# KAJ-GCMC Reports Package

Professional PDF report generation system for the KAJ-GCMC platform using @react-pdf/renderer.

## Features

- **5 Professional PDF Report Types**
  - Client File Report (comprehensive overview)
  - Documents List Report (detailed document inventory)
  - Filings Summary Report (filing status and history)
  - Compliance Report (compliance score and recommendations)
  - Service History Report (service request tracking)

- **Security & Performance**
  - Tenant isolation enforced at all levels
  - RBAC permission checks
  - Streaming PDF generation
  - Base64 encoding for client download
  - Error handling and validation

- **Professional Styling**
  - Consistent branding with company name
  - Color-coded status indicators
  - Page numbers and timestamps
  - Responsive table layouts
  - Warning highlights for urgent items

## Installation

The package is already configured in the monorepo. To install dependencies:

```bash
pnpm install
```

## Usage

### Backend - Generate Reports

```typescript
import {
  generateClientFileReport,
  generateDocumentsListReport,
  generateFilingsSummaryReport,
  generateComplianceReport,
  generateServiceHistoryReport,
} from '@GCMC-KAJ/reports';

// Generate a client file report
const pdfBuffer = await generateClientFileReport(clientId, tenantId);

// Save to file or return to client
fs.writeFileSync('client-report.pdf', pdfBuffer);
```

### tRPC - Use in API Routes

```typescript
import { trpc } from '@/utils/trpc';

// In a React component
const generateReport = trpc.reports.generateClientFile.useMutation();

const handleDownload = async () => {
  const result = await generateReport.mutateAsync({ clientId: 123 });

  if (result.success) {
    // result.data is base64 encoded PDF
    // result.filename is suggested filename
    // result.contentType is 'application/pdf'
  }
};
```

### Frontend - React Components

#### Simple Usage with ReportDownloadButton

```typescript
import { ReportDownloadButton } from '@/components/reports/ReportDownloadButton';

export function MyComponent() {
  return (
    <ReportDownloadButton
      clientId={123}
      reportType="client_file"
      variant="default"
      label="Download Client Report"
    />
  );
}
```

#### Available Report Types

- `client_file` - Complete client overview
- `documents_list` - Document inventory
- `filings_summary` - Filing status summary
- `compliance` - Compliance score report
- `service_history` - Service request history

#### Button Variants

- `default` - Primary blue button
- `outline` - Outlined button
- `secondary` - Secondary style
- `ghost` - Transparent button
- `link` - Link style

## Report Details

### 1. Client File Report

**Includes:**
- Client information (name, type, contact, TIN, NIS, sector)
- Associated businesses
- Compliance score with visual indicator
- Document summary (total, by type, expiring, expired)
- Filing summary (total, by status, upcoming deadlines)
- Service history (recent service requests)

**Permissions Required:** `clients:view`

**Output:** Multi-page PDF with comprehensive client overview

### 2. Documents List Report

**Includes:**
- Client header with contact information
- All documents grouped by type
- Columns: Document Title, Number, Issue Date, Expiry Date, Status, Authority, Warnings
- Expiry warnings (highlighted for documents expiring soon)

**Permissions Required:** `documents:view`

**Output:** Landscape-oriented PDF with detailed document table

### 3. Filings Summary Report

**Includes:**
- Client header with TIN
- Summary statistics (total, filed, pending, overdue)
- Total tax amount calculated
- Separate sections for:
  - Overdue filings
  - Pending filings
  - Filed/approved filings
- Columns: Filing Type, Period, Status, Submission Date, Reference #, Amount, Notes

**Permissions Required:** `filings:view`

**Output:** Multi-page landscape PDF with categorized filings

### 4. Compliance Report

**Includes:**
- Compliance score (0-100%) with color-coded indicator
- Compliance level (Excellent/Moderate/Low)
- Missing documents list
- Expiring documents (next 30 days)
- Overdue filings
- Actionable recommendations

**Permissions Required:** `clients:view`

**Output:** Multi-page PDF with compliance analysis

### 5. Service History Report

**Includes:**
- Service request summary (total, completed, in progress, cancelled)
- Total revenue (if applicable)
- Detailed service request cards with:
  - Service name and business
  - Status and priority
  - Steps progress
  - Dates and assignments

**Permissions Required:** `services:view`

**Output:** Multi-page PDF with service tracking

## Server Endpoints

### Download Endpoint

```
GET /downloads/reports/:reportType/:clientId
```

**Report Types:**
- `client-file`
- `documents-list`
- `filings-summary`
- `compliance`
- `service-history`

**Authentication:** Session-based (Better-Auth)

**Authorization:** Automatic RBAC permission checks

**Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="report-name.pdf"`
- Streams PDF directly to browser

## Architecture

```
packages/reports/
├── src/
│   ├── templates/          # React PDF templates
│   │   ├── ClientFileReport.tsx
│   │   ├── DocumentsListReport.tsx
│   │   ├── FilingsSummaryReport.tsx
│   │   ├── ComplianceReport.tsx
│   │   └── ServiceHistoryReport.tsx
│   ├── styles/
│   │   └── common.ts       # Shared PDF styles
│   ├── generator.ts        # Report generation logic
│   └── index.ts            # Package exports
└── package.json

packages/api/src/routers/
└── reports.ts              # tRPC router

apps/server/src/routes/
└── downloads.ts            # Download endpoint

apps/web/src/components/
└── reports/
    └── ReportDownloadButton.tsx  # React component
```

## Customization

### Styling

Edit `/packages/reports/src/styles/common.ts` to customize:
- Colors
- Fonts
- Table layouts
- Badge styles
- Page layouts

### Templates

Edit individual template files in `/packages/reports/src/templates/` to:
- Add new sections
- Modify layouts
- Change data presentation
- Add charts or visualizations

### New Report Types

1. Create template in `src/templates/YourReport.tsx`
2. Add generator function in `src/generator.ts`
3. Add tRPC endpoint in `packages/api/src/routers/reports.ts`
4. Update `ReportDownloadButton` to support new type

## Error Handling

All report generation functions include comprehensive error handling:

- **Data Validation:** Ensures client belongs to tenant
- **Permission Checks:** RBAC enforcement at multiple layers
- **Graceful Degradation:** Missing data shows placeholders
- **Error Logging:** Detailed error logs for debugging
- **User Feedback:** Toast notifications on frontend

## Performance

- **Streaming:** Large reports stream to avoid memory issues
- **Caching:** No caching (always fresh data)
- **Generation Time:** ~1-3 seconds per report
- **File Size:** Typically 50-200 KB per report

## Development

### Run Tests

```bash
pnpm test
```

### Build Package

```bash
pnpm build
```

### Type Check

```bash
pnpm check-types
```

## Dependencies

- `@react-pdf/renderer` - PDF generation
- `date-fns` - Date formatting
- `react` - React components
- `@GCMC-KAJ/db` - Database access
- `@GCMC-KAJ/types` - Type definitions

## License

Proprietary - KAJ-GCMC Platform

## Support

For issues or questions, contact the development team.
