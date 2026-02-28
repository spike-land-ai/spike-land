# Error Handling Best Practices in TypeScript/React Applications

A comprehensive guide to implementing robust error handling patterns in
TypeScript and React applications, from custom error classes to production
monitoring.

## Table of Contents

1. [Error Types & Custom Classes](#error-types--custom-classes)
2. [React Error Boundaries](#react-error-boundaries)
3. [API Error Handling](#api-error-handling)
4. [User Feedback & Notifications](#user-feedback--notifications)
5. [Logging & Error Tracking](#logging--error-tracking)
6. [Recovery & Resilience](#recovery--resilience)
7. [Best Practices Summary](#best-practices-summary)

---

## Error Types & Custom Classes

### Why Custom Error Classes?

Custom error classes provide type safety, context, and better debugging
information. Always throw Error instances instead of strings or numbers, which
don't produce proper stack traces.

### Base Error Class Pattern

Create a base error class that properly handles the prototype chain (required
for correct `instanceof` checks in ES5 transpilation):

```typescript
/**
 * Base application error class
 * All custom errors should extend this class
 */
class ApplicationError extends Error {
  constructor(
    message: string,
    public code: string = "UNKNOWN_ERROR",
    public statusCode: number = 500,
    public details?: Record<string, any>,
  ) {
    super(message);
    this.name = this.constructor.name;

    // Set prototype chain for proper instanceof checks
    Object.setPrototypeOf(this, ApplicationError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}
```

### Custom Error Hierarchy

Create specific error types for different scenarios:

```typescript
/**
 * Validation errors for invalid input data
 */
class ValidationError extends ApplicationError {
  constructor(
    message: string,
    public field?: string,
    details?: Record<string, any>,
  ) {
    super(message, "VALIDATION_ERROR", 400, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Authentication errors for auth-related issues
 */
class AuthenticationError extends ApplicationError {
  constructor(message: string = "Authentication required") {
    super(message, "AUTHENTICATION_ERROR", 401);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization errors for permission issues
 */
class AuthorizationError extends ApplicationError {
  constructor(message: string = "Access denied") {
    super(message, "AUTHORIZATION_ERROR", 403);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * API errors from external services
 */
class APIError extends ApplicationError {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint?: string,
    details?: Record<string, any>,
  ) {
    super(
      message,
      `API_ERROR_${statusCode}`,
      statusCode,
      { endpoint, ...details },
    );
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

/**
 * Network/timeout errors
 */
class NetworkError extends ApplicationError {
  constructor(
    message: string = "Network request failed",
    public isTimeout: boolean = false,
    details?: Record<string, any>,
  ) {
    super(
      message,
      isTimeout ? "NETWORK_TIMEOUT" : "NETWORK_ERROR",
      503,
      details,
    );
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Rate limit errors with retry information
 */
class RateLimitError extends ApplicationError {
  constructor(
    public retryAfter: number,
    details?: Record<string, any>,
  ) {
    super(
      `Rate limit exceeded. Retry after ${retryAfter}ms`,
      "RATE_LIMIT_ERROR",
      429,
      { retryAfter, ...details },
    );
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Business logic errors
 */
class BusinessLogicError extends ApplicationError {
  constructor(
    message: string,
    public code: string,
    details?: Record<string, any>,
  ) {
    super(message, code, 400, details);
    Object.setPrototypeOf(this, BusinessLogicError.prototype);
  }
}
```

### Using Type Guards with Custom Errors

Safely handle different error types using type guards:

```typescript
/**
 * Type guard for ValidationError
 */
function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Type guard for APIError
 */
function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}

/**
 * Type guard for NetworkError
 */
function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

/**
 * Type guard for standard Error
 */
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Convert unknown errors to ApplicationError
 */
function normalizeError(error: unknown): ApplicationError {
  if (error instanceof ApplicationError) {
    return error;
  }
  if (isError(error)) {
    return new ApplicationError(error.message, "UNKNOWN_ERROR", 500, {
      originalError: error.name,
      stack: error.stack,
    });
  }
  return new ApplicationError(
    String(error),
    "UNKNOWN_ERROR",
    500,
    { originalValue: error },
  );
}
```

---

## React Error Boundaries

### What Are Error Boundaries?

Error boundaries catch JavaScript errors anywhere in their child component tree
during rendering, in lifecycle methods, and in constructors. They prevent entire
app crashes and display fallback UI.

### Limitations

Error boundaries **do NOT** catch errors in:

- Event handlers (use try/catch instead)
- Asynchronous code (setTimeout, promises)
- SSR (server-side rendering)
- The error boundary itself

### Using react-error-boundary Package

The `react-error-boundary` library is the recommended approach (simpler than
class components):

```bash
npm install react-error-boundary
```

#### Basic Error Boundary

```typescript
import { ErrorBoundary, FallbackProps } from "react-error-boundary";

/**
 * Error fallback component
 */
function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Something went wrong
        </h1>
        <details className="mb-4 p-3 bg-red-50 rounded border border-red-200">
          <summary className="cursor-pointer font-semibold text-red-800">
            Error details
          </summary>
          <pre className="mt-2 text-sm text-red-700 overflow-auto">
            {error.message}
          </pre>
        </details>
        <button
          onClick={resetErrorBoundary}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

/**
 * Error logging function
 */
function logError(error: Error, info: { componentStack: string; }) {
  console.error("Error caught by boundary:", error);
  console.error("Component stack:", info.componentStack);
  // Send to error tracking service (e.g., errorLogger.logError)
}

/**
 * Usage in your app
 */
export function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={logError}>
      <YourAppContent />
    </ErrorBoundary>
  );
}
```

#### Granular Error Boundaries

Wrap individual features or routes to isolate errors:

```typescript
// Root level - catches app-wide errors
<ErrorBoundary FallbackComponent={RootErrorFallback} onError={logError}>
  <Header />

  {/* Route level - catches page errors */}
  <ErrorBoundary FallbackComponent={PageErrorFallback} onError={logError}>
    <Page />
  </ErrorBoundary>

  {/* Feature level - catches feature errors */}
  <ErrorBoundary FallbackComponent={FeatureErrorFallback} onError={logError}>
    <ComplexFeature />
  </ErrorBoundary>
</ErrorBoundary>;
```

#### Handling Async Errors with useErrorBoundary

For errors in event handlers or async operations, use the `useErrorBoundary`
hook:

```typescript
import { useErrorBoundary } from "react-error-boundary";

function MyComponent() {
  const { showBoundary } = useErrorBoundary();

  const handleClick = async () => {
    try {
      await riskyAsyncOperation();
    } catch (error) {
      // Pass error to nearest error boundary
      showBoundary(error);
    }
  };

  return <button onClick={handleClick}>Perform action</button>;
}
```

#### Error Boundary with Reset Logic

```typescript
function ErrorFallbackWithReset({
  error,
  resetErrorBoundary,
}: FallbackProps & { resetErrorBoundary: () => void; }) {
  return (
    <div className="error-container">
      <h2>Application Error</h2>
      <p>{error.message}</p>
      <button onClick={resetErrorBoundary}>Reset Application</button>
      <button onClick={() => window.location.href = "/"}>Go Home</button>
    </div>
  );
}

// Usage with custom reset
<ErrorBoundary
  FallbackComponent={ErrorFallbackWithReset}
  onError={logError}
  onReset={() => {
    // Clear user session, reset state, etc.
    sessionStorage.clear();
  }}
>
  <App />
</ErrorBoundary>;
```

#### Next.js App Router Error Boundary

For Next.js 13+, create an `error.tsx` file:

```typescript
// app/error.tsx
"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string; };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Try again
      </button>
    </div>
  );
}
```

---

## API Error Handling

### Understanding Different Error Scenarios

```typescript
/**
 * HTTP status code meanings and handling strategies
 */
enum HttpStatusCode {
  // Success
  OK = 200,
  CREATED = 201,

  // Client Errors
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,

  // Server Errors
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

/**
 * Error response structure
 */
interface ErrorResponse {
  message: string;
  code: string;
  details?: Record<string, any>;
  timestamp: string;
  path?: string;
}
```

### Fetch API Error Handling

```typescript
/**
 * Wrapper for fetch with error handling
 */
async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    // Handle non-2xx status codes
    if (!response.ok) {
      const errorData: ErrorResponse = await response.json().catch(() => ({
        message: response.statusText,
        code: `HTTP_${response.status}`,
        timestamp: new Date().toISOString(),
      }));

      throw new APIError(
        errorData.message || `HTTP ${response.status} error`,
        response.status,
        url,
        errorData,
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    if (error instanceof TypeError) {
      // Network error
      throw new NetworkError(
        "Failed to connect to server",
        false,
        { url, originalError: error.message },
      );
    }
    throw normalizeError(error);
  }
}

/**
 * Usage
 */
async function getUser(id: string) {
  try {
    return await fetchWithErrorHandling<User>(`/api/users/${id}`);
  } catch (error) {
    if (isAPIError(error)) {
      if (error.statusCode === 401) {
        // Handle unauthorized
        redirectToLogin();
      } else if (error.statusCode === 404) {
        // Handle not found
        showNotFound();
      }
    }
    throw error;
  }
}
```

### Axios with Retry Strategy

```typescript
import axios, { AxiosError, AxiosInstance } from "axios";
import axiosRetry from "axios-retry";

/**
 * Create axios instance with retry logic
 */
function createAxiosInstance(): AxiosInstance {
  const instance = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    timeout: 10000,
  });

  // Configure retry strategy
  axiosRetry(instance, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: error => {
      // Retry on network errors and 5xx status codes
      return (
        axiosRetry.isNetworkOrIdempotentRequestError(error)
        || (error.response?.status === 429) // Rate limit
      );
    },
    shouldResetTimeout: true,
  });

  // Response interceptor for error handling
  instance.interceptors.response.use(
    response => response,
    (error: AxiosError) => {
      const status = error.response?.status;
      const data = error.response?.data as ErrorResponse;

      if (status === 429) {
        // Rate limit - check Retry-After header
        const retryAfter = parseInt(
          (error.response?.headers["retry-after"] as string) || "60",
          10,
        ) * 1000;
        throw new RateLimitError(retryAfter, data);
      }

      throw new APIError(
        data?.message || error.message,
        status || 0,
        error.config?.url,
        data,
      );
    },
  );

  return instance;
}

const api = createAxiosInstance();

/**
 * Usage
 */
export async function fetchUserData(id: string) {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    if (error instanceof RateLimitError) {
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, error.retryAfter));
      return fetchUserData(id); // Retry
    }
    throw error;
  }
}
```

### Retry Logic with Exponential Backoff

```typescript
/**
 * Retry utility with exponential backoff
 */
interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  shouldRetry: (error: unknown) => boolean;
}

async function retryAsync<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffFactor = 2,
    shouldRetry = () => true,
  } = options;

  let lastError: unknown;
  let delay = initialDelayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Exponential backoff with jitter
      const jitter = Math.random() * 0.1 * delay;
      delay = Math.min(delay * backoffFactor + jitter, maxDelayMs);

      console.log(
        `Attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms...`,
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Usage
 */
async function robustFetch<T>(url: string): Promise<T> {
  return retryAsync(
    () => fetchWithErrorHandling<T>(url),
    {
      maxRetries: 4,
      initialDelayMs: 500,
      shouldRetry: error => {
        // Don't retry on client errors (4xx) except 429
        if (isAPIError(error)) {
          return error.statusCode === 429 || error.statusCode >= 500;
        }
        return isNetworkError(error);
      },
    },
  );
}
```

---

## User Feedback & Notifications

### Toast Notification System

```typescript
import { useCallback } from "react";

/**
 * Toast notification types
 */
type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

/**
 * Toast context and hook
 */
import { createContext, useContext } from "react";

const ToastContext = createContext<
  {
    addToast: (message: string, type: ToastType, duration?: number) => void;
  } | null
>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

/**
 * Using toast in error handling
 */
function handleApiError(error: unknown) {
  const toast = useToast();

  if (isValidationError(error)) {
    toast.addToast(
      `Validation error: ${error.message}`,
      "error",
      5000,
    );
  } else if (isAPIError(error)) {
    if (error.statusCode === 401) {
      toast.addToast(
        "Your session has expired. Please log in again.",
        "warning",
        5000,
      );
    } else if (error.statusCode === 429) {
      toast.addToast(
        "Too many requests. Please try again later.",
        "error",
        10000,
      );
    } else {
      toast.addToast(
        `Server error: ${error.message}`,
        "error",
        5000,
      );
    }
  } else if (isNetworkError(error)) {
    toast.addToast(
      "Network error. Please check your connection.",
      "warning",
      5000,
    );
  } else {
    toast.addToast(
      "An unexpected error occurred",
      "error",
      5000,
    );
  }
}
```

### Error Page Component

```typescript
/**
 * Generic error page component
 */
export function ErrorPage({
  statusCode = 500,
  title = "Something went wrong",
  message = "Please try again later",
  showDetails = false,
  error,
}: {
  statusCode?: number;
  title?: string;
  message?: string;
  showDetails?: boolean;
  error?: Error;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl font-bold text-gray-400 mb-4">
          {statusCode}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600 mb-6">{message}</p>

        {showDetails && error && (
          <details className="mb-6 p-4 bg-gray-100 rounded text-left">
            <summary className="cursor-pointer font-semibold">
              Error details
            </summary>
            <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}

        <div className="space-y-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Reload Page
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Logging & Error Tracking

### Error Logger (Spike Land Implementation)

This project uses a custom error logger (`src/lib/error-logger.ts`) combined
with Vercel Analytics for monitoring, rather than external error tracking
services.

```typescript
// src/lib/error-logger.ts
import { errorLogger } from "@/lib/error-logger";

/**
 * Log an error with context
 */
errorLogger.logError(error, {
  userId: session?.user?.id,
  route: "/api/images/enhance",
  componentStack: info?.componentStack,
});

/**
 * Error boundary usage
 */
function logError(error: Error, info: { componentStack: string; }) {
  errorLogger.logError(error, {
    componentStack: info.componentStack,
  });
}

/**
 * Usage in your app
 */
export function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={logError}>
      <YourAppContent />
    </ErrorBoundary>
  );
}
```

**Key Features:**

- Structured JSON logging
- Environment-aware (development vs production)
- Context-aware error capture with user and route info
- Request ID tracking for distributed tracing
- No external dependencies required

### Structured Logging

```typescript
/**
 * Log levels
 */
enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

/**
 * Structured logger
 */
class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, any>,
  ) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message,
      ...data,
    };

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(JSON.stringify(logEntry, null, 2));
    }

    // Send to logging service in production
    if (process.env.NODE_ENV === "production") {
      this.sendToLoggingService(logEntry);
    }
  }

  debug(message: string, data?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: Record<string, any>) {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: Record<string, any>) {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, error?: Error, data?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, {
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      },
      ...data,
    });
  }

  private sendToLoggingService(logEntry: Record<string, any>) {
    // Send to Datadog, Loggly, or similar service
    fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logEntry),
    }).catch(err => console.error("Failed to send log:", err));
  }
}

/**
 * Usage
 */
const logger = new Logger("UserService");

logger.info("User logged in", { userId: "123" });
logger.warn("API rate limit approaching", { remaining: 10 });
logger.error("Failed to fetch user data", error, { userId: "123" });
```

---

## Recovery & Resilience

### Graceful Degradation

```typescript
/**
 * Graceful degradation pattern
 */
interface GracefulDegradationOptions<T> {
  critical: () => Promise<T>; // Primary operation
  fallback?: () => Promise<T>; // Fallback operation
  onError?: (error: Error) => void; // Error callback
}

async function withGracefulDegradation<T>(
  options: GracefulDegradationOptions<T>,
): Promise<T | null> {
  try {
    return await options.critical();
  } catch (error) {
    options.onError?.(normalizeError(error) as Error);

    if (options.fallback) {
      try {
        console.warn("Primary operation failed, attempting fallback...");
        return await options.fallback();
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        return null;
      }
    }

    return null;
  }
}

/**
 * Usage: Fetch analytics from primary then fallback to local
 */
async function getAnalytics(userId: string) {
  return withGracefulDegradation({
    critical: () => fetchWithErrorHandling(`/api/analytics/${userId}`),
    fallback: () => Promise.resolve(getAnalyticsFromLocalStorage(userId)),
    onError: error => logger.warn("Failed to fetch analytics", { error: error.message }),
  });
}
```

### Circuit Breaker Pattern

```typescript
/**
 * Circuit breaker to prevent cascading failures
 */
type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private lastFailureTime: number | null = null;

  constructor(
    private failureThreshold: number = 5,
    private resetTimeoutMs: number = 60000,
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (
        this.lastFailureTime
        && Date.now() - this.lastFailureTime > this.resetTimeoutMs
      ) {
        this.state = "HALF_OPEN";
        console.log("Circuit breaker: Attempting recovery...");
      } else {
        throw new Error("Circuit breaker is OPEN");
      }
    }

    try {
      const result = await fn();

      if (this.state === "HALF_OPEN") {
        this.reset();
        console.log("Circuit breaker: Recovered");
      }

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.failureThreshold) {
        this.state = "OPEN";
        console.error("Circuit breaker: Opening due to repeated failures");
      }

      throw error;
    }
  }

  reset() {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  getState(): CircuitState {
    return this.state;
  }
}

/**
 * Usage
 */
const apiBreaker = new CircuitBreaker(5, 60000);

async function fetchUserWithBreaker(id: string) {
  return apiBreaker.execute(() => fetchWithErrorHandling(`/api/users/${id}`));
}
```

### Timeout Handling

```typescript
/**
 * Timeout promise utility
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = "Operation timed out",
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => {
        reject(new NetworkError(timeoutMessage, true));
      }, timeoutMs)
    ),
  ]);
}

/**
 * Usage
 */
async function fetchWithTimeout<T>(url: string): Promise<T> {
  try {
    return await withTimeout(
      fetchWithErrorHandling<T>(url),
      10000,
      "API request timed out",
    );
  } catch (error) {
    if (isNetworkError(error) && error.isTimeout) {
      logger.warn("Request timeout", { url });
    }
    throw error;
  }
}
```

---

## Best Practices Summary

### Do's ✅

1. **Always throw Error instances** - Never throw strings, numbers, or plain
   objects
   ```typescript
   throw new ValidationError("Invalid input", "email");
   ```

2. **Use custom error classes** - Create type-safe, context-rich errors
   ```typescript
   if (isValidationError(error)) {
     // Handle specifically
   }
   ```

3. **Implement error boundaries** - Wrap components to prevent app crashes
   ```typescript
   <ErrorBoundary FallbackComponent={Fallback}>
     <App />
   </ErrorBoundary>;
   ```

4. **Handle async errors** - Use try/catch in event handlers and async
   operations
   ```typescript
   const { showBoundary } = useErrorBoundary();
   showBoundary(error);
   ```

5. **Log errors with context** - Include relevant data for debugging
   ```typescript
   logger.error("User fetch failed", error, { userId: "123" });
   ```

6. **Provide user feedback** - Show helpful messages, not technical details
   ```typescript
   toast.addToast("Failed to save. Please try again.", "error");
   ```

7. **Implement retry logic** - Use exponential backoff for transient failures
   ```typescript
   return retryAsync(fn, { maxRetries: 3 });
   ```

8. **Use circuit breakers** - Prevent cascading failures
   ```typescript
   const breaker = new CircuitBreaker();
   ```

### Don'ts ❌

1. **Don't ignore errors** - Always handle or re-throw
   ```typescript
   // Bad
   try {
     await operation();
   } catch {}

   // Good
   try {
     await operation();
   } catch (e) {
     handle(e);
   }
   ```

2. **Don't throw strings or numbers** - No proper stack traces
   ```typescript
   // Bad
   throw "Something failed";

   // Good
   throw new Error("Something failed");
   ```

3. **Don't expose sensitive information** - Filter error messages
   ```typescript
   // Bad
   console.error(error.stack); // Stack visible to users

   // Good
   logger.error("Operation failed", error); // User sees safe message
   ```

4. **Don't use bare catch blocks** - Always specify error types
   ```typescript
   // Bad
   try { } catch { } // Can't see what error type this is

   // Good
   catch (error: unknown) { normalize(error); }
   ```

5. **Don't retry non-idempotent operations** - Only retry safe operations
   ```typescript
   // Bad - POST creates data, don't blindly retry

   // Good - Only retry on network errors, not 4xx
   if (isNetworkError(error)) retry();
   ```

6. **Don't forget about memory leaks** - Clean up error handlers
   ```typescript
   useEffect(() => {
     const handler = e => handleError(e);
     window.addEventListener("error", handler);
     return () => window.removeEventListener("error", handler);
   }, []);
   ```

### Configuration Checklist

- [ ] Custom error classes defined for your domain
- [ ] Error boundaries set up at appropriate levels
- [ ] API error handling with retry logic
- [ ] Error logging configured (e.g., errorLogger)
- [ ] Toast notifications for user feedback
- [ ] Circuit breaker for critical API calls
- [ ] Timeout handling for network requests
- [ ] User-friendly error pages
- [ ] Error tracking in analytics
- [ ] Documentation for error handling patterns

---

## Resources

### Documentation

- [React Error Boundaries](https://legacy.reactjs.org/docs/error-boundaries.html)
- [react-error-boundary Package](https://github.com/bvaughn/react-error-boundary)
- [Next.js Error Handling](https://nextjs.org/docs/app/getting-started/error-handling)
- [Vercel Analytics Documentation](https://vercel.com/docs/analytics)
- [axios-retry Documentation](https://www.npmjs.com/package/axios-retry)

### Related Best Practices

- See `docs/best-practices/` for other patterns
- See `docs/` for architecture and design documentation

---

## Examples Repository

Full working examples of these patterns can be found in:

- Error classes: `src/lib/errors/`
- React components: `src/components/error-boundary/`
- API utilities: `src/lib/api/`
- Logging: `src/lib/logger/`

---

**Last Updated**: December 2025 **Version**: 1.0
