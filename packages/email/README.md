# Email Package

Professional email templates and integration with Resend/SMTP for the GCMC-KAJ platform.

## Features

- 7 professionally designed, responsive email templates built with React Email
- Integration with Resend API for reliable email delivery
- BullMQ queue integration for asynchronous email sending
- Development mode with email preview server
- Support for both Resend and SMTP providers
- Template rendering with full TypeScript support

## Email Templates

### 1. Welcome Email
Sent when a new client is created with an email address.

**Triggers:** Client creation in API
**Template:** `templates/welcome.tsx`

### 2. Document Expiry Warning
Alerts team members about documents expiring soon (30, 14, 7, 3, and 1 day warnings).

**Triggers:** Daily scheduled job at 7 AM
**Template:** `templates/document-expiry-warning.tsx`

### 3. Filing Reminder
Reminds about upcoming tax filing deadlines (14, 7, 3 days before and overdue).

**Triggers:** Daily scheduled job at 8 AM
**Template:** `templates/filing-reminder.tsx`

### 4. Task Assignment
Notifies team members when a task is assigned to them.

**Triggers:** Task creation in API
**Template:** `templates/task-assignment.tsx`

### 5. Service Request Update
Notifies clients when their service request status changes.

**Triggers:** Service request status update in API
**Template:** `templates/service-request-update.tsx`

### 6. Password Reset
Sends password reset link with security information.

**Triggers:** Password reset request (to be integrated with auth)
**Template:** `templates/password-reset.tsx`

### 7. Invoice
Professional invoice/billing notifications.

**Triggers:** Manual or automated invoicing (to be integrated)
**Template:** `templates/invoice.tsx`

## Installation

This package is already included in the monorepo. To install dependencies:

```bash
bun install
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Email Provider: "resend", "smtp", or "log"
EMAIL_PROVIDER="log"

# Resend API Key (if using Resend)
RESEND_API_KEY="re_xxxxxxxxxxxxx"

# SMTP Configuration (if using SMTP)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-smtp-username"
SMTP_PASSWORD="your-smtp-password"

# Email Settings
EMAIL_FROM="noreply@gcmc.com"
EMAIL_FROM_NAME="GCMC Professional Services"
EMAIL_REPLY_TO="support@gcmc.com"

# Application URLs
PORTAL_URL="https://portal.gcmc.com"
SUPPORT_EMAIL="support@gcmc.com"
```

### Email Providers

#### Development (Default)
In development, emails are logged to console instead of being sent:

```env
EMAIL_PROVIDER="log"
NODE_ENV="development"
```

#### Resend (Recommended for Production)
Sign up at [resend.com](https://resend.com) and get an API key:

```env
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_xxxxxxxxxxxxx"
```

#### SMTP
Use any SMTP provider:

```env
EMAIL_PROVIDER="smtp"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

## Usage

### Preview Templates (Development)

Start the email preview server to view all templates in your browser:

```bash
cd packages/email
bun run preview
```

Then open http://localhost:3003 in your browser.

### Sending Emails from Code

#### Using the Email Service Directly

```typescript
import { emailService } from "@GCMC-KAJ/email";

// Send welcome email
await emailService.sendWelcome("client@example.com", {
  clientName: "John Doe",
  tenantName: "GCMC Professional Services",
  portalUrl: "https://portal.gcmc.com",
  supportEmail: "support@gcmc.com",
});

// Send task assignment email
await emailService.sendTaskAssignment("team@example.com", {
  assigneeName: "Jane Smith",
  taskTitle: "Review documents",
  taskDescription: "Please review the uploaded documents",
  clientName: "ABC Corp",
  priority: "high",
  dueDate: new Date("2025-12-31"),
  assignedBy: "Manager Name",
  portalUrl: "https://portal.gcmc.com",
  tenantName: "GCMC Professional Services",
});
```

#### Using the Email Queue (Recommended)

Queue emails for asynchronous processing by the worker:

```typescript
import { queueWelcomeEmail } from "@GCMC-KAJ/api/utils/emailQueue";

// Queue welcome email
await queueWelcomeEmail("client@example.com", {
  clientName: "John Doe",
  tenantName: "GCMC Professional Services",
  portalUrl: "https://portal.gcmc.com",
  supportEmail: "support@gcmc.com",
});
```

Available queue functions:
- `queueWelcomeEmail()`
- `queueDocumentExpiryWarning()`
- `queueFilingReminder()`
- `queueTaskAssignmentEmail()`
- `queueServiceRequestUpdateEmail()`
- `queuePasswordResetEmail()`
- `queueInvoiceEmail()`

## Worker Integration

The email worker processes queued emails asynchronously. It's automatically started with the worker application.

### Email Worker
Processes individual email jobs from the queue.

**Queue:** `email`
**Concurrency:** Configurable (default: 1)

### Scheduled Email Worker
Runs daily checks for expiring documents and upcoming filings.

**Queue:** `scheduled-email`
**Schedule:**
- Document expiry checks: 7 AM daily
- Filing reminder checks: 8 AM daily

## API Integration

Email sending is automatically integrated into these API endpoints:

### Client Creation
When a client is created with an email address, a welcome email is automatically queued.

**Router:** `packages/api/src/routers/clients.ts`
**Endpoint:** `clients.create`

### Task Assignment
When a task is created and assigned to a user, an assignment email is queued.

**Router:** `packages/api/src/routers/tasks.ts`
**Endpoint:** `tasks.create`

### Service Request Updates
When a service request status changes, an update email is sent to the client.

**Router:** `packages/api/src/routers/serviceRequests.ts`
**Endpoint:** `serviceRequests.update`

## Architecture

```
packages/email/
├── templates/              # React Email templates
│   ├── welcome.tsx
│   ├── document-expiry-warning.tsx
│   ├── filing-reminder.tsx
│   ├── task-assignment.tsx
│   ├── service-request-update.tsx
│   ├── password-reset.tsx
│   └── invoice.tsx
├── src/
│   ├── index.ts           # Package exports
│   ├── types.ts           # TypeScript types
│   ├── service.ts         # EmailService class
│   └── preview.ts         # Development preview server
└── package.json

apps/worker/src/jobs/
├── emailJob.ts            # Process email queue
└── scheduledEmailJob.ts   # Daily scheduled checks

packages/api/src/utils/
└── emailQueue.ts          # Queue helper functions
```

## Development Workflow

1. **Create/Modify Templates:**
   - Edit templates in `templates/` directory
   - Use React Email components
   - Test with preview server: `bun run preview`

2. **Update Email Service:**
   - Add new methods to `src/service.ts`
   - Add corresponding types to `src/types.ts`
   - Update worker jobs if needed

3. **Integrate with API:**
   - Add queue helper to `packages/api/src/utils/emailQueue.ts`
   - Call from relevant API endpoints

4. **Test:**
   - Preview templates in browser
   - Test in development with `EMAIL_PROVIDER="log"`
   - Check worker logs for email processing

## Production Deployment

### Resend Setup

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain
3. Get API key from dashboard
4. Add to production environment:
   ```env
   EMAIL_PROVIDER="resend"
   RESEND_API_KEY="re_live_xxxxxxxxxxxxx"
   EMAIL_FROM="noreply@yourdomain.com"
   EMAIL_FROM_NAME="Your Company Name"
   ```

### Rate Limits

Resend free tier:
- 100 emails/day
- 3,000 emails/month

For higher volumes, upgrade to a paid plan.

### Monitoring

Monitor email delivery in:
- Resend Dashboard: https://resend.com/emails
- Worker logs: Check BullMQ job completion/failures
- Application logs: Email queue operations

## Troubleshooting

### Emails Not Sending

1. **Check worker is running:**
   ```bash
   bun run dev:worker
   ```

2. **Check Redis connection:**
   - Ensure Redis is running
   - Verify `REDIS_URL` is correct

3. **Check environment variables:**
   - Verify `EMAIL_PROVIDER` is set
   - Check API key or SMTP credentials

4. **Check logs:**
   - Worker logs show email processing
   - API logs show queue operations

### Email Preview Not Working

1. **Ensure dependencies are installed:**
   ```bash
   cd packages/email
   bun install
   ```

2. **Check port availability:**
   - Default: http://localhost:3003
   - Change with `EMAIL_PREVIEW_PORT` env var

### Template Styling Issues

React Email has some limitations:
- Use inline styles or style objects
- Some CSS features not supported in emails
- Test across email clients (Gmail, Outlook, etc.)

## Future Enhancements

- [ ] Email analytics and tracking
- [ ] A/B testing for templates
- [ ] Unsubscribe management
- [ ] Email scheduling (send at specific time)
- [ ] Attachment support
- [ ] Multi-language templates
- [ ] Email template versioning
- [ ] Webhook support for delivery events

## Resources

- [React Email Documentation](https://react.email)
- [Resend Documentation](https://resend.com/docs)
- [BullMQ Documentation](https://docs.bullmq.io)
