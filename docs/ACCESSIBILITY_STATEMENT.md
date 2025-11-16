# GCMC Platform - Accessibility Statement

## Commitment to Accessibility

The GCMC Platform is committed to ensuring digital accessibility for all users, including people with disabilities. We strive to conform to Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards to ensure our platform is usable by everyone.

## Accessibility Conformance Status

**Current Status**: WCAG 2.1 Level AA Compliant

The GCMC Platform has been designed, developed, and tested to meet WCAG 2.1 Level AA conformance criteria. This means:

- All content is perceivable by users with different abilities
- All interactive components are operable via keyboard and assistive technologies
- Information is understandable to users with cognitive disabilities
- Content is robust and compatible with current and future assistive technologies

## Supported Assistive Technologies

Our platform is tested and compatible with:

### Screen Readers
- **Windows/Linux**: NVDA (free, open-source)
- **Windows**: JAWS (commercial)
- **macOS/iOS**: VoiceOver (built-in)
- **Android**: TalkBack (built-in)

### Browser Extensions
- WAVE (Web Accessibility Evaluation Tool)
- Axe DevTools
- Lighthouse Accessibility Audit
- Color Blindness Simulators

### Accessibility Features Tested
- Full keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Voice control (via OS-level voice control)
- Text zoom (up to 200% without loss of functionality)
- High contrast modes
- Reduced motion preferences
- Dark mode support

## Key Accessibility Features

### 1. Keyboard Navigation
- All interactive elements are keyboard accessible
- Logical tab order throughout the application
- Clear focus indicators on all interactive elements
- Keyboard shortcuts for common actions
- Escape key closes dialogs and dropdowns

### 2. Screen Reader Support
- Semantic HTML structure with proper landmarks
- ARIA labels and descriptions for complex components
- Live regions for dynamic content updates
- Alternative text for all images
- Form labels properly associated with inputs

### 3. Visual Accessibility
- Minimum 4.5:1 color contrast ratio for normal text
- Minimum 3:1 color contrast ratio for large text (18pt+)
- Focus indicators with sufficient contrast
- Clear visual hierarchy
- Support for system dark mode preferences

### 4. Responsive Design
- Mobile-friendly interface
- Touch targets minimum 44x44 pixels
- Content readable at 200% zoom
- Responsive layout adapts to different screen sizes

### 5. Forms and Input
- All form inputs have associated labels
- Clear error messages and validation feedback
- Required fields clearly marked
- Success/confirmation messages announced to screen readers

### 6. Motion and Animation
- Respects `prefers-reduced-motion` setting
- No auto-playing animations
- Auto-pausing videos with animation

## Accessibility Testing

The GCMC Platform undergoes comprehensive accessibility testing:

### Automated Testing
- **Axe DevTools**: Automated scanning for WCAG violations
- **Playwright Accessibility Tests**: Automated a11y test suite
- **Lighthouse**: Performance and accessibility audits
- **WAVE**: Web accessibility evaluation

### Manual Testing
- Keyboard navigation testing
- Screen reader testing with NVDA and VoiceOver
- Color contrast verification
- Focus management validation
- Zoom and text enlargement testing

### Continuous Monitoring
- Monthly accessibility audits
- User feedback integration
- Accessibility regression testing in CI/CD pipeline

## Known Issues and Remediation

We regularly identify and fix accessibility issues. Any known issues are listed below with their remediation status:

| Issue | Severity | Status | Target Resolution |
|-------|----------|--------|------------------|
| None currently identified at AA level | N/A | N/A | Ongoing monitoring |

## Browser Compatibility

The GCMC Platform is tested on:

### Desktop Browsers
- Chrome/Chromium (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### Mobile Browsers
- iOS Safari (latest version)
- Chrome Mobile (latest version)
- Firefox Mobile (latest version)

### Minimum Requirements
- JavaScript enabled
- Modern browser supporting ES2020 and CSS Grid/Flexbox

## Contact and Feedback

We welcome accessibility feedback and bug reports. If you encounter any accessibility barriers, please contact us:

**Accessibility Contact**: accessibility@gcmc-platform.com

**Report Issue**: Include:
- Page URL or section
- Issue description
- Expected vs. actual behavior
- Your assistive technology/browser
- Steps to reproduce

We aim to respond to accessibility reports within 2 business days.

## Policy and Standards

The GCMC Platform accessibility practices follow:

- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [Authoring Practice Guide (APG) - ARIA](https://www.w3.org/WAI/ARIA/apg/)
- [Americans with Disabilities Act (ADA)](https://www.ada.gov/)
- [Accessible Rich Internet Applications (ARIA)](https://www.w3.org/TR/wai-aria-1.2/)

## Ongoing Commitment

Accessibility is not a one-time achievement but an ongoing commitment. The GCMC Platform team:

- Regularly updates accessibility practices based on new standards
- Incorporates user feedback to improve accessibility
- Trains developers on accessibility best practices
- Tests all new features for accessibility compliance
- Maintains detailed accessibility documentation

## Resources for Users

### Accessibility Guides
- How to use screen readers with GCMC Platform
- Keyboard shortcuts and navigation guide
- High contrast mode setup
- Text zoom and magnification guide

### External Resources
- [WebAIM](https://webaim.org/) - Web accessibility information
- [Accessibility Insights](https://accessibilityinsights.io/) - Testing tools
- [WCAG Overview](https://www.w3.org/WAI/fundamentals/accessibility-intro/)

---

**Last Updated**: November 2024
**Next Review**: May 2025

