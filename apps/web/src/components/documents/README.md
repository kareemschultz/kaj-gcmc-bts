# Smart Document Upload System

An intelligent, agency-aware document upload system with smart categorization, compliance validation, and automated workflows designed specifically for Guyanese regulatory compliance (GRA, NIS, DCRA, Immigration).

## Features

### 🧠 AI-Powered Smart Categorization
- **Automatic document type detection** based on filename, content, and metadata
- **Agency-specific categorization** for GRA, NIS, DCRA, and Immigration documents
- **Confidence scoring** for categorization accuracy
- **Smart suggestions** for document types and templates

### 📱 Mobile Document Scanner
- **Camera integration** with real-time document capture
- **Auto-capture mode** with document edge detection
- **Image enhancement** with contrast, brightness, and rotation controls
- **Batch scanning** with gallery management
- **OCR text extraction** for automatic form filling

### 🛡️ Compliance Validation
- **25+ validation rules** for Guyanese regulatory requirements
- **Real-time validation** with detailed error reporting
- **Auto-fix capabilities** for common issues
- **Compliance scoring** with detailed breakdown
- **Custom validation rules** support

### 👁️ Rich Document Preview
- **Multi-format support** (PDF, DOC, images, spreadsheets)
- **Annotation tools** with highlights, comments, and drawings
- **Version control** with change tracking
- **Document collaboration** with shared annotations
- **Advanced search** and filtering

### ⚙️ Workflow Automation
- **Agency-specific workflows** with automatic routing
- **Step-by-step processing** with progress tracking
- **Deadline management** with notifications
- **Approval workflows** with digital signatures
- **Audit trail** for compliance tracking

## Components

### SmartDocumentUploader
Main upload interface with drag-and-drop, progress tracking, and AI categorization.

```tsx
import { SmartDocumentUploader } from '@/components/documents';

<SmartDocumentUploader
  onUpload={handleUpload}
  multiple={true}
  enableOCR={true}
  enableMobileCapture={true}
  acceptedTypes={['.pdf', '.doc', '.docx', '.jpg', '.png']}
  maxSize={50} // MB
/>
```

### AgencyDocumentSelector
Intelligent categorization interface for Guyanese agencies.

```tsx
import { AgencyDocumentSelector } from '@/components/documents';

<AgencyDocumentSelector
  selectedAgency="GRA"
  selectedDocumentType="income-tax-return"
  onAgencyChange={setAgency}
  onDocumentTypeChange={setDocumentType}
  onTemplateSelect={handleTemplate}
  showTemplates={true}
  showSuggestions={true}
/>
```

### DocumentPreviewGallery
Rich document viewer with annotation and editing capabilities.

```tsx
import { DocumentPreviewGallery } from '@/components/documents';

<DocumentPreviewGallery
  documents={documents}
  selectedDocument={selectedDoc}
  onDocumentSelect={setSelectedDoc}
  viewMode="grid"
  showToolbar={true}
  showSidebar={true}
/>
```

### MobileDocumentScanner
Camera-based document scanning with image processing.

```tsx
import { MobileDocumentScanner } from '@/components/documents';

<MobileDocumentScanner
  onCapture={handleCapture}
  onClose={handleClose}
  enableBatchScan={true}
  showProcessing={true}
  initialSettings={{
    quality: 'good',
    autoCapture: false,
    enhanceContrast: true
  }}
/>
```

### DocumentValidation
Comprehensive validation with Guyanese compliance rules.

```tsx
import { DocumentValidation } from '@/components/documents';

<DocumentValidation
  documents={documents}
  onValidationComplete={handleValidation}
  enableAutoFix={true}
  customRules={customValidationRules}
/>
```

### SmartDocumentManagement
Complete document management system with all features integrated.

```tsx
import { SmartDocumentManagement } from '@/components/documents';

<SmartDocumentManagement
  onDocumentSubmit={handleSubmit}
  onWorkflowComplete={handleWorkflow}
  enabledFeatures={{
    upload: true,
    scanner: true,
    validation: true,
    workflow: true,
    preview: true,
    categorization: true
  }}
  layoutMode="modal" // 'modal' | 'sidebar' | 'fullscreen'
/>
```

## Agency Support

### Guyana Revenue Authority (GRA)
- Income Tax Returns (Form IT-1, IT-2)
- VAT Returns (quarterly filings)
- Corporation Tax Returns
- Withholding Tax Certificates
- Excise Tax Documentation

### National Insurance Scheme (NIS)
- Monthly Contribution Schedules
- Employee Registration Forms
- Employer Registration
- Benefit Claim Forms
- Compliance Certificates

### Deeds & Commercial Registry Authority (DCRA)
- Certificate of Incorporation
- Annual Returns
- Director Resolutions
- Registered Office Changes
- Share Transfer Documentation

### Immigration Department
- Work Permit Applications
- Visa Applications
- Permanent Residency Forms
- Passport Renewal Applications

## Validation Rules

The system includes 25+ built-in validation rules:

### Format Validation
- File size limits (50MB max)
- Supported file types
- Image quality checks
- Document structure validation

### Content Validation
- Required field verification
- TIN number validation (GRA)
- Employer number validation (NIS)
- Company registration validation (DCRA)

### Compliance Validation
- Filing deadline checks
- Regulatory requirement verification
- Document completeness validation
- Security and confidentiality checks

### Custom Rules
Add your own validation rules:

```tsx
const customRule: ValidationRule = {
  id: 'custom-rule',
  name: 'Custom Validation',
  type: 'content',
  severity: 'error',
  description: 'Custom validation rule description',
  category: 'compliance',
  validator: (file) => ({
    passed: /* validation logic */,
    message: 'Validation message',
    suggestion: 'Improvement suggestion',
    autoFixable: false
  }),
  autoFix: (file) => /* auto-fix logic */
};
```

## Workflow Templates

### GRA Tax Filing Workflow
1. Document Review
2. Tax Calculation Verification
3. Compliance Validation
4. Final Approval
5. Submission to GRA

### NIS Contribution Workflow
1. Employee Data Verification
2. Contribution Calculation
3. Compliance Check
4. Approval
5. Submission to NIS

### DCRA Registration Workflow
1. Document Completeness Check
2. Legal Requirement Verification
3. Review and Approval
4. Registration Processing
5. Certificate Issuance

### Immigration Application Workflow
1. Application Review
2. Supporting Document Verification
3. Background Check Processing
4. Interview Scheduling
5. Decision and Processing

## Configuration

### Default Settings
```tsx
import { DEFAULT_SETTINGS } from '@/components/documents';

const settings = {
  ...DEFAULT_SETTINGS,
  uploader: {
    maxSize: 50 * 1024 * 1024, // 50MB
    acceptedTypes: ['.pdf', '.doc', '.docx', '.jpg', '.png', '.xlsx'],
    multiple: true,
    enableOCR: true,
    enableMobileCapture: true
  },
  scanner: {
    quality: 'good',
    autoCapture: false,
    enhanceContrast: true,
    resolution: 'high'
  },
  validation: {
    enableAutoFix: true,
    autoValidation: true
  }
};
```

### Feature Flags
```tsx
import { FEATURE_FLAGS } from '@/components/documents';

const features = {
  ENABLE_OCR: true,
  ENABLE_MOBILE_SCANNER: true,
  ENABLE_AUTO_VALIDATION: true,
  ENABLE_WORKFLOW_AUTOMATION: true,
  ENABLE_AI_SUGGESTIONS: true
};
```

## API Integration

### Document Upload Handler
```tsx
const handleDocumentUpload = async (documents: SmartDocument[]) => {
  try {
    const formData = new FormData();

    documents.forEach((doc, index) => {
      formData.append(`file_${index}`, doc.file);
      formData.append(`metadata_${index}`, JSON.stringify({
        agency: doc.agencyCategory,
        documentType: doc.documentTypeId,
        tags: doc.tags,
        description: doc.description
      }));
    });

    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};
```

### Validation Integration
```tsx
const handleValidation = async (documents: DocumentFile[]) => {
  const response = await fetch('/api/documents/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documents })
  });

  return response.json();
};
```

## Analytics & Metrics

Track system usage and performance:

```tsx
import { ANALYTICS_EVENTS } from '@/components/documents';

// Track document upload
analytics.track(ANALYTICS_EVENTS.DOCUMENT_UPLOADED, {
  agency: document.agencyCategory,
  documentType: document.documentTypeId,
  fileSize: document.file.size,
  processingTime: processingDuration
});

// Track validation completion
analytics.track(ANALYTICS_EVENTS.VALIDATION_COMPLETED, {
  documentCount: documents.length,
  errorCount: validationErrors.length,
  complianceScore: averageScore
});
```

## Error Handling

### Built-in Error Messages
```tsx
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/components/documents';

// File validation errors
if (fileSize > maxSize) {
  toast.error(ERROR_MESSAGES.FILE_TOO_LARGE);
}

// Success notifications
if (uploadCompleted) {
  toast.success(SUCCESS_MESSAGES.UPLOAD_COMPLETE);
}
```

### Custom Error Handling
```tsx
const handleError = (error: Error, context: string) => {
  console.error(`Error in ${context}:`, error);

  // Log to analytics
  analytics.track('error_occurred', {
    context,
    error: error.message,
    timestamp: new Date().toISOString()
  });

  // Show user-friendly message
  toast.error('Something went wrong. Please try again.');
};
```

## Performance Optimization

### Lazy Loading
```tsx
import { lazy, Suspense } from 'react';

const MobileDocumentScanner = lazy(() => import('./mobile-document-scanner'));

<Suspense fallback={<div>Loading scanner...</div>}>
  <MobileDocumentScanner />
</Suspense>
```

### Memoization
```tsx
import { useMemo, useCallback } from 'react';

const MemoizedDocumentList = memo(({ documents, onSelect }) => {
  const sortedDocuments = useMemo(() =>
    documents.sort((a, b) => b.uploadDate.localeCompare(a.uploadDate))
  , [documents]);

  const handleSelect = useCallback((doc) => {
    onSelect(doc);
  }, [onSelect]);

  return /* component JSX */;
});
```

## Testing

### Unit Tests
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { SmartDocumentUploader } from './smart-document-uploader';

test('uploads documents successfully', async () => {
  const mockUpload = jest.fn();
  render(<SmartDocumentUploader onUpload={mockUpload} />);

  const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
  const input = screen.getByLabelText(/upload/i);

  fireEvent.change(input, { target: { files: [file] } });

  expect(mockUpload).toHaveBeenCalledWith([file]);
});
```

### Integration Tests
```tsx
test('complete document workflow', async () => {
  render(<SmartDocumentManagement />);

  // Upload document
  const file = new File(['tax return'], 'tax-return.pdf', { type: 'application/pdf' });
  await uploadFile(file);

  // Verify categorization
  expect(screen.getByText('GRA')).toBeInTheDocument();

  // Run validation
  fireEvent.click(screen.getByRole('button', { name: /validate/i }));

  // Check results
  await waitFor(() => {
    expect(screen.getByText(/validation complete/i)).toBeInTheDocument();
  });
});
```

## Deployment

### Environment Variables
```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.gcmc-kaj.com
NEXT_PUBLIC_UPLOAD_URL=https://uploads.gcmc-kaj.com

# Feature Flags
NEXT_PUBLIC_ENABLE_OCR=true
NEXT_PUBLIC_ENABLE_SCANNER=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Agency Integration
GRA_API_ENDPOINT=https://api.gra.gov.gy
NIS_API_ENDPOINT=https://api.nis.gov.gy
DCRA_API_ENDPOINT=https://api.dcra.gov.gy
```

### Build Configuration
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "dev": "next dev",
    "test": "jest",
    "test:e2e": "playwright test"
  }
}
```

## Browser Support

- **Chrome/Edge**: Full support including camera features
- **Firefox**: Full support with camera permissions
- **Safari**: Full support (iOS 14+)
- **Mobile browsers**: Optimized for touch interfaces

## Security

### Data Protection
- Files encrypted during upload
- Temporary file cleanup
- Secure API endpoints
- HTTPS required

### Privacy
- No client-side data storage
- Configurable data retention
- GDPR-compliant processing
- User consent management

## Support & Documentation

- **Demo**: `/smart-documents-demo`
- **API Documentation**: Available at `/api/docs`
- **Component Library**: Storybook integration
- **GitHub Issues**: Bug reports and feature requests

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

---

For more information, visit the [GCMC-KAJ Business Tax Services Platform](https://gcmc-kaj.com) or contact our support team.