# Logging and Monitoring Best Practices for Node.js/Next.js

A comprehensive guide to implementing production-ready logging, monitoring, and
observability in Node.js and Next.js applications. This document covers
structured logging, monitoring tools, metrics collection, alerting strategies,
and production best practices.

## Table of Contents

1. [Structured Logging](#structured-logging)
2. [Logging Libraries](#logging-libraries)
3. [Monitoring Tools](#monitoring-tools)
4. [Metrics and Performance](#metrics-and-performance)
5. [Context Propagation and Distributed Tracing](#context-propagation-and-distributed-tracing)
6. [Alerting Strategy](#alerting-strategy)
7. [Production Best Practices](#production-best-practices)
8. [Cost Management](#cost-management)

---

## Structured Logging

### Overview

Structured logging is the foundation of modern observability. Unlike traditional
text-based logging that produces unstructured output, structured logging uses
consistent, machine-readable formats (typically JSON) that can be automatically
parsed, aggregated, and analyzed.

### Benefits of Structured Logging

- **Machine Readability**: Logs can be automatically parsed and indexed by log
  aggregation systems
- **Searchability**: Easy to filter, search, and correlate logs across systems
- **Contextual Information**: Capture metadata and context alongside log
  messages
- **Performance**: JSON-formatted logs can be processed efficiently
- **Integration**: Seamless integration with observability platforms and log
  aggregation services

### Log Levels and When to Use Them

| Level     | Severity | Use Cases                               | Example                                           |
| --------- | -------- | --------------------------------------- | ------------------------------------------------- |
| **ERROR** | Critical | Errors that require immediate attention | Database connection failure, unhandled exception  |
| **WARN**  | High     | Potentially harmful situations          | Deprecated API usage, high memory usage           |
| **INFO**  | Medium   | Important business events               | User login, API request, database query completed |
| **DEBUG** | Low      | Detailed diagnostic information         | Variable values, function parameters              |
| **TRACE** | Very Low | Very detailed debugging info            | Entry/exit of functions, detailed state changes   |

### Best Practices for Structured Logging

1. **Use Consistent Field Names**: Define a standard set of fields across your
   application
   ```typescript
   // Consistent logging structure
   {
     timestamp: "2025-12-06T10:30:45.123Z",
     level: "info",
     message: "User authentication successful",
     userId: "user-123",
     service: "auth-service",
     duration: 145,
     ip: "192.168.1.1"
   }
   ```

2. **Include Context**: Add contextual metadata to help with troubleshooting
   ```typescript
   logger.info("Order processed", {
     orderId: "order-456",
     userId: "user-123",
     amount: 99.99,
     status: "completed",
     processingTime: 234,
   });
   ```

3. **Log at Appropriate Levels**: Avoid log spam by using correct severity
   levels
   - Use ERROR for unexpected failures
   - Use WARN for degraded conditions
   - Use INFO for business-relevant events
   - Use DEBUG for development/troubleshooting

4. **Never Log Sensitive Data**: Exclude passwords, API keys, PII, and tokens
   ```typescript
   // Bad: logs sensitive information
   logger.info("User login", { email, password });

   // Good: redacts sensitive fields
   logger.info("User login", { email, status: "authenticated" });
   ```

5. **Add Timestamps**: Always include ISO 8601 formatted timestamps
   ```typescript
   // JSON logging automatically includes timestamps
   {
     timestamp: "2025-12-06T10:30:45.123Z",
     message: "Application started"
   }
   ```

---

## Logging Libraries

### Comparison Table

| Feature            | Pino                  | Winston           | Bunyan       |
| ------------------ | --------------------- | ----------------- | ------------ |
| **Performance**    | 5-10x faster          | Moderate          | Moderate     |
| **JSON Output**    | Native                | Optional          | Native       |
| **Async Logging**  | Yes (default)         | Optional          | No (sync)    |
| **Transports**     | Plugins               | Built-in (10+)    | Minimal      |
| **Customization**  | Moderate              | High              | Low          |
| **Community**      | Growing               | Very Large        | Moderate     |
| **Learning Curve** | Low                   | Moderate          | Low          |
| **Best For**       | High-performance APIs | Flexible projects | JSON logging |

### Pino (Recommended for Performance)

Pino is the fastest logging library for Node.js, designed for high throughput
and minimal overhead. It achieves this through asynchronous, non-blocking I/O.

**Installation:**

```bash
npm install pino
```

**Basic Usage:**

```typescript
import pino from "pino";

// Create a logger instance
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty", // Pretty-print logs in development
    options: {
      colorize: true,
      singleLine: true,
      translateTime: "SYS:standard",
    },
  },
});

// Log at different levels
logger.info({ userId: "user-123" }, "User authenticated");
logger.error({ error: err }, "Authentication failed");
logger.warn({ memory: process.memoryUsage() }, "High memory usage");

// Child loggers for context
const requestLogger = logger.child({ requestId: "req-456" });
requestLogger.info("Processing request");
```

**Production Configuration:**

```typescript
// src/lib/logger.ts
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV === "production"
    ? undefined // Send JSON to stdout for log aggregation
    : {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        singleLine: false,
      },
    },
});

// Redact sensitive fields
const childLogger = logger.child({
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
});

export default logger;
```

**Key Features:**

- Native JSON output
- Asynchronous I/O with minimal CPU overhead
- Child loggers with automatic context propagation
- Built-in redaction for sensitive data
- Extensible transport system

### Winston (Recommended for Flexibility)

Winston is the most popular and flexible logging library, supporting multiple
transports and extensive customization.

**Installation:**

```bash
npm install winston
```

**Basic Usage:**

```typescript
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

logger.info("Application started", { service: "auth" });
logger.error("Database connection failed", { service: "db", error: err });
```

**Custom Format:**

```typescript
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta,
    });
  }),
);

const logger = winston.createLogger({
  format: customFormat,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "app.log" }),
  ],
});
```

**Key Features:**

- Supports 10+ built-in transports (console, file, HTTP, etc.)
- Highly customizable formatting
- Multiple transport destinations simultaneously
- Excellent for complex logging scenarios
- Large community and ecosystem

### Bunyan (JSON-First Approach)

Bunyan is focused on structured JSON logging with built-in serializers for
common objects.

**Installation:**

```bash
npm install bunyan
```

**Basic Usage:**

```typescript
import bunyan from "bunyan";

const logger = bunyan.createLogger({
  name: "myapp",
  level: "info",
  serializers: {
    err: bunyan.stdSerializers.err,
    req: bunyan.stdSerializers.req,
  },
});

logger.info({ userId: "user-123" }, "User logged in");
logger.error({ err }, "Request failed");
logger.warn({ memory: process.memoryUsage() }, "High memory");
```

**Key Features:**

- JSON-first design
- Built-in error and request serializers
- Child loggers for context
- CLI tools for log analysis
- Simple, focused API

---

## Monitoring Tools

### Next.js and Node.js Monitoring Stack

#### Vercel Analytics (Built-in for Vercel deployments)

**Best for:** Next.js applications deployed on Vercel

**Features:**

- Real User Monitoring (RUM)
- Web Vitals tracking
- Performance analytics
- Deployment insights
- Zero configuration required

**Configuration:**

```typescript
// next.config.js
module.exports = {
  reactStrictMode: true,
  analytics: {
    enabled: true, // Enable Vercel Analytics
  },
};
```

#### DataDog Integration

**Best for:** Comprehensive APM and infrastructure monitoring

**Setup for Next.js (App Router):**

1. Install DataDog SDK:
   ```bash
   npm install @datadog/browser-rum
   ```

2. Create a client-side initialization component:
   ```typescript
   // app/components/DatadogInit.tsx
   "use client";

   import { datadogRum } from "@datadog/browser-rum";
   import { useEffect } from "react";

   export function DatadogInit() {
     useEffect(() => {
       datadogRum.init({
         applicationId: process.env.NEXT_PUBLIC_DATADOG_APP_ID,
         clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN,
         site: "datadoghq.com",
         service: "spike-land-nextjs",
         env: process.env.NODE_ENV,
         sessionSampleRate: 100,
         sessionReplaySampleRate: 20,
         trackUserInteractions: true,
         trackResources: true,
         trackLongTasks: true,
         defaultPrivacyLevel: "mask-user-input",
       });

       datadogRum.startSessionReplayRecording();
     }, []);

     return null;
   }
   ```

3. Add to root layout:
   ```typescript
   // app/layout.tsx
   import { DatadogInit } from "./components/DatadogInit";

   export default function RootLayout({
     children,
   }: {
     children: React.ReactNode;
   }) {
     return (
       <html>
         <body>
           <DatadogInit />
           {children}
         </body>
       </html>
     );
   }
   ```

4. Server-side instrumentation:
   ```bash
   npm install dd-trace
   ```

   ```typescript
   // instrumentation.ts (root of src/ directory)
   import tracer from "dd-trace";

   export async function register() {
     if (process.env.NODE_ENV === "production") {
       tracer.init({
         service: "spike-land-nextjs",
         env: process.env.NODE_ENV,
         logInjection: true,
         analytics: true,
       });

       tracer.use("express", {
         analytics: true,
       });

       tracer.use("http", {
         analytics: true,
       });
     }
   }
   ```

5. Enable instrumentation in config, use instrumentation.ts

**Key Features:**

- Distributed tracing
- APM (Application Performance Monitoring)
- Log aggregation
- Real User Monitoring (RUM)
- Infrastructure metrics
- Session replay

#### Structured Logging (Spike Land Approach)

**Best for:** Applications requiring custom error tracking without external
dependencies

This project uses structured logging with `src/lib/error-logger.ts` combined
with Vercel Analytics for monitoring. This approach provides:

- Full control over error logging format
- No external service dependencies
- Cost-effective solution
- Integration with admin dashboard for alerts

**Implementation:**

```typescript
// src/lib/error-logger.ts
export const errorLogger = new ErrorLogger({
  enabled: true,
  environment: process.env.NODE_ENV,
});

// Usage
errorLogger.logError(error, {
  userId: session?.user?.id,
  route: "/api/images/enhance",
  componentStack: info?.componentStack,
});
```

**Key Features:**

- Structured JSON logging
- Request ID tracking
- Context-aware error capture
- Environment-specific handling

### Open-Source Monitoring Stack

**Prometheus + Grafana**

Best for open-source, self-hosted monitoring:

1. Install Prometheus client:
   ```bash
   npm install prom-client
   ```

2. Export metrics:
   ```typescript
   // lib/metrics.ts
   import client from "prom-client";

   // Create metrics
   export const httpRequestDuration = new client.Histogram({
     name: "http_request_duration_seconds",
     help: "Duration of HTTP requests in seconds",
     labelNames: ["method", "status_code"],
     buckets: [0.1, 0.5, 1, 2, 5],
   });

   export const httpRequestTotal = new client.Counter({
     name: "http_requests_total",
     help: "Total number of HTTP requests",
     labelNames: ["method", "status_code"],
   });

   // Get metrics endpoint
   export function getMetrics() {
     return client.register.metrics();
   }
   ```

3. Create metrics endpoint:
   ```typescript
   // app/api/metrics/route.ts
   import { getMetrics } from "@/lib/metrics";
   import { NextResponse } from "next/server";

   export async function GET() {
     return new NextResponse(getMetrics(), {
       headers: { "Content-Type": "text/plain" },
     });
   }
   ```

4. Configure Prometheus to scrape `/api/metrics` endpoint

5. Visualize with Grafana dashboards

---

## Context Propagation and Distributed Tracing

### Overview

Context propagation enables trace IDs, span IDs, and sampling decisions to flow
through your entire application, allowing you to correlate logs, metrics, and
traces across distributed services.

### Correlation IDs

A correlation ID (also called request ID or trace ID) uniquely identifies a
request as it flows through your system.

**Implementation with cls-rtracer:**

1. Install the library:
   ```bash
   npm install cls-rtracer
   ```

2. Use in proxy:
   ```typescript
   // proxy.ts
   import { rTracer } from "cls-rtracer";
   import { NextResponse } from "next/server";
   import type { NextRequest } from "next/server";

   export function proxy(request: NextRequest) {
     const requestId = request.headers.get("x-request-id")
       || crypto.randomUUID();

     const response = NextResponse.next();
     response.headers.set("x-request-id", requestId);

     return response;
   }

   export const config = {
     matcher: ["/api/:path*"],
   };
   ```

3. Access request ID in logger:
   ```typescript
   // lib/logger.ts
   import { rTracer } from "cls-rtracer";
   import pino from "pino";

   const logger = pino();

   export function getContextLogger() {
     const requestId = rTracer.id();
     return logger.child({ requestId });
   }
   ```

### OpenTelemetry Integration

**Installation:**

```bash
npm install @opentelemetry/api \
            @opentelemetry/sdk-node \
            @opentelemetry/auto-instrumentations-node \
            @opentelemetry/sdk-trace-node \
            @opentelemetry/exporter-trace-otlp-http
```

**Server-side Setup (instrumentation.ts):**

```typescript
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
} from "@opentelemetry/sdk-trace-node";

const traceExporter = process.env.NODE_ENV === "production"
  ? new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
      || "http://localhost:4318/v1/traces",
  })
  : new ConsoleSpanExporter();

const sdk = new NodeSDK({
  autoDetectResources: true,
  instrumentations: [getNodeAutoInstrumentations()],
  traceExporter,
});

export async function register() {
  if (process.env.NODE_ENV === "production") {
    sdk.start();

    process.on("SIGTERM", () => {
      sdk.shutdown()
        .then(() => console.log("OpenTelemetry SDK shut down gracefully"))
        .catch(err => console.log("Error shutting down OpenTelemetry SDK", err))
        .finally(() => process.exit(0));
    });
  }
}
```

**Trace-Log Correlation:**

```typescript
// lib/logger.ts
import { context, trace } from "@opentelemetry/api";
import pino from "pino";

const tracer = trace.getTracer("app");
const logger = pino();

export function logWithTrace(message: string, data: any) {
  const span = trace.getActiveSpan();
  const traceId = span?.spanContext().traceId;

  logger.info({ ...data, traceId }, message);
}
```

### W3C Trace Context Standard

Use standardized headers for trace propagation:

```typescript
// Automatically set by OpenTelemetry
// traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
//   Format: version-trace-id-parent-id-flags

// Pass trace context in requests
const headers = {
  "traceparent": "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01",
};

fetch("https://api.example.com/endpoint", { headers });
```

---

## Alerting Strategy

### Alert Threshold Design

#### SLO-Based Alerting (Google SRE Approach)

Google recommends these thresholds for paging (immediate alerts):

- **1 hour**: 2% error budget consumption
- **6 hours**: 5% error budget consumption
- **3 days**: 10% error budget consumption (ticket-based alerts)

**Example Implementation:**

```typescript
// Calculate error budget consumption
interface ErrorBudgetAlert {
  period: "1h" | "6h" | "3d";
  threshold: number; // percentage
  metric: "error_rate" | "latency" | "availability";
}

const alertThresholds: ErrorBudgetAlert[] = [
  { period: "1h", threshold: 2, metric: "error_rate" },
  { period: "6h", threshold: 5, metric: "error_rate" },
  { period: "3d", threshold: 10, metric: "error_rate" },
];
```

#### Tiered Severity Levels

| Severity     | Color  | Action                | Response Time     |
| ------------ | ------ | --------------------- | ----------------- |
| **Critical** | Red    | Page on-call engineer | < 5 minutes       |
| **High**     | Orange | Notify team via Slack | < 15 minutes      |
| **Medium**   | Yellow | Create ticket         | < 1 hour          |
| **Low**      | Blue   | Log for review        | Next business day |

### Alert Configuration Examples

**Prometheus Alert Rules:**

```yaml
# prometheus_rules.yml
groups:
  - name: application
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          severity: critical
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} over 5m"

      - alert: HighLatency
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
        for: 10m
        annotations:
          severity: warning
          summary: "High latency detected"
          description: "p95 latency is {{ $value }}s"

      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes > 800000000
        for: 5m
        annotations:
          severity: warning
          summary: "High memory usage"
          description: "Memory usage is {{ $value | humanize }}B"
```

**DataDog Alerts:**

```typescript
// Configure via DataDog dashboard
const alertConfig = {
  name: "High Error Rate on Production",
  type: "metric alert",
  query: "avg:trace.web.request.errors{service:spike-land-nextjs} > 0.05",
  thresholds: {
    critical: 0.1,
    warning: 0.05,
  },
  notification_channels: [
    "slack-channel",
    "pagerduty",
  ],
};
```

### Preventing Alert Fatigue

**Best Practices:**

1. **Apply Hysteresis** (Alert flapping prevention):
   - Set alert threshold at 80% for triggering
   - Set recovery threshold at 60% for resolution
   - Prevents repeatedly firing/clearing alerts

2. **Use Alert Aggregation**:
   ```typescript
   // Deduplicate similar alerts
   if (alertsSimilar(previousAlert, currentAlert)) {
     // Update existing alert instead of creating new one
     updateAlert(previousAlert.id, currentAlert);
   } else {
     // Create new alert
     createAlert(currentAlert);
   }
   ```

3. **Regular Tuning Schedule**:
   - Review alert effectiveness weekly
   - Adjust thresholds based on false positive rate
   - Target: 80%+ actionable alerts

4. **Alert Enrichment** (Provide context):
   ```typescript
   interface EnrichedAlert {
     alert: string;
     severity: "critical" | "warning" | "info";
     affectedUsers: number;
     affectedServices: string[];
     recentChanges: string[];
     possibleCauses: string[];
     recommendedActions: string[];
   }
   ```

### Incident Response Playbook

**Template Structure:**

```typescript
interface IncidentPlaybook {
  alert: string;
  severity: string;

  detection: {
    symptoms: string[];
    metrics: string[];
    duration: string;
  };

  diagnosis: {
    commonCauses: string[];
    diagnosticSteps: string[];
    commands: string[];
  };

  resolution: {
    immediateActions: string[];
    escalationPath: string[];
    communication: string;
  };

  postIncident: {
    rootCauseAnalysis: string;
    preventiveMeasures: string[];
    monitoringImprovements: string[];
  };
}
```

---

## Metrics and Performance

### Key Application Metrics

**Request Metrics:**

```typescript
import client from "prom-client";

// HTTP request count
export const httpRequestTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "path", "status"],
});

// Request duration
export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "path", "status"],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

// Request size
export const httpRequestSize = new client.Histogram({
  name: "http_request_size_bytes",
  help: "HTTP request size in bytes",
  labelNames: ["method"],
  buckets: [100, 1000, 10000, 100000],
});
```

**Business Metrics:**

```typescript
// User registrations
export const usersRegistered = new client.Counter({
  name: "users_registered_total",
  help: "Total user registrations",
});

// Orders completed
export const ordersCompleted = new client.Counter({
  name: "orders_completed_total",
  help: "Total completed orders",
  labelNames: ["status"],
});

// Revenue
export const revenue = new client.Gauge({
  name: "revenue_usd",
  help: "Total revenue in USD",
});
```

**System Metrics:**

```typescript
// Event loop lag
export const eventLoopLag = new client.Gauge({
  name: "nodejs_eventloop_lag_seconds",
  help: "Event loop lag in seconds",
});

// Garbage collection
export const gcDuration = new client.Histogram({
  name: "nodejs_gc_duration_seconds",
  help: "Garbage collection duration",
  labelNames: ["type"],
});

// Memory usage
export const heapUsed = new client.Gauge({
  name: "nodejs_heap_used_bytes",
  help: "Heap memory used in bytes",
});
```

### Node.js Performance APIs

Use native Node.js performance measurement:

```typescript
import { performance } from "perf_hooks";

// Measure specific operations
export function measureOperation(name: string, fn: () => void) {
  const start = performance.now();
  fn();
  const duration = performance.now() - start;

  logger.info({
    operation: name,
    duration: `${duration.toFixed(2)}ms`,
  });
}

// Usage
measureOperation("database-query", () => {
  // Your operation
});

// Mark and measure for more complex flows
performance.mark("request-start");
// ... process request
performance.mark("request-end");
performance.measure("request", "request-start", "request-end");

const measure = performance.getEntriesByName("request")[0];
console.log(`Request took ${measure.duration}ms`);
```

### Recommended Metrics to Monitor

**Response Time (Latency):**

- Track p50, p95, p99 percentiles
- Monitor by endpoint/route
- Alert on p95 > acceptable threshold

**Error Rate:**

- Track errors per minute
- Monitor by endpoint
- Alert when > 5% of requests fail

**Throughput:**

- Requests per second
- Track peak capacity
- Monitor for bottlenecks

**Resource Usage:**

- CPU usage
- Memory usage (heap size)
- Event loop lag

**Business KPIs:**

- User signups
- Conversion rates
- Revenue
- Feature adoption

---

## Production Best Practices

### Log Aggregation and Centralization

**Vercel Log Drains (for Vercel deployments):**

1. Connect to DataDog:
   ```bash
   # Via Vercel CLI
   vercel env add DATADOG_API_KEY <your-api-key>
   ```

2. Configure in Vercel dashboard:
   - Settings > Log Drains
   - Select DataDog integration
   - Provide API key

3. Logs automatically sent to DataDog

**Self-Hosted Log Aggregation (ELK Stack):**

```typescript
// Install Winston ELK transport
npm install winston-elasticsearch

// Configure transport
const esTransport = new ElasticsearchTransport({
  level: 'info',
  clientOpts: {
    node: 'https://elasticsearch.example.com'
  },
  index: 'logs',
  dataStream: true
});

logger.add(esTransport);
```

**CloudWatch Logs (AWS):**

```typescript
import WinstonCloudWatch from "winston-cloudwatch";

const cloudwatchTransport = new WinstonCloudWatch({
  logGroupName: "/aws/lambda/spike-land-nextjs",
  logStreamName: `${process.env.ENVIRONMENT}-${Date.now()}`,
  awsRegion: "us-east-1",
  messageFormatter: ({ level, message, meta }) => `[${level}] ${message} ${JSON.stringify(meta)}`,
});

logger.add(cloudwatchTransport);
```

### Log Sampling and Filtering

**Reduce log volume in production:**

```typescript
// Sample logs based on log level
function shouldLog(level: string, sampleRate: number = 1): boolean {
  if (["error", "warn"].includes(level)) {
    return true; // Always log errors and warnings
  }
  return Math.random() < sampleRate;
}

// Usage
if (shouldLog("debug", 0.1)) { // 10% sample rate
  logger.debug("Debug information");
}
```

**Filter sensitive data:**

```typescript
// Redact middleware
function redactSensitiveData(obj: any): any {
  const sensitiveFields = ["password", "token", "secret", "api_key"];
  const redacted = { ...obj };

  sensitiveFields.forEach(field => {
    if (field in redacted) {
      redacted[field] = "***REDACTED***";
    }
  });

  return redacted;
}
```

### Health Checks and Status Pages

**Implement health endpoints:**

```typescript
// app/api/health/route.ts
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date(),
      services: {
        database: "ok",
        api: "ok",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
```

**Liveness and readiness probes (Kubernetes):**

```typescript
// app/api/health/live/route.ts - Liveness check
export async function GET() {
  return NextResponse.json({ status: "alive" });
}

// app/api/health/ready/route.ts - Readiness check
export async function GET() {
  // Check if service is ready to handle traffic
  const ready = await isServiceReady();

  if (!ready) {
    return NextResponse.json(
      { status: "not-ready" },
      { status: 503 },
    );
  }

  return NextResponse.json({ status: "ready" });
}
```

### Structured Error Tracking

**Consistent error logging:**

```typescript
interface LoggableError {
  message: string;
  code?: string;
  statusCode?: number;
  userId?: string;
  context?: Record<string, any>;
  stack?: string;
}

function logError(error: LoggableError) {
  logger.error({
    message: error.message,
    code: error.code || "UNKNOWN_ERROR",
    statusCode: error.statusCode || 500,
    userId: error.userId,
    context: error.context,
    stack: error.stack,
  });
}

// Usage in API routes
try {
  // API logic
} catch (error) {
  logError({
    message: error instanceof Error ? error.message : "Unknown error",
    statusCode: 500,
    context: { endpoint: "/api/users", method: "POST" },
  });
}
```

---

## Cost Management

### Log Retention Policies

**Recommended Retention by Log Type:**

| Log Type                | Retention | Reason                                |
| ----------------------- | --------- | ------------------------------------- |
| **Error/Security Logs** | 1 year    | Compliance and incident investigation |
| **Application Logs**    | 30 days   | Troubleshooting and diagnostics       |
| **Access Logs**         | 7 days    | Performance analysis                  |
| **Debug Logs**          | 1-3 days  | Development only                      |

**AWS CloudWatch Retention Configuration:**

```bash
# Set retention via AWS CLI
aws logs put-retention-policy \
  --log-group-name /aws/lambda/spike-land-nextjs \
  --retention-in-days 30
```

**GCP Cloud Logging Retention:**

```bash
# Create retention bucket
gcloud logging buckets create logs-7d \
  --location=us-central1 \
  --retention-days=7
```

**Azure Log Analytics Retention:**

```powershell
# Set retention via PowerShell
Update-AzOperationalInsightsWorkspace `
  -ResourceGroupName myResourceGroup `
  -Name myWorkspaceName `
  -RetentionInDays 30
```

### Cost Optimization Strategies

**1. Log Sampling:**

- Sample 10-20% of debug logs
- Keep 100% of error/warning logs
- Can reduce costs by 60-70%

**2. Structured Logging:**

- Use consistent field names
- Avoid redundant fields
- Reduces log size by 20-30%

**3. Log Routing:**

```typescript
// Route logs to different destinations by severity
function routeLog(level: string, data: any) {
  switch (level) {
    case "error":
    case "warn":
      // Send to main log storage (expensive)
      sendToCloudWatch(data);
      break;
    case "info":
      // Sample 50%
      if (Math.random() < 0.5) {
        sendToCloudWatch(data);
      }
      break;
    case "debug":
      // Sample 10%, keep locally
      if (Math.random() < 0.1) {
        sendToCloudWatch(data);
      }
      break;
  }
}
```

**4. Log Compression:**

- Compress logs before transmission
- Can reduce size by 50-80%
- Minimal performance impact

**5. Tiered Storage:**

```
Days 1-7: Hot storage (CloudWatch, fast search)
Days 8-30: Warm storage (cheaper archive)
Days 31+: Cold storage (Glacier, minimal cost)
```

### Cost Monitoring

**Set up cost alerts:**

```typescript
// Monitor CloudWatch costs
// AWS Cost Explorer → Set budgets and alerts
// Alert when > $X/month on logging

// GCP Cost Management
// Cloud Console → Billing → Budgets & Alerts

// DataDog cost monitoring
// Settings → Plan & Usage → Check log volume
```

### Cost Calculation Example

**Example: 5GB/day log volume**

- Daily generation: 5 GB
- Annual storage: 1.8 TB (5 GB × 365 days)
- CloudWatch cost (US-East): $0.03/GB × 1,800 GB = $54/month
- With 30-day retention: ~$54/month

**Optimization Impact:**

- 50% sampling: $27/month savings
- Compression (70%): $16/month savings
- Combined: $11/month

---

## Summary and Recommendations

### Implementation Roadmap

**Phase 1: Foundation (Week 1)**

- [ ] Set up structured logging (Pino or Winston)
- [ ] Configure log levels across codebase
- [ ] Implement sensitive data redaction

**Phase 2: Monitoring (Week 2)**

- [ ] Set up monitoring (Vercel Analytics + structured logging)
- [ ] Create health check endpoints
- [ ] Configure basic alerts

**Phase 3: Tracing (Week 3)**

- [ ] Implement correlation IDs
- [ ] Set up OpenTelemetry
- [ ] Configure trace-log correlation

**Phase 4: Optimization (Week 4)**

- [ ] Implement log sampling
- [ ] Set retention policies
- [ ] Optimize costs

### Tool Selection Guide

**Choose Pino if:**

- Performance is critical
- Handling high request volume
- Simple, fast setup needed
- AWS/Vercel deployment

**Choose Winston if:**

- Need maximum flexibility
- Multiple log destinations
- Complex formatting requirements
- Large team with diverse needs

**Choose DataDog if:**

- Need comprehensive APM
- Budget allows cloud solution
- Infrastructure monitoring needed
- Want unified observability

**Choose Vercel Analytics + Structured Logging if:**

- Deploying on Vercel
- Want zero-configuration monitoring
- Need Web Vitals tracking
- Prefer cost-effective solution

**Choose Open-Source if:**

- Self-hosted required
- Cost minimization critical
- Full control needed
- Kubernetes/Docker environment

### Key Takeaways

1. **Structured logging is essential** for modern applications
2. **Performance matters** - choose tools that won't create bottlenecks
3. **Context propagation** enables cross-service debugging
4. **Proper alerting** prevents alert fatigue while catching real issues
5. **Cost management** requires retention policies and log sampling
6. **Combine tools** - logging + metrics + traces = complete observability

---

## References and Resources

### Official Documentation

- [Pino Logger Documentation](https://getpino.io/)
- [Winston Logger Documentation](https://github.com/winstonjs/winston)
- [Bunyan Logger Documentation](https://github.com/trentm/node-bunyan)
- [OpenTelemetry Node.js Documentation](https://opentelemetry.io/docs/languages/js/)
- [DataDog Documentation](https://docs.datadoghq.com/)
- [Vercel Analytics Documentation](https://vercel.com/docs/analytics)

### Related Articles and Guides

- [The Top 5 Best Node.js and JavaScript Logging Frameworks in 2025](https://www.dash0.com/faq/the-top-5-best-node-js-and-javascript-logging-frameworks-in-2025-a-complete-guide)
- [Node.js Logging Best Practices - Complete Guide](https://www.atatus.com/blog/best-practices-for-logging-in-node-js/)
- [The Complete Guide to Node.js Logging Libraries in 2025](https://last9.io/blog/node-js-logging-libraries/)
- [Pino Logger: Complete Node.js Guide with Examples](https://signoz.io/guides/pino-logger/)
- [11 Best Practices for Logging in Node.js](https://betterstack.com/community/guides/logging/nodejs-logging-best-practices/)
- [Comparing Node.js Logging Tools](https://blog.logrocket.com/comparing-node-js-logging-tools/)
- [Monitor Your Next.js App With RUM](https://docs.datadoghq.com/real_user_monitoring/guide/monitor-your-nextjs-app-with-rum/)
- [Vercel Analytics and Monitoring Guide](https://vercel.com/docs/observability)
- [Observability Practices: The 3 Pillars with Node.js + OpenTelemetry Example](https://dev.to/wsalas651/observability-practices-the-3-pillars-with-a-nodejs-opentelemetry-example-11k7)
- [Essential OpenTelemetry Best Practices for Robust Observability](https://betterstack.com/community/guides/observability/opentelemetry-best-practices/)
- [Monitoring Node.js Apps with OpenTelemetry Metrics](https://betterstack.com/community/guides/observability/opentelemetry-metrics-nodejs/)
- [Top Node.js Monitoring Tools for 2025](https://odown.com/blog/monitoring-tools/)
- [Best Node.js Application Monitoring Tools in 2025](https://betterstack.com/community/comparisons/nodejs-application-monitoring-tools/)
- [Best 7 Monitoring Tools for Node.js Applications in 2025](https://www.atatus.com/blog/best-monitoring-tools-for-node-js-application/)
- [The Best Node.js Observability Tools in 2025: N|Solid vs New Relic, Datadog, and More](https://nodesource.com/blog/nodejs-observability-tools-2025)
- [Log Retention Policies Explained: Benefits, Challenges & Best Practices](https://www.groundcover.com/logging/log-retention-policies)
- [Best Practices for Log Retention & Cost Optimization in Azure](https://statusneo.com/best-practices-for-log-retention-cost-optimization-in-azure/)
- [How To Reduce Logging Costs in GCP](https://www.finout.io/blog/reducing-gcp-logging-costs)
- [CloudWatch Costs & Pricing in 2025](https://www.wiz.io/academy/cloudwatch-costs)
- [Guide to IT Alerting: Practices and Tools](https://www.atlassian.com/incident-management/on-call/it-alerting)
- [Google SRE - Prometheus Alerting: Turn SLOs into Alerts](https://sre.google/workbook/alerting-on-slos/)
- [Incident Response Best Practices For 2025](https://purplesec.us/learn/incident-response-best-practices/)
- [Top Incident Management Best Practices to Improve Response](https://blog.resgrid.com/incident-management-best-practices/)
- [Context Propagation in Distributed Tracing](https://signoz.io/blog/context-propagation-in-distributed-tracing/)
- [Mastering Correlation IDs: Enhancing Tracing and Debugging in Distributed Systems](https://medium.com/@nynptel/mastering-correlation-ids-enhancing-tracing-and-debugging-in-distributed-systems-602a84e1ded6)
- [OpenTelemetry Context Propagation](https://opentelemetry.io/docs/concepts/context-propagation/)
- [Node Application Metrics GitHub Repository](https://github.com/RuntimeTools/appmetrics)

---

**Document Version:** 1.0 **Last Updated:** December 6, 2025 **Author:** Claude
Code (AI Assistant) **Target Audience:** Backend engineers, DevOps, SREs
**Status:** Production Ready
