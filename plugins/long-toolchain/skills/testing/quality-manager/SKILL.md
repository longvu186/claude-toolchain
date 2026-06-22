---
name: quality-manager
description: "**WORKFLOW SKILL** — Write, organize, run, and manage tests for any project. Use when: writing unit/integration/E2E tests, setting up Playwright, configuring visual regression, running test suites, debugging test failures, managing test coverage, triaging flaky tests, local webapp testing, browser flow debugging, opening the test dashboard, planning seeded test accounts, or bypassing OAuth such as Google Auth for automated role testing. Trigger phrases: write test, add test, run tests, test coverage, Playwright setup, visual regression, test dashboard, failing test, flaky test, sharding, trace viewer, test strategy, test local webapp, Playwright recon pass, Google auth bypass, quick login, test accounts."
argument-hint: "Describe what you want tested, or ask to run tests / set up a test framework / open the dashboard."
portability: adapt-port
source-skill: ComposioHQ/awesome-claude-skills/webapp-testing (merged lane)
overlap-gate:
  existing-skill: testing/quality-manager
  overlap-score: 78
  decision: merge-upgrade
---

# Quality Manager

Comprehensive workflow for writing, organizing, running, and managing tests across unit, integration, and E2E layers. Covers Playwright E2E, Vitest/Jest unit tests, visual regression, test dashboards, and flaky test triage.

## Pack-Driven Coverage Gate

Before writing non-trivial feature tests, load `requirements-pack-enforcement` and the matching domain packs.

Minimum mapping:

- auth/session work -> `feature-auth-system`
- tenant or membership work -> `feature-saas-foundations`
- billing/webhook work -> `feature-subscription-billing`
- API/schema/webhook work -> `api-contract-and-edge-case-testing`

The test plan is incomplete if it cannot point back to the selected packs and their required destructive, deny-path, and recovery cases.

## Auth-Protected App Test Access

When the app uses protected routes, role gates, or third-party auth such as Google, require a concrete automation entry path before writing E2E tests.

- Prefer seeded non-production accounts plus first-party auth bootstrap over browser-driving third-party login.
- Acceptable bootstrap lanes are API login, session bootstrap, or Playwright `storageState` generated from first-party flows.
- If OAuth is the only human login path, require a non-production-only quick-login or session bootstrap lane for automation.
- Keep quick-login UI available only in local and preview or staging while the app is unpublished.
- Hide or remove quick-login UI once the app is marked published.
- UI-only impersonation may help manual QA, but it does not replace backend permission coverage with real seeded accounts.
- Include one signed-out path, one active account per critical role, and restricted-state accounts when the app enforces states such as `suspended` or `blocked`.
- For stateful suites, use per-worker account pools so parallel tests do not trample shared server-side state.
- For cross-role interaction scenarios, use multiple browser contexts with distinct auth states in the same test.

## Coverage Planning Gate

Before writing non-trivial tests, produce a compact coverage record:

- journey inventory by role: primary, alternate, deny, destructive, and recovery paths
- interaction surface: forms, navigation, async states, permissions, uploads, keyboard, and responsive deltas
- contract surface: routes, RPCs, webhooks, jobs, and third-party APIs touched by the journeys
- layer plan: unit, integration, E2E, visual, destructive, and exploratory coverage
- release tier: pre-merge smoke, blocking regression, or non-blocking nightly/exploratory
- known gaps: missing docs, fixtures, environments, or contract sources
- auth test access for protected apps: seeded accounts, bootstrap lane, signed-out reset, and publish gate for quick-login UI

If the docs do not already enumerate journeys and touched contracts, stop and create a documentation gap instead of guessing.

## Batch 2 Merge-Upgrade Lane: Local Webapp Testing

Portability tag: adapt-port.

Use this lane for fast browser validation against local apps, especially when selectors and UI states are uncertain.

1. Run reconnaissance first: open page, wait for `networkidle`, then inspect rendered state.
2. Prefer robust locators (`getByRole`, `getByLabel`, `getByText`) over brittle CSS/XPath chains.
3. Capture screenshots or DOM snapshots before asserting complex flows.
4. Keep server lifecycle explicit (known start command, expected port, timeout policy).
5. Separate smoke-path checks from user-reported bug repro checks.

### Local Webapp Safety and Fallback

- Do not execute unknown startup scripts without reviewing their intent.
- If app startup is unstable, run minimal page-load probes before full E2E scenarios.
- If selectors are unstable, switch to reconnaissance mode and derive selectors from rendered output.
- If browser automation is blocked, fall back to contract-level/unit-level validation and mark E2E coverage gaps.

## When to Use

- Writing new tests for functions, components, APIs, or full user flows
- Setting up a test framework (Playwright, Vitest, Jest) from scratch
- Running existing test suites and reporting results
- Debugging failing or flaky tests
- Configuring visual regression testing with Playwright screenshots
- Setting up test parallelism, sharding, or multi-browser configs
- Opening or managing the Playwright HTML report dashboard
- Reviewing test coverage and identifying gaps

## Reliability Rules Learned from Production Repros

1. Repro tests must hard-assert user-reported symptoms.
- Do not stop at diagnostic logs or screenshots.
- Convert reported symptoms into explicit assertions (for example element presence + scrollability).

2. Run flaky-path repros with repetition.
- Use `--repeat-each` for production repro tests to expose intermittent regressions.

3. Keep exact user-path tests separate from broad smoke tests.
- Exact path tests should mirror click sequence, route transitions, and stateful intermediate screens.

4. Add fixture preflight checks for stateful filtered flows.
- Before UI assertions, verify required seeded/progression preconditions (for example entry CTA exists and expected stage is reachable).
- If preconditions are missing, fail as `fixture-precondition` and surface reseed/reset guidance instead of reporting a UI regression.

5. Extend the nearest focused regression spec before adding another overlapping suite.
- If a bug lands in a slice that already has a narrow repro or regression file, add the new assertion there instead of creating a near-duplicate spec.
- Keep one focused spec per bug cluster or touched-surface slice so failures stay attributable and maintenance stays local.

6. Treat optional seeded states as scoped skips, not broad failures.
- When a targeted assertion depends on data that may legitimately be absent for the current seed or account, run a small preflight check first.
- If the state is absent and that absence is acceptable for the run, skip only that assertion or test with an explicit reason and keep the rest of the focused regression suite active.

7. Tie new E2E coverage to documented user journeys and release tiers.
- If a flow matters enough to automate, it must be named in the journey inventory and assigned to pre-merge, blocking release, or non-blocking nightly coverage.

8. Convert exploratory discoveries into stable regression assets.
- Exploratory charters can start loose, but important discoveries must end as deterministic automated tests or explicit tracked gaps.

## Release Regression Tiers

- **Pre-merge smoke**: diff-targeted checks for the changed slice and nearby critical flows.
- **Blocking release regression**: critical end-to-end journeys, destructive or recovery flows, and touched API contracts.
- **Nightly or non-blocking**: expensive cross-browser sweeps, fuzzing, and exploratory charters that are not yet stable enough to gate every merge.

All release-grade E2E tests should be rerunnable, deterministic, and safe for CI parallelism.

## Procedure

### Phase 1: Assessment

Before writing any tests, understand the testing landscape:

#### Step 1.1 — Detect Existing Test Infrastructure

Check for test configuration files:
- `playwright.config.ts` / `playwright.config.js` → Playwright E2E
- `vitest.config.ts` / `vitest.config.js` → Vitest unit/integration
- `jest.config.ts` / `jest.config.js` → Jest unit/integration
- `package.json` → `scripts.test`, `scripts.test:e2e`, `scripts.test:unit`

Check for existing test files:
- `**/*.spec.ts`, `**/*.test.ts` → TypeScript tests
- `tests/`, `__tests__/`, `e2e/`, `test/` → test directories

#### Step 1.2 — Determine Test Scope

| Layer | What to Test | Runner | Speed |
|-------|-------------|--------|-------|
| **Unit** | Pure functions, utilities, transformers, validators | Vitest / Jest | Fast (ms) |
| **Integration** | Module boundaries, API routes, DB queries, service interactions | Vitest / Jest + mocks | Medium (ms-s) |
| **E2E** | Full user flows through the browser | Playwright | Slow (s) |
| **Exploratory** | Charter-driven probes for unclear or failure-prone behavior | Playwright or manual-assisted | Variable |
| **Destructive / Recovery** | Risky state changes, role denials, undo/restore flows, audit side effects | Playwright and integration | Medium-slow |
| **Visual** | Screenshot comparison against reference images | Playwright | Slow (s) |

#### Step 1.3 — Read Source Code

Before writing tests:
1. Read the source file(s) that will be tested
2. Identify the public API / exported functions / component props
3. Understand happy paths, edge cases, and error conditions
4. Map the affected user journeys and touched contracts before picking the layer split
5. Check for existing tests that may need extending rather than duplicating

### Journey And Contract Baseline

For a feature slice to be considered comprehensively covered, the plan should identify:

- critical user journeys by role
- alternate, deny, destructive, and recovery branches for those journeys
- all APIs, RPCs, webhooks, or jobs each journey touches
- which checks belong in unit, integration, E2E, visual, and exploratory lanes
- which journeys are blocking for release CI versus nightly or non-blocking runs

### Phase 2: Writing Tests

#### Step 2.1 — Unit Tests (Vitest/Jest)

```ts
import { describe, it, expect } from 'vitest';
import { calculateTotal } from '../src/utils/pricing';

describe('calculateTotal', () => {
  it('sums line items correctly', () => {
    expect(calculateTotal([{ price: 10, qty: 2 }, { price: 5, qty: 1 }])).toBe(25);
  });

  it('returns 0 for empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });

  it('handles decimal prices', () => {
    expect(calculateTotal([{ price: 9.99, qty: 3 }])).toBeCloseTo(29.97);
  });

  it('throws on negative quantity', () => {
    expect(() => calculateTotal([{ price: 10, qty: -1 }])).toThrow();
  });
});
```

**Principles:**
- Test user-visible behavior, not implementation details
- Each test should be independent — no shared mutable state
- Name tests as `it('does X when Y')` for readable output
- Cover: happy path, edge cases, error cases, boundary values

#### Step 2.2 — Integration Tests

```ts
import { describe, it, expect } from 'vitest';
import { createServer } from '../src/server';

describe('POST /api/orders', () => {
  const app = createServer();

  it('creates an order and returns 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/orders',
      payload: { items: [{ id: 'abc', qty: 1 }] },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toHaveProperty('orderId');
  });

  it('returns 400 for empty items', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/orders',
      payload: { items: [] },
    });
    expect(res.statusCode).toBe(400);
  });
});
```

**Principles:**
- Mock external services (`page.route()` in Playwright, `vi.mock()` in Vitest)
- Test the contract, not the implementation
- Use test databases or in-memory stores, never production

#### Step 2.3 — E2E Tests (Playwright)

```ts
import { test, expect } from '@playwright/test';

test.describe('Checkout flow', () => {
  test('completes purchase as logged-in user', async ({ page }) => {
    await page.goto('/products');
    
    // Add item to cart
    await page.getByRole('button', { name: 'Add to cart' }).first().click();
    
    // Go to cart
    await page.getByRole('link', { name: 'Cart' }).click();
    await expect(page.getByRole('heading', { name: 'Your Cart' })).toBeVisible();
    
    // Proceed to checkout
    await page.getByRole('button', { name: 'Checkout' }).click();
    
    // Fill shipping
    await page.getByLabel('Address').fill('123 Main St');
    await page.getByLabel('City').fill('Springfield');
    
    // Complete order
    await page.getByRole('button', { name: 'Place order' }).click();
    await expect(page.getByText('Order confirmed')).toBeVisible();
  });
});
```

**Locator priority (best to worst):**
1. `getByRole()` — accessible role + name (best)
2. `getByLabel()` — form field labels
3. `getByText()` — visible text content
4. `getByTestId()` — `data-testid` attribute (when role/label unavailable)
5. `locator('.class')` — CSS selector (last resort)

**Never use:**
- `page.waitForTimeout()` — use web-first assertions that auto-wait
- `page.$()` / `page.$$()` — use `page.locator()` instead
- XPath selectors — fragile and hard to read

#### Step 2.4 — Page Object Model

For complex E2E tests, encapsulate page interactions:

```ts
// tests/pages/checkout.page.ts
import { type Page, type Locator } from '@playwright/test';

export class CheckoutPage {
  readonly page: Page;
  readonly addressInput: Locator;
  readonly cityInput: Locator;
  readonly placeOrderButton: Locator;
  readonly confirmationMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addressInput = page.getByLabel('Address');
    this.cityInput = page.getByLabel('City');
    this.placeOrderButton = page.getByRole('button', { name: 'Place order' });
    this.confirmationMessage = page.getByText('Order confirmed');
  }

  async fillShipping(address: string, city: string) {
    await this.addressInput.fill(address);
    await this.cityInput.fill(city);
  }

  async placeOrder() {
    await this.placeOrderButton.click();
  }
}
```

#### Step 2.5 — Visual Regression Tests

```ts
import { test, expect } from '@playwright/test';

test.describe('Visual regression', () => {
  test('homepage matches baseline', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('home.png', {
      maxDiffPixels: 50,
      threshold: 0.2,
      animations: 'disabled',
      mask: [
        page.locator('[data-testid="timestamp"]'),
        page.locator('.user-avatar'),
      ],
    });
  });

  test('hero section matches baseline', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero')).toHaveScreenshot('hero.png', {
      maxDiffPixels: 20,
      threshold: 0.15,
    });
  });
});
```

**Visual regression workflow:**
1. First run creates baseline screenshots (stored in test-results/)
2. Subsequent runs compare against baselines
3. Update baselines with `npx playwright test --update-snapshots`
4. Commit baseline images to version control

#### Step 2.6 — Custom Fixtures

```ts
// tests/fixtures.ts
import { test as base } from '@playwright/test';

type Fixtures = {
  authenticatedPage: import('@playwright/test').Page;
};

export const test = base.extend<Fixtures>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('/dashboard');
    await use(page);
  },
});

export { expect } from '@playwright/test';
```

### Phase 3: Configuration

#### Step 3.1 — Playwright Config

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['dot'], ['html', { open: 'never' }], ['github']]
    : [['list'], ['html', { open: 'on-failure' }]],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### Step 3.2 — Vitest Config

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // or 'jsdom' for component tests
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/**/*.test.*'],
    },
  },
});
```

### Phase 4: Running Tests

#### Step 4.1 — Run Commands

| Action | Command |
|--------|---------|
| Run all Playwright tests | `npx playwright test` |
| Run specific test file | `npx playwright test tests/e2e/checkout.spec.ts` |
| Run with UI mode | `npx playwright test --ui` |
| Run headed (visible browser) | `npx playwright test --headed` |
| Update snapshots | `npx playwright test --update-snapshots` |
| Run Vitest | `npx vitest` |
| Run Vitest once (CI) | `npx vitest run` |
| Run Vitest with coverage | `npx vitest run --coverage` |
| Show Playwright report | `npx playwright show-report` |

#### Step 4.2 — Parallelism & Sharding

```ts
// Run tests in parallel within a file
test.describe.configure({ mode: 'parallel' });

// Shard across CI machines
// Machine 1: npx playwright test --shard=1/3
// Machine 2: npx playwright test --shard=2/3
// Machine 3: npx playwright test --shard=3/3
```

#### Step 4.3 — Report Results

After running tests, produce a summary:

```markdown
| Suite | Total | Passed | Failed | Skipped |
|-------|-------|--------|--------|---------|
| Unit  | 42    | 41     | 1      | 0       |
| E2E   | 15    | 13     | 1      | 1       |
```

For failures, include:
- Test name and file path
- Error message
- Steps to reproduce or relevant stack trace

### Phase 5: Debugging

#### Step 5.1 — Playwright Debugging

| Method | When |
|--------|------|
| `--ui` mode | Interactive test exploration with time-travel |
| `--debug` flag | Step through with Playwright Inspector |
| Trace viewer | Analyze CI failures from HTML report |
| `page.pause()` | Debug at a specific point in test |

#### Step 5.2 — Trace Viewer

```ts
// Enable traces on first retry (recommended for CI)
use: { trace: 'on-first-retry' }

// View trace from HTML report or directly:
// npx playwright show-trace trace.zip
```

Traces capture: screenshots, DOM snapshots, network requests, console logs, and action timelines.

#### Step 5.3 — Flaky Test Triage

When a test fails intermittently:

1. Enable `retries: 2` and check the HTML report for `±` (flaky) markers
2. Common root causes:
   - **Race conditions**: Missing `await`, assertions before element is ready
   - **Animation timing**: Add `animations: 'disabled'` to screenshot config
   - **External dependencies**: Mock them with `page.route()`
   - **Shared state**: Tests depend on execution order
   - **Viewport sensitivity**: Element off-screen at certain sizes
3. Fixes:
   - Replace `waitForTimeout` with web-first assertions
   - Use `expect(locator).toBeVisible()` before interactions
   - Isolate test data per test (unique IDs, fresh DB state)
4. If unfixable short-term: mark with `test.fixme()` to skip but track

### Phase 6: Coverage

#### Step 6.1 — Unit/Integration Coverage

```bash
npx vitest run --coverage
```

Review the HTML coverage report for:
- Uncovered files (0% coverage)
- Uncovered branches (if/else, switch cases)
- Uncovered functions that handle error cases

#### Step 6.2 — E2E Coverage

Playwright doesn't measure code coverage by default. Options:
- Use `@playwright/experimental-ct-*` for component test coverage
- Use Istanbul instrumentation for full E2E coverage
- Rely on E2E for flow validation, not line coverage

## Constraints

- DO NOT modify application source code to make tests pass — fix tests or raise the issue
- DO NOT delete existing tests without explicit user approval
- DO NOT use `--headed` in CI contexts — keep headless by default
- DO NOT use brittle CSS/XPath selectors when role, label, or text locators are available
- ONLY install test-related packages
- ALWAYS use TypeScript for test files (`.spec.ts` / `.test.ts`)
- ALWAYS check for existing test patterns before creating new ones — follow the project's conventions
- NEVER use `page.waitForTimeout()` — use auto-waiting assertions

## Output Format

- **Writing tests**: Show file path and describe what each test group covers
- **Running tests**: Markdown summary table (suite | passed | failed | skipped) + failure details
- **Opening dashboard**: Confirm reporter config, show run command, print local URL
- **Visual regression**: Diff image path, pixel difference count, severity classification
- **Coverage**: Summary stats and list of uncovered critical paths
