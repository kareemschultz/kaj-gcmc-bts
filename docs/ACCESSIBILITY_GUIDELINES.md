# GCMC Platform - Accessibility Developer Guidelines

## Overview

This guide ensures all developers on the GCMC Platform maintain WCAG 2.1 Level AA accessibility standards. Accessibility is not an afterthought but an integral part of the development process.

## Quick Start Checklist

Before committing any changes:

- [ ] All interactive elements are keyboard accessible
- [ ] Color contrast ratios meet WCAG AA standards
- [ ] Images have descriptive alt text
- [ ] Form inputs have associated labels
- [ ] Icon-only buttons have aria-labels
- [ ] Focus indicators are visible
- [ ] No color used as sole means of communication
- [ ] Content is logical and semantic
- [ ] ARIA attributes are used correctly
- [ ] Tests include accessibility checks

## 1. Semantic HTML

### Always Use Semantic Elements

Use semantic HTML elements instead of divs with roles:

```typescript
// GOOD - Use semantic elements
<button onClick={handleClick}>Click me</button>
<nav>Navigation content</nav>
<main>Main content</main>
<header>Header content</header>
<footer>Footer content</footer>
<article>Article content</article>
<section>Section content</section>

// AVOID - Using divs with roles
<div role="button" onClick={handleClick}>Click me</div>
<div role="navigation">Navigation content</div>
```

### Headings Hierarchy

Maintain proper heading hierarchy (h1 → h2 → h3):

```typescript
// GOOD - Proper hierarchy
<h1>Page Title</h1>
<h2>Section Title</h2>
<h3>Subsection Title</h3>

// AVOID - Skipping levels
<h1>Page Title</h1>
<h3>Skipped h2!</h3>
```

### List Elements

Use semantic list elements:

```typescript
// GOOD
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>

<ol>
  <li>First step</li>
  <li>Second step</li>
</ol>

// AVOID
<div>
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

## 2. Keyboard Navigation

### Tab Order

Ensure logical tab order:

```typescript
// Tab order follows visual/reading order
<input type="text" />
<button>Submit</button>
<a href="/help">Help</a>

// Use tabIndex only when necessary
<button tabIndex={0}>Important button</button>
<button tabIndex={-1}>Skipped in tab order</button>
```

### Focus Management

Manage focus for dynamic content:

```typescript
import { useRef, useEffect } from 'react';

export function Dialog({ isOpen, onClose }) {
  const focusableRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && focusableRef.current) {
      focusableRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div role="dialog">
      <p>Dialog content</p>
      <button ref={focusableRef} onClick={onClose}>
        Close
      </button>
    </div>
  );
}
```

### Keyboard Event Handling

Handle Enter and Space for buttons:

```typescript
// Using native button element (automatically handles Enter/Space)
<button onClick={handleClick}>Click me</button>

// For custom interactive elements (if semantic element cannot be used)
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  Custom button
</div>
```

## 3. Focus Indicators

### Visible Focus Indicators

All interactive elements must have visible focus indicators:

```typescript
// Using Tailwind utility classes
<button className="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
  Button with focus indicator
</button>

// For input fields
<input
  className="focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-300"
  type="text"
/>
```

### Custom Focus Styles

If customizing focus styles, maintain visibility:

```css
/* GOOD - Visible focus indicator */
:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* AVOID - No visible focus */
:focus {
  outline: none;
}

/* AVOID - Very thin outline */
:focus {
  outline: 1px solid #ccc;
}
```

## 4. Color Contrast

### Minimum Ratios

- **Normal text**: 4.5:1 contrast ratio
- **Large text** (18pt+): 3:1 contrast ratio
- **Graphics/UI**: 3:1 contrast ratio

### Testing Color Contrast

```typescript
// Use automated tools
import { inchAudit } from '@axe-core/playwright';

// Example in tests
await page.goto('/dashboard');
const results = await inchAudit(page);
// Assert no contrast violations
```

### Color Not Sole Indicator

```typescript
// GOOD - Uses color and text
<button className="bg-green-500 text-white">
  Success ✓
</button>

// GOOD - Uses color and icon
<span className="flex items-center gap-2">
  <CheckCircle className="text-green-500" />
  <span>Success</span>
</span>

// AVOID - Color alone
<div className="bg-red-500">Error</div> {/* No text label */}
```

## 5. Images and Icons

### Alt Text for Images

```typescript
// GOOD - Descriptive alt text
<img
  src="dashboard.png"
  alt="Dashboard showing active users and revenue metrics"
/>

// GOOD - Decorative images
<img
  src="divider.png"
  alt=""
  role="presentation"
/>

// AVOID - Missing alt text
<img src="dashboard.png" />

// AVOID - Vague alt text
<img src="dashboard.png" alt="dashboard" />
```

### Icon-Only Buttons

Always add aria-label to icon-only buttons:

```typescript
import { Download } from 'lucide-react';

// GOOD - Icon with aria-label
<button aria-label="Download report">
  <Download className="h-4 w-4" />
</button>

// GOOD - Icon with sr-only text
<button>
  <Download className="h-4 w-4" />
  <span className="sr-only">Download report</span>
</button>

// AVOID - Icon without label
<button>
  <Download className="h-4 w-4" />
</button>
```

### Icon Descriptions

When icons need descriptions, use aria-describedby:

```typescript
<button aria-labelledby="icon-label" aria-describedby="icon-desc">
  <Icon className="h-6 w-6" />
</button>
<span id="icon-label" className="sr-only">Settings</span>
<span id="icon-desc" className="sr-only">
  Configure application settings and preferences
</span>
```

## 6. Form Accessibility

### Label Association

```typescript
// GOOD - Label with htmlFor
<label htmlFor="email">Email Address</label>
<input id="email" type="email" />

// GOOD - Label wrapping input
<label>
  Email Address
  <input type="email" />
</label>

// AVOID - No label association
<label>Email Address</label>
<input type="email" />
```

### Form Validation

```typescript
// GOOD - Clear error messages
<label htmlFor="password">Password</label>
<input
  id="password"
  type="password"
  aria-invalid={!isValid}
  aria-describedby={!isValid ? "password-error" : undefined}
/>
{!isValid && (
  <span id="password-error" role="alert">
    Password must be at least 8 characters
  </span>
)}

// GOOD - Required indicator
<label htmlFor="username">
  Username <span aria-label="required">*</span>
</label>
<input id="username" required />
```

### Input Grouping

```typescript
// GOOD - Grouped with fieldset
<fieldset>
  <legend>Notification Preferences</legend>
  <label>
    <input type="checkbox" /> Email notifications
  </label>
  <label>
    <input type="checkbox" /> SMS notifications
  </label>
</fieldset>

// GOOD - Grouped with role="group"
<div role="group" aria-labelledby="group-label">
  <h3 id="group-label">Filter options</h3>
  <label><input type="checkbox" /> Active</label>
  <label><input type="checkbox" /> Inactive</label>
</div>
```

## 7. ARIA Usage

### ARIA Labels

```typescript
// GOOD - aria-label for icon buttons
<button aria-label="Close dialog">×</button>

// GOOD - aria-label for custom widgets
<div
  role="slider"
  aria-label="Volume"
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={50}
/>

// AVOID - Redundant ARIA on semantic elements
<button aria-label="Click me">Click me</button>
```

### Live Regions

Use aria-live for dynamic content:

```typescript
// GOOD - Announce status updates
<div aria-live="polite" aria-atomic="true">
  {loadingMessage && <span>{loadingMessage}</span>}
</div>

// GOOD - Announce errors immediately
<div aria-live="assertive" role="alert">
  {errorMessage && <span>{errorMessage}</span>}
</div>

// GOOD - Announce loading
<div aria-busy={isLoading} role="status">
  {isLoading && <span>Loading...</span>}
</div>
```

### ARIA Attributes

```typescript
// Relationships
<button aria-controls="panel1">Toggle Panel</button>
<div id="panel1" aria-hidden={!isOpen}>
  Panel content
</div>

// State
<button aria-pressed={isActive} onClick={toggle}>
  Toggle
</button>

// Expansion
<button aria-expanded={isOpen} aria-controls="details">
  Show Details
</button>

// Current page
<nav>
  <a href="/dashboard" aria-current="page">Dashboard</a>
  <a href="/reports">Reports</a>
</nav>
```

## 8. Testing for Accessibility

### Automated Testing with Axe

```typescript
import { test, expect } from '@playwright/test';
import { AccessibilityHelper } from '@/tests/utils/accessibility-helper';

test('page should meet WCAG AA standards', async ({ page }) => {
  await page.goto('/dashboard');

  const a11yHelper = new AccessibilityHelper(page);
  await a11yHelper.scanWCAG_AA();
});
```

### Manual Testing Checklist

- [ ] **Keyboard Only**: Navigate entire page using Tab, Enter, Escape
- [ ] **Screen Reader**: Test with NVDA or VoiceOver
- [ ] **Color Contrast**: Use WebAIM Contrast Checker
- [ ] **Zoom**: Test at 200% zoom level
- [ ] **Mobile**: Test on mobile with assistive tech
- [ ] **Focus**: Verify focus indicators visible
- [ ] **Landmarks**: Verify nav, main, header, footer exist
- [ ] **Images**: Check alt text meaningful
- [ ] **Forms**: Test form labels and error messages
- [ ] **Links**: Verify link purposes clear

### Testing Tools

```bash
# Install testing tools
npm install --save-dev @axe-core/playwright
npm install --save-dev @testing-library/jest-dom

# Run accessibility tests
bun run test:e2e:a11y

# Check specific element
npx axe https://example.com
```

## 9. Component Best Practices

### Buttons vs Links

```typescript
// Use BUTTON for actions
<button onClick={handleAction}>Save</button>

// Use LINK for navigation
<a href="/dashboard">Go to Dashboard</a>
```

### Modal/Dialog

```typescript
<dialog
  aria-label="Confirm action"
  aria-modal="true"
>
  <p>Are you sure?</p>
  <button onClick={onConfirm}>Yes</button>
  <button onClick={onCancel}>No</button>
</dialog>
```

### Tabs

```typescript
<div role="tablist" aria-label="Content tabs">
  <button
    role="tab"
    aria-selected={activeTab === 'overview'}
    aria-controls="panel-overview"
  >
    Overview
  </button>
  <div
    id="panel-overview"
    role="tabpanel"
    aria-labelledby="tab-overview"
  >
    Overview content
  </div>
</div>
```

### Dropdown Menu

```typescript
<div role="menu">
  <button aria-haspopup="menu" aria-expanded={isOpen}>
    Menu
  </button>
  {isOpen && (
    <div role="menu" aria-label="Actions">
      <button role="menuitem">Edit</button>
      <button role="menuitem">Delete</button>
    </div>
  )}
</div>
```

## 10. Common Accessibility Patterns

### Skip Links

```typescript
// Add skip link at top of page
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>

<main id="main-content">
  Main content here
</main>
```

### Breadcrumbs

```typescript
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/products">Products</a></li>
    <li aria-current="page">Product Details</li>
  </ol>
</nav>
```

### Loading States

```typescript
<div aria-busy={isLoading} role="status" aria-live="polite">
  {isLoading ? (
    <>
      <span aria-hidden="true">Loading...</span>
      <span className="sr-only">Loading content</span>
    </>
  ) : (
    <div>{content}</div>
  )}
</div>
```

### Notifications/Toasts

```typescript
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {notification}
</div>
```

## 11. Accessibility in CI/CD

### Pre-commit Hooks

```bash
# .husky/pre-commit
npm run check:a11y
npm run test:e2e:a11y -- --failOnViolations
```

### Continuous Integration

```yaml
# In GitHub Actions or similar
- name: Run accessibility tests
  run: npm run test:e2e:a11y
```

## 12. Resources and References

### WCAG 2.1
- [WCAG 2.1 Specification](https://www.w3.org/WAI/WCAG21/quickref/)
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/)

### ARIA
- [ARIA Authoring Practice Guide](https://www.w3.org/WAI/ARIA/apg/)
- [Using ARIA](https://www.w3.org/TR/using-aria/)

### Tools
- [Axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebAIM](https://webaim.org/)

### Screen Readers
- [NVDA (free, Windows/Linux)](https://www.nvaccess.org/)
- [JAWS (commercial, Windows)](https://www.freedomscientific.com/)
- [VoiceOver (free, macOS/iOS)](https://www.apple.com/voiceover/)
- [TalkBack (free, Android)](https://support.google.com/accessibility/android/answer/6283677)

## 13. Accessibility Review Process

### Code Review Checklist

When reviewing code, check:

- [ ] All buttons/links are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Color contrast is sufficient
- [ ] Alt text provided for images
- [ ] Form inputs have labels
- [ ] ARIA used appropriately
- [ ] No keyboard traps
- [ ] Semantic HTML used
- [ ] No auto-playing audio/video
- [ ] Tested with screen reader

### Design Review

- [ ] Contrast ratios calculated before implementation
- [ ] Icon meanings clear without color alone
- [ ] Focus states designed
- [ ] Text readability verified
- [ ] Color blindness considered

## 14. Contact and Questions

For accessibility questions or guidance:

- **Slack Channel**: #accessibility
- **Email**: accessibility@gcmc-platform.com
- **Issue Tracker**: Tag with `accessibility` label

---

**Last Updated**: November 2024
**Version**: 1.0
**Next Review**: May 2025

