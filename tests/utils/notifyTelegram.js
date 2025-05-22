// utils/notifyTelegram.js
import fetch from 'node-fetch';

export async function notifyTelegram(message) {
  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.TG_CHAT_ID;

  if (!token || !chatId) {
    console.warn('❗ Telegram токен или chat ID не заданы');
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const payload = {
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML'
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error(`❌ Не удалось отправить сообщение: ${res.statusText}`);
    }
  } catch (err) {
    console.error('❌ Ошибка отправки в Telegram:', err);
  }
}
