# Image Generation AI Best Practices

Comprehensive guide to integrating and optimizing image generation APIs for
production applications. This document covers API integration patterns, prompt
engineering, performance optimization, cost management, and quality assurance
best practices.

---

## Table of Contents

1. [API Integration Patterns](#api-integration-patterns)
2. [Prompt Engineering](#prompt-engineering)
3. [Performance Optimization](#performance-optimization)
4. [Cost Management](#cost-management)
5. [Quality Assurance](#quality-assurance)
6. [Provider Comparison](#provider-comparison)

---

## API Integration Patterns

### 1. Streaming vs Batch Responses

Image generation APIs support different response models depending on your use
case and scale requirements.

#### Streaming Responses

**When to use**: Real-time applications where users expect immediate feedback.

**Advantages**:

- Provides immediate response feedback (HTTP 202 Accepted)
- Reduces perceived latency for end users
- Allows progress indication during generation
- Better for interactive experiences

**TypeScript Implementation**:

```typescript
import axios from "axios";

interface StreamingImageGenerationOptions {
  prompt: string;
  model: string;
  timeout?: number;
  onProgress?: (status: string) => void;
}

async function generateImageStreaming(
  options: StreamingImageGenerationOptions,
): Promise<{ imageUrl: string; metadata: Record<string, unknown>; }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    options.timeout || 60000,
  );

  try {
    // Initial request returns 202 Accepted with polling URL
    const initialResponse = await axios.post(
      "https://api.example.com/v1/images/generations",
      {
        prompt: options.prompt,
        model: options.model,
      },
      {
        signal: controller.signal,
      },
    );

    if (initialResponse.status === 202) {
      const pollingUrl = initialResponse.data.processing_url;

      // Poll for completion
      return await pollForCompletion(pollingUrl, options.onProgress);
    }

    return initialResponse.data;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function pollForCompletion(
  pollingUrl: string,
  onProgress?: (status: string) => void,
): Promise<{ imageUrl: string; metadata: Record<string, unknown>; }> {
  const maxAttempts = 60;
  const baseDelay = 1000; // 1 second

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await axios.get(pollingUrl);

      if (response.data.status === "completed") {
        onProgress?.("Image generation completed");
        return {
          imageUrl: response.data.image_url,
          metadata: response.data.metadata,
        };
      }

      if (response.data.status === "failed") {
        throw new Error(`Generation failed: ${response.data.error}`);
      }

      onProgress?.(response.data.status || "Processing...");

      // Exponential backoff: base * 1.5^attempt
      const delay = Math.min(baseDelay * Math.pow(1.5, attempt), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // Job not found yet, continue polling
        continue;
      }
      throw error;
    }
  }

  throw new Error("Image generation polling timeout");
}
```

#### Batch Responses

**When to use**: Background processing, bulk image generation, scheduled tasks.

**Advantages**:

- Higher throughput and rate limits for batch operations
- More cost-effective for volume processing
- Supports parallel processing patterns
- Better resource utilization

**TypeScript Implementation**:

```typescript
interface BatchImageGenerationRequest {
  id: string;
  prompt: string;
  parameters: {
    size?: string;
    quality?: string;
    style?: string;
  };
}

interface BatchGenerationOptions {
  requests: BatchImageGenerationRequest[];
  maxConcurrent?: number;
}

async function generateImagesBatch(
  options: BatchGenerationOptions,
): Promise<Map<string, string>> {
  const maxConcurrent = options.maxConcurrent || 5;
  const results = new Map<string, string>();
  const queue = [...options.requests];
  const active = new Set<Promise<void>>();

  async function processRequest(request: BatchImageGenerationRequest) {
    try {
      const response = await axios.post(
        "https://api.example.com/v1/images/generations",
        {
          prompt: request.prompt,
          ...request.parameters,
        },
      );
      results.set(request.id, response.data.image_url);
    } catch (error) {
      console.error(`Failed to generate image ${request.id}:`, error);
      results.set(request.id, ""); // Mark as failed
    }
  }

  // Process requests concurrently with limit
  while (queue.length > 0 || active.size > 0) {
    // Add new requests up to maxConcurrent limit
    while (active.size < maxConcurrent && queue.length > 0) {
      const request = queue.shift()!;
      const promise = processRequest(request);
      active.add(promise);

      promise.finally(() => active.delete(promise));
    }

    // Wait for at least one to complete
    if (active.size > 0) {
      await Promise.race(active);
    }
  }

  return results;
}
```

### 2. Error Handling and Retries

Robust error handling is critical for production image generation systems.

#### Common Error Codes and Handling

| Status      | Error               | Handling Strategy                           |
| ----------- | ------------------- | ------------------------------------------- |
| 429         | Rate Limit Exceeded | Exponential backoff + Retry-After header    |
| 500/502/503 | Server Error        | Exponential backoff with circuit breaker    |
| 400         | Invalid Request     | Validate prompt and parameters, don't retry |
| 401         | Unauthorized        | Check API key and credentials               |
| 402         | Insufficient Quota  | Implement fallback or user notification     |
| 408         | Timeout             | Retry with increased timeout                |

**TypeScript Implementation**:

```typescript
interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: "closed" | "open" | "half-open";
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

class ImageGenerationClient {
  private circuitBreaker: CircuitBreakerState = {
    failures: 0,
    lastFailureTime: 0,
    state: "closed",
  };

  async generateImageWithRetry(
    prompt: string,
    config: Partial<RetryConfig> = {},
  ): Promise<string> {
    const retryConfig = { ...defaultRetryConfig, ...config };
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        // Check circuit breaker
        if (!this.isCircuitBreakerOpen()) {
          return await this.generateImage(prompt);
        }
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (
          axios.isAxiosError(error)
          && error.response?.status?.toString().startsWith("4")
        ) {
          // Except rate limiting (429)
          if (error.response.status !== 429) {
            throw error;
          }
        }

        // Update circuit breaker
        this.recordFailure();

        if (attempt < retryConfig.maxRetries) {
          const delay = this.calculateBackoffDelay(attempt, retryConfig);
          const retryAfter = this.getRetryAfterHeader(error);

          await new Promise(resolve => setTimeout(resolve, retryAfter || delay));
        }
      }
    }

    throw new Error(
      `Failed to generate image after ${retryConfig.maxRetries} retries: ${lastError?.message}`,
    );
  }

  private async generateImage(prompt: string): Promise<string> {
    const response = await axios.post(
      "https://api.example.com/v1/images/generations",
      {
        prompt,
      },
    );
    return response.data.image_url;
  }

  private isCircuitBreakerOpen(): boolean {
    if (this.circuitBreaker.state === "closed") {
      return true;
    }

    // Half-open after 60 seconds
    if (Date.now() - this.circuitBreaker.lastFailureTime > 60000) {
      this.circuitBreaker.state = "half-open";
      return true;
    }

    return this.circuitBreaker.state !== "open";
  }

  private recordFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();

    if (this.circuitBreaker.failures >= 5) {
      this.circuitBreaker.state = "open";
    }
  }

  private calculateBackoffDelay(attempt: number, config: RetryConfig): number {
    const delay = config.initialDelayMs
      * Math.pow(config.backoffMultiplier, attempt);
    return Math.min(delay, config.maxDelayMs);
  }

  private getRetryAfterHeader(error: unknown): number | null {
    if (axios.isAxiosError(error) && error.response?.headers["retry-after"]) {
      const retryAfter = error.response.headers["retry-after"];
      return parseInt(retryAfter) * 1000; // Convert to milliseconds
    }
    return null;
  }
}
```

### 3. Rate Limiting Strategies

Effective rate limiting prevents quota exhaustion and maintains API stability.

#### Provider Rate Limits (2025)

| Provider            | Limit            | Details                                 |
| ------------------- | ---------------- | --------------------------------------- |
| **OpenAI (DALL-E)** | Variable by tier | Default: 60 RPM (requests per minute)   |
| **Google Gemini**   | 20 RPM / 30 TPM  | Per project, configurable via quota     |
| **Stability AI**    | 150 req/10s      | Fixed limit with 60s timeout            |
| **Replicate**       | Tier-based       | Free tier: burst-limited, pro: 100 RPM+ |

**TypeScript Implementation - Token Bucket Algorithm**:

```typescript
interface RateLimitConfig {
  requestsPerSecond: number;
  burstSize: number;
}

class RateLimiter {
  private tokens: number;
  private lastRefillTime: number;
  private readonly config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.tokens = config.burstSize;
    this.lastRefillTime = Date.now();
  }

  async acquireToken(): Promise<void> {
    while (!this.tryAcquire()) {
      const waitTime = this.getWaitTime();
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  private tryAcquire(): boolean {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens--;
      return true;
    }
    return false;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefillTime) / 1000;
    const tokensToAdd = timePassed * this.config.requestsPerSecond;

    this.tokens = Math.min(
      this.config.burstSize,
      this.tokens + tokensToAdd,
    );
    this.lastRefillTime = now;
  }

  private getWaitTime(): number {
    return Math.ceil((1 - this.tokens) / this.config.requestsPerSecond) * 1000;
  }
}

// Usage with image generation
async function generateImageWithRateLimit(
  prompt: string,
  limiter: RateLimiter,
): Promise<string> {
  await limiter.acquireToken();
  return generateImage(prompt);
}
```

---

## Prompt Engineering

### 1. Effective Prompts for Image Enhancement

The foundation of good image generation is clear, descriptive prompting.

#### Core Principle: Narrative > Keywords

**Anti-pattern**:

```typescript
// ❌ Avoid - Generic keywords
const poorPrompt = "sunset, beach, beautiful, colorful";
```

**Best Practice**:

```typescript
// ✅ Good - Narrative description
const goodPrompt =
  "A vibrant watercolor painting of a coastal village at sunset with warm orange and pink tones. The composition emphasizes foreground fishing boats and cottages with soft, glowing light reflecting off calm waters. Artistic, dreamy atmosphere with visible brushstrokes.";
```

#### Prompt Structure for Image Enhancement

```typescript
interface PromptTemplate {
  scene: string;
  style: string;
  lighting: string;
  details: string;
  mood: string;
}

function buildEnhancementPrompt(template: PromptTemplate): string {
  return `
    Scene: ${template.scene}
    Style: ${template.style}
    Lighting: ${template.lighting}
    Technical Details: ${template.details}
    Mood: ${template.mood}
  `.trim();
}

// Example: Image enhancement using natural description
const enhancementPrompt = buildEnhancementPrompt({
  scene: "A modern smart home living room with minimalist furniture",
  style: "Photorealistic, contemporary architecture photography",
  lighting: "Soft natural sunlight from large floor-to-ceiling windows, warm color temperature",
  details:
    "Sharp focus on interior details, professional product photography quality, 8K resolution equivalent",
  mood: "Bright, airy, premium, sophisticated",
});
```

### 2. Model-Specific Prompting Strategies

Each AI model has distinct strengths and quirks. Tailor prompts accordingly.

#### DALL-E 3 (OpenAI)

- **Strength**: Narrative interpretation, creative concepts
- **Best for**: Abstract, imaginative, creative content
- **Prompt style**: Natural language description
- **Avoid**: Negative prompts (use positive instructions instead)

```typescript
// DALL-E 3 optimized prompt
const dalle3Prompt = `
  A detailed illustration of a futuristic city skyline at night.
  The scene features sleek, modern skyscrapers with glowing windows
  that create a sense of movement and energy. Flying vehicles navigate
  between buildings. Vibrant neon colors dominate: electric blue,
  hot pink, and cyan. The overall mood is energetic and hopeful.
`;
```

#### Gemini 2.5 Flash (Google)

- **Strength**: Text rendering, photorealism, Google Search grounding
- **Best for**: Realistic images, diagrams, infographics with text
- **Prompt style**: Clear, specific requirements
- **Advantage**: Native multi-turn refinement

```typescript
// Gemini-optimized prompt with explicit specifications
const geminiPrompt = `
  Generate a product photograph of a luxury smartwatch.
  Requirements:
  - Photorealistic, professional product photography
  - White background
  - Soft studio lighting, no harsh shadows
  - Display shows time as 10:10
  - High-end jewelry photography quality
  - Resolution: 4K
`;
```

#### Stable Diffusion 3.5 (Stability AI)

- **Strength**: Fine-grained control, prompt weighting
- **Best for**: Detailed requirements, technical specifications
- **Prompt style**: Structured, supports syntax for emphasis
- **Advanced**: Supports LoRA models for specific styles

```typescript
// Stable Diffusion with prompt weighting
interface SDWeightedPrompt {
  primary: { text: string; weight: number; };
  secondary: { text: string; weight: number; }[];
  negative: string[];
}

const sdWeightedPrompt: SDWeightedPrompt = {
  primary: {
    text: "stunning landscape photograph of mountains at sunrise",
    weight: 1.5, // Emphasize this element
  },
  secondary: [
    {
      text: "golden light, mist in valleys",
      weight: 1.2,
    },
    {
      text: "professional photography, award-winning",
      weight: 0.8,
    },
  ],
  negative: [
    "blurry",
    "low quality",
    "watermark",
    "distorted",
  ],
};

function buildSDPrompt(weighted: SDWeightedPrompt): string {
  const parts = [
    `(${weighted.primary.text}:${weighted.primary.weight})`,
    ...weighted.secondary.map(
      s => `(${s.text}:${s.weight})`,
    ),
    ...weighted.negative.map(n => `(${n}:-0.5)`),
  ];
  return parts.join(", ");
}
```

### 3. Resolution and Quality Parameters

Understanding quality tiers and resolution impacts cost and output.

#### Quality Tier Recommendations

| Tier         | Model                         | Use Case                    | Cost per Image  |
| ------------ | ----------------------------- | --------------------------- | --------------- |
| **Standard** | DALL-E 2                      | Prototyping, testing        | $0.016 - $0.020 |
| **High**     | DALL-E 3 Standard (1024×1024) | Production, web             | $0.040          |
| **Premium**  | DALL-E 3 HD (1024×1792)       | Marketing, print            | $0.080 - $0.120 |
| **Ultra**    | Stable Diffusion Ultra        | Detailed, commercial        | $0.080          |
| **Budget**   | Gemini Flash (1024×1024)      | High volume, cost-sensitive | $0.004          |
| **4K**       | Gemini Pro (4096×4096)        | Ultra high-quality needs    | $0.240          |

**TypeScript Implementation**:

```typescript
interface ImageQualityConfig {
  tier: "standard" | "high" | "premium" | "ultra";
  resolution: string;
  aspectRatio: string;
}

type ResolutionMap = Record<string, { width: number; height: number; }>;

const resolutionMap: ResolutionMap = {
  "1K": { width: 1024, height: 1024 },
  "2K": { width: 2048, height: 2048 },
  "4K": { width: 4096, height: 4096 },
  "wide": { width: 1024, height: 576 }, // 16:9
  "portrait": { width: 576, height: 1024 }, // 9:16
};

function getQualityConfig(useCase: string): ImageQualityConfig {
  const configs: Record<string, ImageQualityConfig> = {
    prototyping: {
      tier: "standard",
      resolution: "1K",
      aspectRatio: "1:1",
    },
    production_web: {
      tier: "high",
      resolution: "1K",
      aspectRatio: "1:1",
    },
    marketing: {
      tier: "premium",
      resolution: "2K",
      aspectRatio: "16:9",
    },
    print: {
      tier: "ultra",
      resolution: "4K",
      aspectRatio: "1:1",
    },
  };

  return configs[useCase] || configs.production_web;
}

// Cost calculator
function estimateCost(
  imageCount: number,
  tier: "standard" | "high" | "premium" | "ultra",
): number {
  const costPerImage: Record<string, number> = {
    standard: 0.016,
    high: 0.040,
    premium: 0.080,
    ultra: 0.120,
  };

  return imageCount * costPerImage[tier];
}
```

---

## Performance Optimization

### 1. Timeout Management

Proper timeout configuration prevents hanging requests and improves reliability.

```typescript
interface TimeoutConfig {
  connection: number;
  request: number;
  polling: number;
}

const timeoutPresets: Record<string, TimeoutConfig> = {
  fast: {
    connection: 5000, // 5 seconds
    request: 30000, // 30 seconds (for streaming models)
    polling: 5000, // 5 seconds per poll
  },
  standard: {
    connection: 10000, // 10 seconds
    request: 60000, // 60 seconds
    polling: 3000, // 3 seconds per poll
  },
  slow: {
    connection: 15000, // 15 seconds
    request: 120000, // 2 minutes
    polling: 5000, // 5 seconds per poll
  },
};

// Implementation with axios
function createImageGenerationClient(
  timeoutPreset: keyof typeof timeoutPresets,
) {
  const config = timeoutPresets[timeoutPreset];

  const client = axios.create({
    baseURL: "https://api.example.com",
    timeout: config.request,
    httpAgent: new http.Agent({ keepAlive: true }),
    httpsAgent: new https.Agent({ keepAlive: true }),
  });

  client.interceptors.request.use(config => {
    config.timeout = config.timeout || timeoutPresets[timeoutPreset].request;
    return config;
  });

  return client;
}
```

### 2. Caching Strategies

Intelligent caching dramatically reduces API costs and improves response times.

#### Multi-Level Caching Architecture

```typescript
interface CacheEntry {
  imageUrl: string;
  metadata: Record<string, unknown>;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheConfig {
  memory: { maxSize: number; ttl: number; };
  redis?: { host: string; port: number; ttl: number; };
}

class ImageGenerationCache {
  private memoryCache = new Map<string, CacheEntry>();
  private redisClient: ioredis.Redis | null = null;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  async get(prompt: string): Promise<CacheEntry | null> {
    const cacheKey = this.hashPrompt(prompt);

    // Check memory cache first
    const memoryEntry = this.memoryCache.get(cacheKey);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry;
    }

    // Check Redis if available
    if (this.redisClient) {
      try {
        const redisEntry = await this.redisClient.get(cacheKey);
        if (redisEntry) {
          const entry = JSON.parse(redisEntry) as CacheEntry;
          // Restore to memory cache
          this.memoryCache.set(cacheKey, entry);
          return entry;
        }
      } catch (error) {
        console.warn("Redis cache read error:", error);
      }
    }

    return null;
  }

  async set(prompt: string, entry: CacheEntry): Promise<void> {
    const cacheKey = this.hashPrompt(prompt);

    // Store in memory cache
    this.memoryCache.set(cacheKey, entry);

    // Enforce memory cache size limit
    if (this.memoryCache.size > this.config.memory.maxSize) {
      const oldestKey = Array.from(this.memoryCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.memoryCache.delete(oldestKey);
    }

    // Store in Redis if available
    if (this.redisClient) {
      try {
        await this.redisClient.setex(
          cacheKey,
          Math.ceil(this.config.memory.ttl / 1000),
          JSON.stringify(entry),
        );
      } catch (error) {
        console.warn("Redis cache write error:", error);
      }
    }
  }

  private hashPrompt(prompt: string): string {
    return crypto
      .createHash("sha256")
      .update(prompt)
      .digest("hex");
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }
}

// Usage
async function generateImageWithCache(
  prompt: string,
  cache: ImageGenerationCache,
): Promise<string> {
  // Check cache first
  const cached = await cache.get(prompt);
  if (cached) {
    console.log("Cache hit - serving cached image");
    return cached.imageUrl;
  }

  // Generate new image
  const imageUrl = await generateImage(prompt);

  // Store in cache
  await cache.set(prompt, {
    imageUrl,
    metadata: { model: "gpt-4-turbo-vision" },
    timestamp: Date.now(),
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return imageUrl;
}
```

#### Cache Key Strategy for Prompts

```typescript
interface CacheKeyConfig {
  normalizeWhitespace: boolean;
  caseSensitive: boolean;
  ignoreParameters?: string[];
}

function generateCacheKey(
  prompt: string,
  parameters: Record<string, unknown>,
  config: CacheKeyConfig = {
    normalizeWhitespace: true,
    caseSensitive: false,
  },
): string {
  // Normalize prompt
  let normalizedPrompt = prompt;

  if (config.normalizeWhitespace) {
    normalizedPrompt = normalizedPrompt.replace(/\s+/g, " ").trim();
  }

  if (!config.caseSensitive) {
    normalizedPrompt = normalizedPrompt.toLowerCase();
  }

  // Build cache key components
  const keyParts = [normalizedPrompt];

  // Add relevant parameters
  const relevantParams = Object.entries(parameters).filter(
    ([key]) => !config.ignoreParameters?.includes(key),
  );

  relevantParams.forEach(([key, value]) => {
    keyParts.push(`${key}=${JSON.stringify(value)}`);
  });

  return crypto
    .createHash("sha256")
    .update(keyParts.join("|"))
    .digest("hex");
}
```

### 3. Queue Management for Batch Processing

Efficient queue management enables reliable batch image generation.

```typescript
interface QueuedTask {
  id: string;
  prompt: string;
  parameters: Record<string, unknown>;
  priority: number;
  retries: number;
  status: "pending" | "processing" | "completed" | "failed";
  result?: string;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

class ImageGenerationQueue {
  private queue: QueuedTask[] = [];
  private processing = new Map<string, Promise<void>>();
  private maxConcurrent: number;
  private maxRetries: number;

  constructor(maxConcurrent: number = 5, maxRetries: number = 3) {
    this.maxConcurrent = maxConcurrent;
    this.maxRetries = maxRetries;
  }

  enqueue(
    prompt: string,
    parameters: Record<string, unknown> = {},
    priority: number = 0,
  ): string {
    const task: QueuedTask = {
      id: crypto.randomUUID(),
      prompt,
      parameters,
      priority,
      retries: 0,
      status: "pending",
      createdAt: Date.now(),
    };

    this.queue.push(task);
    this.queue.sort((a, b) => b.priority - a.priority);

    this.processQueue();

    return task.id;
  }

  private async processQueue(): Promise<void> {
    while (
      this.processing.size < this.maxConcurrent
      && this.queue.some(t => t.status === "pending")
    ) {
      const task = this.queue.find(t => t.status === "pending");
      if (!task) break;

      task.status = "processing";
      task.startedAt = Date.now();

      const promise = this.processTask(task);
      this.processing.set(task.id, promise);

      promise.finally(() => {
        this.processing.delete(task.id);
        this.processQueue();
      });
    }
  }

  private async processTask(task: QueuedTask): Promise<void> {
    try {
      task.result = await generateImage(task.prompt, task.parameters);
      task.status = "completed";
      task.completedAt = Date.now();
    } catch (error) {
      if (task.retries < this.maxRetries) {
        task.retries++;
        task.status = "pending"; // Retry
        this.queue.push(task);
      } else {
        task.status = "failed";
        task.error = String(error);
        task.completedAt = Date.now();
      }
    }
  }

  getStatus(taskId: string): QueuedTask | undefined {
    return this.queue.find(t => t.id === taskId);
  }

  getStats(): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    avgProcessingTime: number;
  } {
    const tasks = this.queue;
    const completedTasks = tasks.filter(t => t.completedAt && t.startedAt);

    return {
      pending: tasks.filter(t => t.status === "pending").length,
      processing: tasks.filter(t => t.status === "processing").length,
      completed: tasks.filter(t => t.status === "completed").length,
      failed: tasks.filter(t => t.status === "failed").length,
      avgProcessingTime: completedTasks.length > 0
        ? completedTasks.reduce(
          (sum, t) => sum + (t.completedAt! - t.startedAt!),
          0,
        )
          / completedTasks.length
        : 0,
    };
  }
}
```

---

## Cost Management

### 1. Token and Credit Optimization

Effective cost management requires understanding usage patterns and optimization
strategies.

#### Cost Optimization Techniques

```typescript
interface CostOptimizationStrategy {
  name: string;
  savings: number; // Estimated savings percentage
  implementation: string;
}

const costOptimizationStrategies: CostOptimizationStrategy[] = [
  {
    name: "Request Caching",
    savings: 20,
    implementation: "Cache identical generations for 7+ days",
  },
  {
    name: "Lower Resolution Testing",
    savings: 40,
    implementation: "Use 1K resolution during development, 4K for production",
  },
  {
    name: "Batch Processing",
    savings: 15,
    implementation: "Process requests during off-peak hours (2-6 AM UTC)",
  },
  {
    name: "Provider Selection",
    savings: 60,
    implementation: "Use Gemini Flash ($0.004) instead of DALL-E ($0.04)",
  },
  {
    name: "Prompt Similarity Grouping",
    savings: 25,
    implementation: "Batch similar prompts together for warm-start efficiency",
  },
];

// Cost tracking implementation
class CostTracker {
  private costs: Map<string, number> = new Map();

  recordGeneration(
    provider: string,
    tier: string,
    count: number = 1,
  ): number {
    const costPerImage: Record<string, Record<string, number>> = {
      openai: {
        standard: 0.016,
        hd: 0.120,
      },
      google: {
        flash_1k: 0.004,
        pro_4k: 0.240,
      },
      stability: {
        standard: 0.025,
        ultra: 0.080,
      },
    };

    const cost = (costPerImage[provider]?.[tier] || 0) * count;
    const key = `${provider}_${tier}`;
    this.costs.set(key, (this.costs.get(key) || 0) + cost);

    return cost;
  }

  getReport(): Record<string, unknown> {
    let totalCost = 0;
    const breakdown: Record<string, number> = {};

    this.costs.forEach((cost, key) => {
      breakdown[key] = cost;
      totalCost += cost;
    });

    return {
      totalCost: totalCost.toFixed(2),
      breakdown,
      monthlyProjection: (totalCost * 30).toFixed(2),
    };
  }
}
```

### 2. Pricing Models Comparison

Comprehensive pricing comparison for 2025 image generation APIs.

#### Pricing Table

| Provider      | Model              | Resolution     | Price/Image   | Notes               |
| ------------- | ------------------ | -------------- | ------------- | ------------------- |
| **OpenAI**    | DALL-E 3 Std       | 1024×1024      | $0.040        | Most creative       |
| **OpenAI**    | DALL-E 3 HD        | 1024×1792      | $0.080-$0.120 | Premium quality     |
| **OpenAI**    | DALL-E 2           | 1024×1024      | $0.016-$0.020 | Budget option       |
| **Google**    | Gemini Flash       | 1K (1024×1024) | $0.004        | **Cheapest option** |
| **Google**    | Gemini Flash       | 2K (2048×2048) | $0.134        | 1 per image         |
| **Google**    | Gemini Pro         | 4K (4096×4096) | $0.240        | Highest quality     |
| **Stability** | SD 1.6             | 512×512        | $0.010        | Open source base    |
| **Stability** | SD 3.5 Large       | 1024×1024      | $0.065        | Latest model        |
| **Stability** | Stable Image Ultra | 1024×1024      | $0.080        | Premium stability   |

#### Cost at Scale Examples

```typescript
interface ScaleAnalysis {
  provider: string;
  monthlyImages: number;
  costPerImage: number;
  monthlyCost: number;
  yearlyCost: number;
}

const scaleAnalysis: ScaleAnalysis[] = [
  {
    provider: "Gemini Flash",
    monthlyImages: 10000,
    costPerImage: 0.004,
    monthlyCost: 40,
    yearlyCost: 480,
  },
  {
    provider: "Stable Diffusion 3.5",
    monthlyImages: 10000,
    costPerImage: 0.065,
    monthlyCost: 650,
    yearlyCost: 7800,
  },
  {
    provider: "DALL-E 3 Standard",
    monthlyImages: 10000,
    costPerImage: 0.040,
    monthlyCost: 400,
    yearlyCost: 4800,
  },
];

// At 10,000 images/month: Gemini saves $360-$610/month vs competitors
```

### 3. Usage Tracking and Monitoring

Implement comprehensive usage monitoring to control costs.

```typescript
interface UsageMetrics {
  timestamp: number;
  provider: string;
  model: string;
  resolution: string;
  costAmount: number;
  duration: number; // milliseconds
  success: boolean;
  error?: string;
}

class UsageMonitor {
  private metrics: UsageMetrics[] = [];
  private dailyAlert = 100; // Alert if daily cost exceeds $100

  recordUsage(metrics: UsageMetrics): void {
    this.metrics.push(metrics);
    this.checkAlerts();
  }

  private checkAlerts(): void {
    const today = new Date().toDateString();
    const todayMetrics = this.metrics.filter(
      m => new Date(m.timestamp).toDateString() === today,
    );
    const dailyCost = todayMetrics.reduce((sum, m) => sum + m.costAmount, 0);

    if (dailyCost > this.dailyAlert) {
      console.warn(
        `Daily usage alert: $${dailyCost.toFixed(2)} spent today`,
      );
    }
  }

  getDailyReport(date: Date): Record<string, unknown> {
    const dateStr = date.toDateString();
    const dayMetrics = this.metrics.filter(
      m => new Date(m.timestamp).toDateString() === dateStr,
    );

    const providerCosts: Record<string, number> = {};
    let totalCost = 0;
    let successCount = 0;
    let failureCount = 0;
    let totalDuration = 0;

    dayMetrics.forEach(m => {
      totalCost += m.costAmount;
      totalDuration += m.duration;
      if (m.success) successCount++;
      else failureCount++;
      providerCosts[m.provider] = (providerCosts[m.provider] || 0)
        + m.costAmount;
    });

    return {
      date: dateStr,
      imageCount: dayMetrics.length,
      totalCost: totalCost.toFixed(2),
      successRate: ((successCount / dayMetrics.length) * 100).toFixed(1),
      avgDuration: (totalDuration / dayMetrics.length).toFixed(0),
      providerBreakdown: providerCosts,
    };
  }
}
```

---

## Quality Assurance

### 1. Output Validation

Validate generated images for quality and compliance before serving to users.

```typescript
import sharp from "sharp";

interface ImageValidationConfig {
  minWidth: number;
  minHeight: number;
  maxFileSizeBytes: number;
  requiredFormat: "jpeg" | "png" | "webp" | "avif";
}

async function validateImage(
  imageUrl: string,
  config: ImageValidationConfig,
): Promise<{ valid: boolean; errors: string[]; }> {
  const errors: string[] = [];

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      errors.push(`HTTP ${response.status}: Failed to fetch image`);
      return { valid: false, errors };
    }

    const buffer = await response.arrayBuffer();
    const size = buffer.byteLength;

    if (size > config.maxFileSizeBytes) {
      errors.push(
        `File size ${size} bytes exceeds maximum ${config.maxFileSizeBytes}`,
      );
    }

    // Analyze image metadata using sharp
    const metadata = await sharp(Buffer.from(buffer)).metadata();

    if (!metadata.width || metadata.width < config.minWidth) {
      errors.push(
        `Image width ${metadata.width} below minimum ${config.minWidth}`,
      );
    }

    if (!metadata.height || metadata.height < config.minHeight) {
      errors.push(
        `Image height ${metadata.height} below minimum ${config.minHeight}`,
      );
    }

    if (metadata.format !== config.requiredFormat) {
      errors.push(
        `Image format ${metadata.format} != required ${config.requiredFormat}`,
      );
    }

    // Check for corruption
    try {
      await sharp(Buffer.from(buffer)).rotate().toBuffer();
    } catch {
      errors.push("Image may be corrupted");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Validation error: ${String(error)}`],
    };
  }
}
```

### 2. Format Conversion Best Practices

Optimize image formats for different use cases and platforms.

#### Format Selection Guide

| Format   | Best For                     | Compression              | Transparency         | Browser Support |
| -------- | ---------------------------- | ------------------------ | -------------------- | --------------- |
| **JPEG** | Photographs, continuous tone | 10:1 lossy               | No                   | 100%            |
| **PNG**  | Graphics, text, transparency | 2:1 lossless             | Yes                  | 100%            |
| **WebP** | Web optimization             | 25-35% smaller than JPEG | Yes (lossy+lossless) | 97%             |
| **AVIF** | Maximum compression          | 50% smaller than WebP    | Yes                  | 85%+            |
| **HEIC** | Apple devices                | Excellent                | Yes                  | Limited         |

**TypeScript Implementation**:

```typescript
import sharp from "sharp";

interface FormatConversionConfig {
  quality: number; // 1-100
  progressive: boolean; // For JPEG
  colors?: number; // For PNG
}

async function convertImageFormat(
  sourceBuffer: Buffer,
  targetFormat: "jpeg" | "png" | "webp" | "avif",
  config: Partial<FormatConversionConfig> = {},
): Promise<Buffer> {
  const defaultConfig: FormatConversionConfig = {
    quality: 80,
    progressive: true,
    colors: 256,
    ...config,
  };

  let pipeline = sharp(sourceBuffer);

  switch (targetFormat) {
    case "jpeg":
      return pipeline
        .jpeg({
          quality: defaultConfig.quality,
          progressive: defaultConfig.progressive,
          mozjpeg: true, // Better compression
        })
        .toBuffer();

    case "png":
      return pipeline
        .png({
          compressionLevel: 9,
          colors: defaultConfig.colors,
        })
        .toBuffer();

    case "webp":
      return pipeline
        .webp({
          quality: defaultConfig.quality,
        })
        .toBuffer();

    case "avif":
      return pipeline
        .avif({
          quality: defaultConfig.quality,
        })
        .toBuffer();

    default:
      throw new Error(`Unsupported format: ${targetFormat}`);
  }
}

// Example: Convert to multiple formats for different devices
async function generateResponsiveFormats(
  sourceBuffer: Buffer,
): Promise<Record<string, Buffer>> {
  const formats = ["jpeg", "webp", "avif"] as const;
  const results: Record<string, Buffer> = {};

  for (const format of formats) {
    results[format] = await convertImageFormat(sourceBuffer, format, {
      quality: 80,
    });
  }

  return results;
}
```

### 3. Resolution Scaling Techniques

Properly handle resolution scaling and upscaling for different use cases.

```typescript
import sharp from "sharp";

interface ScalingConfig {
  maxWidth: number;
  maxHeight: number;
  fit: "cover" | "contain" | "fill" | "inside" | "outside";
  withoutEnlargement: boolean;
  position?: string;
}

async function scaleImage(
  imageBuffer: Buffer,
  config: ScalingConfig,
): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(config.maxWidth, config.maxHeight, {
      fit: config.fit,
      withoutEnlargement: config.withoutEnlargement,
      position: config.position || "center",
    })
    .toBuffer();
}

// High-DPI Support
async function generateHighDPIVariants(
  sourceBuffer: Buffer,
  displayWidth: number,
  displayHeight: number,
): Promise<Record<string, Buffer>> {
  const variants: Record<string, Buffer> = {};

  // 1x - Standard density
  variants["1x"] = await scaleImage(sourceBuffer, {
    maxWidth: displayWidth,
    maxHeight: displayHeight,
    fit: "cover",
    withoutEnlargement: true,
  });

  // 2x - Retina/High-DPI
  variants["2x"] = await scaleImage(sourceBuffer, {
    maxWidth: displayWidth * 2,
    maxHeight: displayHeight * 2,
    fit: "cover",
    withoutEnlargement: false, // Allow enlargement for high-DPI
  });

  // 3x - Premium high-DPI (iPad Pro, Galaxy S21+)
  variants["3x"] = await scaleImage(sourceBuffer, {
    maxWidth: displayWidth * 3,
    maxHeight: displayHeight * 3,
    fit: "cover",
    withoutEnlargement: false,
  });

  return variants;
}

// Aspect ratio preservation
async function cropToAspectRatio(
  imageBuffer: Buffer,
  targetAspectRatio: number,
): Promise<Buffer> {
  const metadata = await sharp(imageBuffer).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("Unable to determine image dimensions");
  }

  const currentRatio = metadata.width / metadata.height;
  const { width, height } = metadata;

  let newWidth = width;
  let newHeight = height;

  if (currentRatio > targetAspectRatio) {
    // Image too wide
    newWidth = Math.round(height * targetAspectRatio);
  } else {
    // Image too tall
    newHeight = Math.round(width / targetAspectRatio);
  }

  return sharp(imageBuffer)
    .resize(newWidth, newHeight, {
      fit: "cover",
      position: "center",
    })
    .toBuffer();
}
```

---

## Provider Comparison

### Feature Matrix (2025)

| Feature              | OpenAI            | Google Gemini   | Stable Diffusion | Replicate   |
| -------------------- | ----------------- | --------------- | ---------------- | ----------- |
| **Text Rendering**   | Excellent         | Excellent       | Good             | Variable    |
| **Speed**            | Moderate (10-60s) | Fast (3-5s)     | Very Fast (5-8s) | Varies      |
| **Cost**             | High              | Low-Medium      | Low              | Low-Medium  |
| **Customization**    | Limited           | Medium          | Excellent        | Excellent   |
| **API Stability**    | Very Stable       | Stable          | Stable           | Good        |
| **Free Tier**        | Limited           | 1500 images/day | N/A              | Yes         |
| **Batch Processing** | Supported         | Via API         | Supported        | Supported   |
| **Commercial Use**   | Allowed           | Allowed         | Allowed          | Check model |

### Selection Criteria

```typescript
interface ProviderSelectionCriteria {
  budget: "ultra-low" | "low" | "medium" | "high";
  speed: "fast" | "moderate" | "any";
  volume: number; // Images per month
  textQuality: "essential" | "important" | "optional";
  customization: "high" | "medium" | "low";
}

function selectBestProvider(criteria: ProviderSelectionCriteria): string {
  // Ultra-low budget + high volume: Gemini Flash
  if (criteria.budget === "ultra-low" && criteria.volume > 5000) {
    return "Google Gemini Flash";
  }

  // Speed is critical: Stable Diffusion + Gemini Flash
  if (criteria.speed === "fast") {
    return "Stable Diffusion or Gemini Flash";
  }

  // Text rendering essential: DALL-E 3 or Gemini Pro
  if (criteria.textQuality === "essential") {
    return criteria.budget === "high" ? "DALL-E 3" : "Google Gemini Pro";
  }

  // Customization important: Stable Diffusion
  if (criteria.customization === "high") {
    return "Stable Diffusion 3.5";
  }

  // Default: balanced provider
  return "Google Gemini Flash";
}
```

---

## References

### Official Documentation

- [Google Gemini Image Generation API](https://ai.google.dev/gemini-api/docs/image-generation)
- [OpenAI Image Generation API Guide](https://platform.openai.com/docs/guides/images)
- [Google Cloud Imagen API](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/imagen-api)

### Pricing and Comparison

- [OpenAI Image Generation Pricing](https://openai.com/pricing)
- [Google Gemini Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Top 10 Image Generation APIs 2025](https://www.pixazo.ai/blog/top-image-generation-apis)
- [Comprehensive Image Generation API Guide 2025](https://www.cursor-ide.com/blog/comprehensive-image-generation-api-guide-2025-english)

### Prompt Engineering and Performance

- [Max Woolf's Nano Banana Prompt Engineering](https://minimaxir.com/2025/11/nano-banana-prompts/)
- [AI Image Generation Comparison: DALL-E vs Gemini vs Stable Diffusion](https://www.weblineindia.com/blog/ai-image-generation-dalle-vs-gemini-vs-stable-diffusion/)
- [FastAPI Streaming Response Best Practices](https://apidog.com/blog/fastapi-streaming-response/)

### Image Optimization and Formats

- [WebP Image Format Guide](https://developers.google.com/speed/webp)
- [JPEG vs PNG vs WebP vs AVIF Comparison 2025](https://www.thecssagency.com/blog/best-web-image-format)
- [Image Format Selection Guide](https://strapi.io/blog/image-file-format-guide)
- [DebugBear: Image Format Optimization Guide](https://www.debugbear.com/blog/image-formats)

### Error Handling and Rate Limiting

- [Google Gemini API Rate Limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- [OpenAI Rate Limit Documentation](https://help.openai.com/en/articles/6696591-what-are-the-rate-limits-for-image-generation)
- [Stability AI REST API Reference](https://platform.stability.ai/docs/api-reference)

---

## Related Documentation

- [Image Enhancement App Implementation Guide](../image-enhancement-app.md)
- [Token Economy System](../token-economy.md)
- [API Integration Patterns](../api-integration.md)
- [Performance Monitoring](../monitoring.md)

---

**Last Updated**: December 2025 **Maintained By**: Spike Land Development Team
