# Playwright Best Practices Reference

## Locator Strategy (Priority Order)

1. **`getByRole()`** — Accessible role + name. Best because it mirrors how users/assistive tech see the page.
   ```ts
   page.getByRole('button', { name: 'Submit' })
   page.getByRole('heading', { name: 'Dashboard' })
   page.getByRole('link', { name: 'Settings' })
   page.getByRole('listitem').filter({ hasText: 'Premium' })
   ```

2. **`getByLabel()`** — Form field labels.
   ```ts
   page.getByLabel('Email address')
   page.getByLabel('Password')
   ```

3. **`getByText()`** — Visible text content.
   ```ts
   page.getByText('Welcome back')
   page.getByText(/order #\d+/i)
   ```

4. **`getByTestId()`** — `data-testid` attribute (when no semantic locator works).
   ```ts
   page.getByTestId('cart-count')
   ```

5. **`locator()`** — CSS selector (last resort).
   ```ts
   page.locator('.product-card >> nth=0')
   ```

## Assertion Patterns

### Web-First Assertions (Auto-Wait)
```ts
await expect(page.getByRole('heading')).toBeVisible();
await expect(page.getByText('Success')).toHaveText('Success!');
await expect(page).toHaveURL(/dashboard/);
await expect(page).toHaveTitle('Dashboard');
await expect(page.getByRole('button')).toBeEnabled();
await expect(page.getByRole('textbox')).toHaveValue('hello');
```

### Soft Assertions (Multiple Checks, All Reported)
```ts
await expect.soft(page.getByTestId('status')).toHaveText('Active');
await expect.soft(page.getByTestId('count')).toHaveText('3');
await expect.soft(page.getByTestId('label')).toBeVisible();
// All failures reported, test doesn't stop at first
```

### Anti-Patterns
```ts
// BAD: Manual waiting
await page.waitForTimeout(1000);

// GOOD: Auto-waiting assertion
await expect(page.getByText('Loaded')).toBeVisible();

// BAD: Manual visibility check
if (await page.getByRole('button').isVisible()) { ... }

// GOOD: Assert directly
await expect(page.getByRole('button')).toBeVisible();
```

## Test Isolation

Each test runs in its own `BrowserContext`:
- Fresh cookies, localStorage, sessionStorage
- No shared state between tests
- Tests can run in any order

```ts
// Share setup with beforeEach, not across tests
test.beforeEach(async ({ page }) => {
  await page.goto('/');
});
```

## Mocking External APIs

```ts
// Mock a REST API response
await page.route('**/api/users', (route) =>
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ id: 1, name: 'Test User' }]),
  })
);

// Mock with conditional logic
await page.route('**/api/orders/**', (route, request) => {
  if (request.method() === 'POST') {
    return route.fulfill({ status: 201, body: '{"id":"new-123"}' });
  }
  return route.continue();
});
```

## Reporter Configuration

```ts
// playwright.config.ts
reporter: [
  ['list'],                              // Terminal output
  ['html', { open: 'on-failure' }],      // Interactive dashboard
  ['json', { outputFile: 'results.json' }], // Machine-readable
  ['github'],                             // GH Actions annotations
],
```

## Screenshot Comparison Settings

```ts
expect: {
  toHaveScreenshot: {
    maxDiffPixels: 50,        // Max different pixels allowed
    maxDiffPixelRatio: 0.01,  // Alternative: max ratio
    threshold: 0.2,           // Per-pixel color tolerance (0-1)
    animations: 'disabled',   // Freeze animations
  },
},
```

## Parallel Execution

```ts
// File-level: tests run in parallel across files (default)
// Intra-file: explicitly opt in
test.describe.configure({ mode: 'parallel' });

// Serial when tests have dependencies
test.describe.configure({ mode: 'serial' });
```

## Sharding for CI

```yaml
# GitHub Actions matrix
strategy:
  matrix:
    shard: [1/4, 2/4, 3/4, 4/4]
steps:
  - run: npx playwright test --shard=${{ matrix.shard }}
```
