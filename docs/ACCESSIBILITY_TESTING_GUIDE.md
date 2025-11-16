# GCMC Platform - Accessibility Testing Guide

## Overview

This guide explains how to run accessibility tests on the GCMC Platform, interpret results, and fix accessibility issues.

## Quick Start

### Run All Accessibility Tests

```bash
# Run E2E accessibility tests
bun run test:e2e:a11y

# Run with UI
bun run test:e2e:a11y:ui

# Run in headed mode (with browser visible)
bun run test:e2e:a11y:headed

# Run in debug mode
bun run test:e2e:a11y:debug
```

### Install Browsers

```bash
# Install Playwright browsers if not already done
bun run test:e2e:install
```

## Test Structure

### Test Directory

```
tests/
├── e2e/
│   ├── accessibility/
│   │   └── wcag-compliance.spec.ts     # Main accessibility tests
│   ├── auth/
│   ├── crud/
│   ├── navigation/
│   └── visual/
├── fixtures/
│   ├── base-fixtures.ts                # Base test fixtures
│   ├── auth-helper.ts
│   └── auth-state.json                 # Authenticated session
├── utils/
│   ├── accessibility-helper.ts         # Accessibility test utilities
│   ├── auth-helper.ts
│   └── data-seeder.ts
└── snapshots/                          # Visual regression snapshots
```

## Accessibility Test Utilities

### AccessibilityHelper Class

Located in `tests/utils/accessibility-helper.ts`

#### Available Methods

```typescript
// Run full page accessibility scan
async scanPage(options?: {
  disableRules?: string[];
  tags?: string[];
}): Promise<void>

// WCAG 2.1 Level A scan
async scanWCAG_A(): Promise<void>

// WCAG 2.1 Level AA scan
async scanWCAG_AA(): Promise<void>

// WCAG 2.1 Level AAA scan
async scanWCAG_AAA(): Promise<void>

// Scan specific element
async scanElement(selector: string): Promise<void>

// Test keyboard navigation
async testKeyboardNavigation(expectedOrder: string[]): Promise<void>

// Test focus visibility
async testFocusVisible(selector: string): Promise<void>

// Test color contrast
async testColorContrast(): Promise<void>

// Test image alt text
async testImageAltText(): Promise<void>

// Test ARIA labels
async testAriaLabels(selector: string): Promise<void>

// Test semantic HTML
async testSemanticHTML(): Promise<void>

// Test form labels
async testFormLabels(): Promise<void>

// Test ARIA live regions
async testAriaLive(selector: string, expectedRole: 'polite' | 'assertive'): Promise<void>

// Generate detailed report
async generateReport(name: string): Promise<void>
```

## Running Specific Tests

### Run WCAG Compliance Tests Only

```bash
bun run test:e2e:a11y -- --grep "WCAG AA Compliance"
```

### Run Keyboard Navigation Tests

```bash
bun run test:e2e:a11y -- --grep "Keyboard Navigation"
```

### Run Screen Reader Tests

```bash
bun run test:e2e:a11y -- --grep "Screen Reader Support"
```

### Run Color Contrast Tests

```bash
bun run test:e2e:a11y -- --grep "Color Contrast"
```

### Run Accessibility Reports Generation

```bash
bun run test:e2e:a11y -- --grep "Accessibility Reports"
```

## Test Reports

### View Test Results

After running tests, view results in HTML report:

```bash
bun run test:e2e:report
```

This opens the Playwright HTML report in your default browser.

### Report Locations

- **HTML Report**: `playwright-report/index.html`
- **JSON Results**: `playwright-report/results.json`
- **JUnit XML**: `playwright-report/results.xml`
- **Accessibility Reports**: `test-results/a11y-reports/*.json`

### Interpreting Reports

Each accessibility report contains:

```json
{
  "violations": [
    {
      "id": "color-contrast",
      "impact": "serious",
      "description": "Elements must have sufficient color contrast",
      "nodes": [
        {
          "target": ["button.submit"],
          "html": "<button class='submit'>Save</button>"
        }
      ]
    }
  ],
  "passes": [
    {
      "id": "button-name",
      "description": "Buttons must have discernible text"
    }
  ],
  "incomplete": []
}
```

## Debugging Failed Tests

### View Failed Test Details

```bash
# Run test in debug mode with inspector
bun run test:e2e:a11y:debug
```

### Check Specific Failure

```bash
# Run single test file
bun run test:e2e:a11y -- wcag-compliance.spec.ts

# Run single test
bun run test:e2e:a11y -- -g "should meet WCAG AA standards"
```

### Inspect Page Content

In debug mode, you can:
1. Pause test execution
2. Inspect the page in the browser
3. Use DevTools accessibility inspector
4. Check the HTML structure

## Common Accessibility Issues and Fixes

### Issue: Color Contrast Violation

**Error**: Elements must have sufficient color contrast

**Solution**:

```typescript
// Check color tokens in apps/web/src/index.css
// Ensure foreground/background contrast ≥ 4.5:1

// Example fix
const textColor = 'text-foreground';      // Dark text
const bgColor = 'bg-background';          // Light background
// Contrast: 6.8:1 ✅ PASS
```

### Issue: Missing Alt Text

**Error**: Images must have alt text

**Solution**:

```typescript
// ADD alt text to images
<img src="logo.png" alt="Company logo" />

// For decorative images
<img src="spacer.png" alt="" role="presentation" />
```

### Issue: Missing Form Label

**Error**: Form inputs must have associated labels

**Solution**:

```typescript
// Ensure label htmlFor matches input id
<label htmlFor="email">Email</label>
<input id="email" type="email" />
```

### Issue: Missing Keyboard Handler

**Error**: Interactive elements must support keyboard

**Solution**:

```typescript
// Use semantic buttons instead of divs
<button onClick={handleClick}>Click me</button>

// If using custom element, add keyboard support
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Custom button
</div>
```

### Issue: Focus Not Visible

**Error**: Interactive elements must have visible focus

**Solution**:

```typescript
// Add focus styles
<button className="focus:outline-none focus:ring-2 focus:ring-primary-500">
  Click me
</button>

// In CSS
button:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

### Issue: Icon Button Without Label

**Error**: Icon buttons must have accessible name

**Solution**:

```typescript
// Option 1: sr-only text
<button>
  <Download className="h-4 w-4" />
  <span className="sr-only">Download</span>
</button>

// Option 2: aria-label
<button aria-label="Download">
  <Download className="h-4 w-4" />
</button>
```

## Adding New Accessibility Tests

### Template for New Test

```typescript
import { test, expect } from '../../fixtures/base-fixtures';

test.describe('New Feature Accessibility', () => {
  test.use({ storageState: 'tests/fixtures/auth-state.json' });

  test('component should be keyboard accessible', async ({ page, a11yHelper }) => {
    await page.goto('/path-to-page');
    await page.waitForLoadState('networkidle');

    // Test keyboard navigation
    await a11yHelper.testKeyboardNavigation([
      'button.action1',
      'button.action2',
      'a[href="/next"]',
    ]);
  });

  test('component should meet WCAG AA standards', async ({ page, a11yHelper }) => {
    await page.goto('/path-to-page');
    await a11yHelper.scanWCAG_AA();
  });

  test('form should have proper labels', async ({ page, a11yHelper }) => {
    await page.goto('/path-to-form');
    await a11yHelper.testFormLabels();
  });
});
```

## Manual Accessibility Testing

### Test Checklist

Use this checklist for manual testing:

#### Keyboard Navigation
- [ ] Can navigate to all interactive elements using Tab
- [ ] Can activate buttons using Enter or Space
- [ ] Can close modals using Escape
- [ ] Tab order is logical and visible
- [ ] No keyboard traps

#### Screen Reader
- [ ] Page structure is announced correctly
- [ ] Headings are announced with levels
- [ ] Form labels are announced with inputs
- [ ] Links have descriptive text
- [ ] Button purposes are clear
- [ ] Icons have alt text or aria-labels
- [ ] Navigation landmarks are announced

#### Visual
- [ ] Focus indicators are visible
- [ ] Color contrast is sufficient
- [ ] Text is readable
- [ ] Zoom to 200% doesn't break layout
- [ ] Dark mode is readable

### Manual Testing Tools

```bash
# Analyze page with Axe
# 1. Open DevTools (F12)
# 2. Axe DevTools > Scan ALL of my page

# Test with NVDA (Windows)
# Download from https://www.nvaccess.org/

# Test with VoiceOver (Mac)
# Cmd + F5 to enable

# Check color contrast
# https://webaim.org/resources/contrastchecker/
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Accessibility Tests

on: [push, pull_request]

jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run test:e2e:a11y
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Pre-commit Hook

```bash
#!/bin/bash
# .husky/pre-commit

# Run accessibility tests
bun run test:e2e:a11y --failOnViolations

if [ $? -ne 0 ]; then
  echo "Accessibility tests failed!"
  exit 1
fi
```

## Performance Benchmarks

### Expected Test Execution Times

| Test Suite | Browsers | Time |
|---|---|---|
| All accessibility tests | Chromium | ~45 seconds |
| Single page test | Chromium | ~5 seconds |
| WCAG compliance | All (6) | ~4 minutes |

## Troubleshooting

### Tests Won't Run

**Error**: `Cannot find package '@GCMC-KAJ/db'`

**Solution**: Update imports in `tests/utils/data-seeder.ts` to use `@prisma/client` instead

### Server Won't Start

**Error**: `Connection refused` when running tests

**Solution**:
```bash
# Make sure the development server is running
bun run dev:web

# Or let Playwright start it automatically
# The playwright.config.ts includes webServer configuration
```

### Tests Timeout

**Error**: Tests timeout waiting for page load

**Solution**:
```typescript
// Increase timeout for slow pages
await page.goto('/slow-page', { timeout: 30000 });
await page.waitForLoadState('networkidle', { timeout: 30000 });
```

### Focus Tests Failing

**Error**: Focus visible tests fail in headless mode

**Solution**:
```bash
# Run tests with browser visible (headed mode)
bun run test:e2e:a11y:headed

# Or use debug mode
bun run test:e2e:a11y:debug
```

## Resources

### Documentation
- [WCAG 2.1 Specification](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Playwright Accessibility Testing](https://playwright.dev/docs/accessibility-testing)

### Tools
- [Axe DevTools Browser Extension](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Screen Readers
- [NVDA (Windows/Linux)](https://www.nvaccess.org/)
- [JAWS (Windows)](https://www.freedomscientific.com/)
- [VoiceOver (Mac/iOS)](https://www.apple.com/voiceover/)
- [TalkBack (Android)](https://support.google.com/accessibility/android/answer/6283677)

## Support

For questions or issues with accessibility testing:

- **Slack**: #accessibility
- **Email**: accessibility@gcmc-platform.com
- **Issues**: Tag with `accessibility` label

---

**Last Updated**: November 2024
**Version**: 1.0

