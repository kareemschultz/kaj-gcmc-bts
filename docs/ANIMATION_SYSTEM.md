# GCMC-KAJ Animation System

A comprehensive micro-interactions and animation framework designed specifically for the GCMC-KAJ Business Tax Services Platform. This system provides premium, accessible, and performance-optimized animations throughout the application.

## Features

### 🎨 **Core Animation Components**
- **AnimatedButton** - Enhanced buttons with sophisticated micro-interactions
- **AnimatedInput** - Form fields with focus states, validation feedback, and smooth transitions
- **AnimatedCard** - Interactive cards with hover effects, loading states, and smooth transitions
- **PageTransition** - Smooth page transitions and layout animations
- **StaggeredList** - Sequential reveal animations for lists and grids
- **ScrollReveal** - Intersection Observer-based scroll animations

### 💼 **Business-Specific Animations**
- **ComplianceScore** - Animated progress circles with trend indicators for compliance metrics
- **DeadlineWarning** - Urgency-based pulsing and color transitions for deadline tracking
- **DocumentUploadAnimation** - Drag-and-drop visual feedback with progress indicators
- **MonetaryValue** - Counting animations for financial data with trend visualization
- **StatusChangeAnimation** - Smooth state transitions for business processes

### 📱 **Mobile-Optimized Interactions**
- **SwipeableCard** - Gesture-enabled cards with haptic feedback
- **TouchFeedback** - Visual and haptic feedback for touch interactions
- **PullToRefresh** - Custom animated refresh indicators
- **PinchZoom** - Gesture-controlled zoom with momentum physics

### ♿ **Accessibility Features**
- **AccessibilityControls** - User controls for animation preferences
- **AnimationAnnouncer** - Screen reader announcements for animation changes
- **Reduced Motion Support** - Automatic detection and respect for user preferences
- **High Contrast Mode** - Automatic adaptation to system contrast preferences
- **Keyboard Navigation** - Full keyboard accessibility for animated elements

### ⚡ **Performance Optimization**
- **Performance Monitor** - Real-time animation performance tracking
- **Frame Rate Monitoring** - Automatic performance mode switching
- **GPU Acceleration** - Optimized rendering for smooth animations
- **Memory Management** - Automatic cleanup and optimization
- **Intersection Observer** - Efficient scroll-based animations
- **Animation Orchestration** - Concurrent animation management

## Installation

The animation system is already integrated into the GCMC-KAJ platform. The following dependencies are included:

```json
{
  "framer-motion": "^12.23.24",
  "react-spring": "^10.0.3",
  "@react-spring/web": "^10.0.3",
  "gsap": "^3.13.0",
  "react-use-gesture": "^9.1.3"
}
```

## Quick Start

### 1. Provider Setup

The `AnimationProvider` is already configured in the app providers:

```tsx
import { AnimationProvider } from '@/lib/animations/context';

function App({ children }) {
  return (
    <AnimationProvider
      initialConfig={{
        respectMotionPreference: true,
        enableGPUAcceleration: true,
        frameRateTarget: 60,
        maxConcurrentAnimations: 15,
      }}
    >
      {children}
    </AnimationProvider>
  );
}
```

### 2. Basic Usage

```tsx
import {
  AnimatedButton,
  AnimatedCard,
  PageTransition,
  ComplianceScore,
  AccessibilityControls
} from '@/lib/animations';

function MyComponent() {
  return (
    <PageTransition animationType="business">
      <div className="container">
        <AccessibilityControls showPerformanceMetrics />

        <AnimatedCard animationType="business" interactive>
          <h2>Tax Filing Status</h2>
          <ComplianceScore
            score={85}
            previousScore={82}
            showTrend={true}
          />
        </AnimatedCard>

        <AnimatedButton
          animationType="business"
          onClick={handleSubmit}
        >
          Submit Filing
        </AnimatedButton>
      </div>
    </PageTransition>
  );
}
```

### 3. Business Context Usage

```tsx
import {
  MonetaryValue,
  StatusChangeAnimation,
  DeadlineWarning
} from '@/lib/animations';

function BusinessDashboard() {
  return (
    <div className="dashboard">
      <MonetaryValue
        value={125000}
        previousValue={120000}
        currency="$"
        precision={2}
      />

      <StatusChangeAnimation
        status="approved"
        previousStatus="processing"
        label="Tax Filing Status"
      />

      <DeadlineWarning
        deadline={new Date('2024-03-15')}
        urgent={true}
      />
    </div>
  );
}
```

## Animation Types

### Button Animations
- `default` - Standard scale and lift effect
- `bounce` - Spring-based bounce animation
- `pulse` - Pulsing glow effect
- `glow` - Hover glow with brightness increase
- `slide` - Subtle horizontal movement
- `business` - Professional scale with shadow

### Card Animations
- `default` - Lift and scale on hover
- `hover` - Enhanced hover with rotation
- `tilt` - 3D tilt effect with mouse tracking
- `glow` - Shadow glow effect
- `business` - Professional interaction style
- `minimal` - Subtle background change

### Page Transitions
- `slide` - Horizontal slide transition
- `fade` - Simple fade in/out
- `scale` - Scale-based transition
- `blur` - Blur effect transition
- `business` - Vertical slide with easing

## Configuration

### Animation Config

```tsx
interface AnimationConfig {
  enabled: boolean;
  respectMotionPreference: boolean;
  defaultSpeed: 'slow' | 'normal' | 'fast';
  defaultEasing: 'linear' | 'ease' | 'easeIn' | 'easeOut' | 'easeInOut';
  enableGPUAcceleration: boolean;
  frameRateTarget: number;
  maxConcurrentAnimations: number;
  reduceMotion: boolean;
  highContrast: boolean;
  showProgressAnimations: boolean;
  enableDataVisualizationAnimations: boolean;
  enableFormValidationAnimations: boolean;
}
```

### Custom Animation Presets

```tsx
import { GCMC_ANIMATION_PRESETS } from '@/lib/animations';

// Use predefined business animations
const taxFilingAnimation = GCMC_ANIMATION_PRESETS.taxFilingSuccess;
const complianceAnimation = GCMC_ANIMATION_PRESETS.complianceUpdate;
```

## Hooks

### Performance Monitoring

```tsx
import { usePerformanceAnimation } from '@/lib/animations';

function MyComponent() {
  const {
    performanceMetrics,
    shouldAnimate,
    adaptAnimation
  } = usePerformanceAnimation();

  const optimizedAnimation = adaptAnimation({
    animate: { scale: [1, 1.1, 1] },
    transition: { duration: 0.5 }
  });

  return (
    <motion.div {...optimizedAnimation}>
      {/* Content */}
    </motion.div>
  );
}
```

### Business Animations

```tsx
import { useBusinessAnimation } from '@/lib/animations';

function ClientMetric({ value, previousValue }) {
  const { animationProps, isAnimating } = useBusinessAnimation(
    'client',
    value,
    previousValue
  );

  return (
    <motion.div {...animationProps}>
      Client Count: {value}
    </motion.div>
  );
}
```

### Form Validation

```tsx
import { useFormValidationAnimation } from '@/lib/animations';

function MyForm() {
  const { triggerError, triggerSuccess, animationProps } = useFormValidationAnimation();

  const handleSubmit = (isValid) => {
    if (isValid) {
      triggerSuccess();
    } else {
      triggerError();
    }
  };

  return (
    <motion.form {...animationProps}>
      {/* Form fields */}
    </motion.form>
  );
}
```

## Performance Guidelines

### Best Practices

1. **Use GPU-accelerated properties**: `transform`, `opacity`, `filter`
2. **Avoid animating layout properties**: `width`, `height`, `top`, `left`
3. **Use `will-change` sparingly**: Only when necessary
4. **Respect user preferences**: Always check for reduced motion
5. **Limit concurrent animations**: Keep under 15 simultaneous animations
6. **Use appropriate easing**: Match animation context (business vs. playful)

### Performance Monitoring

```tsx
import { performanceMonitor } from '@/lib/animations';

// Get current metrics
const metrics = performanceMonitor.getMetrics();

// Get optimization recommendations
const recommendations = performanceMonitor.getOptimizationRecommendations();

// Check if performance is good
const isGood = performanceMonitor.isPerformanceGood();
```

## Accessibility

### Reduced Motion Support

The system automatically detects and respects the user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  /* Animations are automatically simplified or disabled */
}
```

### Screen Reader Support

```tsx
import { AnimationAnnouncer } from '@/lib/animations';

function App() {
  return (
    <div>
      <AnimationAnnouncer />
      {/* Your app content */}
    </div>
  );
}
```

### Keyboard Navigation

```tsx
import { useKeyboardNavigation } from '@/lib/animations';

function InteractiveElement({ onActivate }) {
  const { createKeyboardHandler } = useKeyboardNavigation();

  return (
    <motion.div
      {...createKeyboardHandler(onActivate)}
      whileHover={{ scale: 1.05 }}
    >
      Interactive content
    </motion.div>
  );
}
```

## Mobile Optimization

### Touch Gestures

```tsx
import { SwipeableCard, TouchFeedback } from '@/lib/animations';

function MobileCard() {
  return (
    <SwipeableCard
      onSwipeLeft={() => console.log('Archived')}
      onSwipeRight={() => console.log('Favorited')}
    >
      <TouchFeedback feedbackType="ripple">
        <div>Swipeable content</div>
      </TouchFeedback>
    </SwipeableCard>
  );
}
```

### Performance on Mobile

The system automatically optimizes animations for mobile devices:
- Reduced animation duration
- Simplified effects
- Hardware acceleration
- Battery-aware optimization

## Business Context Integration

### Tax Services Animations

```tsx
// Compliance score updates
<ComplianceScore score={85} previousScore={82} />

// Financial value changes
<MonetaryValue value={125000} previousValue={120000} />

// Document processing states
<StatusChangeAnimation status="approved" />

// Deadline warnings
<DeadlineWarning deadline={deadline} urgent={true} />
```

### Data Visualization

```tsx
import { useDataVisualizationAnimation } from '@/lib/animations';

function TaxChart({ data }) {
  const { getChartAnimation, shouldAnimate } = useDataVisualizationAnimation(data);

  return (
    <motion.div {...getChartAnimation()}>
      {/* Chart content */}
    </motion.div>
  );
}
```

## Demo

Visit `/animations-demo` to see all animation components in action with interactive controls.

## Browser Support

- Modern browsers with ES2015+ support
- iOS Safari 12+
- Chrome 70+
- Firefox 65+
- Edge 79+

## Performance Metrics

The system automatically tracks:
- Frame rate (target: 60fps)
- Animation count
- Memory usage
- Dropped frames
- CPU usage estimation

## Contributing

When adding new animations:

1. Follow the established patterns
2. Include accessibility considerations
3. Add performance optimizations
4. Include mobile adaptations
5. Add comprehensive documentation
6. Test with reduced motion preferences

## License

This animation system is part of the GCMC-KAJ Business Tax Services Platform and is proprietary software.