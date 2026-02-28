# TypeScript Best Practices for Production Applications

A comprehensive guide to writing maintainable, type-safe, and performant
TypeScript code in production environments.

## Table of Contents

- [Type System](#type-system)
- [Code Organization](#code-organization)
- [Advanced Patterns](#advanced-patterns)
- [Error Handling](#error-handling)
- [Performance Optimization](#performance-optimization)
- [Testing](#testing)
- [Common Pitfalls](#common-pitfalls)

---

## Type System

### Strict Mode Configuration

Enabling strict mode is essential for production TypeScript projects. It enables
a comprehensive set of type checking behaviors that catch potential errors
early.

#### Enable Strict Mode

Set `"strict": true` in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

This automatically enables:

- **noImplicitAny** - Raises errors on expressions with inferred type `any`
- **noImplicitThis** - Raises errors on `this` expressions with inferred type
  `any`
- **strictNullChecks** - Treats `null` and `undefined` as distinct types
- **strictFunctionTypes** - Enables strict checking of function type parameters
- **strictBindCallApply** - Enables strict checking of `bind`, `call`, and
  `apply` methods
- **strictPropertyInitialization** - Requires non-undefined class properties to
  be initialized
- **alwaysStrict** - Parses code in strict mode and emits `"use strict"`

#### Additional Strict Options

Beyond the core `strict` flag, consider enabling these additional options:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true",
    "useUnknownInCatchVariables": true
  }
}
```

| Option                               | Purpose                                                        |
| ------------------------------------ | -------------------------------------------------------------- |
| `noUncheckedIndexedAccess`           | Adds `undefined` to indexed access types                       |
| `exactOptionalPropertyTypes`         | Distinguishes between `undefined` and optional properties      |
| `noPropertyAccessFromIndexSignature` | Prevents accessing index signature properties via dot notation |
| `noImplicitOverride`                 | Requires explicit `override` keyword in derived classes        |
| `noFallthroughCasesInSwitch`         | Disallows switch fallthrough without explicit `break`          |

### Type Inference Optimization

#### Let TypeScript Infer Simple Types

Trust TypeScript's inference for straightforward assignments:

```typescript
// Good: Let TypeScript infer
const name = "Alice";
const count = 42;
const isActive = true;

// Unnecessary: Explicit types for obvious values
const name: string = "Alice";
const count: number = 42;
const isActive: boolean = true;
```

#### Explicit Types for Complex Structures

Always annotate function parameters and return types:

```typescript
// Good: Clear contracts
interface User {
  id: string;
  email: string;
  role: "admin" | "user";
}

function getUserEmail(user: User): string {
  return user.email;
}

// Avoid: Inferred return type is unclear
function processData(data: unknown) {
  return data; // What's the return type?
}
```

#### Use `as const` for Literal Types

Prevent TypeScript from widening literal types:

```typescript
// Without as const - widened to string
const status = "active";
const status: string = "active";

// With as const - preserved as literal
const status = "active" as const;
const status: "active" = "active";

// Practical example
const ROUTES = {
  home: "/",
  about: "/about",
  contact: "/contact",
} as const;

type Route = typeof ROUTES[keyof typeof ROUTES]; // "/" | "/about" | "/contact"
```

### Generic Patterns

#### Constrained Generics

Use extends to constrain generic types:

```typescript
// Good: Constrained generic
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "Alice", age: 30 };
const name = getProperty(user, "name"); // ✓ Type: string
// getProperty(user, "email"); // ✗ Error: "email" not in keyof User

// Avoid: Unconstrained generic
function getProperty<T>(obj: T, key: string): any {
  return (obj as any)[key];
}
```

#### Generic Helper Functions

Use helper functions for type inference in object creation:

```typescript
// Without helper: Type inference fails
const config = {
  api: "https://api.example.com",
  timeout: 5000,
};
// config is inferred as { api: string; timeout: number }
// We lose the literal types

// With helper: Preserves literal types
function createConfig<T extends Record<string, string | number>>(config: T): T {
  return config;
}

const config = createConfig({
  api: "https://api.example.com",
  timeout: 5000,
});
// config is inferred as { api: "https://api.example.com"; timeout: 5000 }
```

#### Using `infer` for Type Extraction

The `infer` keyword enables sophisticated type operations:

```typescript
// Extract return type of a function
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function greet(name: string): string {
  return `Hello, ${name}!`;
}

type GreetReturn = ReturnType<typeof greet>; // string

// Extract array element type
type ArrayElement<T> = T extends Array<infer E> ? E : T;

type Numbers = ArrayElement<number[]>; // number
type Single = ArrayElement<string>; // string
```

#### Using Variance Annotations

Optimize type checking performance for complex generics:

```typescript
// Without variance - TypeScript must structurally compare
interface Producer<T> {
  produce(): T;
}

// With variance annotation - TypeScript can use simple comparison
interface Producer<out T> {
  produce(): T;
}

// This helps with performance: Producer<Cat> is assignable to Producer<Animal>
// rather than doing full structural comparison
```

---

## Code Organization

### Type File Structure

Organize types into focused, single-responsibility files:

```
src/
├── types/
│   ├── user.ts          # User-related types
│   ├── api.ts           # API request/response types
│   ├── errors.ts        # Application error types
│   └── index.ts         # Barrel export
├── models/
│   ├── user.ts
│   └── product.ts
└── services/
    ├── userService.ts
    └── productService.ts
```

**types/user.ts:**

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user" | "guest";
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = User["role"];

export interface CreateUserInput {
  email: string;
  name: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
}
```

### Barrel Exports

Create index files to expose a clean public API:

**types/index.ts:**

```typescript
export * from "./api";
export * from "./errors";
export * from "./user";
```

**Usage:**

```typescript
// Good: Clean import from barrel
import { CreateUserInput, User, UserRole } from "@/types";

// Avoid: Deep imports bypass organization
import { User } from "@/types/user";
```

**Benefits:**

- Simplifies imports across the codebase
- Provides a single source of truth for module exports
- Makes refactoring easier (can reorganize files without breaking imports)
- Creates clear boundaries between public and private APIs

### Module Augmentation

Extend third-party types when needed:

```typescript
// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: User;
      context?: RequestContext;
    }
  }
}

export interface RequestContext {
  traceId: string;
  userId?: string;
  timestamp: Date;
}
```

### Namespaces (Use with Caution)

**Avoid namespaces in modern TypeScript.** They add unnecessary nesting when
using ES modules:

```typescript
// ✗ Avoid: Unnecessary nesting
namespace UserNamespace {
  export interface User {
    id: string;
  }
  export function getUser(id: string): User {
    // ...
  }
}

// Usage is verbose
const user: UserNamespace.User = UserNamespace.getUser("123");

// ✓ Good: Modern ES modules
import { getUser, User } from "./user";

const user: User = getUser("123");
```

**When namespaces might be appropriate:**

- Global scope organization in non-module contexts (legacy code)
- Hierarchical type grouping for discovery (resembling class-based languages)
- Avoiding naming conflicts in global scope

---

## Advanced Patterns

### Discriminated Unions (Tagged Unions)

Use a common property (discriminant) to distinguish union members:

```typescript
// Define separate types with a common discriminant property
type Success<T> = {
  kind: "success";
  data: T;
  timestamp: Date;
};

type Failure = {
  kind: "failure";
  error: Error;
  code: string;
};

type Result<T> = Success<T> | Failure;

// Type guard is automatic with discriminant
function handleResult<T>(result: Result<T>): void {
  switch (result.kind) {
    case "success":
      console.log("Data:", result.data); // ✓ data is available
      console.log("Timestamp:", result.timestamp);
      break;
    case "failure":
      console.log("Error:", result.error); // ✓ error is available
      console.log("Code:", result.code);
      break;
  }
}
```

**Real-World Example - API Response:**

```typescript
type ApiResponse<T> =
  | {
    status: "success";
    data: T;
    statusCode: 200 | 201;
  }
  | {
    status: "error";
    error: string;
    statusCode: 400 | 401 | 403 | 404 | 500;
  }
  | {
    status: "loading";
    progress: number;
  };

async function fetchUser(id: string): Promise<ApiResponse<User>> {
  return { status: "loading", progress: 0 };
}

// TypeScript automatically narrows types
function processResponse(response: ApiResponse<User>): void {
  if (response.status === "success") {
    const user = response.data; // ✓ data is available
    const code = response.statusCode; // ✓ 200 | 201
  } else if (response.status === "error") {
    const error = response.error; // ✓ error is available
    const code = response.statusCode; // ✓ 400 | 401 | 403 | 404 | 500
  }
}
```

### Type Guards

Custom type guards narrow types in conditional blocks:

#### `typeof` Guard

```typescript
function processValue(value: string | number): void {
  if (typeof value === "string") {
    console.log(value.toUpperCase()); // ✓ value is string
  } else {
    console.log(value.toFixed(2)); // ✓ value is number
  }
}
```

#### `instanceof` Guard

```typescript
class Dog {
  bark() {
    return "Woof!";
  }
}

class Cat {
  meow() {
    return "Meow!";
  }
}

function makeSound(animal: Dog | Cat): string {
  if (animal instanceof Dog) {
    return animal.bark(); // ✓ animal is Dog
  } else {
    return animal.meow(); // ✓ animal is Cat
  }
}
```

#### Custom Type Predicate

```typescript
interface Fish {
  swim(): void;
}

interface Bird {
  fly(): void;
}

// Custom type predicate function
function isFish(pet: Fish | Bird): pet is Fish {
  return typeof (pet as Fish).swim === "function";
}

function animalAction(pet: Fish | Bird): void {
  if (isFish(pet)) {
    pet.swim(); // ✓ pet is Fish
  } else {
    pet.fly(); // ✓ pet is Bird
  }
}
```

#### `in` Operator

```typescript
type Human = {
  name: string;
  speak(): void;
};

type Dog = {
  breed: string;
  bark(): void;
};

function interact(being: Human | Dog): void {
  if ("speak" in being) {
    being.speak(); // ✓ being is Human
  } else {
    being.bark(); // ✓ being is Dog
  }
}
```

### Template Literal Types

Create dynamic string types with constraints:

```typescript
// CSS class names
type Size = "sm" | "md" | "lg";
type Color = "red" | "blue" | "green";

type ClassName = `btn-${Size}` | `text-${Color}`;

const class1: ClassName = "btn-sm"; // ✓ Valid
const class2: ClassName = "text-red"; // ✓ Valid
// const class3: ClassName = "btn-invalid"; // ✗ Error

// API endpoint paths
type Method = "GET" | "POST" | "PUT" | "DELETE";
type Entity = "users" | "products" | "orders";

type ApiEndpoint = `/${Method}:${Entity}`;

// Extract parts from a formatted string
type ParsePath<T> = T extends `/${infer M}:${infer E}` ? { method: M; entity: E; }
  : never;

type UserPath = ParsePath<"/POST:users">; // { method: "POST"; entity: "users" }
```

### Conditional Types

Create types that depend on conditions:

```typescript
// Basic conditional type
type IsString<T> = T extends string ? true : false;

type A = IsString<"hello">; // true
type B = IsString<number>; // false

// More practical example - Promise unwrapping
type Awaited<T> = T extends Promise<infer U> ? U : T;

type StringPromise = Awaited<Promise<string>>; // string
type PlainNumber = Awaited<number>; // number

// Mapping over unions
type Flatten<T> = T extends Array<infer U> ? U : T;

type Str = Flatten<string[]>; // string
type Num = Flatten<number>; // number

// Complex conditional - return type based on input
type ProcessResult<T> = T extends { error: true; } ? null : T;

function process<T extends { error?: boolean; }>(input: T): ProcessResult<T> {
  if (input.error) {
    return null as ProcessResult<T>;
  }
  return input as ProcessResult<T>;
}
```

### Exhaustive Checking with `never`

Ensure all union variants are handled:

```typescript
type Shape =
  | { kind: "circle"; radius: number; }
  | { kind: "square"; side: number; }
  | { kind: "triangle"; base: number; height: number; };

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.side ** 2;
    case "triangle":
      return (shape.base * shape.height) / 2;
    default:
      const _exhaustive: never = shape;
      return _exhaustive;
  }
}

// If a new Shape variant is added, the switch statement becomes invalid
// and TypeScript will error at the `default` case because the type is no longer `never`
```

---

## Error Handling

### Result Type Pattern

Use a `Result` type instead of throwing exceptions for expected errors:

```typescript
type Result<T, E> =
  | { kind: "ok"; value: T; }
  | { kind: "error"; error: E; };

// More concise syntax
type Result<T, E> = { ok: true; value: T; } | { ok: false; error: E; };

interface ValidationError {
  field: string;
  message: string;
}

function validateEmail(email: string): Result<string, ValidationError> {
  if (!email.includes("@")) {
    return {
      ok: false,
      error: { field: "email", message: "Invalid email format" },
    };
  }
  return { ok: true, value: email };
}

// Usage
const result = validateEmail("user@example.com");

if (result.ok) {
  console.log("Valid email:", result.value);
} else {
  console.log("Validation error:", result.error);
}
```

### Either Type (Functional Approach)

Use the Either monad for functional error handling:

```typescript
type Either<L, R> = { kind: "left"; value: L; } | { kind: "right"; value: R; };

const Either = {
  right: <R>(value: R): Either<never, R> => ({
    kind: "right",
    value,
  }),
  left: <L>(value: L): Either<L, never> => ({
    kind: "left",
    value,
  }),
  map: <L, R1, R2>(
    fn: (value: R1) => R2,
    either: Either<L, R1>,
  ): Either<L, R2> => {
    return either.kind === "right" ? Either.right(fn(either.value)) : either;
  },
  flatMap: <L, R1, R2>(
    fn: (value: R1) => Either<L, R2>,
    either: Either<L, R1>,
  ): Either<L, R2> => {
    return either.kind === "right" ? fn(either.value) : either;
  },
  match: <L, R, T>(
    onLeft: (value: L) => T,
    onRight: (value: R) => T,
    either: Either<L, R>,
  ): T => {
    return either.kind === "left"
      ? onLeft(either.value)
      : onRight(either.value);
  },
};

// Example usage
interface ParseError {
  message: string;
}

function parseJSON(text: string): Either<ParseError, unknown> {
  try {
    return Either.right(JSON.parse(text));
  } catch (e) {
    return Either.left({
      message: e instanceof Error ? e.message : "Unknown error",
    });
  }
}

const data = parseJSON("{\"name\":\"Alice\"}");
const result = Either.match(
  error => `Parse failed: ${error.message}`,
  value => `Parsed: ${JSON.stringify(value)}`,
  data,
);
```

### Exception Handling Patterns

Use typed errors for exception handling:

```typescript
// Define error types
interface AppError {
  code: string;
  message: string;
}

class ValidationError extends Error implements AppError {
  code = "VALIDATION_ERROR";
  constructor(message: string, public field: string) {
    super(message);
  }
}

class NotFoundError extends Error implements AppError {
  code = "NOT_FOUND";
  constructor(message: string, public resource: string) {
    super(message);
  }
}

type KnownError = ValidationError | NotFoundError;

// Using unknown in catch blocks (requires useUnknownInCatchVariables)
function handleError(err: unknown): void {
  if (err instanceof ValidationError) {
    console.log(`Validation error on ${err.field}: ${err.message}`);
  } else if (err instanceof NotFoundError) {
    console.log(`${err.resource} not found: ${err.message}`);
  } else if (err instanceof Error) {
    console.log(`Unknown error: ${err.message}`);
  } else {
    console.log(`Unknown error type:`, err);
  }
}
```

---

## Performance Optimization

### Compilation Performance

#### tsconfig.json Optimization

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,

    // Performance optimizations
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo",
    "skipLibCheck": true,
    "skipDefaultLibCheck": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true,

    // Module resolution
    "moduleResolution": "node",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"]
    },

    // Exclude node_modules from type checking
    "types": []
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Key Performance Options:**

| Option                | Benefit                                         |
| --------------------- | ----------------------------------------------- |
| `incremental`         | Caches compilation info for faster rebuilds     |
| `skipLibCheck`        | Skips type checking of declaration files        |
| `isolatedModules`     | Allows each file to be transpiled independently |
| `skipDefaultLibCheck` | Skips type checking of default library files    |

#### Type Optimization Strategies

**Avoid Large Unions:**

```typescript
// ✗ Problematic: Large union has quadratic comparison overhead
type Element =
  | DivElement | ImgElement | SpanElement | ButtonElement
  | InputElement | FormElement | ... (100+ more types);

// ✓ Better: Use inheritance hierarchy
interface HTMLElement {
  tagName: string;
  attributes: Record<string, string>;
}

type DivElement = HTMLElement & { specific: "div" };
type ImgElement = HTMLElement & { specific: "img" };
```

**Extract Complex Type Helpers:**

```typescript
// ✗ Inline conditional types
type MapResult<T, U> = T extends { data: infer D; }
  ? U extends { transform: infer F extends (x: any) => any; } ? ReturnType<F>
  : never
  : never;

// ✓ Extract to named types for caching
type ExtractData<T> = T extends { data: infer D; } ? D : never;
type ExtractTransform<U> = U extends { transform: infer F extends (x: any) => any; } ? ReturnType<F>
  : never;

type MapResult<T, U> = ExtractTransform<U> extends never ? never
  : ExtractTransform<U>;
```

**Prefer Interfaces over Intersections:**

```typescript
// ✗ Slower: Recursive merging
type Combined = TypeA & TypeB & TypeC & TypeD;

// ✓ Faster: Single flat object type
interface Combined extends TypeA, TypeB, TypeC, TypeD {}
```

#### Diagnostic Tools

**Profile compilation time:**

```bash
# Extended diagnostics shows where compiler spends time
tsc --extendedDiagnostics

# Generate trace for analysis
tsc --generateTrace ./trace

# View with Chrome DevTools: chrome://tracing
```

**Analyze included files:**

```bash
# List all included files
tsc --listFilesOnly

# Explain why files are included
tsc --explainFiles

# Debug module resolution
tsc --traceResolution
```

### Code Splitting and Lazy Loading

Use dynamic imports to reduce bundle sizes:

```typescript
// Static import - loaded immediately
import { expensiveModule } from "./expensive";

// Dynamic import - loaded on demand
async function loadExpensive() {
  const { expensiveModule } = await import("./expensive");
  return expensiveModule.process();
}

// In React
const LazyComponent = lazy(() => import("./HeavyComponent"));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
```

---

## Testing

### Type Testing with tsd

Use `tsd` to test type definitions:

**Installation:**

```bash
npm install --save-dev tsd
```

**Create test file (utils.test-d.ts):**

```typescript
import { expectAssignable, expectError, expectType } from "tsd";
import { getUserById, parseJSON } from "./utils";

// Test that function returns correct type
expectType<{ name: string; }>(parseJSON("{\"name\":\"Alice\"}"));

// Test that expression causes a type error
expectError(parseJSON(123)); // ✓ Error: number is not assignable to string

// Test assignability (looser than expectType)
const user: { id: string; name: string; } = getUserById("123");
expectAssignable<{ id: string; }>(user); // ✓ Valid: user has id property
```

**Configuration (package.json):**

```json
{
  "tsd": {
    "directory": "src",
    "compilerOptions": {
      "strict": true
    }
  }
}
```

### Testing Type Safety

**With Vitest:**

```typescript
import { expectTypeOf } from "vitest";

describe("Type checks", () => {
  it("should infer correct return type", () => {
    const result = parseJSON("{\"name\":\"Alice\"}");
    expectTypeOf(result).toMatchTypeOf<Record<string, any>>();
  });

  it("should not allow wrong types", () => {
    // @ts-expect-error - number is not assignable to string
    parseJSON(123);
  });
});
```

**With @ts-expect-error:**

```typescript
function requireString(value: string): void {}

// This test passes - error is expected
// @ts-expect-error
requireString(123);

// This test fails if no error occurs
// @ts-expect-error
requireString("valid string"); // ✗ Error comment is unused
```

### Mocking Typed Modules

Maintain type safety when mocking:

```typescript
// userService.ts
export async function getUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

// userService.test.ts
import { vi } from "vitest";
import * as userService from "./userService";
import { getUser } from "./userService";

describe("User service", () => {
  it("should fetch user", async () => {
    const mockUser: User = { id: "1", name: "Alice" };
    vi.spyOn(userService, "getUser").mockResolvedValue(mockUser);

    const user = await getUser("1");
    expect(user).toEqual(mockUser);
  });
});
```

---

## Common Pitfalls

### 1. Using `any` Type

**Problem:**

```typescript
// ✗ Loses all type information
function process(data: any): any {
  return data.transform();
}

const result = process({ foo: "bar" });
result.unknown(); // No error, but crashes at runtime
```

**Solution:**

```typescript
// ✓ Use `unknown` and narrow types
function process(data: unknown): unknown {
  if (typeof data === "object" && data !== null && "transform" in data) {
    return (data as { transform(): unknown; }).transform();
  }
  throw new Error("Invalid data");
}
```

### 2. Implicit `any` from Object Indexing

**Problem:**

```typescript
const config: Record<string, string> = { timeout: "5000" };
const value = config["timeout"]; // type: string | undefined
// TypeScript doesn't know what keys are available
```

**Solution:**

```typescript
const config = { timeout: "5000", retries: "3" } as const;
const value = config["timeout"]; // type: "5000"

// Or with noUncheckedIndexedAccess
const config2: Record<string, string> = { timeout: "5000" };
const value2 = config2["timeout"]; // type: string | undefined
```

### 3. Non-Null Assertion Abuse

**Problem:**

```typescript
// ✗ Bypasses type safety
const value = getValue()!;
const arr = getArray()!;
const elem = arr[0]!; // Multiple assertions hide issues
```

**Solution:**

```typescript
// ✓ Handle nullability explicitly
function getValue(): string | null {
  return null;
}

const value = getValue();
if (value !== null) {
  console.log(value.toUpperCase());
} else {
  console.log("No value");
}

// Or use optional chaining
const upper = value?.toUpperCase();
```

### 4. Overly Complex Generic Types

**Problem:**

```typescript
// ✗ Difficult to understand and maintain
type Complex<T, U, V> = T extends { a: infer A; }
  ? U extends { b: infer B; } ? V extends Array<infer E> ? { result: A | B | E; }
    : never
  : never
  : never;
```

**Solution:**

```typescript
// ✓ Break into smaller, named types
type ExtractA<T> = T extends { a: infer A; } ? A : never;
type ExtractB<U> = U extends { b: infer B; } ? B : never;
type ExtractElement<V> = V extends Array<infer E> ? E : never;

type Complex<T, U, V> =
  | ExtractA<T>
  | ExtractB<U>
  | ExtractElement<V>;
```

### 5. Forgotten Type Exports

**Problem:**

```typescript
// ✗ Type is not exported
interface User {
  id: string;
  name: string;
}

export function getUser(): User {}

// Consumers can't import the type
// import type { User } from "./user"; // Error!
```

**Solution:**

```typescript
// ✓ Always export types
export interface User {
  id: string;
  name: string;
}

export function getUser(): User {}

// Now consumers can import
import type { User } from "./user"; // ✓ Works
```

### 6. Mutating Readonly Types

**Problem:**

```typescript
interface Config {
  readonly timeout: number;
  readonly retries: number;
}

const config: Config = { timeout: 5000, retries: 3 };
config.timeout = 10000; // Type error, but might be ignored
```

**Solution:**

```typescript
// Use const assertion for immutability
const config = { timeout: 5000, retries: 3 } as const;
// config.timeout = 10000; // ✗ Error: cannot assign to readonly

// Or use Object.freeze
const config2 = Object.freeze({ timeout: 5000, retries: 3 });
```

### 7. Circular Dependencies

**Problem:**

```typescript
// moduleA.ts
import { TypeB } from "./moduleB";

export interface TypeA {
  b: TypeB;
}

// moduleB.ts
import { TypeA } from "./moduleA";

export interface TypeB {
  a: TypeA;
}
```

**Solution:**

```typescript
// Use type-only imports
// moduleA.ts
import type { TypeB } from "./moduleB";

export interface TypeA {
  b: TypeB;
}

// moduleB.ts
import type { TypeA } from "./moduleA";

export interface TypeB {
  a: TypeA;
}
```

---

## TypeScript 2025 & Future Directions

### ESM-First Development

TypeScript 2025 fully embraces ECMAScript Modules (ESM):

```typescript
// All modern TypeScript code uses ESM
import { Component } from "react";
import { getData } from "./utils";

export const MyComponent = () => {
  // ...
};
```

### Template Type Inference

Extract and infer parts from template literals:

```typescript
type ParseRoute<T extends string> = T extends `/${infer Path}/:${infer Id}`
  ? { path: Path; id: Id; }
  : never;

type UserRoute = ParseRoute<"/users/:userId">;
// { path: "users"; id: "userId" }
```

### AI-Assisted Development

TypeScript's type system integrates with AI tools for:

- Automatic type inference from JSDoc comments
- Contextual type suggestions
- Automatic error fixes

**Tip:** Use stricter defaults and let tools help with the details.

---

## References & Resources

### Official Documentation

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [TSConfig Reference](https://www.typescriptlang.org/tsconfig/)
- [TypeScript Performance Wiki](https://github.com/microsoft/TypeScript/wiki/Performance)

### Best Practices Guides

- [TypeScript Best Practices 2025 - DEV Community](https://dev.to/sovannaro/typescript-best-practices-2025-elevate-your-code-quality-1gh3)
- [Effective TypeScript - Dan Vanderkam](https://effectivetypescript.com/)
- [Total TypeScript - Matt Pocock](https://www.totaltypescript.com/)

### Advanced Topics

- [Learn TypeScript - Learning TypeScript](https://learntypescript.dev/)
- [Discriminated Unions - TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [Generics - TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/2/generics.html)

### Type Testing Tools

- [tsd - Check TypeScript Type Definitions](https://github.com/tsdjs/tsd)
- [dtslint - Microsoft's Declaration File Linter](https://github.com/microsoft/DefinitelyTyped-tools/tree/master/packages/dtslint)
- [Vitest Type Testing](https://vitest.dev/guide/testing-types.html)

### Functional Programming

- [fp-ts - Functional Programming in TypeScript](https://gcanti.github.io/fp-ts/)
- [Using the JavaScript Either Monad - LogRocket Blog](https://blog.logrocket.com/javascript-either-monad-error-handling/)
- [Monads in TypeScript - Medium](https://medium.com/flock-community/monads-simplified-with-generators-in-typescript-part-1-33486bf9d887)

### Performance & Optimization

- [TypeScript Performance - Marius Bajorunas](https://www.bajorunas.tech/blog/typescript-compiler-performance)
- [Optimizing TypeScript - Wallaby.js Blog](https://wallabyjs.com/blog/optimizing-typescript.html)
- [Type Optimization in Large-Scale Projects - Medium](https://medium.com/@an.chmelev/typescript-performance-and-type-optimization-in-large-scale-projects-18e62bd37cfb)

---

**Last Updated:** 2025-12-06

This guide reflects TypeScript 5.x+ best practices and the direction of
TypeScript 2025, emphasizing strict types, modern ESM, and practical patterns
for production applications.
