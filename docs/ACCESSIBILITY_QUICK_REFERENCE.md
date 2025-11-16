# Accessibility Quick Reference Card

A quick guide for developers implementing accessibility features.

## Do's and Don'ts

### Buttons and Links

#### DO ✅
```tsx
// Semantic button
<button onClick={handleClick}>Save</button>

// Semantic link
<a href="/dashboard">Dashboard</a>

// Icon button with aria-label
<button aria-label="Download"><Download size={20} /></button>
```

#### DON'T ❌
```tsx
// Div that looks like button
<div onClick={handleClick} role="button">Save</div>

// Link without href
<a onClick={handleClick}>Dashboard</a>

// Icon button without label
<button><Download size={20} /></button>
```

---

### Form Labels

#### DO ✅
```tsx
// Proper label association
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// Label wrapping input
<label>
  Email
  <input type="email" />
</label>

// ARIA label for complex inputs
<input aria-label="Email address" type="email" />
```

#### DON'T ❌
```tsx
// No label
<input type="email" />

// Unassociated label
<label>Email</label>
<input type="email" />

// Placeholder as label
<input placeholder="Email" type="email" />
```

---

### Headings

#### DO ✅
```tsx
// Proper hierarchy
<h1>Page Title</h1>
<h2>Section</h2>
<h3>Subsection</h3>

// One h1 per page
<h1>Main Title</h1>
```

#### DON'T ❌
```tsx
// Skip levels
<h1>Title</h1>
<h3>Skip h2!</h3>

// Multiple h1s
<h1>Title 1</h1>
<h1>Title 2</h1>

// Use heading for styling
<h3 style={{fontSize: '12px'}}>This shouldn't be a heading</h3>
```

---

### Color

#### DO ✅
```tsx
// Color + text
<button className="bg-red-500">
  Cancel
</button>

// Color + icon
<span className="text-red-500">
  <AlertCircle /> Error
</span>

// 4.5:1 contrast minimum
<p className="text-foreground bg-background">
  High contrast text
</p>
```

#### DON'T ❌
```tsx
// Color alone
<div className="bg-red-500"></div>

// Low contrast
<span className="text-gray-400 bg-white">Low contrast</span>

// Blinking/flashing > 3x per second
<div className="animate-pulse">Don't blink</div>
```

---

### Images

#### DO ✅
```tsx
// Descriptive alt text
<img
  src="chart.png"
  alt="Revenue growth chart showing 25% increase"
/>

// Decorative image
<img src="divider.png" alt="" role="presentation" />

// Icon with label
<button aria-label="Download">
  <Download size={20} />
</button>
```

#### DON'T ❌
```tsx
// Missing alt
<img src="chart.png" />

// Alt text = filename
<img src="chart.png" alt="chart" />

// Icon without label
<button><Download size={20} /></button>
```

---

### Focus

#### DO ✅
```tsx
// Visible focus indicator
<button className="focus-visible:ring-2 focus-visible:ring-primary">
  Click me
</button>

// Outline style
<input className="focus:outline-2 focus:outline-primary" />

// CSS
button:focus-visible {
  outline: 2px solid blue;
  outline-offset: 2px;
}
```

#### DON'T ❌
```tsx
// No focus indicator
<button className="focus:outline-none">Click me</button>

// Invisible focus
button:focus { outline: none; }

// Too thin outline
button:focus { outline: 1px solid #ccc; }
```

---

### ARIA

#### DO ✅
```tsx
// ARIA label on icon button
<button aria-label="Close">×</button>

// ARIA live region
<div aria-live="polite">
  {message}
</div>

// ARIA expanded state
<button aria-expanded={open} aria-controls="menu">
  Menu
</button>
```

#### DON'T ❌
```tsx
// Redundant ARIA on semantic elements
<button aria-label="Click me">Click me</button>

// Wrong live region
<div aria-live="assertive">
  {infoMessage}
</div>

// No ARIA for custom widgets
<div onClick={toggle}>
  <span>{open ? 'Open' : 'Closed'}</span>
</div>
```

---

### Keyboard

#### DO ✅
```tsx
// Tab accessible
<button onClick={action}>Action</button>

// Escape handling
<div onKeyDown={(e) => {
  if (e.key === 'Escape') closeDialog();
}}>

// Enter/Space for buttons
<button onClick={handleClick}>Click</button>
```

#### DON'T ❌
```tsx
// Only mouse events
<div onClick={action}>Action</div>

// No escape support in modal
<div>Modal without escape</div>

// Non-standard keyboard patterns
<input onKeyDown={(e) => {
  if (e.key === 'a') doSomething();
}}
```

---

## Checklist Template

```
Accessibility Checklist:

Keyboard
□ Tab navigation works
□ Focus is visible
□ Escape closes modals
□ No keyboard traps

Visual
□ 4.5:1 text contrast
□ 3:1 UI contrast
□ Focus indicators visible
□ Text readable at 200% zoom

Content
□ Headings proper hierarchy
□ Semantic HTML used
□ No color as sole indicator
□ Images have alt text

Forms
□ All inputs labeled
□ Error messages clear
□ Required fields marked
□ Validation announced

ARIA
□ Labels on icon buttons
□ Live regions for updates
□ Roles appropriate
□ No redundant attributes

Testing
□ Keyboard only navigation
□ Screen reader test
□ Color contrast verified
□ Axe scan passed
```

---

## Common Patterns

### Icon Button
```tsx
<button aria-label="Download document">
  <Download size={20} />
</button>
```

### Form Group
```tsx
<fieldset>
  <legend>Choose one:</legend>
  <label>
    <input type="radio" name="option" /> Option 1
  </label>
  <label>
    <input type="radio" name="option" /> Option 2
  </label>
</fieldset>
```

### Dialog
```tsx
<dialog open aria-labelledby="dialog-title">
  <h2 id="dialog-title">Confirm Action</h2>
  <p>Are you sure?</p>
  <button onClick={onConfirm}>Yes</button>
  <button onClick={onCancel}>No</button>
</dialog>
```

### Loading State
```tsx
<div aria-busy={loading} role="status">
  {loading ? <Spinner /> : content}
</div>
```

### Alert Message
```tsx
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

---

## Tools

| Task | Tool |
|------|------|
| **Find violations** | Axe DevTools, WAVE |
| **Test with screen reader** | NVDA, VoiceOver, JAWS |
| **Check contrast** | WebAIM, Colour Contrast Analyzer |
| **Run tests** | Playwright, Axe, Lighthouse |
| **Debug** | DevTools, Accessibility Inspector |

---

## Links

- [WCAG Quick Ref](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Guide](https://www.w3.org/WAI/ARIA/apg/)
- [MDN A11y](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)

---

## Quick Commands

```bash
# Run accessibility tests
bun run test:e2e:a11y

# View report
bun run test:e2e:report

# Debug test
bun run test:e2e:a11y:debug

# Check specific test
bun run test:e2e:a11y -- -g "WCAG AA"
```

---

**Remember**: Accessibility is everyone's responsibility. Build inclusively!

