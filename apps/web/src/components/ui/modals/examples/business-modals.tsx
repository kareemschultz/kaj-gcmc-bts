'use client';

import React, { memo } from 'react';
import { FileText, Upload, DollarSign, Calculator, Users, Calendar } from 'lucide-react';
import { useFormDialog, useConfirmDialog, useGalleryDialog, useWizardDialog, useNotification } from '../modal-utils';

// Business-specific modal examples for GCMC-KAJ Tax Services

export const ClientManagementModals = memo(function ClientManagementModals() {
  const formDialog = useFormDialog();
  const confirmDialog = useConfirmDialog();
  const notification = useNotification();

  const handleCreateClient = async () => {
    const result = await formDialog.create({
      title: 'Add New Client',
      description: 'Enter the new client information',
      fields: [
        {
          name: 'businessName',
          label: 'Business Name',
          type: 'text',
          placeholder: 'ABC Corporation',
          required: true,
        },
        {
          name: 'contactPerson',
          label: 'Contact Person',
          type: 'text',
          placeholder: 'John Smith',
          required: true,
        },
        {
          name: 'email',
          label: 'Email Address',
          type: 'email',
          placeholder: 'contact@business.com',
          required: true,
        },
        {
          name: 'phone',
          label: 'Phone Number',
          type: 'tel',
          placeholder: '(555) 123-4567',
          required: true,
        },
        {
          name: 'entityType',
          label: 'Business Entity Type',
          type: 'select',
          required: true,
          options: [
            { label: 'C Corporation', value: 'c_corp' },
            { label: 'S Corporation', value: 's_corp' },
            { label: 'LLC', value: 'llc' },
            { label: 'Partnership', value: 'partnership' },
            { label: 'Sole Proprietorship', value: 'sole_prop' },
          ],
        },
        {
          name: 'taxId',
          label: 'Tax ID (EIN)',
          type: 'text',
          placeholder: 'XX-XXXXXXX',
          required: true,
        },
        {
          name: 'industry',
          label: 'Industry',
          type: 'select',
          required: false,
          options: [
            { label: 'Technology', value: 'technology' },
            { label: 'Healthcare', value: 'healthcare' },
            { label: 'Manufacturing', value: 'manufacturing' },
            { label: 'Retail', value: 'retail' },
            { label: 'Construction', value: 'construction' },
            { label: 'Professional Services', value: 'professional_services' },
            { label: 'Other', value: 'other' },
          ],
        },
        {
          name: 'notes',
          label: 'Additional Notes',
          type: 'textarea',
          placeholder: 'Any special requirements or notes...',
          required: false,
        },
      ],
    });

    if (result) {
      notification.success(`Client "${result.businessName}" created successfully`);
      console.log('New client:', result);
    }
  };

  const handleDeleteClient = async (clientName: string) => {
    const confirmed = await confirmDialog.confirm({
      title: 'Delete Client',
      description: `Are you sure you want to delete ${clientName}? This will also remove all associated tax documents and history. This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete Client',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      notification.success(`Client "${clientName}" deleted successfully`);
    }
  };

  return {
    createClient: handleCreateClient,
    deleteClient: handleDeleteClient,
  };
});

export const TaxDocumentModals = memo(function TaxDocumentModals() {
  const galleryDialog = useGalleryDialog();
  const confirmDialog = useConfirmDialog();
  const notification = useNotification();

  const handleViewDocuments = (clientName: string) => {
    const sampleDocuments = [
      {
        id: '1',
        src: '/api/documents/tax-return-2023.pdf',
        alt: 'Tax Return 2023',
        title: `${clientName} - Tax Return 2023`,
        description: 'Annual tax return filing',
        downloadUrl: '/api/documents/download/tax-return-2023.pdf',
      },
      {
        id: '2',
        src: '/api/documents/financial-statements.pdf',
        alt: 'Financial Statements',
        title: `${clientName} - Financial Statements`,
        description: 'Year-end financial statements',
        downloadUrl: '/api/documents/download/financial-statements.pdf',
      },
      {
        id: '3',
        src: '/api/documents/receipts-q4.pdf',
        alt: 'Q4 Receipts',
        title: `${clientName} - Q4 Business Receipts`,
        description: 'Fourth quarter business receipts and expenses',
        downloadUrl: '/api/documents/download/receipts-q4.pdf',
      },
    ];

    galleryDialog.show({
      items: sampleDocuments,
      showThumbnails: true,
      allowDownload: true,
      allowZoom: true,
    });
  };

  const handleDeleteDocument = async (documentName: string) => {
    const confirmed = await confirmDialog.confirm({
      title: 'Delete Document',
      description: `Are you sure you want to delete "${documentName}"? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      notification.success('Document deleted successfully');
    }
  };

  return {
    viewDocuments: handleViewDocuments,
    deleteDocument: handleDeleteDocument,
  };
});

export const TaxCalculationModals = memo(function TaxCalculationModals() {
  const formDialog = useFormDialog();
  const wizardDialog = useWizardDialog();
  const notification = useNotification();

  const handleQuickTaxEstimate = async () => {
    const result = await formDialog.create({
      title: 'Tax Estimate Calculator',
      description: 'Provide basic information for a quick tax estimate',
      fields: [
        {
          name: 'filingStatus',
          label: 'Filing Status',
          type: 'select',
          required: true,
          options: [
            { label: 'Single', value: 'single' },
            { label: 'Married Filing Jointly', value: 'married_jointly' },
            { label: 'Married Filing Separately', value: 'married_separately' },
            { label: 'Head of Household', value: 'head_of_household' },
          ],
        },
        {
          name: 'grossIncome',
          label: 'Gross Annual Income',
          type: 'number',
          placeholder: '75000',
          required: true,
        },
        {
          name: 'deductions',
          label: 'Estimated Deductions',
          type: 'number',
          placeholder: '12950',
          required: false,
        },
        {
          name: 'dependents',
          label: 'Number of Dependents',
          type: 'number',
          placeholder: '0',
          required: false,
        },
        {
          name: 'businessIncome',
          label: 'Business Income',
          type: 'number',
          placeholder: '0',
          required: false,
        },
        {
          name: 'selfEmployed',
          label: 'Self-employed',
          type: 'checkbox',
          required: false,
        },
      ],
    });

    if (result) {
      // Simulate tax calculation
      const estimatedTax = calculateTaxEstimate(result);
      notification.success(`Estimated tax liability: $${estimatedTax.toLocaleString()}`);
    }
  };

  const handleFullTaxReturn = () => {
    const taxReturnSteps = [
      {
        id: 'personal-info',
        title: 'Personal Information',
        description: 'Enter taxpayer information',
        content: (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input type="text" className="w-full px-3 py-2 border border-border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input type="text" className="w-full px-3 py-2 border border-border rounded-md" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Social Security Number</label>
              <input type="text" className="w-full px-3 py-2 border border-border rounded-md" placeholder="XXX-XX-XXXX" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date of Birth</label>
              <input type="date" className="w-full px-3 py-2 border border-border rounded-md" />
            </div>
          </div>
        ),
      },
      {
        id: 'income',
        title: 'Income Sources',
        description: 'Report all income sources',
        content: (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">W-2 Wages</label>
              <input type="number" className="w-full px-3 py-2 border border-border rounded-md" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Self-Employment Income</label>
              <input type="number" className="w-full px-3 py-2 border border-border rounded-md" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Investment Income</label>
              <input type="number" className="w-full px-3 py-2 border border-border rounded-md" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Other Income</label>
              <input type="number" className="w-full px-3 py-2 border border-border rounded-md" placeholder="0.00" />
            </div>
          </div>
        ),
      },
      {
        id: 'deductions',
        title: 'Deductions & Credits',
        description: 'Enter deductions and tax credits',
        content: (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input type="radio" name="deduction-type" value="standard" id="standard" defaultChecked />
              <label htmlFor="standard">Standard Deduction</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="radio" name="deduction-type" value="itemized" id="itemized" />
              <label htmlFor="itemized">Itemized Deductions</label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Child Tax Credit</label>
              <input type="number" className="w-full px-3 py-2 border border-border rounded-md" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Education Credits</label>
              <input type="number" className="w-full px-3 py-2 border border-border rounded-md" placeholder="0.00" />
            </div>
          </div>
        ),
      },
      {
        id: 'review',
        title: 'Review & Submit',
        description: 'Review your tax return before filing',
        content: (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Tax Return Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Total Income: $85,000</div>
                <div>Adjusted Gross Income: $80,000</div>
                <div>Standard Deduction: $12,950</div>
                <div>Taxable Income: $67,050</div>
                <div>Federal Tax: $7,853</div>
                <div>Refund/Owed: $1,247 (Refund)</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="accuracy" />
              <label htmlFor="accuracy" className="text-sm">
                I certify that the information provided is accurate to the best of my knowledge
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="e-signature" />
              <label htmlFor="e-signature" className="text-sm">
                I authorize electronic signature for this return
              </label>
            </div>
          </div>
        ),
      },
    ];

    wizardDialog.show({
      title: 'Tax Return Filing Wizard',
      steps: taxReturnSteps,
      allowStepNavigation: true,
      onComplete: async (data) => {
        notification.success('Tax return submitted successfully!');
        console.log('Tax return data:', data);
      },
    });
  };

  // Simple tax calculation (for demo purposes)
  const calculateTaxEstimate = (data: any) => {
    const income = parseFloat(data.grossIncome) || 0;
    const deductions = parseFloat(data.deductions) || 12950; // Standard deduction
    const taxableIncome = Math.max(0, income - deductions);

    // Simplified tax brackets (2023)
    let tax = 0;
    if (taxableIncome > 539900) tax += (taxableIncome - 539900) * 0.37;
    if (taxableIncome > 215950) tax += Math.min(taxableIncome - 215950, 539900 - 215950) * 0.35;
    if (taxableIncome > 182050) tax += Math.min(taxableIncome - 182050, 215950 - 182050) * 0.32;
    if (taxableIncome > 95450) tax += Math.min(taxableIncome - 95450, 182050 - 95450) * 0.24;
    if (taxableIncome > 44725) tax += Math.min(taxableIncome - 44725, 95450 - 44725) * 0.22;
    if (taxableIncome > 11000) tax += Math.min(taxableIncome - 11000, 44725 - 11000) * 0.12;
    if (taxableIncome > 0) tax += Math.min(taxableIncome, 11000) * 0.10;

    return Math.round(tax);
  };

  return {
    quickEstimate: handleQuickTaxEstimate,
    fullReturn: handleFullTaxReturn,
  };
});

export const AppointmentModals = memo(function AppointmentModals() {
  const formDialog = useFormDialog();
  const confirmDialog = useConfirmDialog();
  const notification = useNotification();

  const handleScheduleAppointment = async () => {
    const result = await formDialog.create({
      title: 'Schedule Consultation',
      description: 'Book a consultation with our tax professionals',
      fields: [
        {
          name: 'clientName',
          label: 'Client Name',
          type: 'text',
          placeholder: 'Your name',
          required: true,
        },
        {
          name: 'email',
          label: 'Email Address',
          type: 'email',
          placeholder: 'your.email@example.com',
          required: true,
        },
        {
          name: 'phone',
          label: 'Phone Number',
          type: 'tel',
          placeholder: '(555) 123-4567',
          required: true,
        },
        {
          name: 'serviceType',
          label: 'Service Needed',
          type: 'select',
          required: true,
          options: [
            { label: 'Tax Return Preparation', value: 'tax_prep' },
            { label: 'Tax Planning Consultation', value: 'tax_planning' },
            { label: 'Business Formation', value: 'business_formation' },
            { label: 'Audit Representation', value: 'audit_rep' },
            { label: 'Bookkeeping Services', value: 'bookkeeping' },
            { label: 'Financial Planning', value: 'financial_planning' },
          ],
        },
        {
          name: 'preferredDate',
          label: 'Preferred Date',
          type: 'date',
          required: true,
        },
        {
          name: 'preferredTime',
          label: 'Preferred Time',
          type: 'select',
          required: true,
          options: [
            { label: '9:00 AM', value: '09:00' },
            { label: '10:00 AM', value: '10:00' },
            { label: '11:00 AM', value: '11:00' },
            { label: '1:00 PM', value: '13:00' },
            { label: '2:00 PM', value: '14:00' },
            { label: '3:00 PM', value: '15:00' },
            { label: '4:00 PM', value: '16:00' },
          ],
        },
        {
          name: 'meetingType',
          label: 'Meeting Type',
          type: 'select',
          required: true,
          options: [
            { label: 'In-Person', value: 'in_person' },
            { label: 'Video Call', value: 'video' },
            { label: 'Phone Call', value: 'phone' },
          ],
        },
        {
          name: 'notes',
          label: 'Additional Information',
          type: 'textarea',
          placeholder: 'Please describe your needs or any specific questions...',
          required: false,
        },
      ],
    });

    if (result) {
      notification.success('Appointment scheduled successfully! You will receive a confirmation email shortly.');
      console.log('Appointment:', result);
    }
  };

  const handleCancelAppointment = async (appointmentId: string, date: string) => {
    const confirmed = await confirmDialog.confirm({
      title: 'Cancel Appointment',
      description: `Are you sure you want to cancel your appointment scheduled for ${date}?`,
      variant: 'warning',
      confirmText: 'Cancel Appointment',
      cancelText: 'Keep Appointment',
    });

    if (confirmed) {
      notification.success('Appointment cancelled successfully');
    }
  };

  return {
    scheduleAppointment: handleScheduleAppointment,
    cancelAppointment: handleCancelAppointment,
  };
});

// Export all business modal utilities
export const BusinessModalUtils = {
  ClientManagementModals,
  TaxDocumentModals,
  TaxCalculationModals,
  AppointmentModals,
};