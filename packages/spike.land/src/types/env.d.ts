/**
 * Environment variable type declarations
 *
 * This file extends the NodeJS.ProcessEnv interface to provide
 * type-safe access to environment variables used in this project.
 *
 * @see https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Authentication
      AUTH_SECRET?: string;
      AUTH_DEBUG?: string;
      AUTH_APPLE_ID?: string;
      AUTH_APPLE_SECRET?: string;
      AUTH_FACEBOOK_ID?: string;
      AUTH_FACEBOOK_SECRET?: string;
      APPLE_KEY_ID?: string;
      APPLE_TEAM_ID?: string;
      APPLE_PRIVATE_KEY?: string;
      APPLE_PRIVATE_KEY_PATH?: string;
      NEXTAUTH_URL?: string;

      // Database
      DATABASE_URL?: string;
      DATABASE_URL_E2E?: string;

      // Node.js
      NODE_ENV?: "development" | "production" | "test";
      DEBUG?: string;
      PORT?: string;
      CI?: string;

      // Application Environment
      APP_ENV?: "development" | "staging" | "production";

      // Next.js
      NEXT_RUNTIME?: string;
      NEXT_PHASE?: string;
      NEXT_DEPLOYMENT_ID?: string;
      SKIP_TS_BUILD_CHECK?: string;

      // Vercel
      VERCEL_DEPLOYMENT_ID?: string;
      VERCEL_GIT_COMMIT_SHA?: string;
      VERCEL_PROJECT_PRODUCTION_URL?: string;

      // Public env vars (client-side)
      NEXT_PUBLIC_APP_URL?: string;
      NEXT_PUBLIC_BASE_URL?: string;
      NEXT_PUBLIC_GA_MEASUREMENT_ID?: string;
      NEXT_PUBLIC_META_PIXEL_ID?: string;
      NEXT_PUBLIC_PEER_SERVER_HOST?: string;
      NEXT_PUBLIC_PEER_SERVER_PATH?: string;
      NEXT_PUBLIC_PEER_SERVER_PORT?: string;
      NEXT_PUBLIC_PEER_SERVER_SECURE?: string;
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;

      // Cloudflare
      CLOUDFLARE_API_TOKEN?: string;
      CLOUDFLARE_ACCOUNT_ID?: string;
      CLOUDFLARE_R2_ACCESS_KEY_ID?: string;
      CLOUDFLARE_R2_SECRET_ACCESS_KEY?: string;
      CLOUDFLARE_R2_BUCKET_NAME?: string;
      CLOUDFLARE_R2_ENDPOINT?: string;
      CLOUDFLARE_R2_PUBLIC_URL?: string;
      CLOUDFLARE_R2_AUDIO_BUCKET_NAME?: string;
      CLOUDFLARE_R2_AUDIO_PUBLIC_URL?: string;

      // S3 / Object Storage (AWS S3 or S3-compatible like R2)
      S3_ENDPOINT?: string;
      S3_ACCESS_KEY_ID?: string;
      S3_SECRET_ACCESS_KEY?: string;
      S3_BUCKET_NAME?: string;
      S3_PUBLIC_URL?: string;
      S3_REGION?: string;
      S3_AUDIO_BUCKET_NAME?: string;
      S3_AUDIO_PUBLIC_URL?: string;

      // AWS
      AWS_REGION?: string;

      // AI Services
      ANTHROPIC_API_KEY?: string;
      CLAUDE_API_KEY?: string;
      GEMINI_API_KEY?: string;
      GEMINI_TIMEOUT_MS?: string;
      CLAUDE_CODE_OAUTH_TOKEN?: string;

      // Stripe
      STRIPE_SECRET_KEY?: string;
      STRIPE_WEBHOOK_SECRET?: string;
      STRIPE_PRICE_TIER_BASIC?: string;
      STRIPE_PRICE_TIER_STANDARD?: string;
      STRIPE_PRICE_TIER_PREMIUM?: string;

      // Redis/KV
      UPSTASH_REDIS_REST_URL?: string;
      UPSTASH_REDIS_REST_TOKEN?: string;
      KV_REST_API_URL?: string;
      KV_REST_API_TOKEN?: string;
      REDIS_URL?: string;

      // Email
      RESEND_API_KEY?: string;
      RESEND_AUDIENCE_ID?: string;
      EMAIL_FROM?: string;

      // Discord
      DISCORD_BOT_TOKEN?: string;
      DISCORD_SERVER_ID?: string;
      DISCORD_ANNOUNCEMENT_CHANNEL_ID?: string;

      // Slack
      SLACK_WEBHOOK_URL?: string;

      // Twilio
      TWILIO_ACCOUNT_SID?: string;
      TWILIO_AUTH_TOKEN?: string;

      // GitHub
      GITHUB_ID?: string;
      GITHUB_SECRET?: string;
      GITHUB_OWNER?: string;
      GITHUB_REPO?: string;
      GITHUB_PROJECT_NUMBER?: string;
      GITHUB_PROJECT_ID?: string;
      GH_PAT_TOKEN?: string;

      // Google
      GOOGLE_ID?: string;
      GOOGLE_SECRET?: string;
      GOOGLE_CLIENT_ID?: string;
      GOOGLE_CLIENT_SECRET?: string;
      GOOGLE_ADS_CUSTOMER_ID?: string;
      GOOGLE_ADS_DEVELOPER_TOKEN?: string;
      GOOGLE_ADS_CALLBACK_URL?: string;
      GA_MEASUREMENT_ID?: string;
      GA_API_SECRET?: string;

      // Facebook/Meta
      FACEBOOK_MARKETING_APP_ID?: string;
      FACEBOOK_MARKETING_APP_SECRET?: string;
      FACEBOOK_SOCIAL_APP_ID?: string;
      FACEBOOK_SOCIAL_APP_SECRET?: string;
      FACEBOOK_CALLBACK_URL?: string;
      FACEBOOK_SOCIAL_CALLBACK_URL?: string;
      FACEBOOK_GRAPH_API_VERSION?: string;

      // Instagram
      INSTAGRAM_CONTAINER_STATUS_MAX_ATTEMPTS?: string;
      INSTAGRAM_CONTAINER_STATUS_POLL_INTERVAL_MS?: string;

      // LinkedIn
      LINKEDIN_CLIENT_ID?: string;
      LINKEDIN_CLIENT_SECRET?: string;
      LINKEDIN_CALLBACK_URL?: string;

      // Pinterest
      PINTEREST_APP_ID?: string;
      PINTEREST_APP_SECRET?: string;

      // Snapchat
      SNAPCHAT_CLIENT_ID?: string;
      SNAPCHAT_CLIENT_SECRET?: string;

      // TikTok
      TIKTOK_CLIENT_KEY?: string;
      TIKTOK_CLIENT_SECRET?: string;

      // Twitter/X
      TWITTER_CLIENT_ID?: string;
      TWITTER_CLIENT_SECRET?: string;
      NITTER_INSTANCE_URL?: string;

      // YouTube
      YOUTUBE_CLIENT_ID?: string;
      YOUTUBE_CLIENT_SECRET?: string;
      YOUTUBE_CALLBACK_URL?: string;

      // Jules
      JULES_API_KEY?: string;

      // Prodigi
      PRODIGI_API_KEY?: string;
      PRODIGI_SANDBOX?: string;
      PRODIGI_WEBHOOK_SECRET?: string;

      // Spike Land
      SPIKE_LAND_API_KEY?: string;
      SPIKE_LAND_API_URL?: string;
      SPIKE_LAND_COMPONENT_URL?: string;
      SPIKE_LAND_SERVICE_TOKEN?: string;
      SPIKE_LAND_SUPER_ADMIN_EMAIL?: string;
      SPIKE_API_KEY?: string;

      // Agent/MCP
      AGENT_API_KEY?: string;
      AGENT_REQUIRE_PERMISSIONS?: string;
      AGENT_MAX_ITERATIONS?: string;
      AGENT_USE_QUEUE?: string;
      MCP_DOCKER_URL?: string;
      USE_INPROCESS_MCP?: string;
      SMITHERY_API_KEY?: string;

      // OpenClaw
      OPENCLAW_GATEWAY_URL?: string;

      // Cron
      CRON_SECRET?: string;

      // Sandbox/Boxes
      SANDBOX_CALLBACK_SECRET?: string;
      SANDBOX_TIMEOUT_MINUTES?: string;
      BOX_EC2_AMI_ID?: string;
      BOX_EC2_INSTANCE_TYPE?: string;
      BOX_EC2_KEY_NAME?: string;
      BOX_EC2_REGION?: string;
      BOX_EC2_SECURITY_GROUP_ID?: string;
      BOX_EC2_SUBNET_ID?: string;
      BOX_PROVISIONING_SECRET?: string;
      BOX_PROVISIONING_WEBHOOK_URL?: string;
      BOX_VNC_TOKEN_SECRET?: string;
      VNC_TOKEN_SECRET?: string;

      // Registration
      REGISTRATION_OPEN?: string;
      SKIP_RATE_LIMIT?: string;

      // Career/Job Search
      ADZUNA_APP_ID?: string;
      ADZUNA_APP_KEY?: string;

      // Neon
      NEON_API_KEY?: string;
      NEON_PROJECT_ID?: string;

      // Agent URLs
      CREATE_AGENT_PORT?: string;
      CREATE_AGENT_SECRET?: string;
      CREATE_AGENT_URL?: string;
      LEARNIT_AGENT_PORT?: string;
      LEARNIT_AGENT_SECRET?: string;
      LEARNIT_AGENT_URL?: string;

      // Database (additional)
      DATABASE_URL_PROD?: string;

      // UI
      UI_BASE_URL?: string;

      // Testing
      BASE_URL?: string;
      E2E_BYPASS_AUTH?: string;
      E2E_BYPASS_SECRET?: string;
      E2E_CACHE_DIR?: string;
      E2E_COVERAGE?: string;
      E2E_DATABASE_CONFIRMED?: string;
      HEADLESS?: string;
      TEST_CACHE_DIR?: string;
      VITEST_COVERAGE?: string;

      // Enhancement
      ENHANCEMENT_EXECUTION_MODE?: string;
      ENHANCEMENT_TIMEOUT_SECONDS?: string;
      ANALYSIS_TIMEOUT_MS?: string;

      // Security
      TOKEN_ENCRYPTION_KEY?: string;
      USER_ID_SALT?: string;
      BLOCKED_EMAIL_DOMAINS?: string;
      SECRET?: string;
      TOKEN?: string;
      VAULT_MASTER_KEY?: string;
      INTERNAL_API_KEY?: string;

      // ElevenLabs TTS
      ELEVENLABS_API_KEY?: string;
      ELEVENLABS_VOICE_ID?: string;

      // Workflow
      WORKFLOW_RUNTIME?: string;
    }
  }
}

export {};
