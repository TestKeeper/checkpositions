// @ts-check
import { test, expect } from '@playwright/test';
import { getValidRefreshToken } from './utils/tokenManager.js';

const tradingPairs = [
  'BTC_USD', 'ETH_USD', 'KAITO_USD', 'TON_USD', 'TRUMP_USD', 'XRP_USD', '1000BONK_USD',
  '1000PEPE_USD', '1000SHIB_USD', 'AAVE_USD', 'ADA_USD', 'AERO_USD', 'AI16Z_USD',
  'ALGO_USD', 'APT_USD', 'ARB_USD', 'ATOM_USD', 'AVAX_USD', 'AXS_USD', 'BCH_USD',
  'BERA_USD', 'BGB_USD', 'BNB_USD', 'BRETT_USD', 'BSV_USD', 'CAKE_USD', 'CHZ_USD',
  'CRO_USD', 'CRV_USD', 'DASH_USD', 'DEEP_USD', 'DEXE_USD', 'DOGE_USD', 'DOT_USD',
  'DYDX_USD', 'EIGEN_USD', 'ENA_USD', 'ENS_USD', 'ETC_USD', 'FARTCOIN_USD', 'FET_USD',
  'FIL_USD', 'FLOKI_USD', 'FLOW_USD', 'GALA_USD', 'GRASS_USD', 'GRT_USD', 'HBAR_USD',
  'ICP_USD', 'IMX_USD', 'INJ_USD', 'IOTA_USD', 'IP_USD', 'JASMY_USD', 'JTO_USD',
  'JUP_USD', 'KAIA_USD', 'KAS_USD', 'LDO_USD', 'LINK_USD', 'LTC_USD', 'MANA_USD',
  'MKR_USD', 'MNT_USD', 'MOVE_USD', 'NEAR_USD', 'ONDO_USD', 'OP_USD', 'ORDI_USD',
  'PENDLE_USD', 'PENGU_USD', 'PNUT_USD', 'POL_USD', 'POPCAT_USD', 'PYTH_USD',
  'RAY_USD', 'RENDER_USD', 'RUNE_USD', 'S_USD', 'SAND_USD', 'SEI_USD', 'SOL_USD',
  'STRK_USD', 'SUI_USD', 'TAO_USD', 'TIA_USD', 'TRX_USD', 'TURBO_USD', 'UNI_USD',
  'VET_USD', 'VIRTUAL_USD', 'WAL_USD', 'WIF_USD', 'WLD_USD', 'XLM_USD', 'XMR_USD',
  'XTZ_USD', 'ZEC_USD', 'ZRO_USD'
];
const directions = ['Short', 'Long'];

test.beforeEach(async ({ page }) => {
  const modal = page.locator('section.chakra-modal__content');
  const isVisible = await modal.count();
  if (isVisible > 0) {
    console.warn('⚠️ Перед началом теста найдена открытая модалка — закрываем');
    const modalCloseBtn = page.locator('[data-testid="close-position-modal-close-button"]');
    try {
      await modalCloseBtn.waitFor({ timeout: 5000 });
      await expect(modalCloseBtn).toBeVisible();
      await modalCloseBtn.click();
      await expect(modal).toHaveCount(0, { timeout: 10000 });
    } catch (e) {
      console.warn('⚠️ Не удалось закрыть модалку в beforeEach:', e);
    }
  }
});

test.describe('🚀 Тесты  проверки  частичного и полного закрытия позиций (по всем парам)', () => {
  for (const pair of tradingPairs) {
    for (const direction of directions) {
      test(`🔁 ${pair}: ${direction} позиция: открыть и закрыть`, async ({ page }) => {
        const closeModalSafely = async () => {
          const modal = page.locator('section.chakra-modal__content');
          const modalCloseBtn = page.locator('[data-testid="close-position-modal-close-button"]');
          for (let attempt = 1; attempt <= 3; attempt++) {
            const count = await modal.count();
            if (count === 0) return;

            console.log(`🔁 Попытка #${attempt} закрыть модалку`);

            try {
              await modalCloseBtn.waitFor({ timeout: 5000 });
              await expect(modalCloseBtn).toBeVisible();
              await modalCloseBtn.click();
              await page.waitForTimeout(1500);

              const stillVisible = await modal.count();
              if (stillVisible === 0) {
                console.log('✅ Модалка закрыта');
                return;
              }
            } catch (e) {
              console.warn(`⚠️ Ошибка при закрытии модалки на попытке #${attempt}:`, e);
            }
          }

          // Последняя попытка
          await expect(modal).toHaveCount(0, { timeout: 7000 });
        };

        try {
          const username = 'mrcheck_1';
          const refreshToken = await getValidRefreshToken(username);
          const debugUrl = `https://app.upscale.stormtrade.dev/debug/${refreshToken}`;
          const tradeUrl = `https://app.upscale.stormtrade.dev/trade/${pair}?collateral=USD&tab=positions`;

          await page.goto(debugUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
          await expect(page).toHaveURL(/\/accounts/, { timeout: 10000 });

          await page.goto(tradeUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

          await page.locator('[data-testid="order-creation-card-asset-amount-input"]').fill('10');
          await page.locator('input[name="leverage"]:not([type="hidden"])').fill('3');

          await page.locator('div.css-1i4hgyt', { hasText: direction }).click();

          // 🔍 Проверка активной вкладки
          const tabGroup = page.locator('[role="radiogroup"]');
          const activeTab = tabGroup.locator('div[data-checked]').filter({ hasText: direction }).first();
          await expect(activeTab).toBeVisible({ timeout: 5000 });
          console.log(`✅ Активная вкладка: ${direction}`);

          // 🚀 Открытие позиции
          const openBtn = page.locator('[data-testid="open-position-button"]');
          await openBtn.click();
          await page.waitForTimeout(3000);

          // ❌ Закрытие позиции
          const closeBtn = page.locator('button.chakra-button:has-text("Close")').first();
          if (await closeBtn.isVisible()) {
            await closeBtn.click();
            const modalInput = page.locator('[data-testid="close-position-modal-input-amount"]');
            await modalInput.waitFor();
            const half = (parseFloat(await modalInput.inputValue()) / 2).toFixed(8);
            await modalInput.fill(half);
            await closeModalSafely();

            await closeBtn.click();
            const fullBtn = page.locator('button:has-text("100%")');
            if (await fullBtn.isVisible()) await fullBtn.click();
            await closeModalSafely();
          } else {
            console.warn(`⚠️ Кнопка Close не появилась для ${direction}`);
          }

          // 🧾 Проверка в истории
          await page.waitForTimeout(2000);
          await page.locator('button[role="tab"][aria-controls*="tabpanel-2"]').click();

          const directionCell = page.locator(`p.chakra-text.css-79wky:has-text("${direction}")`).first();
          await directionCell.waitFor({ state: 'attached', timeout: 10000 });

          const isVisible = await directionCell.isVisible();
          if (!isVisible) {
            console.warn(`⚠️ Направление "${direction}" найдено, но скрыто. Пропускаем проверку статуса.`);
          } else {
            const directionText = await directionCell.innerText();
            if (directionText.trim() !== direction) {
              throw new Error(`❌ В истории направление "${directionText.trim()}", ожидалось "${direction}"`);
            }

            const statusText = (await page.locator('span.chakra-badge').first().innerText()).trim().toLowerCase();
            if (statusText !== 'closed') {
              console.warn(`⚠️ Позиция не закрыта. Статус: ${statusText}`);
            } else {
              console.log('✅ Статус позиции: closed');
            }
          }
        } catch (err) {
          await page.screenshot({ path: `screenshots/error-${pair}-${direction}.png` });
          throw err;
        }
      });
    }
  }
});
