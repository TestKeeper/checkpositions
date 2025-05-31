import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Поддержка __dirname в ES-модулях:
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TOKEN_CACHE_PATH = path.resolve(__dirname, '../../.token_cache.json');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

/**
 * Получает refreshToken из файла или по API, если нет кеша
 * @param {string} username
 * @returns {Promise<string>}
 */
export async function getValidRefreshToken(username) {
  try {
    const cached = await readTokenFromFile();
    if (cached?.username === username && cached?.refreshToken) {
      console.log('🗃️ Используем сохранённый refreshToken из кеша');
      return cached.refreshToken;
    }
  } catch {
    // кеша нет — нормально
  }

  console.log('🔄 Запрашиваем новый refreshToken через API...');
  const refreshToken = await fetchRefreshToken(username);
  await saveTokenToFile({ username, refreshToken });
  return refreshToken;
}

async function fetchRefreshToken(username, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('https://api.upscale.stormtrade.dev/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Статус: ${response.status}`);
    const data = await response.json();
    if (!data.refreshToken) throw new Error('Ответ не содержит refreshToken');

    return data.refreshToken;
  } catch (err) {
    clearTimeout(timeoutId);
    throw new Error(`Ошибка при запросе токена: ${err.message}`);
  }
}

async function readTokenFromFile() {
  const raw = await fs.readFile(TOKEN_CACHE_PATH, 'utf-8');
  return JSON.parse(raw);
}

async function saveTokenToFile(data) {
  await fs.writeFile(TOKEN_CACHE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}
