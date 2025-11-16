# TypeScript Guidelines for GCMC Platform

## Table of Contents
1. [Overview](#overview)
2. [Strict Mode Configuration](#strict-mode-configuration)
3. [Type Safety Best Practices](#type-safety-best-practices)
4. [Common Type Patterns](#common-type-patterns)
5. [Type Guards](#type-guards)
6. [Third-Party Types](#third-party-types)
7. [When to Use `unknown` vs `any`](#when-to-use-unknown-vs-any)
8. [Prisma Type Patterns](#prisma-type-patterns)
9. [React Type Patterns](#react-type-patterns)
10. [Type Assertions](#type-assertions)

## Overview

The GCMC Platform enforces strict TypeScript type checking across all packages to ensure:
- Early error detection during development
- Better IDE autocomplete and refactoring support
- Self-documenting code through types
- Reduced runtime errors in production

**Zero Tolerance Policy**: Production code must have ZERO `any` types. Use `unknown` sparingly and only when absolutely necessary.

## Strict Mode Configuration

### Base Configuration

All packages extend from `/packages/config/tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### What These Flags Do

- **`strict`**: Enables all strict type-checking options
- **`noImplicitAny`**: Error on expressions with implied `any` type
- **`strictNullChecks`**: `null` and `undefined` are not assignable to other types
- **`noUncheckedIndexedAccess`**: Add `undefined` to index signatures (`array[0]` → `Type | undefined`)
- **`noImplicitReturns`**: Functions must explicitly return a value in all code paths
- **`noUnusedLocals`**: Error on unused local variables
- **`noUnusedParameters`**: Error on unused function parameters

## Type Safety Best Practices

### 1. Always Provide Explicit Types for Function Parameters

❌ **Bad:**
```typescript
function processUser(user) {
  return user.email;
}
```

✅ **Good:**
```typescript
function processUser(user: { id: string; email: string }) {
  return user.email;
}
```

✅ **Better:**
```typescript
import type { User } from '@prisma/client';

function processUser(user: User) {
  return user.email;
}
```

### 2. Use Type Inference Where Appropriate

TypeScript can infer return types, so you don't always need to specify them:

✅ **Good:**
```typescript
function getFullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`; // TypeScript infers string
}
```

But for exported functions, explicit return types are better for API documentation:

✅ **Better (for exported functions):**
```typescript
export function getFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}
```

### 3. Never Use `any` in Production Code

❌ **Never do this:**
```typescript
function handleData(data: any) {
  return data.property;
}
```

✅ **Use proper types:**
```typescript
interface DataShape {
  property: string;
}

function handleData(data: DataShape) {
  return data.property;
}
```

✅ **Or use `unknown` for truly unknown data:**
```typescript
function handleData(data: unknown) {
  if (isDataShape(data)) {
    return data.property;
  }
  throw new Error('Invalid data shape');
}

function isDataShape(value: unknown): value is DataShape {
  return (
    typeof value === 'object' &&
    value !== null &&
    'property' in value &&
    typeof value.property === 'string'
  );
}
```

## Common Type Patterns

### Event Handlers (React)

```typescript
// Button click
function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
  e.preventDefault();
}

// Form submit
function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
}

// Input change
function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
  setValue(e.target.value);
}

// Generic element
function handleFocus(e: React.FocusEvent<HTMLElement>) {
  console.log('focused');
}
```

### API Responses

```typescript
// Define response shape
interface ApiResponse<T> {
  data: T;
  total: number;
  page: number;
}

interface User {
  id: string;
  email: string;
  name: string;
}

// Use generic type
async function fetchUsers(): Promise<ApiResponse<User[]>> {
  const response = await fetch('/api/users');
  return response.json();
}
```

### Generic Utilities

```typescript
// Map object values
function mapValues<T, U>(
  obj: Record<string, T>,
  fn: (value: T, key: string) => U
): Record<string, U> {
  const result: Record<string, U> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = fn(value, key);
  }
  return result;
}

// Filter object by predicate
function filterObject<T>(
  obj: Record<string, T>,
  predicate: (value: T, key: string) => boolean
): Record<string, T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key, value]) => predicate(value, key))
  );
}
```

## Type Guards

Type guards help TypeScript narrow types at runtime:

### Basic Type Guards

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
```

### Object Shape Type Guards

```typescript
interface User {
  id: string;
  email: string;
  name: string;
}

function isUser(value: unknown): value is User {
  return (
    isObject(value) &&
    'id' in value && typeof value.id === 'string' &&
    'email' in value && typeof value.email === 'string' &&
    'name' in value && typeof value.name === 'string'
  );
}

// Usage
function processData(data: unknown) {
  if (isUser(data)) {
    // TypeScript knows data is User here
    console.log(data.email);
  }
}
```

### Array Type Guards

```typescript
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function isUserArray(value: unknown): value is User[] {
  return Array.isArray(value) && value.every(isUser);
}
```

## Third-Party Types

### Installing Type Definitions

```bash
# For libraries without built-in types
bun add -D @types/library-name
```

### Creating Declaration Files

If no types exist, create a `.d.ts` file:

```typescript
// types/my-library.d.ts
declare module 'my-library' {
  export function doSomething(arg: string): Promise<void>;

  export interface Config {
    apiKey: string;
    timeout?: number;
  }
}
```

## When to Use `unknown` vs `any`

### Use `unknown` when:
- Receiving data from external sources (API, user input, file parsing)
- You genuinely don't know the type yet
- You want to force type checking before use

```typescript
function parseJSON(jsonString: string): unknown {
  return JSON.parse(jsonString);
}

const data = parseJSON('{"name": "John"}');
// Must check type before use
if (isObject(data) && 'name' in data) {
  console.log(data.name);
}
```

### NEVER use `any`:
- It disables all type checking
- It can spread through your codebase
- It defeats the purpose of TypeScript

The ONLY acceptable use of `any` is in test files when mocking complex third-party types.

## Prisma Type Patterns

### Using Generated Prisma Types

```typescript
import type { User, Client, Document } from '@prisma/client';
import type { Prisma } from '@prisma/client';

// Direct Prisma model types
function processUser(user: User) {
  console.log(user.email);
}

// Prisma query includes
type UserWithProfile = Prisma.UserGetPayload<{
  include: { profile: true }
}>;

function displayUser(user: UserWithProfile) {
  console.log(user.profile.bio);
}

// Prisma query selects
type UserEmailOnly = Prisma.UserGetPayload<{
  select: { email: true }
}>;
```

### Typing Prisma Query Results

When Prisma's type inference fails (rare cases), provide explicit types:

```typescript
// Explicit type for map callback
const clients = await prisma.client.findMany({
  select: { id: true, name: true }
});

const ids = clients.map((client: { id: number; name: string }) => client.id);
```

## React Type Patterns

### Component Props

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({ label, onClick, variant = 'primary', disabled }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={variant}
    >
      {label}
    </button>
  );
}
```

### Children Props

```typescript
interface CardProps {
  title: string;
  children: React.ReactNode;
}

export function Card({ title, children }: CardProps) {
  return (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

### Hooks

```typescript
// useState with explicit type
const [user, setUser] = useState<User | null>(null);

// useRef for DOM elements
const inputRef = useRef<HTMLInputElement>(null);

// Custom hook
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  });

  const setValue = (value: T) => {
    setStoredValue(value);
    localStorage.setItem(key, JSON.stringify(value));
  };

  return [storedValue, setValue];
}
```

## Type Assertions

### When Type Assertions Are Acceptable

Use `as` type assertions sparingly and only when:
1. You have more information than TypeScript
2. The type is verified at runtime
3. You're dealing with third-party library type incompatibilities

```typescript
// Type compatibility for third-party libraries
import { Ratelimit } from '@upstash/ratelimit';
import Redis from 'ioredis';

const redis = new Redis(url);

// Redis types don't match exactly, but runtime behavior is correct
const limiter = new Ratelimit({
  redis: redis as Parameters<typeof Ratelimit>[0]['redis'],
  limiter: Ratelimit.slidingWindow(100, '60 s')
});
```

### When Type Assertions Are NOT Acceptable

❌ **Don't use to bypass type errors:**
```typescript
// BAD - hiding a real type error
const user = getUserFromAPI() as User;
```

✅ **Fix the actual type:**
```typescript
// GOOD - ensure proper typing
const user: User = await getUserFromAPI();
```

## Enforcement

### Pre-commit Checks
- `bun run check-types` must pass before committing
- No `any` types allowed in production code (apps/, packages/)
- Tests can use `unknown` sparingly if needed

### Code Review Guidelines
- All PRs must pass TypeScript type checking
- Type assertions (`as`) require justification in PR description
- New `unknown` types require type guards for usage

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Prisma Type Reference](https://www.prisma.io/docs/concepts/components/prisma-client/advanced-type-safety)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

## Questions?

If you're unsure about typing something:
1. Check existing patterns in the codebase
2. Consult this guide
3. Ask in PR review
4. Default to `unknown` + type guard rather than `any`
