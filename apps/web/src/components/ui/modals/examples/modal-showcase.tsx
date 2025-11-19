'use client';

import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import {
  useModal,
  useConfirmDialog,
  useFormDialog,
  useGalleryDialog,
  useWizardDialog,
  useLoadingDialog,
  useNotification,
} from '../modal-utils';
import { ConfirmationModal } from '../variants/confirmation-modal';
import { FormModal } from '../variants/form-modal';
import { GalleryModal } from '../variants/gallery-modal';
import { WizardModal } from '../variants/wizard-modal';
import { LoadingModal } from '../variants/loading-modal';
import { ToastModal } from '../variants/toast-modal';
import { Card } from '@/components/ui/card';

// Sample data for examples
const sampleGalleryItems = [
  {
    id: '1',
    src: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
    alt: 'Modern workspace',
    title: 'Modern Office Space',
    description: 'A clean and modern office workspace design',
  },
  {
    id: '2',
    src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    alt: 'Business meeting',
    title: 'Team Collaboration',
    description: 'Professional team meeting in progress',
  },
  {
    id: '3',
    src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    alt: 'Financial documents',
    title: 'Financial Analysis',
    description: 'Document review and analysis workflow',
  },
];

const sampleFormFields = [
  {
    name: 'clientName',
    label: 'Client Name',
    type: 'text',
    placeholder: 'Enter client name',
    required: true,
  },
  {
    name: 'email',
    label: 'Email Address',
    type: 'email',
    placeholder: 'client@example.com',
    required: true,
  },
  {
    name: 'businessType',
    label: 'Business Type',
    type: 'select',
    required: true,
    options: [
      { label: 'Corporation', value: 'corporation' },
      { label: 'LLC', value: 'llc' },
      { label: 'Partnership', value: 'partnership' },
      { label: 'Sole Proprietorship', value: 'sole_proprietorship' },
    ],
  },
  {
    name: 'annualRevenue',
    label: 'Annual Revenue',
    type: 'number',
    placeholder: '0',
    required: false,
  },
  {
    name: 'notes',
    label: 'Additional Notes',
    type: 'textarea',
    placeholder: 'Any additional information...',
    required: false,
  },
  {
    name: 'agreeToTerms',
    label: 'I agree to the terms and conditions',
    type: 'checkbox',
    required: true,
  },
];

const sampleWizardSteps = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Enter your basic business details',
    content: (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Business Name</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-border rounded-md"
            placeholder="Your business name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tax ID</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-border rounded-md"
            placeholder="XX-XXXXXXX"
          />
        </div>
      </div>
    ),
  },
  {
    id: 'financial-info',
    title: 'Financial Details',
    description: 'Provide financial information',
    content: (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Annual Revenue</label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-border rounded-md"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Number of Employees</label>
          <select className="w-full px-3 py-2 border border-border rounded-md">
            <option value="">Select...</option>
            <option value="1-10">1-10</option>
            <option value="11-50">11-50</option>
            <option value="51-200">51-200</option>
            <option value="200+">200+</option>
          </select>
        </div>
      </div>
    ),
  },
  {
    id: 'review',
    title: 'Review & Submit',
    description: 'Review your information and submit',
    content: (
      <div className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Summary</h4>
          <p className="text-sm text-muted-foreground">
            Please review all information before submitting your tax service request.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="final-terms" />
          <label htmlFor="final-terms" className="text-sm">
            I confirm all information is accurate and agree to the terms of service
          </label>
        </div>
      </div>
    ),
  },
];

export const ModalShowcase = memo(function ModalShowcase() {
  const { openModal } = useModal();
  const confirmDialog = useConfirmDialog();
  const formDialog = useFormDialog();
  const galleryDialog = useGalleryDialog();
  const wizardDialog = useWizardDialog();
  const loadingDialog = useLoadingDialog();
  const notification = useNotification();

  // Confirmation Modal Examples
  const handleDeleteConfirmation = async () => {
    const confirmed = await confirmDialog.delete('Tax Document 2023');
    if (confirmed) {
      notification.success('Document deleted successfully');
    }
  };

  const handleCustomConfirmation = async () => {
    const confirmed = await confirmDialog.confirm({
      title: 'Submit Tax Return',
      description: 'Are you sure you want to submit this tax return? This action cannot be undone.',
      variant: 'warning',
      confirmText: 'Submit',
      cancelText: 'Cancel',
    });
    if (confirmed) {
      notification.success('Tax return submitted successfully');
    }
  };

  // Form Modal Examples
  const handleCreateClient = async () => {
    const result = await formDialog.create({
      title: 'Create New Client',
      description: 'Enter the client information below',
      fields: sampleFormFields,
      submitText: 'Create Client',
    });

    if (result) {
      console.log('Created client:', result);
      notification.success('Client created successfully');
    }
  };

  const handleEditClient = async () => {
    const result = await formDialog.edit({
      title: 'Edit Client Information',
      description: 'Update the client details',
      fields: sampleFormFields,
      initialValues: {
        clientName: 'John Doe',
        email: 'john@example.com',
        businessType: 'corporation',
        annualRevenue: 500000,
        notes: 'Existing client since 2020',
        agreeToTerms: true,
      },
      submitText: 'Update Client',
    });

    if (result) {
      console.log('Updated client:', result);
      notification.success('Client updated successfully');
    }
  };

  // Gallery Modal Example
  const handleShowDocuments = () => {
    galleryDialog.show({
      items: sampleGalleryItems,
      showThumbnails: true,
      allowDownload: true,
      allowZoom: true,
      allowRotate: true,
    });
  };

  // Wizard Modal Example
  const handleTaxWizard = () => {
    wizardDialog.show({
      title: 'Tax Service Application',
      steps: sampleWizardSteps,
      allowStepNavigation: true,
      onComplete: async (data) => {
        console.log('Wizard completed:', data);
        notification.success('Application submitted successfully');
      },
    });
  };

  // Loading Modal Examples
  const handleSimulateLoading = async () => {
    const loadingId = loadingDialog.show({
      title: 'Processing Tax Return',
      description: 'Please wait while we process your tax return...',
      cancelable: true,
    });

    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      loadingDialog.updateProgress(loadingId, i,
        i < 50 ? 'Validating data...' :
        i < 80 ? 'Calculating taxes...' :
        'Finalizing return...'
      );
    }

    loadingDialog.hide(loadingId);
    notification.success('Tax return processed successfully');
  };

  // Toast/Notification Examples
  const handleShowNotifications = () => {
    notification.success('Operation completed successfully');
    setTimeout(() => notification.warning('This is a warning message'), 1000);
    setTimeout(() => notification.error('An error occurred'), 2000);
    setTimeout(() => notification.info('Information message'), 3000);
  };

  // Custom Modal Examples
  const handleCustomModal = () => {
    openModal({
      type: 'custom',
      title: 'Custom Modal Example',
      size: 'lg',
      animation: 'scale',
      backdrop: 'blur',
      content: (
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Custom Modal Content</h3>
          <p className="text-muted-foreground mb-6">
            This is a custom modal with completely custom content. You can put any React component here.
          </p>
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Features Demonstrated:</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Custom content rendering</li>
              <li>Flexible sizing options</li>
              <li>Custom animations</li>
              <li>Backdrop blur effects</li>
            </ul>
          </div>
        </div>
      ),
    });
  };

  const handleFullscreenModal = () => {
    openModal({
      type: 'custom',
      title: 'Fullscreen Modal',
      size: 'full',
      animation: 'fade',
      backdrop: 'dark',
      content: (
        <div className="p-8 h-full flex flex-col">
          <h3 className="text-2xl font-bold mb-4">Fullscreen Experience</h3>
          <div className="flex-1 bg-muted rounded-lg p-6 flex items-center justify-center">
            <div className="text-center">
              <h4 className="text-xl font-semibold mb-2">Full Screen Modal</h4>
              <p className="text-muted-foreground">
                This modal takes up the entire screen, perfect for complex workflows or detailed content.
              </p>
            </div>
          </div>
        </div>
      ),
    });
  };

  const modalExamples = [
    {
      title: 'Confirmation Modals',
      description: 'User confirmations and alerts',
      examples: [
        {
          title: 'Delete Confirmation',
          description: 'Standard delete confirmation with item name',
          action: handleDeleteConfirmation,
        },
        {
          title: 'Custom Confirmation',
          description: 'Custom confirmation with warning style',
          action: handleCustomConfirmation,
        },
      ],
    },
    {
      title: 'Form Modals',
      description: 'Data collection and editing',
      examples: [
        {
          title: 'Create Client Form',
          description: 'Multi-field form with validation',
          action: handleCreateClient,
        },
        {
          title: 'Edit Client Form',
          description: 'Pre-filled form for editing',
          action: handleEditClient,
        },
      ],
    },
    {
      title: 'Gallery & Media',
      description: 'Image and document viewing',
      examples: [
        {
          title: 'Document Gallery',
          description: 'Zoomable gallery with thumbnails',
          action: handleShowDocuments,
        },
      ],
    },
    {
      title: 'Workflow Modals',
      description: 'Multi-step processes',
      examples: [
        {
          title: 'Tax Service Wizard',
          description: 'Step-by-step application process',
          action: handleTaxWizard,
        },
      ],
    },
    {
      title: 'Feedback & Loading',
      description: 'User feedback and progress',
      examples: [
        {
          title: 'Progress Loading',
          description: 'Loading with progress indication',
          action: handleSimulateLoading,
        },
        {
          title: 'Notifications',
          description: 'Toast notifications (all types)',
          action: handleShowNotifications,
        },
      ],
    },
    {
      title: 'Custom Modals',
      description: 'Flexible custom implementations',
      examples: [
        {
          title: 'Custom Content',
          description: 'Modal with completely custom content',
          action: handleCustomModal,
        },
        {
          title: 'Fullscreen Modal',
          description: 'Full-screen modal experience',
          action: handleFullscreenModal,
        },
      ],
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Modal System Showcase</h1>
        <p className="text-muted-foreground">
          Comprehensive examples of the advanced modal system for GCMC-KAJ Business Tax Services Platform.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {modalExamples.map((category, index) => (
          <Card key={index} className="p-6">
            <h2 className="text-xl font-semibold mb-2">{category.title}</h2>
            <p className="text-muted-foreground mb-4">{category.description}</p>
            <div className="space-y-3">
              {category.examples.map((example, exampleIndex) => (
                <div key={exampleIndex} className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{example.title}</h3>
                    <p className="text-sm text-muted-foreground">{example.description}</p>
                  </div>
                  <Button
                    onClick={example.action}
                    variant="outline"
                    size="sm"
                    className="ml-4"
                  >
                    Demo
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-6 bg-muted rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Modal System Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            'Advanced animations with Framer Motion',
            'Full accessibility support (ARIA, keyboard nav)',
            'Mobile-responsive with swipe gestures',
            'Performance optimized with lazy loading',
            'Multiple backdrop styles and effects',
            'Auto-dismiss and persistent options',
            'Focus trapping and restoration',
            'Modal stacking and queuing',
            'TypeScript support throughout',
            'Customizable themes and styling',
            'Progress tracking for loading states',
            'Form validation and error handling',
          ].map((feature, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});