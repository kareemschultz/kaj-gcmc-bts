# Interactive API Documentation

> **Interactive Swagger UI for KAJ-GCMC BTS Platform**
> **Generated from tRPC Schema**
> **Last Updated:** 2025-11-18

This document provides setup instructions for interactive API documentation using Swagger UI with tRPC-to-OpenAPI conversion.

---

## 📚 Table of Contents

- [Setup Instructions](#setup-instructions)
- [Interactive Documentation Features](#interactive-documentation-features)
- [OpenAPI Specification](#openapi-specification)
- [Usage Examples](#usage-examples)
- [Authentication in Swagger UI](#authentication-in-swagger-ui)

---

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
# Install tRPC-to-OpenAPI conversion tools
bun add @trpc/openapi openapi-types swagger-ui-react

# Install development dependencies
bun add -D openapi-typescript
```

### 2. Create OpenAPI Generator

```typescript
// scripts/generate-openapi.ts
import { generateOpenApiDocument } from '@trpc/openapi';
import { writeFileSync } from 'fs';
import { appRouter } from '../packages/api/src/routers';

const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'KAJ-GCMC BTS Platform API',
  description: 'Comprehensive Business Tax Services API',
  version: '1.0.0',
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  docsUrl: 'https://docs.gcmc-kaj.com/api',
  tags: [
    { name: 'Authentication', description: 'User authentication endpoints' },
    { name: 'Clients', description: 'Client management operations' },
    { name: 'Documents', description: 'Document management and uploads' },
    { name: 'Filings', description: 'Tax filing operations' },
    { name: 'Services', description: 'Service request management' },
    { name: 'Compliance', description: 'Compliance engine operations' },
    { name: 'Analytics', description: 'Analytics and reporting' },
    { name: 'Notifications', description: 'Notification management' },
  ],
});

writeFileSync(
  './docs/api/openapi.json',
  JSON.stringify(openApiDocument, null, 2)
);

console.log('OpenAPI specification generated successfully!');
```

### 3. Add tRPC OpenAPI Metadata

Update router definitions to include OpenAPI metadata:

```typescript
// packages/api/src/routers/clients.ts
import { z } from 'zod';
import { router, rbacProcedure } from '../index';

export const clientsRouter = router({
  list: rbacProcedure("clients", "view")
    .meta({
      openapi: {
        method: 'GET',
        path: '/clients',
        tags: ['Clients'],
        summary: 'List clients',
        description: 'Retrieve a paginated list of clients with filtering options',
      },
    })
    .input(z.object({
      search: z.string().optional().describe('Search term for client name, email, or TIN'),
      type: z.enum(['individual', 'company', 'partnership']).optional(),
      sector: z.string().optional().describe('Business sector filter'),
      riskLevel: z.enum(['low', 'medium', 'high']).optional(),
      page: z.number().min(1).default(1).describe('Page number (1-based)'),
      pageSize: z.number().min(1).max(100).default(20).describe('Items per page'),
    }).optional())
    .output(z.object({
      clients: z.array(z.object({
        id: z.number(),
        name: z.string(),
        type: z.enum(['individual', 'company', 'partnership']),
        email: z.string().nullable(),
        phone: z.string().nullable(),
        address: z.string().nullable(),
        tin: z.string().nullable(),
        nisNumber: z.string().nullable(),
        sector: z.string().nullable(),
        riskLevel: z.enum(['low', 'medium', 'high']).nullable(),
        notes: z.string().nullable(),
        createdAt: z.date(),
        updatedAt: z.date(),
        _count: z.object({
          documents: z.number(),
          filings: z.number(),
          serviceRequests: z.number(),
        }),
      })),
      pagination: z.object({
        page: z.number(),
        pageSize: z.number(),
        total: z.number(),
        totalPages: z.number(),
      }),
    }))
    .query(async ({ ctx, input }) => {
      // Implementation...
    }),

  get: rbacProcedure("clients", "view")
    .meta({
      openapi: {
        method: 'GET',
        path: '/clients/{id}',
        tags: ['Clients'],
        summary: 'Get client by ID',
        description: 'Retrieve detailed client information including related data',
      },
    })
    .input(z.object({
      id: z.number().describe('Client ID'),
    }))
    .output(z.object({
      id: z.number(),
      name: z.string(),
      type: z.enum(['individual', 'company', 'partnership']),
      // ... full client schema
      businesses: z.array(z.object({
        // Client business schema
      })),
      _count: z.object({
        documents: z.number(),
        filings: z.number(),
        serviceRequests: z.number(),
        tasks: z.number(),
      }),
    }))
    .query(async ({ ctx, input }) => {
      // Implementation...
    }),
});
```

### 4. Create Swagger UI Component

```typescript
// apps/web/src/components/docs/SwaggerUI.tsx
'use client';

import { useState, useEffect } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

interface SwaggerUIComponentProps {
  specUrl?: string;
}

export function SwaggerUIComponent({
  specUrl = '/api/openapi.json'
}: SwaggerUIComponentProps) {
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    fetch(specUrl)
      .then(res => res.json())
      .then(setSpec)
      .catch(console.error);
  }, [specUrl]);

  if (!spec) {
    return <div className="p-8">Loading API documentation...</div>;
  }

  return (
    <div className="swagger-ui-container">
      <SwaggerUI
        spec={spec}
        docExpansion="list"
        defaultModelsExpandDepth={2}
        defaultModelExpandDepth={2}
        displayRequestDuration={true}
        tryItOutEnabled={true}
        requestInterceptor={(request) => {
          // Add authentication headers
          if (typeof document !== 'undefined') {
            request.headers.Cookie = document.cookie;
          }
          return request;
        }}
        onComplete={(system) => {
          console.log('Swagger UI loaded successfully');
        }}
      />

      <style jsx global>{`
        .swagger-ui-container {
          max-width: 100%;
        }

        .swagger-ui .topbar {
          display: none;
        }

        .swagger-ui .info {
          margin: 20px 0;
        }

        .swagger-ui .scheme-container {
          background: #f7f7f7;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
        }
      `}</style>
    </div>
  );
}
```

### 5. Create API Documentation Page

```typescript
// apps/web/src/app/docs/api/page.tsx
import { SwaggerUIComponent } from '../../../components/docs/SwaggerUI';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Download, ExternalLink } from 'lucide-react';

export default function APIDocsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">API Documentation</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Interactive documentation for the KAJ-GCMC BTS Platform API
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">tRPC API</CardTitle>
              <CardDescription>
                Type-safe API with end-to-end TypeScript
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                View tRPC Docs
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">OpenAPI Spec</CardTitle>
              <CardDescription>
                Download OpenAPI 3.0 specification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <a href="/api/openapi.json" download>
                  <Download className="w-4 h-4 mr-2" />
                  Download JSON
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Postman Collection</CardTitle>
              <CardDescription>
                Import into Postman for testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <a href="/api/postman-collection.json" download>
                  <Download className="w-4 h-4 mr-2" />
                  Download Collection
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interactive API Explorer</CardTitle>
          <CardDescription>
            Try out API endpoints directly from your browser
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <SwaggerUIComponent />
        </CardContent>
      </Card>
    </div>
  );
}
```

### 6. OpenAPI Route Handler

```typescript
// apps/web/src/app/api/openapi.json/route.ts
import { generateOpenApiDocument } from '@trpc/openapi';
import { appRouter } from '@GCMC-KAJ/api';
import { NextResponse } from 'next/server';

const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'KAJ-GCMC BTS Platform API',
  description: 'Comprehensive Business Tax Services API for compliance management, client operations, and business processes.',
  version: '1.0.0',
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  docsUrl: 'https://docs.gcmc-kaj.com/api',
  tags: [
    { name: 'System', description: 'System health and status endpoints' },
    { name: 'Authentication', description: 'User authentication and session management' },
    { name: 'Users', description: 'User management and administration' },
    { name: 'Tenants', description: 'Multi-tenant organization management' },
    { name: 'Clients', description: 'Client relationship management' },
    { name: 'Documents', description: 'Document management and file uploads' },
    { name: 'Filings', description: 'Tax filing and compliance submissions' },
    { name: 'Services', description: 'Service request and workflow management' },
    { name: 'Compliance', description: 'Compliance rules and requirement bundles' },
    { name: 'Analytics', description: 'Business intelligence and reporting' },
    { name: 'Notifications', description: 'Notification and alert management' },
    { name: 'Tasks', description: 'Background task and job management' },
  ],
});

export async function GET() {
  return NextResponse.json(openApiDocument);
}
```

---

## 🎮 Interactive Documentation Features

### Authentication

The interactive docs support session-based authentication:

1. **Login via Better-Auth**
2. **Session cookies** automatically included in requests
3. **RBAC permissions** enforced for all endpoints
4. **Real-time authentication status** in UI

### Try It Out Features

- **Interactive forms** for all endpoints
- **Real-time validation** based on Zod schemas
- **Example values** auto-populated
- **Response inspection** with syntax highlighting
- **cURL command generation** for each request

### Advanced Features

- **Schema exploration** with expandable models
- **Error response examples** for each endpoint
- **Rate limiting information** displayed
- **Request/response timing** metrics
- **Download specifications** in multiple formats

---

## 📋 OpenAPI Specification

### Core Information

```yaml
openapi: 3.0.0
info:
  title: KAJ-GCMC BTS Platform API
  description: Comprehensive Business Tax Services API
  version: 1.0.0
  contact:
    name: API Support
    email: support@gcmc-kaj.com
    url: https://docs.gcmc-kaj.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: http://localhost:3000
    description: Development server
  - url: https://api.gcmc-kaj.com
    description: Production server

security:
  - SessionAuth: []

components:
  securitySchemes:
    SessionAuth:
      type: apiKey
      in: cookie
      name: better-auth.session_token
```

### Example Endpoint Specification

```yaml
paths:
  /clients:
    get:
      tags:
        - Clients
      summary: List clients
      description: Retrieve a paginated list of clients with filtering
      operationId: clients.list
      security:
        - SessionAuth: []
      parameters:
        - name: search
          in: query
          description: Search term for client name, email, or TIN
          schema:
            type: string
        - name: type
          in: query
          description: Client type filter
          schema:
            type: string
            enum: [individual, company, partnership]
        - name: page
          in: query
          description: Page number (1-based)
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: pageSize
          in: query
          description: Items per page
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  clients:
                    type: array
                    items:
                      $ref: '#/components/schemas/Client'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'
        '429':
          $ref: '#/components/responses/RateLimited'

components:
  schemas:
    Client:
      type: object
      required:
        - id
        - name
        - type
        - createdAt
        - updatedAt
      properties:
        id:
          type: integer
          description: Unique client identifier
          example: 123
        name:
          type: string
          description: Client name
          example: "ABC Corporation"
        type:
          type: string
          enum: [individual, company, partnership]
          description: Client type
          example: "company"
        email:
          type: string
          format: email
          nullable: true
          description: Client email address
          example: "contact@abc.com"
        # ... other properties
```

---

## 💡 Usage Examples

### Authentication Flow

1. **Login to the platform**
2. **Navigate to `/docs/api`**
3. **Session automatically authenticated**
4. **Try endpoints directly in browser**

### Testing Workflow

1. **Explore available endpoints** by category
2. **Review input/output schemas** for each operation
3. **Use "Try it out"** to test with real data
4. **Copy generated cURL commands** for external testing
5. **Download Postman collection** for team sharing

### Development Integration

```bash
# Generate TypeScript types from OpenAPI
npx openapi-typescript http://localhost:3001/api/openapi.json -o ./types/api.ts

# Generate client SDK
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:3001/api/openapi.json \
  -g typescript-fetch \
  -o ./sdk/api
```

---

## 🔐 Authentication in Swagger UI

### Session-Based Auth

The Swagger UI automatically includes session cookies for authenticated users:

```typescript
// Automatic cookie inclusion in requests
requestInterceptor: (request) => {
  if (typeof document !== 'undefined') {
    request.headers.Cookie = document.cookie;
  }
  return request;
}
```

### Manual Authentication

For non-browser environments, include session token:

```bash
curl -X GET "http://localhost:3000/clients" \
  -H "Cookie: better-auth.session_token=your-session-token"
```

---

## 🛠 Maintenance

### Regenerating Documentation

```bash
# Update OpenAPI spec after router changes
bun run scripts/generate-openapi.ts

# Validate OpenAPI specification
npx swagger-codegen validate -i docs/api/openapi.json

# Generate updated types
npx openapi-typescript docs/api/openapi.json -o types/openapi.ts
```

### Custom Styling

```css
/* Custom Swagger UI theme */
.swagger-ui {
  font-family: 'Inter', sans-serif;
}

.swagger-ui .info .title {
  color: #1e40af;
}

.swagger-ui .scheme-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.swagger-ui .opblock.opblock-post {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.swagger-ui .opblock.opblock-get {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}
```

---

## 📚 Related Documentation

- [API Reference](./API_REFERENCE.md) - Complete endpoint documentation
- [Authentication Guide](./AUTHENTICATION.md) - Auth implementation details
- [Error Handling](./ERROR_HANDLING.md) - Error codes and handling
- [Rate Limiting](./RATE_LIMITING.md) - API usage limits
- [Testing Guide](./TESTING.md) - API testing strategies

---

**Documentation Version:** 1.0.0
**Last Updated:** 2025-11-18
**Interactive Docs URL:** [https://docs.gcmc-kaj.com/api](https://docs.gcmc-kaj.com/api)