// @ts-check
import { test, expect } from '@playwright/test';
import { getValidRefreshToken } from './utils/tokenManager.js';

const tradingPairs = [
  '1000BONK_USD',
  'AAVE_USD',
  'ADA_USD',
  'AERO_USD',
  'AI16Z_USD',
  'ALGO_USD',
  'APT_USD',
  'ARAVAX_USD',
  'ARB_USD',
  'ATOM_USD',
  'AXS_USD',
  'BCH_USD',
  'BERA_USD',
  'BETA_USD',
  'BGB_USD',
  'BNB_USD',
  'BOY_USD',
  'BRETT_USD',
  'BSV_USD',
  'BTC_USD',
  'CAKE_USD',
  'CHZ_USD',
  'CRO_USD',
  'CRV_USD',
  'DEEP_USD',
  'DEXE_USD',
  'DOGE_USD',
  'DYDX_USD',
  'EIGEN_USD',
  'ENA_USD',
  'ENS_USD',
  'EOS_USD',
  'ETC_USD',
  'ETH_USD',
  'FARTCOIN_USD',
  'FET_USD',
  'FLOKI_USD',
  'FLOW_USD',
  'GALA_USD',
  'GRASS_USD',
  'GRT_USD',
  'HBAR_USD',
  'ICP_USD',
  'IMX_USD',
  'INJ_USD',
  'IOTA_USD',
  'IP_USD',
  'JASMY_USD',
  'JTO_USD',
  'JUP_USD',
  'KAIA_USD',
  'KAITO_USD',
  'KAS_USD',
  'LBR_USD',
  'LDO_USD',
  'LTC_USD',
  'MANA_USD',
  'MKR_USD',
  'MNT_USD',
  'MOVE_USD',
  'NEAR_USD',
  'OBDAO_USD',
  'OP_USD',
  'ORDI_USD',
  'PENDLE_USD',
  'PENGU_USD',
  'PEPE_USD',
  'POL_USD',
  'POPCAT_USD',
  'PYTH_USD',
  'RAY_USD',
  'RENDER_USD',
  'RUNE_USD',
  'SAND_USD',
  'SEI_USD',
  'SHIB_USD',
  'SOL_USD',
  'SPX_USD',
  'STRK_USD',
  'SUI_USD',
  'S_USD',
  'TAO_USD',
  'TIA_USD',
  'TON_USD',
  'TRUMPX_USD',
  'TRUMP_USD',
  'TURBO_USD',
  'UNI_USD',
  'VET_USD',
  'VIRTUAL_USD',
  'WAL_USD',
  'WIF_USD',
  'WLD_USD',
  'XLM_USD',
  'XMR_USD',
  'XRP_USD',
  'XTZ_USD',
  'ZEC_USD',
  'ZRO_USD'
];


const directions = ['Short', 'Long'];

test.describe('🚀 Тесты открытия и закрытия позиций (по всем парам)', () => {
  for (const pair of tradingPairs) {
    for (const direction of directions) {
      test(`🔁 ${pair}: ${direction} позиция: открыть и закрыть`, async ({ page }) => {
        try {
          const username = 'mrcheck_1';
          let refreshToken = await getValidRefreshToken(username);
          let debugUrl = `https://app.upscale.stormtrade.dev/debug/${refreshToken}`;

          try {
            console.log('🟢 Переход по debug-ссылке:', debugUrl);
            await page.goto(debugUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
          } catch {
            refreshToken = await getValidRefreshToken(username);
            debugUrl = `https://app.upscale.stormtrade.dev/debug/${refreshToken}`;
            await page.goto(debugUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
          }

          await expect(page).toHaveURL(/\/accounts/, { timeout: 10000 });
          console.log('✅ Авторизация прошла');

          const tradeUrl = `https://app.upscale.stormtrade.dev/trade/${pair}?collateral=USD&tab=positions`;
          await page.goto(tradeUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          console.log(`✅ Перешли на страницу ${pair} для ${direction}`);

          const amountInput = page.locator('[data-testid="order-creation-card-asset-amount-input"]');
          await amountInput.waitFor({ timeout: 10000 });
          await amountInput.fill('10');
          console.log('🟢 Введена сумма 10');

          const slider = page.locator('[role="slider"]');
          await slider.waitFor({ timeout: 10000 });
          const min = await slider.getAttribute('aria-valuemin');
          const max = await slider.getAttribute('aria-valuemax');
          if (min !== '1' || max !== '5') {
            throw new Error(`❌ Неверные значения кредитного плеча: aria-valuemin=${min}, aria-valuemax=${max}`);
          }
          console.log('✅ Проверка диапазона плеча: min=1, max=5');

          const leverageInput = page.locator('input[name="leverage"]:not([type="hidden"])');
          await leverageInput.waitFor({ timeout: 10000 });
          await leverageInput.click();
          await leverageInput.press('Control+A');
          await leverageInput.press('Backspace');
          await leverageInput.type('3', { delay: 100 });
          console.log('🟢 Введено плечо 3');

          const directionTab = page.locator('div.css-1i4hgyt', { hasText: direction });
          await directionTab.waitFor({ timeout: 10000 });
          await directionTab.click();
          console.log(`🟢 Клик по вкладке ${direction}`);

          if (direction === 'Short') {
            const tabWrappers = page.locator('div.css-1lrd9y7[data-checked]');
            const allTexts = await tabWrappers.allTextContents();
            const found = allTexts.some(text => text.trim().toLowerCase().includes(direction.toLowerCase()));
            if (!found) {
              await page.screenshot({ path: `screenshots/tab-not-found-${pair}-${direction}.png` });
              throw new Error(`❌ Не найдена активная вкладка ${direction} на паре ${pair}`);
            }
            console.log(`✅ Вкладка ${direction} активна`);
          }

          const openButton = page.locator('[data-testid="open-position-button"]');
          await expect(openButton).toBeEnabled({ timeout: 10000 });
          await openButton.click();
          console.log(`🟢 Открытие позиции ${direction}`);

          if (!['BTC_USD', 'ETH_USD', 'TON_USD'].includes(pair)) {
            const spread = page.locator('[data-testid="order-creation-card-price-impact"]');
            await spread.waitFor({ timeout: 5000 });
            const spreadText = await spread.innerText();
            const spreadValue = parseFloat(spreadText.replace(/[^\d.]/g, ''));
            console.log(`📈 Спред: ${spreadValue}`);
            if (isNaN(spreadValue)) {
              throw new Error(`❌ Спред не определён для ${pair} (${direction})`);
            } else if (spreadValue === 0) {
              console.warn(`⚠️ Спред равен нулю для ${pair} (${direction})`);
            }
          }

          const fee = page.locator('span.css-1t1qvjl');
          await fee.waitFor({ timeout: 5000 });
          const feeValue = parseFloat((await fee.innerText()).replace(/[^\d.]/g, ''));
          console.log(`💰 Комиссия: ${feeValue}`);
          if (isNaN(feeValue) || feeValue === 0) {
            throw new Error(`❌ Комиссия равна 0 для ${pair} (${direction})`);
          }

          const expectedFee = 0.002399;
          const tolerance = 0.000001;
          if (Math.abs(feeValue - expectedFee) > tolerance) {
            console.warn(`⚠️ Комиссия отличается от ожидаемой. Ожидалась: ${expectedFee}, получено: ${feeValue}`);
          } else {
            console.log(`✅ Комиссия соответствует ожидаемой: ${feeValue}`);
          }

          // ➕ Продолжение теста — вход, ликвидация, закрытие и история
          const entry = page.locator('[data-testid="order-creation-card-entry-price"]');
          await entry.waitFor({ timeout: 5000 });
          const entryValue = parseFloat((await entry.innerText()).replace(/[^\d.]/g, ''));
          console.log(`🎯 Цена входа: ${entryValue}`);

          const liq = page.locator('[data-testid="order-creation-card-liquidation-price"]');
          await liq.waitFor({ timeout: 5000 });
          const liqValue = parseFloat((await liq.innerText()).replace(/[^\d.]/g, ''));
          console.log(`💥 Ликвидация: ${liqValue}`);

          const closeBtn = page.locator('button.chakra-button:has-text("Close")').first();
          await closeBtn.waitFor({ timeout: 10000 });
          await closeBtn.click();

          const modalInput = page.locator('[data-testid="close-position-modal-input-amount"]');
          await modalInput.waitFor({ timeout: 10000 });
          const currentValue = parseFloat(await modalInput.inputValue());
          const half = (currentValue / 2).toFixed(8);
          await modalInput.fill(half);

          const modalClose = page.locator('[data-testid="close-position-modal-close-button"]');
          await modalClose.waitFor({ timeout: 10000 });
          await modalClose.click();
          console.log('✅ Первая часть позиции закрыта');

          await closeBtn.click();
          const fullAmountBtn = page.locator('button:has-text("100%")');
          if (await fullAmountBtn.isVisible()) await fullAmountBtn.click();
          await modalClose.waitFor({ timeout: 10000 });
          await modalClose.click();
          console.log('✅ Остаток позиции закрыт');

          await page.waitForTimeout(3000);

          const historyTab = page.locator('button[role="tab"][aria-controls*="tabpanel-2"]');
          await historyTab.waitFor({ timeout: 10000 });
          await historyTab.click();

          const directionCell = page.locator(`p.chakra-text.css-79wky:has-text("${direction}")`).first();
          await directionCell.waitFor({ state: 'attached', timeout: 20000 });
          const directionText = await directionCell.innerText();

          if (directionText.trim() !== direction) {
            throw new Error(`❌ В истории направление "${directionText.trim()}", ожидалось "${direction}"`);
          }
          console.log(`✅ В истории направление совпадает: ${direction}`);

          const statusBadge = page.locator('span.chakra-badge');
          const statusText = (await statusBadge.first().innerText()).trim().toLowerCase();
          if (statusText !== 'closed') {
            console.warn(`⚠️ Позиция не закрыта. Статус: ${statusText}`);
          } else {
            console.log('✅ Статус позиции: closed');
          }

          console.log(`✅ Тест завершён для ${pair} / ${direction}`);
        } catch (err) {
          console.error(`❌ Ошибка в паре ${pair} (${direction}):`, err);
          await page.screenshot({ path: `screenshots/error-${pair}-${direction}.png` });
          throw err;
        }
      });
    }
  }
});
