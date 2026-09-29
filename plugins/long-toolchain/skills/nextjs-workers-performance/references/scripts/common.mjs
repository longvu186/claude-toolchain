import pw from '/root/projects/tobuso-migration/node_modules/.pnpm/playwright-core@1.62.1/node_modules/playwright-core/index.js';
export const BASE='https://staging.app.tobuso.ca';
export async function open({storage}={}) {
  const browser = await pw.chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome', ...(process.env.PROXY ? { proxy: { server: process.env.PROXY } } : {}) });
  const ctx = await browser.newContext({ viewport:{width:1440,height:900}, storageState: storage });
  await ctx.route(u => new URL(u).host === 'staging.app.tobuso.ca', async (route) => {
    const h = { ...route.request().headers(), 'cf-access-client-id': process.env.STAGING_APP_CF_ACCESS_CLIENT_ID, 'cf-access-client-secret': process.env.STAGING_APP_CF_ACCESS_CLIENT_SECRET };
    await route.continue({ headers: h });
  });
  const page = await ctx.newPage();
  return { browser, ctx, page };
}
