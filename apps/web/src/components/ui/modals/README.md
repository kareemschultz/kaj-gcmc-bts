# Advanced Modal System for GCMC-KAJ Business Tax Services Platform

A comprehensive, performance-optimized modal system built with React, TypeScript, and Framer Motion. Features advanced animations, full accessibility support, mobile responsiveness, and business-specific modal variants.

## Features

### 🎨 **Advanced Animations**
- Smooth entrance/exit animations with Framer Motion
- Multiple animation types: fade, slide, scale, blur, bounce
- Backdrop blur effects
- Gesture-based dismiss (swipe on mobile)
- Custom easing and duration controls

### ♿ **Accessibility First**
- Full keyboard navigation support
- Screen reader compatibility (ARIA attributes)
- Focus trapping and restoration
- High contrast support
- Reduced motion respect

### 📱 **Mobile Responsive**
- Touch gesture support (swipe to dismiss)
- Bottom sheet UI on mobile
- Responsive sizing and positioning
- Optimized animations for mobile
- Haptic feedback support (where available)

### ⚡ **Performance Optimized**
- Lazy loading of modal components
- React.memo for unnecessary re-renders prevention
- Efficient portal-based rendering
- Memory usage monitoring
- Component preloading for critical modals

### 🔧 **Modal Types**
- **Confirmation**: Delete confirmations, action confirmations
- **Form**: Data collection, editing forms with validation
- **Gallery**: Image/document viewing with zoom and rotation
- **Wizard**: Multi-step workflows with progress tracking
- **Loading**: Progress indicators with cancellation options
- **Toast**: Notifications with auto-dismiss
- **Custom**: Flexible custom content support

## Quick Start

### 1. Installation

The modal system is already integrated into the GCMC-KAJ platform. Import the necessary components:

```tsx
import {
  ModalSystemProvider,
  useConfirmDialog,
  useFormDialog,
  useNotification,
} from '@/components/ui/modals';
```

### 2. Setup Provider

Wrap your application with the ModalSystemProvider:

```tsx
// In your app root (e.g., layout.tsx or app.tsx)
import { ModalSystemProvider } from '@/components/ui/modals';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ModalSystemProvider>
          {children}
        </ModalSystemProvider>
      </body>
    </html>
  );
}
```

### 3. Basic Usage

```tsx
import { useConfirmDialog, useFormDialog, useNotification } from '@/components/ui/modals';

function ClientManagement() {
  const confirmDialog = useConfirmDialog();
  const formDialog = useFormDialog();
  const notification = useNotification();

  const handleDeleteClient = async (clientName: string) => {
    const confirmed = await confirmDialog.delete(clientName);
    if (confirmed) {
      // Delete logic here
      notification.success('Client deleted successfully');
    }
  };

  const handleCreateClient = async () => {
    const result = await formDialog.create({
      title: 'Add New Client',
      fields: [
        {
          name: 'businessName',
          label: 'Business Name',
          type: 'text',
          required: true,
        },
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true,
        },
      ],
    });

    if (result) {
      notification.success(`Client "${result.businessName}" created`);
    }
  };

  return (
    <div>
      <button onClick={() => handleDeleteClient('ABC Corp')}>
        Delete Client
      </button>
      <button onClick={handleCreateClient}>
        Add Client
      </button>
    </div>
  );
}
```

## Modal Types & Examples

### Confirmation Modals

```tsx
import { useConfirmDialog } from '@/components/ui/modals';

const confirmDialog = useConfirmDialog();

// Simple delete confirmation
const deleteConfirmed = await confirmDialog.delete('Tax Document 2023');

// Custom confirmation
const submitConfirmed = await confirmDialog.confirm({
  title: 'Submit Tax Return',
  description: 'Are you sure you want to submit this tax return?',
  variant: 'warning',
  confirmText: 'Submit',
  cancelText: 'Review Again',
});
```

### Form Modals

```tsx
import { useFormDialog } from '@/components/ui/modals';

const formDialog = useFormDialog();

// Create form
const clientData = await formDialog.create({
  title: 'Add New Client',
  fields: [
    {
      name: 'businessName',
      label: 'Business Name',
      type: 'text',
      required: true,
    },
    {
      name: 'entityType',
      label: 'Business Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Corporation', value: 'corp' },
        { label: 'LLC', value: 'llc' },
      ],
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
    },
  ],
});

// Edit form with existing data
const updatedData = await formDialog.edit({
  title: 'Edit Client',
  fields: [...],
  initialValues: {
    businessName: 'Existing Corp',
    entityType: 'corp',
  },
});
```

### Gallery Modals

```tsx
import { useGalleryDialog } from '@/components/ui/modals';

const galleryDialog = useGalleryDialog();

galleryDialog.show({
  items: [
    {
      id: '1',
      src: '/api/documents/tax-return.pdf',
      title: 'Tax Return 2023',
      description: 'Annual tax return filing',
      downloadUrl: '/api/documents/download/tax-return.pdf',
    },
    // ... more items
  ],
  showThumbnails: true,
  allowDownload: true,
  allowZoom: true,
});
```

### Wizard Modals

```tsx
import { useWizardDialog } from '@/components/ui/modals';

const wizardDialog = useWizardDialog();

wizardDialog.show({
  title: 'Tax Return Filing Wizard',
  steps: [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Enter your basic details',
      content: <PersonalInfoForm />,
    },
    {
      id: 'income',
      title: 'Income Sources',
      description: 'Report all income',
      content: <IncomeForm />,
    },
    {
      id: 'review',
      title: 'Review & Submit',
      description: 'Final review',
      content: <ReviewForm />,
    },
  ],
  allowStepNavigation: true,
  onComplete: async (data) => {
    console.log('Completed:', data);
  },
});
```

### Loading Modals

```tsx
import { useLoadingDialog } from '@/components/ui/modals';

const loadingDialog = useLoadingDialog();

// Show loading with progress
const loadingId = loadingDialog.show({
  title: 'Processing Tax Return',
  description: 'Please wait...',
  cancelable: true,
});

// Update progress
loadingDialog.updateProgress(loadingId, 50, 'Calculating taxes...');

// Hide when done
loadingDialog.hide(loadingId);
```

### Toast Notifications

```tsx
import { useNotification } from '@/components/ui/modals';

const notification = useNotification();

notification.success('Operation completed successfully');
notification.error('An error occurred');
notification.warning('Please review your data');
notification.info('New feature available');

// With action
notification.success('Document uploaded', 'Click to view', {
  label: 'View Document',
  onClick: () => console.log('View document'),
});
```

## Advanced Usage

### Custom Modals

```tsx
import { useModal } from '@/components/ui/modals';

const { openModal } = useModal();

// Custom modal with full control
openModal({
  type: 'custom',
  title: 'Custom Business Logic',
  size: 'lg',
  animation: 'scale',
  backdrop: 'blur',
  content: (
    <CustomBusinessComponent
      onSuccess={(data) => console.log('Success:', data)}
    />
  ),
});

// Using custom component
openModal({
  type: 'custom',
  component: MyCustomModalComponent,
  props: {
    clientId: '123',
    onComplete: handleComplete,
  },
  size: 'xl',
  position: 'center',
});
```

### Performance Optimization

```tsx
import { useModalPreloader } from '@/components/ui/modals';

function App() {
  const { preloadCriticalModals } = useModalPreloader();

  React.useEffect(() => {
    // Preload commonly used modals
    preloadCriticalModals();
  }, []);

  return <YourApp />;
}
```

### Responsive Behavior

The modal system automatically adapts to mobile devices:

- **Mobile**: Bottom sheet style, swipe to dismiss
- **Tablet**: Centered with responsive sizing
- **Desktop**: Full modal experience with hover states

### Configuration Options

```tsx
import { ModalSystemProvider } from '@/components/ui/modals';

<ModalSystemProvider
  maxModals={10}           // Maximum concurrent modals
  useOptimized={true}      // Enable performance optimizations
  useResponsive={true}     // Enable responsive behavior
  preloadCritical={true}   // Preload critical modal types
>
  <App />
</ModalSystemProvider>
```

## Business Integration Examples

### Tax Document Management

```tsx
import { TaxDocumentModals } from '@/components/ui/modals/examples/business-modals';

function DocumentManager() {
  const { viewDocuments, deleteDocument } = TaxDocumentModals();

  return (
    <div>
      <button onClick={() => viewDocuments('ABC Corp')}>
        View Documents
      </button>
      <button onClick={() => deleteDocument('tax-return-2023.pdf')}>
        Delete Document
      </button>
    </div>
  );
}
```

### Client Management

```tsx
import { ClientManagementModals } from '@/components/ui/modals/examples/business-modals';

function ClientList() {
  const { createClient, deleteClient } = ClientManagementModals();

  return (
    <div>
      <button onClick={createClient}>Add Client</button>
      <button onClick={() => deleteClient('ABC Corp')}>
        Delete Client
      </button>
    </div>
  );
}
```

### Tax Calculations

```tsx
import { TaxCalculationModals } from '@/components/ui/modals/examples/business-modals';

function TaxServices() {
  const { quickEstimate, fullReturn } = TaxCalculationModals();

  return (
    <div>
      <button onClick={quickEstimate}>Quick Tax Estimate</button>
      <button onClick={fullReturn}>File Tax Return</button>
    </div>
  );
}
```

## Development Tools

In development mode, the modal system includes debugging tools:

```tsx
import { ModalDeveloperTools } from '@/components/ui/modals';

function App() {
  return (
    <div>
      <YourApp />
      <ModalDeveloperTools />  {/* Shows performance metrics */}
    </div>
  );
}
```

## Best Practices

### 1. Modal Stacking
- Limit concurrent modals (max 3-5)
- Use wizard patterns for complex flows
- Consider replacing modals with inline editing for simple forms

### 2. Performance
- Preload critical modals during app initialization
- Use lazy loading for heavy modal content
- Implement proper cleanup in modal components

### 3. Accessibility
- Always provide meaningful titles and descriptions
- Ensure keyboard navigation works properly
- Test with screen readers
- Respect user's motion preferences

### 4. Mobile UX
- Use bottom sheets for mobile forms
- Enable swipe-to-dismiss where appropriate
- Keep modal content concise on small screens
- Test touch interactions thoroughly

### 5. Business Logic
- Keep business logic outside modal components
- Use modals for user interactions, not complex data processing
- Provide clear success/error feedback
- Implement proper validation before submission

## API Reference

### Modal Configuration

```tsx
interface ModalConfig {
  id: string;
  type: 'confirmation' | 'form' | 'gallery' | 'wizard' | 'loading' | 'toast' | 'custom';
  title?: string;
  description?: string;
  content?: ReactNode;
  component?: React.ComponentType<any>;
  props?: Record<string, any>;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  animation?: 'fade' | 'slide' | 'scale' | 'blur' | 'bounce';
  backdrop?: 'blur' | 'dark' | 'transparent' | 'none';
  dismissible?: boolean;
  autoClose?: number;
  persistent?: boolean;
  zIndex?: number;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  onClose?: () => void;
  className?: string;
  overlayClassName?: string;
}
```

### Hook Returns

All modal hooks return promises that resolve with user input or boolean confirmation.

## Troubleshooting

### Common Issues

1. **Modal not appearing**: Check if ModalSystemProvider is properly wrapped around your app
2. **Performance issues**: Reduce concurrent modals, enable optimization flags
3. **Mobile scrolling**: Ensure proper body scroll prevention is working
4. **Focus issues**: Verify focus trap is enabled and working correctly

### Debug Mode

Enable debug logging in development:

```tsx
// Set in environment or code
window.MODAL_DEBUG = true;
```

This will log modal lifecycle events to the browser console.

## Contributing

When adding new modal types or features:

1. Follow the existing component structure
2. Add proper TypeScript types
3. Implement accessibility features
4. Add mobile responsive behavior
5. Include usage examples
6. Update documentation

## Performance Benchmarks

The modal system is optimized for:
- **First modal render**: <100ms
- **Modal transitions**: 60fps
- **Memory usage**: <2MB for 5 concurrent modals
- **Bundle size**: ~15KB gzipped (with tree shaking)

---

**Built for GCMC-KAJ Business Tax Services Platform**
Advanced modal system supporting all business workflows with enterprise-grade performance and accessibility.