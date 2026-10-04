# Test Organization Patterns

## Directory Structure

```
tests/
├── e2e/                     # Playwright E2E tests
│   ├── pages/               # Page Object Models
│   │   ├── home.page.ts
│   │   ├── checkout.page.ts
│   │   └── dashboard.page.ts
│   ├── fixtures/            # Custom test fixtures
│   │   └── auth.fixture.ts
│   ├── home.spec.ts
│   ├── checkout.spec.ts
│   └── visual.spec.ts       # Visual regression tests
├── unit/                    # Vitest/Jest unit tests (mirror src/ structure)
│   ├── utils/
│   │   └── pricing.test.ts
│   └── services/
│       └── auth.test.ts
└── integration/             # API/module boundary tests
    └── api/
        └── orders.test.ts
```

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| E2E test | `{feature}.spec.ts` | `checkout.spec.ts` |
| Unit test | `{module}.test.ts` | `pricing.test.ts` |
| Page Object | `{page}.page.ts` | `checkout.page.ts` |
| Fixture | `{purpose}.fixture.ts` | `auth.fixture.ts` |
| Visual test | `visual.spec.ts` or `{page}.visual.spec.ts` | `home.visual.spec.ts` |

## Test File Template

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { functionUnderTest } from '../src/module';

describe('functionUnderTest', () => {
  // Group: Happy path
  describe('when input is valid', () => {
    it('returns expected result', () => {
      expect(functionUnderTest('valid')).toBe('expected');
    });
  });

  // Group: Edge cases
  describe('when input is empty', () => {
    it('returns default value', () => {
      expect(functionUnderTest('')).toBe('default');
    });
  });

  // Group: Error cases
  describe('when input is invalid', () => {
    it('throws descriptive error', () => {
      expect(() => functionUnderTest(null)).toThrow('Input required');
    });
  });
});
```

## E2E Test Template

```ts
import { test, expect } from '@playwright/test';

test.describe('Feature: Checkout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
  });

  test('adds product to cart', async ({ page }) => {
    await page.getByRole('button', { name: 'Add to cart' }).first().click();
    await expect(page.getByTestId('cart-count')).toHaveText('1');
  });

  test('removes product from cart', async ({ page }) => {
    // Setup: add item first
    await page.getByRole('button', { name: 'Add to cart' }).first().click();
    
    // Act
    await page.getByRole('link', { name: 'Cart' }).click();
    await page.getByRole('button', { name: 'Remove' }).click();
    
    // Assert
    await expect(page.getByText('Your cart is empty')).toBeVisible();
  });
});
```

## Coverage Thresholds

Recommended starting thresholds (adjust per project maturity):

```ts
// vitest.config.ts
coverage: {
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 60,
    statements: 70,
  },
},
```

Critical paths should have higher coverage:
- Auth flows: 90%+
- Payment processing: 95%+
- Data validation: 85%+

## When to Write Which Type of Test

| Scenario | Test Type | Why |
|----------|----------|-----|
| Pure utility function | Unit | Fast, isolated, comprehensive |
| API endpoint | Integration | Test contract + validation |
| Complex user flow | E2E | Validates real browser behavior |
| UI appearance | Visual regression | Catches unintended style changes |
| Component rendering | Unit (jsdom) or Playwright CT | Depends on interaction complexity |
| Third-party integration | Integration + mocks | Don't test their code, test your contract |
