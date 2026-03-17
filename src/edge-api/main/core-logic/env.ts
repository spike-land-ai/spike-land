/// <reference types="@cloudflare/workers-types" />

export interface Variables {
  userId: string;
  userEmail: string;
  requestId: string;
}

export interface Env {
  R2: R2Bucket;
  SPA_ASSETS: R2Bucket;
  DB: D1Database;
  LIMITERS: DurableObjectNamespace;
  SPIKE_CHAT_SESSIONS: DurableObjectNamespace;
  AUTH_MCP: Fetcher;
  MCP_SERVICE: Fetcher;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  OPENAI_API_KEY?: string;
  GEMINI_API_KEY: string;
  CLAUDE_OAUTH_TOKEN: string;
  LLM_CONTEXT_WINDOW?: string;
  GITHUB_TOKEN: string;
  ALLOWED_ORIGINS: string;
  QUIZ_BADGE_SECRET: string;
  GA_MEASUREMENT_ID: string;
  GA_API_SECRET: string;
  INTERNAL_SERVICE_SECRET: string;
  WHATSAPP_APP_SECRET: string;
  WHATSAPP_ACCESS_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_VERIFY_TOKEN: string;
  MCP_INTERNAL_SECRET: string;
  CF_ZONE_ID: string;
  CF_CACHE_PURGE_TOKEN: string;
  XAI_API_KEY: string;
  ELEVENLABS_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REFRESH_TOKEN: string;
  GA_PROPERTY_ID: string;
  OLLAMA_ENDPOINT?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
  SENTRY_DSN?: string;
  SENTRY_TRACES_SAMPLE_RATE?: string;
  PRD_COMPRESSION_MODE?: string;
  PRD_COMPRESSION_EXPOSE?: string;
  /**
   * 32-byte (256-bit) random secret used to derive the AES-256-GCM key for
   * encrypting donated API keys at rest in D1.
   * Required for POST /v1/donate-token to function.
   * Generate with: openssl rand -base64 32
   */
  TOKEN_ENCRYPTION_KEY?: string;
  ANALYTICS: AnalyticsEngineDataset;
  /** Set to "development" or "local" in dev wrangler config to enable draft posts */
  ENVIRONMENT?: string;
}
