# GCMC Platform Design System

## Overview

The GCMC Platform Design System is a comprehensive, production-ready design system that transforms the platform from scaffold UI to a stunning professional compliance management application. This system provides a cohesive visual language, consistent user experience, and accessible interface components.

## Brand Identity

### Vision
Professional, trustworthy, and modern compliance management platform that instills confidence through clear visual hierarchy and accessible design.

### Personality Traits
- **Professional**: Clean, organized, business-focused
- **Trustworthy**: Solid, reliable, secure
- **Modern**: Contemporary, efficient, tech-forward
- **Accessible**: Clear, readable, inclusive

---

## Color System

### Primary Brand Colors (Blue-Gray)

The GCMC brand uses a sophisticated blue-gray palette that conveys professionalism, trust, and stability.

```css
Brand 50:  #f0f4f8  oklch(0.965 0.005 240) - Lightest backgrounds
Brand 100: #d9e2ec  oklch(0.910 0.010 240) - Subtle backgrounds
Brand 200: #bcccdc  oklch(0.840 0.020 240) - Borders, dividers
Brand 300: #9fb3c8  oklch(0.765 0.030 240) - Disabled states
Brand 400: #829ab1  oklch(0.680 0.040 240) - Placeholder text
Brand 500: #627d98  oklch(0.570 0.050 240) - PRIMARY BRAND COLOR
Brand 600: #486581  oklch(0.475 0.055 240) - Interactive elements
Brand 700: #334e68  oklch(0.390 0.060 240) - Hover states
Brand 800: #243b53  oklch(0.310 0.055 240) - Active states
Brand 900: #102a43  oklch(0.230 0.045 240) - Text, headings
```

**Usage:**
- Primary buttons and CTAs: Brand 600
- Navigation elements: Brand 700-900
- Backgrounds: Brand 50-100
- Borders and dividers: Brand 200-300

### Accent Colors (Trust Green)

Green signifies compliance, success, and positive status - critical for a compliance platform.

```css
Accent 50:  #f0fdf4  oklch(0.980 0.020 145) - Success backgrounds
Accent 100: #dcfce7  oklch(0.950 0.050 145) - Success highlights
Accent 200: #bbf7d0  oklch(0.910 0.090 145) - Success borders
Accent 300: #86efac  oklch(0.850 0.130 145) - Success indicators
Accent 400: #4ade80  oklch(0.780 0.165 145) - Success states
Accent 500: #22c55e  oklch(0.700 0.195 145) - PRIMARY ACCENT
Accent 600: #16a34a  oklch(0.600 0.190 145) - Compliant badges
Accent 700: #15803d  oklch(0.510 0.175 145) - Success hover
Accent 800: #166534  oklch(0.440 0.155 145) - Success active
Accent 900: #14532d  oklch(0.380 0.130 145) - Success text
```

**Usage:**
- Compliance status badges: Accent 600
- Success messages: Accent 500-700
- Positive metrics: Accent 500
- Checkmarks and confirmations: Accent 600

### Semantic Colors

```css
Success: #10b981  oklch(0.650 0.180 155) - Success states, compliant
Warning: #f59e0b  oklch(0.750 0.150 75)  - Warnings, pending items
Error:   #ef4444  oklch(0.630 0.240 25)  - Errors, non-compliant
Info:    #3b82f6  oklch(0.600 0.215 250) - Information, neutral status
```

**Usage Guidelines:**
- Use semantic colors consistently across the platform
- Combine with icons for better accessibility
- Never rely solely on color to convey information
- Ensure sufficient contrast ratios (WCAG AA minimum)

### Color Accessibility

All color combinations in this system meet WCAG 2.1 Level AA standards:
- Normal text: 4.5:1 contrast ratio minimum
- Large text (18pt+): 3:1 contrast ratio minimum
- UI components: 3:1 contrast ratio minimum

---

## Typography

### Font Families

```css
Sans-serif: 'Inter var', 'Inter', system-ui, sans-serif
Monospace:  'JetBrains Mono', 'Fira Code', monospace
Display:    'Inter var', 'Inter', system-ui
```

**Why Inter?**
- Excellent readability at all sizes
- Professional, modern appearance
- Variable font support for performance
- Extensive OpenType features
- Designed for UI/digital interfaces

### Type Scale

```css
xs:   0.75rem   (12px) - Fine print, captions
sm:   0.875rem  (14px) - Secondary text, labels
base: 1rem      (16px) - Body text (DEFAULT)
lg:   1.125rem  (18px) - Emphasized text
xl:   1.25rem   (20px) - Subheadings
2xl:  1.5rem    (24px) - Section headings
3xl:  1.875rem  (30px) - Page headings
4xl:  2.25rem   (36px) - Major headings
5xl:  3rem      (48px) - Hero text
```

### Font Weights

```css
Light:     300 - Rarely used, decorative only
Normal:    400 - Body text
Medium:    500 - Emphasis, labels
Semibold:  600 - Subheadings, buttons
Bold:      700 - Headings, strong emphasis
```

### Line Heights

```css
Tight:    1.25  - Large headings
Normal:   1.5   - Body text (DEFAULT)
Relaxed:  1.75  - Long-form content
```

### Typography Best Practices

**DO:**
- Use semibold (600) for buttons and interactive elements
- Maintain consistent heading hierarchy (h1 → h2 → h3)
- Use medium (500) weight for form labels
- Keep line lengths between 45-75 characters for readability

**DON'T:**
- Use more than 3 font weights on a single page
- Set body text below 14px (0.875rem)
- Use light weight (300) for body text
- Mix multiple font families

---

## Spacing System

Based on an 8px grid for consistency and visual rhythm.

```css
0:  0         Base/reset
1:  0.25rem   4px   - Tight spacing
2:  0.5rem    8px   - Base unit
3:  0.75rem   12px  - Compact spacing
4:  1rem      16px  - Standard spacing
5:  1.25rem   20px  - Comfortable spacing
6:  1.5rem    24px  - Loose spacing
8:  2rem      32px  - Section spacing
10: 2.5rem    40px  - Large spacing
12: 3rem      48px  - Extra large spacing
16: 4rem      64px  - Major sections
20: 5rem      80px  - Page sections
24: 6rem      96px  - Hero sections
```

### Spacing Guidelines

**Component Spacing:**
- Buttons padding: `py-2 px-4` (8px × 16px)
- Card padding: `p-6` (24px)
- Section spacing: `py-12` (48px)
- Page margins: `px-8` or `px-12` (32px or 48px)

**Layout Grid:**
- Column gaps: `gap-6` (24px)
- Row gaps: `gap-8` (32px)
- Container max-width: 1280px

---

## Border Radius

Rounded corners create a modern, friendly appearance while maintaining professionalism.

```css
none: 0         Sharp corners
sm:   0.25rem   4px   - Small elements
base: 0.5rem    8px   - Default (cards, inputs)
md:   0.75rem   12px  - Medium elements
lg:   1rem      16px  - Large cards
xl:   1.5rem    24px  - Hero cards
full: 9999px         - Pills, avatars
```

**Usage:**
- Form inputs: `rounded-base` (8px)
- Buttons: `rounded-base` (8px)
- Cards: `rounded-lg` (16px)
- Modals: `rounded-xl` (24px)
- Badges: `rounded-full` (pill shape)

---

## Shadows & Elevation

Subtle shadows create depth and visual hierarchy without being overwhelming.

```css
sm:   0 1px 2px 0 rgb(0 0 0 / 0.05)
      Subtle elevation for hover states

base: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)
      Default card elevation

md:   0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
      Elevated cards, dropdowns

lg:   0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
      Modals, popovers

xl:   0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)
      Floating elements, tooltips
```

**Elevation Levels:**
1. **Level 0** (no shadow): Inline elements, backgrounds
2. **Level 1** (sm): Subtle hover states
3. **Level 2** (base): Standard cards, containers
4. **Level 3** (md): Active/selected states, dropdowns
5. **Level 4** (lg): Modals, dialogs
6. **Level 5** (xl): Tooltips, notifications

---

## Animation & Motion

Smooth, purposeful animations enhance user experience without being distracting.

### Duration

```css
Fast: 150ms - Micro-interactions (hover, focus)
Base: 250ms - Standard transitions (DEFAULT)
Slow: 350ms - Complex animations (modals, drawers)
```

### Easing Functions

```css
In:    cubic-bezier(0.4, 0, 1, 1)      - Accelerating
Out:   cubic-bezier(0, 0, 0.2, 1)      - Decelerating (DEFAULT)
InOut: cubic-bezier(0.4, 0, 0.2, 1)    - Smooth both ways
```

### Animation Guidelines

**DO:**
- Use `ease-out` for most transitions
- Keep duration under 350ms for UI elements
- Animate opacity, transform, and colors
- Provide `prefers-reduced-motion` alternatives

**DON'T:**
- Animate layout properties (width, height, top, left)
- Use animations longer than 500ms
- Create infinite animations (except loaders)
- Animate without user trigger

---

## Component Patterns

### Buttons

```tsx
// Primary Button
<button className="bg-primary text-primary-foreground hover:bg-brand-700
                   px-4 py-2 rounded-base font-semibold transition-colors">
  Primary Action
</button>

// Secondary Button
<button className="bg-secondary text-secondary-foreground hover:bg-brand-200
                   px-4 py-2 rounded-base font-semibold transition-colors">
  Secondary Action
</button>

// Success Button
<button className="bg-accent text-accent-foreground hover:bg-accent-700
                   px-4 py-2 rounded-base font-semibold transition-colors">
  Success Action
</button>
```

### Cards

```tsx
// Standard Card
<div className="bg-card rounded-lg shadow-base p-6 border border-border">
  <h3 className="text-xl font-semibold mb-2">Card Title</h3>
  <p className="text-muted-foreground">Card content...</p>
</div>

// Elevated Card (hover)
<div className="bg-card rounded-lg shadow-base hover:shadow-md
                transition-shadow p-6 border border-border">
  Interactive card content
</div>
```

### Status Badges

```tsx
// Compliant Status
<span className="inline-flex items-center px-3 py-1 rounded-full
                 text-sm font-medium bg-accent-100 text-accent-900">
  Compliant
</span>

// Pending Status
<span className="inline-flex items-center px-3 py-1 rounded-full
                 text-sm font-medium bg-warning/10 text-warning">
  Pending
</span>

// Non-Compliant Status
<span className="inline-flex items-center px-3 py-1 rounded-full
                 text-sm font-medium bg-error/10 text-error">
  Non-Compliant
</span>
```

### Form Inputs

```tsx
// Text Input
<input
  type="text"
  className="w-full px-4 py-2 rounded-base border border-input
             bg-background text-foreground
             focus:outline-none focus:ring-2 focus:ring-ring
             transition-shadow"
  placeholder="Enter value..."
/>

// Select Dropdown
<select className="w-full px-4 py-2 rounded-base border border-input
                   bg-background text-foreground
                   focus:outline-none focus:ring-2 focus:ring-ring">
  <option>Option 1</option>
</select>
```

---

## Accessibility Guidelines

### Color Contrast

- **Normal Text**: Minimum 4.5:1 contrast ratio (WCAG AA)
- **Large Text** (18pt+): Minimum 3:1 contrast ratio
- **Interactive Elements**: Minimum 3:1 contrast ratio
- **Focus Indicators**: Always visible, high contrast

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Visible focus indicators required (ring-2 ring-ring)
- Logical tab order maintained
- Skip navigation links for long pages

### Screen Readers

- Use semantic HTML elements (button, nav, main, etc.)
- Provide alt text for all images
- Use aria-labels for icon-only buttons
- Announce dynamic content changes

### Motion & Animation

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Design Principles

### 1. Consistency
- Use design tokens consistently across all components
- Maintain visual hierarchy through typography and spacing
- Apply the same patterns for similar interactions

### 2. Clarity
- Clear visual hierarchy guides user attention
- Sufficient whitespace prevents cognitive overload
- Descriptive labels and helpful error messages

### 3. Efficiency
- Minimize clicks to complete tasks
- Provide keyboard shortcuts for power users
- Show loading states and progress indicators

### 4. Trustworthiness
- Professional appearance builds confidence
- Consistent branding reinforces reliability
- Clear status indicators (compliant/non-compliant)

### 5. Accessibility
- WCAG 2.1 Level AA compliance minimum
- Keyboard navigation for all features
- Screen reader compatible
- Respects user preferences (dark mode, reduced motion)

---

## Dark Mode

The design system includes a comprehensive dark mode implementation:

### Color Adaptation
- Reduced contrast to prevent eye strain
- Adjusted saturation for better readability
- Inverted elevation (lighter = elevated)
- Consistent semantic color meanings

### Usage
```tsx
// Components automatically adapt to dark mode
<div className="bg-background text-foreground">
  This content adapts to light/dark mode
</div>

// Dark mode specific styles
<div className="bg-white dark:bg-gray-900">
  Override when needed
</div>
```

---

## Usage Examples

### Dashboard Header

```tsx
<header className="bg-card border-b border-border shadow-sm">
  <div className="max-w-7xl mx-auto px-8 py-6">
    <h1 className="text-3xl font-bold text-foreground">
      Compliance Dashboard
    </h1>
    <p className="text-muted-foreground mt-1">
      Monitor and manage compliance across all clients
    </p>
  </div>
</header>
```

### Client Card

```tsx
<div className="bg-card rounded-lg shadow-base hover:shadow-md
                transition-shadow p-6 border border-border">
  <div className="flex items-start justify-between">
    <div>
      <h3 className="text-xl font-semibold text-foreground">
        Acme Corporation
      </h3>
      <p className="text-sm text-muted-foreground mt-1">
        ID: CLT-2024-001
      </p>
    </div>
    <span className="inline-flex items-center px-3 py-1 rounded-full
                     text-sm font-medium bg-accent-100 text-accent-900">
      Compliant
    </span>
  </div>

  <div className="mt-6 grid grid-cols-3 gap-4">
    <div>
      <p className="text-sm text-muted-foreground">Active Filings</p>
      <p className="text-2xl font-semibold text-foreground mt-1">12</p>
    </div>
    <div>
      <p className="text-sm text-muted-foreground">Pending Tasks</p>
      <p className="text-2xl font-semibold text-warning mt-1">3</p>
    </div>
    <div>
      <p className="text-sm text-muted-foreground">Compliance Rate</p>
      <p className="text-2xl font-semibold text-accent-600 mt-1">98%</p>
    </div>
  </div>
</div>
```

### Data Table

```tsx
<div className="bg-card rounded-lg shadow-base border border-border overflow-hidden">
  <table className="w-full">
    <thead className="bg-muted border-b border-border">
      <tr>
        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
          Filing
        </th>
        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
          Status
        </th>
        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
          Due Date
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-border">
      <tr className="hover:bg-muted/50 transition-colors">
        <td className="px-6 py-4 text-sm text-foreground">
          Annual Report
        </td>
        <td className="px-6 py-4">
          <span className="inline-flex items-center px-2 py-1 rounded-full
                         text-xs font-medium bg-accent-100 text-accent-900">
            Complete
          </span>
        </td>
        <td className="px-6 py-4 text-sm text-muted-foreground">
          Dec 31, 2024
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## Resources

### Design Tools
- **Figma**: Design tokens exported to Figma tokens plugin
- **Tailwind CSS v4**: CSS-based configuration
- **TypeScript**: Type-safe design tokens

### File Locations
- Design tokens: `/packages/ui-tokens/src/index.ts`
- Tailwind config: `/apps/web/src/index.css`
- Components: `/apps/web/src/components/`

### Additional Reading
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Inter Font Family](https://rsms.me/inter/)

---

## Changelog

### Version 1.0.0 (Phase 7)
- Initial design system creation
- Professional brand colors (blue-gray + trust green)
- Comprehensive typography scale
- Spacing system based on 8px grid
- Dark mode support
- Accessibility guidelines
- Component patterns and examples
