# Wizard & Template Implementation Guide

This document provides guidance on implementing and customizing the GCMC-KAJ wizard workflows and interactive templates.

## Overview

The wizard and template system consists of:

1. **Wizard Infrastructure** - Core wizard functionality with state management
2. **Interactive Wizards** - Multi-step guided processes
3. **Smart Templates** - Adaptive forms and interfaces
4. **Storage System** - Persistent state and progress tracking

## Quick Start

### Basic Wizard Implementation

```typescript
import { WizardProvider, WizardLayout, useWizard } from '@/components/wizards';

// Define your wizard steps
const steps: WizardStep[] = [
  {
    id: "step1",
    title: "Step 1",
    description: "First step description",
    component: Step1Component,
    validation: step1Schema,
  },
  // ... more steps
];

// Your wizard component
function MyWizard({ onComplete, onExit }) {
  return (
    <WizardProvider
      steps={steps}
      onComplete={onComplete}
      onSave={handleSave}
      onLoad={handleLoad}
    >
      <WizardLayout
        title="My Wizard"
        subtitle="Wizard description"
        onExit={onExit}
      >
        <MyWizardContent />
      </WizardLayout>
    </WizardProvider>
  );
}
```

### Step Component Example

```typescript
import { useStepData } from '@/components/wizards';

function Step1Component() {
  const [data, setData] = useStepData("step1");

  const handleChange = (field: string, value: any) => {
    setData({ ...data, [field]: value });
  };

  return (
    <div>
      <Input
        value={data.field1 || ""}
        onChange={(e) => handleChange("field1", e.target.value)}
      />
    </div>
  );
}
```

## Available Wizards

### 1. Client Onboarding Wizard
- **Purpose**: Multi-step client registration
- **Features**: Conditional logic, document collection, compliance setup
- **Usage**: New client registration workflow

### 2. Document Upload Wizard
- **Purpose**: Secure document management
- **Features**: Categorization, metadata, access control
- **Usage**: Client document submission and organization

### 3. Service Request Wizard
- **Purpose**: Service booking and configuration
- **Features**: Dynamic pricing, scheduling, requirements
- **Usage**: Professional service engagement workflow

### 4. Compliance Assessment Wizard
- **Purpose**: Interactive compliance evaluation
- **Features**: Risk scoring, recommendations, action plans
- **Usage**: Business compliance health checks

### 5. Filing Preparation Wizard
- **Purpose**: Tax and regulatory filing process
- **Features**: Multi-filing support, deadline tracking, submission
- **Usage**: Streamlined filing workflows

## Available Templates

### 1. Dynamic Tax Form Template
- **Purpose**: Adaptive tax form interface
- **Features**: Conditional fields, auto-calculations, validation
- **Usage**: Tax preparation workflows

### 2. Smart Compliance Checklist
- **Purpose**: Personalized compliance tracking
- **Features**: Business profiling, adaptive checklists, progress tracking
- **Usage**: Ongoing compliance management

## Customization Guide

### Creating Custom Wizard Steps

```typescript
const customStep: WizardStep = {
  id: "custom_step",
  title: "Custom Step",
  description: "Step description",
  icon: <Icon className="h-6 w-6" />,
  validation: customValidationSchema,
  component: CustomStepComponent,
  canSkip: true, // Optional
  isOptional: true, // Optional
};
```

### Custom Validation Schemas

```typescript
import { z } from 'zod';

const customValidationSchema = z.object({
  requiredField: z.string().min(1, "Required field is required"),
  emailField: z.string().email("Invalid email format"),
  numberField: z.number().min(0, "Must be positive"),
});
```

### Conditional Step Rendering

```typescript
// In your step component
function ConditionalStep() {
  const [data, setData] = useStepData("conditional");
  const [previousData] = useStepData("previous_step");

  // Show different fields based on previous selections
  if (previousData.userType === "business") {
    return <BusinessForm data={data} setData={setData} />;
  }

  return <IndividualForm data={data} setData={setData} />;
}
```

### Custom Storage Implementation

```typescript
const customSaveHandler = async (data: any, sessionId: string) => {
  // Save to your backend
  await fetch('/api/wizard-progress', {
    method: 'POST',
    body: JSON.stringify({ sessionId, data }),
  });
};

const customLoadHandler = async (sessionId: string) => {
  // Load from your backend
  const response = await fetch(`/api/wizard-progress/${sessionId}`);
  return response.json();
};
```

## Advanced Features

### Auto-Save Configuration

```typescript
<WizardProvider
  steps={steps}
  autoSave={true}
  autoSaveInterval={30000} // 30 seconds
  onSave={customSaveHandler}
>
```

### Mobile Optimization

```typescript
<WizardLayout
  mobileOptimized={true}
  enableKeyboardNavigation={true}
>
```

### Progress Callbacks

```typescript
<WizardProvider
  steps={steps}
  onStepChange={(stepIndex) => {
    analytics.track('wizard_step_change', { stepIndex });
  }}
>
```

## Form Template Customization

### Creating Dynamic Forms

```typescript
const customFormTemplate: FormTemplate = {
  id: "custom_form",
  title: "Custom Form",
  description: "Custom form description",
  category: "custom",
  sections: [
    {
      id: "section1",
      title: "Section 1",
      fields: [
        {
          id: "field1",
          label: "Field 1",
          type: "text",
          required: true,
          validation: z.string().min(1),
        },
        // Conditional field
        {
          id: "field2",
          label: "Field 2",
          type: "select",
          dependsOn: {
            field: "field1",
            value: "specific_value",
            condition: "equals",
          },
          options: [
            { value: "opt1", label: "Option 1" },
            { value: "opt2", label: "Option 2" },
          ],
        },
      ],
    },
  ],
};
```

### Calculated Fields

```typescript
const fieldWithCalculation: FormField = {
  id: "total_amount",
  label: "Total Amount",
  type: "currency",
  calculation: {
    formula: "base_amount + tax_amount",
    dependencies: ["base_amount", "tax_amount"],
  },
};
```

## Integration Examples

### With Backend APIs

```typescript
const handleWizardComplete = async (data: any) => {
  try {
    const response = await fetch('/api/submit-wizard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      toast.success('Submission successful!');
      router.push('/success');
    }
  } catch (error) {
    toast.error('Submission failed');
  }
};
```

### With State Management

```typescript
import { useDispatch } from 'react-redux';

function WizardContainer() {
  const dispatch = useDispatch();

  const handleStepDataUpdate = (stepId: string, data: any) => {
    dispatch(updateWizardData({ stepId, data }));
  };

  return (
    <WizardProvider
      steps={steps}
      onStepDataChange={handleStepDataUpdate}
    >
      {/* Wizard content */}
    </WizardProvider>
  );
}
```

## Best Practices

### 1. Step Design
- Keep steps focused on single objectives
- Use clear, descriptive titles and descriptions
- Provide helpful validation messages
- Consider mobile users in step complexity

### 2. Data Management
- Use proper validation schemas
- Implement auto-save for long workflows
- Handle network failures gracefully
- Clear sensitive data appropriately

### 3. User Experience
- Show progress clearly
- Allow navigation between steps when appropriate
- Provide help text and examples
- Handle errors gracefully with clear messaging

### 4. Performance
- Lazy load wizard components
- Optimize large forms with virtualization
- Use debounced auto-save
- Minimize unnecessary re-renders

### 5. Accessibility
- Ensure keyboard navigation works
- Provide proper ARIA labels
- Use semantic HTML elements
- Test with screen readers

## Testing

### Unit Tests for Steps

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { WizardProvider } from '@/components/wizards';

describe('CustomStep', () => {
  it('should validate required fields', async () => {
    render(
      <WizardProvider steps={[customStep]}>
        <CustomStep />
      </WizardProvider>
    );

    fireEvent.click(screen.getByText('Next'));

    expect(screen.getByText('Required field is required')).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
describe('WizardFlow', () => {
  it('should complete full wizard flow', async () => {
    const onComplete = jest.fn();

    render(
      <CustomWizard onComplete={onComplete} />
    );

    // Fill out each step
    // Assert completion callback called
    expect(onComplete).toHaveBeenCalledWith(expectedData);
  });
});
```

## Deployment Considerations

### Environment Configuration
- Configure storage backends per environment
- Set up proper error tracking
- Configure analytics for wizard usage
- Set up monitoring for completion rates

### Performance Monitoring
- Track wizard completion rates
- Monitor step abandonment
- Measure load times
- Track validation errors

This implementation provides a robust foundation for creating sophisticated business workflows while maintaining flexibility and user experience standards.