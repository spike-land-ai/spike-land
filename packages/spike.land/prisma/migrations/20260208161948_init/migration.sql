-- CreateEnum
CREATE TYPE "ObjectiveType" AS ENUM ('AWARENESS', 'ENGAGEMENT', 'CONVERSION', 'RETENTION', 'ADVOCACY');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "MarketingPlatform" AS ENUM ('FACEBOOK', 'GOOGLE_ADS');

-- CreateEnum
CREATE TYPE "AppStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "AppBuildStatus" AS ENUM ('PROMPTING', 'WAITING', 'DRAFTING', 'BUILDING', 'FINE_TUNING', 'TEST', 'LIVE', 'ARCHIVED', 'FAILED');

-- CreateEnum
CREATE TYPE "InboxSentiment" AS ENUM ('POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED');

-- CreateEnum
CREATE TYPE "EscalationStatus" AS ENUM ('NONE', 'PENDING', 'ESCALATED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "EscalationEventType" AS ENUM ('ESCALATED', 'DE_ESCALATED', 'ASSIGNED', 'SLA_WARNING', 'SLA_BREACH', 'RESOLVED');

-- CreateEnum
CREATE TYPE "EscalationTrigger" AS ENUM ('SENTIMENT', 'PRIORITY', 'SLA_TIMEOUT', 'MANUAL', 'RULE');

-- CreateEnum
CREATE TYPE "AppMessageRole" AS ENUM ('USER', 'AGENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "RequirementPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RequirementStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MonetizationType" AS ENUM ('FREE', 'ONE_TIME', 'SUBSCRIPTION', 'FREEMIUM', 'USAGE_BASED');

-- CreateEnum
CREATE TYPE "SubscriptionInterval" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "McpJobType" AS ENUM ('GENERATE', 'MODIFY');

-- CreateEnum
CREATE TYPE "EnhancementTier" AS ENUM ('FREE', 'TIER_1K', 'TIER_2K', 'TIER_4K');

-- CreateEnum
CREATE TYPE "EnhancementType" AS ENUM ('STANDARD', 'BLEND', 'PIPELINE', 'AUTO_CROP');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('ANALYZING', 'CROPPING', 'PROMPTING', 'GENERATING');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'UNPAID', 'TRIALING');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'BASIC', 'STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "WorkspaceSubscriptionTier" AS ENUM ('FREE', 'PRO', 'BUSINESS');

-- CreateEnum
CREATE TYPE "AlbumPrivacy" AS ENUM ('PRIVATE', 'UNLISTED', 'PUBLIC');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('ROLE_CHANGE', 'TOKEN_ADJUSTMENT', 'VOUCHER_CREATE', 'VOUCHER_UPDATE', 'VOUCHER_DELETE', 'USER_DELETE', 'ADMIN_LOGIN', 'USER_LOGIN', 'USER_LOGOUT', 'SESSION_REFRESH', 'WORKSPACE_CREATE', 'WORKSPACE_UPDATE', 'WORKSPACE_DELETE', 'WORKSPACE_MEMBER_ADD', 'WORKSPACE_MEMBER_REMOVE', 'WORKSPACE_SETTINGS_CHANGE', 'CONTENT_CREATE', 'CONTENT_UPDATE', 'CONTENT_DELETE', 'CONTENT_PUBLISH', 'CONTENT_UNPUBLISH', 'CONTENT_SCHEDULE', 'AI_GENERATION_REQUEST', 'AI_GENERATION_COMPLETE', 'AI_APPROVAL', 'AI_REJECTION', 'AI_FEEDBACK', 'INTEGRATION_CONNECT', 'INTEGRATION_DISCONNECT', 'INTEGRATION_SYNC', 'DATA_EXPORT', 'DATA_IMPORT', 'RELAY_DRAFT_CREATE', 'RELAY_DRAFT_APPROVE', 'RELAY_DRAFT_REJECT', 'RELAY_DRAFT_EDIT', 'RELAY_DRAFT_SEND');

-- CreateEnum
CREATE TYPE "ErrorEnvironment" AS ENUM ('FRONTEND', 'BACKEND');

-- CreateEnum
CREATE TYPE "GalleryCategory" AS ENUM ('PORTRAIT', 'LANDSCAPE', 'PRODUCT', 'ARCHITECTURE');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'FAILED');

-- CreateEnum
CREATE TYPE "BoxStatus" AS ENUM ('CREATING', 'STARTING', 'RUNNING', 'PAUSED', 'STOPPING', 'STOPPED', 'TERMINATED', 'ERROR');

-- CreateEnum
CREATE TYPE "BoxActionType" AS ENUM ('CREATE', 'START', 'STOP', 'RESTART', 'DELETE', 'CLONE');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'CONNECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AgentMessageRole" AS ENUM ('USER', 'AGENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "SandboxJobStatus" AS ENUM ('PENDING', 'SPAWNING', 'RUNNING', 'COMPLETED', 'FAILED', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "BoxMessageRole" AS ENUM ('USER', 'AGENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "PipelineVisibility" AS ENUM ('PRIVATE', 'PUBLIC', 'LINK');

-- CreateEnum
CREATE TYPE "AudioStorageType" AS ENUM ('R2', 'OPFS');

-- CreateEnum
CREATE TYPE "AttributionType" AS ENUM ('FIRST_TOUCH', 'LAST_TOUCH', 'LINEAR', 'TIME_DECAY', 'POSITION_BASED');

-- CreateEnum
CREATE TYPE "ConversionType" AS ENUM ('SIGNUP', 'ENHANCEMENT', 'PURCHASE');

-- CreateEnum
CREATE TYPE "PodProvider" AS ENUM ('PRODIGI', 'PRINTFUL');

-- CreateEnum
CREATE TYPE "MerchOrderStatus" AS ENUM ('PENDING', 'PAYMENT_PENDING', 'PAID', 'SUBMITTED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "HypothesisStatus" AS ENUM ('PROPOSED', 'APPROVED', 'TESTING', 'VALIDATED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AgentProvider" AS ENUM ('JULES', 'CODEX', 'OTHER');

-- CreateEnum
CREATE TYPE "ExternalAgentStatus" AS ENUM ('QUEUED', 'PLANNING', 'AWAITING_PLAN_APPROVAL', 'AWAITING_USER_FEEDBACK', 'IN_PROGRESS', 'PAUSED', 'FAILED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('TWITTER', 'LINKEDIN', 'FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'DISCORD', 'SNAPCHAT', 'PINTEREST');

-- CreateEnum
CREATE TYPE "SocialAccountStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'ERROR', 'RATE_LIMITED', 'RESTRICTED', 'SUSPENDED', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "SocialPostStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "RewriteStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ContentPlatform" AS ENUM ('TWITTER', 'LINKEDIN', 'INSTAGRAM', 'FACEBOOK', 'GENERAL');

-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "GuardrailType" AS ENUM ('PROHIBITED_TOPIC', 'REQUIRED_DISCLOSURE', 'CONTENT_WARNING');

-- CreateEnum
CREATE TYPE "GuardrailSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "VocabularyType" AS ENUM ('PREFERRED', 'BANNED', 'REPLACEMENT');

-- CreateEnum
CREATE TYPE "ConnectionNextStep" AS ENUM ('REPLY', 'REACH_OUT', 'SUGGEST_COFFEE', 'SCHEDULE_MEET', 'FOLLOW_UP', 'NONE');

-- CreateEnum
CREATE TYPE "MeetupPipelineStatus" AS ENUM ('NONE', 'INTERESTED', 'CHATTING', 'SUGGESTED', 'SCHEDULED', 'MET', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('FOLLOW_UP', 'REPLY', 'REACH_OUT', 'MEETUP', 'BIRTHDAY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'DUE', 'SNOOZED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScheduledPostStatus" AS ENUM ('DRAFT', 'PENDING', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContentSuggestionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'MODIFIED');

-- CreateEnum
CREATE TYPE "InboxItemType" AS ENUM ('MENTION', 'COMMENT', 'DIRECT_MESSAGE', 'REPLY', 'REVIEW');

-- CreateEnum
CREATE TYPE "InboxItemStatus" AS ENUM ('UNREAD', 'READ', 'PENDING_REPLY', 'REPLIED', 'ARCHIVED', 'IGNORED');

-- CreateEnum
CREATE TYPE "RelayDraftStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "DraftEditType" AS ENUM ('MINOR_TWEAK', 'TONE_ADJUSTMENT', 'CONTENT_REVISION', 'COMPLETE_REWRITE', 'PLATFORM_FORMATTING');

-- CreateEnum
CREATE TYPE "DraftAuditAction" AS ENUM ('CREATED', 'VIEWED', 'EDITED', 'APPROVED', 'REJECTED', 'SENT', 'SEND_FAILED', 'REGENERATED');

-- CreateEnum
CREATE TYPE "CrisisSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CrisisEventStatus" AS ENUM ('DETECTED', 'ACKNOWLEDGED', 'RESOLVED', 'FALSE_ALARM');

-- CreateEnum
CREATE TYPE "CrisisRuleType" AS ENUM ('SENTIMENT_THRESHOLD', 'ENGAGEMENT_DROP', 'MENTION_SPIKE', 'FOLLOWER_DROP', 'VIRAL_COMPLAINT', 'MANUAL');

-- CreateEnum
CREATE TYPE "AccountHealthStatus" AS ENUM ('HEALTHY', 'DEGRADED', 'UNHEALTHY', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AccountIssueType" AS ENUM ('TOKEN_EXPIRED', 'TOKEN_EXPIRING_SOON', 'RATE_LIMITED', 'API_ERROR', 'PERMISSION_DENIED', 'ACCOUNT_RESTRICTED', 'ACCOUNT_SUSPENDED', 'SYNC_FAILED', 'CONNECTION_LOST', 'QUOTA_EXCEEDED');

-- CreateEnum
CREATE TYPE "AccountHealthEventType" AS ENUM ('STATUS_CHANGED', 'SCORE_DECREASED', 'SCORE_RECOVERED', 'RATE_LIMIT_HIT', 'RATE_LIMIT_CLEARED', 'ERROR_OCCURRED', 'ERROR_RESOLVED', 'TOKEN_REFRESHED', 'TOKEN_EXPIRED', 'ACCOUNT_RECOVERED', 'MANUAL_INTERVENTION');

-- CreateEnum
CREATE TYPE "IssueSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PolicyCategory" AS ENUM ('CONTENT_GUIDELINES', 'AD_COMPLIANCE', 'CHARACTER_LIMITS', 'PROHIBITED_CONTENT', 'CLAIMS_RESTRICTIONS', 'BRAND_SAFETY', 'ACCESSIBILITY', 'HASHTAG_RULES', 'LINK_POLICIES', 'MEDIA_REQUIREMENTS');

-- CreateEnum
CREATE TYPE "PolicyRuleType" AS ENUM ('KEYWORD_MATCH', 'REGEX_PATTERN', 'CHARACTER_COUNT', 'MEDIA_CHECK', 'LINK_VALIDATION', 'NLP_CLASSIFICATION', 'CUSTOM_LOGIC');

-- CreateEnum
CREATE TYPE "PolicySeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PolicyContentType" AS ENUM ('POST', 'AD', 'COMMENT', 'MESSAGE', 'BIO', 'STORY');

-- CreateEnum
CREATE TYPE "PolicyCheckScope" AS ENUM ('FULL', 'QUICK', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PolicyCheckStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PolicyCheckResult" AS ENUM ('PASSED', 'PASSED_WITH_WARNINGS', 'FAILED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "SuggestionContentType" AS ENUM ('POST', 'THREAD', 'STORY', 'REEL', 'ARTICLE');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DISMISSED', 'USED');

-- CreateEnum
CREATE TYPE "AllocatorPlatform" AS ENUM ('FACEBOOK_ADS', 'GOOGLE_ADS', 'LINKEDIN_ADS');

-- CreateEnum
CREATE TYPE "AllocatorAlertType" AS ENUM ('BUDGET_FLOOR_HIT', 'BUDGET_CEILING_HIT', 'DAILY_LIMIT_REACHED', 'COOLDOWN_ACTIVE', 'EMERGENCY_STOP_ACTIVATED', 'CONSECUTIVE_FAILURES', 'UNUSUAL_ACTIVITY');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AllocatorDecisionType" AS ENUM ('RECOMMENDATION_GENERATED', 'RECOMMENDATION_EVALUATED', 'EXECUTION_STARTED', 'EXECUTION_COMPLETED', 'EXECUTION_FAILED', 'EXECUTION_SKIPPED', 'ROLLBACK_INITIATED', 'ROLLBACK_COMPLETED', 'GUARDRAIL_TRIGGERED', 'EMERGENCY_STOP');

-- CreateEnum
CREATE TYPE "AllocatorDecisionOutcome" AS ENUM ('APPROVED', 'REJECTED', 'EXECUTED', 'FAILED', 'SKIPPED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "AbTestStatus" AS ENUM ('DRAFT', 'RUNNING', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('SOCIAL_POST', 'SCHEDULED_POST');

-- CreateEnum
CREATE TYPE "BoostRecommendationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'APPLIED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AppliedBoostStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AutopilotMode" AS ENUM ('CONSERVATIVE', 'MODERATE', 'AGGRESSIVE');

-- CreateEnum
CREATE TYPE "AutopilotExecutionStatus" AS ENUM ('PENDING', 'EXECUTING', 'COMPLETED', 'FAILED', 'SKIPPED', 'ROLLED_BACK', 'PAUSED');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WorkflowStepType" AS ENUM ('TRIGGER', 'ACTION', 'CONDITION');

-- CreateEnum
CREATE TYPE "WorkflowRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BranchType" AS ENUM ('IF_TRUE', 'IF_FALSE', 'SWITCH_CASE', 'DEFAULT');

-- CreateEnum
CREATE TYPE "StepRunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "WorkflowEventType" AS ENUM ('MENTION_RECEIVED', 'ENGAGEMENT_THRESHOLD', 'FOLLOWER_MILESTONE', 'CRISIS_DETECTED', 'POST_PUBLISHED', 'INBOX_ITEM_RECEIVED');

-- CreateEnum
CREATE TYPE "ConversionStatus" AS ENUM ('DRAFT', 'FETCHING_ENGAGEMENT', 'ANALYZING_AUDIENCE', 'ADAPTING_CREATIVE', 'READY_FOR_LAUNCH', 'LAUNCHING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "EngagerDataStatus" AS ENUM ('PENDING', 'FETCHING', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "IdentifierType" AS ENUM ('VISITOR_ID', 'USER_ID', 'EMAIL');

-- CreateEnum
CREATE TYPE "DomainVerificationStatus" AS ENUM ('PENDING', 'VERIFYING', 'VERIFIED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SslCertificateStatus" AS ENUM ('PENDING', 'PROVISIONING', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "CreativeSetStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CreativeVariantType" AS ENUM ('TEXT_ONLY', 'IMAGE_ONLY', 'COMBINED');

-- CreateEnum
CREATE TYPE "VariantStatus" AS ENUM ('PENDING', 'GENERATING', 'READY', 'ACTIVE', 'PAUSED', 'FAILED');

-- CreateEnum
CREATE TYPE "FatigueSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "LearnItRelationType" AS ENUM ('PARENT_CHILD', 'RELATED', 'PREREQUISITE');

-- CreateEnum
CREATE TYPE "LearnItStatus" AS ENUM ('GENERATING', 'PUBLISHED', 'HIDDEN', 'FAILED');

-- CreateEnum
CREATE TYPE "AgencyPortfolioCategory" AS ENUM ('AI_INTEGRATION', 'WEB_APP', 'MOBILE_APP', 'PROTOTYPE', 'OPEN_SOURCE');

-- CreateEnum
CREATE TYPE "AgencyInquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "CreatedAppStatus" AS ENUM ('GENERATING', 'PUBLISHED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stripeCustomerId" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "passwordHash" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_briefs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetAudience" JSONB NOT NULL,
    "campaignObjectives" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT,
    "templateId" TEXT,
    "toneOfVoice" TEXT,
    "keyMessages" TEXT[],
    "callToAction" TEXT,
    "brandGuidelines" JSONB,
    "budgetAmount" DOUBLE PRECISION,
    "budgetCurrency" TEXT DEFAULT 'GBP',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),

    CONSTRAINT "campaign_briefs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_target_audiences" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "ageMin" INTEGER,
    "ageMax" INTEGER,
    "genders" TEXT[],
    "locations" TEXT[],
    "interests" TEXT[],
    "behaviors" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_target_audiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_objectives" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "type" "ObjectiveType" NOT NULL,
    "metric" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION,
    "deadline" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "MarketingPlatform" NOT NULL,
    "accountId" TEXT NOT NULL,
    "accountName" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_ads_campaigns" (
    "id" TEXT NOT NULL,
    "marketingAccountId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "spend" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_ads_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "apps" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "forkedFrom" TEXT,
    "status" "AppBuildStatus" NOT NULL DEFAULT 'PROMPTING',
    "domain" TEXT,
    "codespaceId" TEXT,
    "codespaceUrl" TEXT,
    "isCurated" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "lastAgentActivity" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirements" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "RequirementPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "RequirementStatus" NOT NULL DEFAULT 'PENDING',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monetization_models" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "type" "MonetizationType" NOT NULL DEFAULT 'FREE',
    "price" DECIMAL(10,2),
    "subscriptionInterval" "SubscriptionInterval",
    "features" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monetization_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_messages" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "role" "AppMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_status_history" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "status" "AppBuildStatus" NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_images" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "r2Key" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'webp',
    "tags" TEXT[],
    "aiDescription" TEXT,
    "analysisJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_attachments" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_code_versions" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "messageId" TEXT,
    "code" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_code_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enhanced_images" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "originalUrl" TEXT NOT NULL,
    "originalR2Key" TEXT NOT NULL,
    "originalWidth" INTEGER NOT NULL,
    "originalHeight" INTEGER NOT NULL,
    "originalSizeBytes" INTEGER NOT NULL,
    "originalFormat" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "shareToken" TEXT,

    CONSTRAINT "enhanced_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image_enhancement_jobs" (
    "id" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" "EnhancementTier" NOT NULL,
    "enhancementType" "EnhancementType" NOT NULL DEFAULT 'STANDARD',
    "creditsCost" INTEGER NOT NULL,
    "status" "JobStatus" NOT NULL,
    "currentStage" "PipelineStage",
    "enhancedUrl" TEXT,
    "enhancedR2Key" TEXT,
    "enhancedWidth" INTEGER,
    "enhancedHeight" INTEGER,
    "enhancedSizeBytes" INTEGER,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "geminiPrompt" TEXT,
    "geminiModel" TEXT,
    "geminiTemp" DOUBLE PRECISION,
    "processingStartedAt" TIMESTAMP(3),
    "processingCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workflowRunId" TEXT,
    "analysisResult" JSONB,
    "analysisSource" TEXT,
    "altText" TEXT,
    "qualityScore" DOUBLE PRECISION,
    "wasCropped" BOOLEAN NOT NULL DEFAULT false,
    "cropDimensions" JSONB,
    "pipelineId" TEXT,
    "sourceImageId" TEXT,
    "isBlend" BOOLEAN NOT NULL DEFAULT false,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "image_enhancement_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "stripePriceId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "tier" "SubscriptionTier" NOT NULL DEFAULT 'BASIC',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "downgradeTo" "SubscriptionTier",
    "creditsPerMonth" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "creditsPerMonth" INTEGER NOT NULL,
    "priceGBP" DECIMAL(10,2) NOT NULL,
    "stripePriceId" TEXT NOT NULL,
    "priority" BOOLEAN NOT NULL DEFAULT false,
    "apiAccess" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "albums" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coverImageId" TEXT,
    "privacy" "AlbumPrivacy" NOT NULL DEFAULT 'PRIVATE',
    "defaultTier" "EnhancementTier" NOT NULL DEFAULT 'TIER_1K',
    "shareToken" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pipelineId" TEXT,

    CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "album_images" (
    "id" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "album_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "targetId" TEXT,
    "targetType" TEXT,
    "resourceId" TEXT,
    "resourceType" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_audit_logs" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "targetId" TEXT,
    "targetType" TEXT,
    "resourceId" TEXT,
    "resourceType" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_decision_logs" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "userId" TEXT,
    "requestType" TEXT NOT NULL,
    "inputPrompt" TEXT,
    "inputContext" JSONB,
    "outputResult" TEXT,
    "outputMetadata" JSONB,
    "modelId" TEXT,
    "modelVersion" TEXT,
    "tokensUsed" INTEGER,
    "latencyMs" INTEGER,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_decision_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_retention_policies" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "retentionDays" INTEGER NOT NULL DEFAULT 365,
    "archiveAfterDays" INTEGER,
    "deleteAfterDays" INTEGER,
    "actionTypes" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_retention_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archived_audit_logs" (
    "id" TEXT NOT NULL,
    "originalId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT,
    "targetType" TEXT,
    "resourceId" TEXT,
    "resourceType" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "originalCreatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retentionPolicyId" TEXT,
    "archiveReason" TEXT,

    CONSTRAINT "archived_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_logs" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "sourceFile" TEXT,
    "sourceLine" INTEGER,
    "sourceColumn" INTEGER,
    "callerName" TEXT,
    "userId" TEXT,
    "route" TEXT,
    "environment" "ErrorEnvironment" NOT NULL,
    "errorType" TEXT,
    "errorCode" TEXT,
    "metadata" JSONB,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inbox_suggested_responses" (
    "id" TEXT NOT NULL,
    "inboxItemId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inbox_suggested_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalation_events" (
    "id" TEXT NOT NULL,
    "inboxItemId" TEXT NOT NULL,
    "eventType" "EscalationEventType" NOT NULL,
    "fromLevel" INTEGER NOT NULL,
    "toLevel" INTEGER NOT NULL,
    "fromUserId" TEXT,
    "toUserId" TEXT,
    "reason" TEXT,
    "triggeredBy" "EscalationTrigger" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "escalation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "featured_gallery_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "GalleryCategory" NOT NULL DEFAULT 'PORTRAIT',
    "originalUrl" TEXT NOT NULL,
    "enhancedUrl" TEXT NOT NULL,
    "width" INTEGER NOT NULL DEFAULT 16,
    "height" INTEGER NOT NULL DEFAULT 9,
    "sourceImageId" TEXT,
    "sourceJobId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "featured_gallery_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "box_tiers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cpu" INTEGER NOT NULL,
    "ram" INTEGER NOT NULL,
    "storage" INTEGER NOT NULL,
    "pricePerHour" INTEGER NOT NULL,
    "pricePerMonth" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "box_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boxes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "tierId" TEXT,
    "status" "BoxStatus" NOT NULL DEFAULT 'STOPPED',
    "connectionUrl" TEXT,
    "storageVolumeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "boxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claude_code_agents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "projectPath" TEXT,
    "workingDirectory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "totalTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "totalTasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalSessionTime" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "claude_code_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_connection_requests" (
    "id" TEXT NOT NULL,
    "connectId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "displayName" TEXT,
    "projectPath" TEXT,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT,
    "agentId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "agent_connection_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_messages" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "role" "AgentMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "box_actions" (
    "id" TEXT NOT NULL,
    "boxId" TEXT NOT NULL,
    "action" "BoxActionType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "box_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_tasks" (
    "id" TEXT NOT NULL,
    "boxId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sandbox_jobs" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "sandboxId" TEXT,
    "requestId" TEXT,
    "status" "SandboxJobStatus" NOT NULL DEFAULT 'PENDING',
    "result" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "sandbox_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'SENT',
    "resendId" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracked_urls" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "label" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "tracked_urls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mcp_generation_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "apiKeyId" TEXT,
    "type" "McpJobType" NOT NULL,
    "tier" "EnhancementTier" NOT NULL,
    "creditsCost" INTEGER NOT NULL,
    "status" "JobStatus" NOT NULL,
    "prompt" TEXT NOT NULL,
    "inputImageUrl" TEXT,
    "inputImageR2Key" TEXT,
    "outputImageUrl" TEXT,
    "outputImageR2Key" TEXT,
    "outputWidth" INTEGER,
    "outputHeight" INTEGER,
    "outputSizeBytes" INTEGER,
    "errorMessage" TEXT,
    "geminiModel" TEXT,
    "processingStartedAt" TIMESTAMP(3),
    "processingCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mcp_generation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "box_messages" (
    "id" TEXT NOT NULL,
    "boxId" TEXT NOT NULL,
    "role" "BoxMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "box_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enhancement_pipelines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT,
    "visibility" "PipelineVisibility" NOT NULL DEFAULT 'PRIVATE',
    "shareToken" TEXT,
    "tier" "EnhancementTier" NOT NULL DEFAULT 'TIER_1K',
    "analysisConfig" JSONB,
    "autoCropConfig" JSONB,
    "promptConfig" JSONB,
    "generationConfig" JSONB,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enhancement_pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor_sessions" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionEnd" TIMESTAMP(3),
    "deviceType" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "ipCountry" TEXT,
    "ipCity" TEXT,
    "referrer" TEXT,
    "landingPage" TEXT NOT NULL,
    "exitPage" TEXT,
    "pageViewCount" INTEGER NOT NULL DEFAULT 0,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmTerm" TEXT,
    "utmContent" TEXT,
    "gclid" TEXT,
    "fbclid" TEXT,

    CONSTRAINT "visitor_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_views" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeOnPage" INTEGER,
    "scrollDepth" INTEGER,

    CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "value" DOUBLE PRECISION,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_attributions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "conversionId" TEXT NOT NULL,
    "attributionType" "AttributionType" NOT NULL,
    "platform" TEXT,
    "externalCampaignId" TEXT,
    "utmCampaign" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "conversionType" "ConversionType" NOT NULL,
    "conversionValue" DOUBLE PRECISION,
    "convertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_attributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_metrics_cache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_metrics_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_links" (
    "id" TEXT NOT NULL,
    "utmCampaign" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "externalCampaignId" TEXT NOT NULL,
    "externalCampaignName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audio_mixer_projects" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audio_mixer_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audio_tracks" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileR2Key" TEXT,
    "fileFormat" TEXT NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "muted" BOOLEAN NOT NULL DEFAULT false,
    "solo" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "storageType" "AudioStorageType" NOT NULL DEFAULT 'R2',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audio_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merch_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merch_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merch_products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "provider" "PodProvider" NOT NULL,
    "providerSku" TEXT NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "retailPrice" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "minDpi" INTEGER NOT NULL DEFAULT 150,
    "minWidth" INTEGER NOT NULL DEFAULT 1800,
    "minHeight" INTEGER NOT NULL DEFAULT 1800,
    "printAreaWidth" INTEGER,
    "printAreaHeight" INTEGER,
    "mockupTemplate" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merch_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merch_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "providerSku" TEXT NOT NULL,
    "priceDelta" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "attributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merch_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merch_carts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merch_carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merch_cart_items" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "imageId" TEXT,
    "uploadedImageR2Key" TEXT,
    "uploadedImageUrl" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "customText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merch_cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merch_orders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" "MerchOrderStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "shippingCost" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "stripePaymentIntentId" TEXT,
    "stripePaymentStatus" TEXT,
    "shippingAddress" JSONB NOT NULL,
    "billingAddress" JSONB,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "merch_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merch_order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "productName" TEXT NOT NULL,
    "variantName" TEXT,
    "imageUrl" TEXT NOT NULL,
    "imageR2Key" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "customText" TEXT,
    "podOrderId" TEXT,
    "podStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "shipmentId" TEXT,

    CONSTRAINT "merch_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merch_shipments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" "PodProvider" NOT NULL,
    "providerShipId" TEXT,
    "carrier" TEXT,
    "trackingNumber" TEXT,
    "trackingUrl" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merch_shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merch_order_events" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "merch_order_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merch_webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "merch_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_agent_sessions" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "provider" "AgentProvider" NOT NULL DEFAULT 'JULES',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ExternalAgentStatus" NOT NULL,
    "sourceRepo" TEXT,
    "startingBranch" TEXT,
    "outputBranch" TEXT,
    "pullRequestUrl" TEXT,
    "planSummary" TEXT,
    "planApprovedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_agent_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_session_activities" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "externalId" TEXT,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_session_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scout_competitors" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "handle" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scout_competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scout_competitor_posts" (
    "id" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "platformPostId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scout_competitor_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scout_benchmarks" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "ownMetrics" JSONB NOT NULL,
    "competitorMetrics" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scout_benchmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_accounts" (
    "id" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "accountId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accessTokenEncrypted" TEXT NOT NULL,
    "refreshTokenEncrypted" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "SocialAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_posts" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "status" "SocialPostStatus" NOT NULL DEFAULT 'DRAFT',
    "metadata" JSONB,
    "likes" INTEGER,
    "comments" INTEGER,
    "shares" INTEGER,
    "impressions" INTEGER,
    "reach" INTEGER,
    "engagementRate" DECIMAL(5,4),
    "isEligibleForAd" BOOLEAN NOT NULL DEFAULT false,
    "lastMetricsSync" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_post_accounts" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "platformPostId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "status" "SocialPostStatus" NOT NULL DEFAULT 'DRAFT',
    "errorMessage" TEXT,

    CONSTRAINT "social_post_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_metrics" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "following" INTEGER NOT NULL DEFAULT 0,
    "postsCount" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DECIMAL(5,4),
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_metric_anomalies" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "expectedValue" DOUBLE PRECISION NOT NULL,
    "zScore" DOUBLE PRECISION NOT NULL,
    "severity" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "percentChange" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_metric_anomalies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hypothesis" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "theoreticalBasis" TEXT,
    "expectedOutcome" TEXT,
    "confidence" DOUBLE PRECISION,
    "generatedBy" TEXT NOT NULL DEFAULT 'hypothesis-agent',
    "reasoning" TEXT,
    "experimentId" TEXT,
    "status" "HypothesisStatus" NOT NULL DEFAULT 'PROPOSED',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hypothesis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_post_ab_tests" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AbTestStatus" NOT NULL DEFAULT 'DRAFT',
    "originalPostId" TEXT NOT NULL,
    "significanceLevel" DOUBLE PRECISION NOT NULL DEFAULT 0.95,
    "winnerVariantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_post_ab_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_post_ab_test_variants" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "variationType" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "engagements" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_post_ab_test_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentResult" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "variantId" TEXT,
    "metricName" TEXT NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "confidenceLevel" DOUBLE PRECISION,
    "confidenceInterval" JSONB,
    "pValue" DOUBLE PRECISION,
    "effect" TEXT,
    "effectSize" DOUBLE PRECISION,
    "interpretation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "avatarUrl" TEXT,
    "settings" JSONB,
    "isPersonal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "subscriptionTier" "WorkspaceSubscriptionTier" NOT NULL DEFAULT 'FREE',
    "maxSocialAccounts" INTEGER NOT NULL DEFAULT 3,
    "maxScheduledPosts" INTEGER NOT NULL DEFAULT 30,
    "maxAbTests" INTEGER NOT NULL DEFAULT 1,
    "monthlyAiCredits" INTEGER NOT NULL DEFAULT 100,
    "usedAiCredits" INTEGER NOT NULL DEFAULT 0,
    "maxTeamMembers" INTEGER NOT NULL DEFAULT 1,
    "billingCycleStart" TIMESTAMP(3),
    "stripeSubscriptionId" TEXT,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_apps" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "purpose" TEXT,
    "linkedCampaign" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_apps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_recent_access" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_recent_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'MEMBER',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP(3),
    "invitedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connections" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "identityId" TEXT,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "notes" TEXT,
    "warmthScore" INTEGER NOT NULL DEFAULT 0,
    "warmthFactors" JSONB,
    "lastInteraction" TIMESTAMP(3),
    "interactionCount" INTEGER NOT NULL DEFAULT 0,
    "nextStep" "ConnectionNextStep",
    "nextStepDueDate" TIMESTAMP(3),
    "nextStepNotes" TEXT,
    "meetupStatus" "MeetupPipelineStatus" NOT NULL DEFAULT 'NONE',
    "meetupStatusUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connection_platform_presence" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "handle" TEXT NOT NULL,
    "profileUrl" TEXT,
    "lastSeenAt" TIMESTAMP(3),

    CONSTRAINT "connection_platform_presence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connection_tags" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',

    CONSTRAINT "connection_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connection_reminders" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "type" "ReminderType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "snoozedUntil" TIMESTAMP(3),
    "snoozeCount" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connection_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meetup_status_history" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "fromStatus" "MeetupPipelineStatus" NOT NULL,
    "toStatus" "MeetupPipelineStatus" NOT NULL,
    "notes" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meetup_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_profiles" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mission" TEXT,
    "values" JSONB,
    "toneDescriptors" JSONB,
    "logoUrl" TEXT,
    "logoR2Key" TEXT,
    "colorPalette" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_guardrails" (
    "id" TEXT NOT NULL,
    "brandProfileId" TEXT NOT NULL,
    "type" "GuardrailType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "severity" "GuardrailSeverity" NOT NULL DEFAULT 'MEDIUM',
    "ruleConfig" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_guardrails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_vocabulary" (
    "id" TEXT NOT NULL,
    "brandProfileId" TEXT NOT NULL,
    "type" "VocabularyType" NOT NULL,
    "term" TEXT NOT NULL,
    "replacement" TEXT,
    "context" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_vocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_rewrites" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "brandProfileId" TEXT NOT NULL,
    "originalContent" TEXT NOT NULL,
    "rewrittenContent" TEXT,
    "platform" "ContentPlatform" NOT NULL DEFAULT 'GENERAL',
    "status" "RewriteStatus" NOT NULL DEFAULT 'PENDING',
    "characterLimit" INTEGER,
    "changes" JSONB,
    "toneAnalysis" JSONB,
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_rewrites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_posts" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "recurrenceRule" TEXT,
    "recurrenceEndAt" TIMESTAMP(3),
    "status" "ScheduledPostStatus" NOT NULL DEFAULT 'DRAFT',
    "metadata" JSONB,
    "publishedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "lastAttemptAt" TIMESTAMP(3),
    "nextOccurrenceAt" TIMESTAMP(3),
    "workspaceId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_post_accounts" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "platformPostId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "status" "ScheduledPostStatus" NOT NULL DEFAULT 'DRAFT',
    "errorMessage" TEXT,

    CONSTRAINT "scheduled_post_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posting_time_recommendations" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "hourUtc" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "confidence" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "posting_time_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_content_suggestions" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "suggestedFor" TIMESTAMP(3) NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ContentSuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "confidence" DOUBLE PRECISION NOT NULL,
    "keywords" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),

    CONSTRAINT "calendar_content_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inbox_items" (
    "id" TEXT NOT NULL,
    "type" "InboxItemType" NOT NULL,
    "status" "InboxItemStatus" NOT NULL DEFAULT 'UNREAD',
    "platform" "SocialPlatform" NOT NULL,
    "platformItemId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderHandle" TEXT,
    "senderAvatarUrl" TEXT,
    "originalPostId" TEXT,
    "originalPostContent" TEXT,
    "metadata" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "readAt" TIMESTAMP(3),
    "repliedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "workspaceId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentiment" "InboxSentiment",
    "sentimentScore" DOUBLE PRECISION,
    "priorityScore" INTEGER,
    "priorityFactors" JSONB,
    "routingAnalyzedAt" TIMESTAMP(3),
    "routingMetadata" JSONB,
    "escalationStatus" "EscalationStatus" DEFAULT 'NONE',
    "escalationLevel" INTEGER DEFAULT 0,
    "escalatedAt" TIMESTAMP(3),
    "escalatedToId" TEXT,
    "slaDeadline" TIMESTAMP(3),
    "slaBreach" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "inbox_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relay_drafts" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "status" "RelayDraftStatus" NOT NULL DEFAULT 'PENDING',
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "inboxItemId" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relay_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draft_edit_history" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "originalContent" TEXT NOT NULL,
    "editedContent" TEXT NOT NULL,
    "editType" "DraftEditType" NOT NULL,
    "changesSummary" TEXT,
    "editDistance" INTEGER,
    "editedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draft_edit_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draft_audit_logs" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "action" "DraftAuditAction" NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "performedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draft_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crisis_detection_events" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "severity" "CrisisSeverity" NOT NULL,
    "status" "CrisisEventStatus" NOT NULL DEFAULT 'DETECTED',
    "triggerType" TEXT NOT NULL,
    "triggerData" JSONB NOT NULL,
    "affectedAccountIds" TEXT[],
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "responseNotes" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crisis_detection_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crisis_response_templates" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "platform" "SocialPlatform",
    "content" TEXT NOT NULL,
    "variables" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crisis_response_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crisis_alert_rules" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ruleType" "CrisisRuleType" NOT NULL,
    "conditions" JSONB NOT NULL,
    "severity" "CrisisSeverity" NOT NULL,
    "notifyChannels" TEXT[],
    "escalateAfterMinutes" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crisis_alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_account_health" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "healthScore" INTEGER NOT NULL DEFAULT 100,
    "status" "AccountHealthStatus" NOT NULL DEFAULT 'HEALTHY',
    "lastSuccessfulSync" TIMESTAMP(3),
    "lastSyncAttempt" TIMESTAMP(3),
    "lastError" TEXT,
    "lastErrorAt" TIMESTAMP(3),
    "consecutiveErrors" INTEGER NOT NULL DEFAULT 0,
    "totalErrorsLast24h" INTEGER NOT NULL DEFAULT 0,
    "rateLimitRemaining" INTEGER,
    "rateLimitTotal" INTEGER,
    "rateLimitResetAt" TIMESTAMP(3),
    "isRateLimited" BOOLEAN NOT NULL DEFAULT false,
    "tokenExpiresAt" TIMESTAMP(3),
    "tokenRefreshRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_account_health_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recovery_guidance" (
    "id" TEXT NOT NULL,
    "platform" "SocialPlatform",
    "issueType" "AccountIssueType" NOT NULL,
    "severity" "IssueSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "estimatedTime" TEXT,
    "requiresAction" BOOLEAN NOT NULL DEFAULT true,
    "autoRecoverable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recovery_guidance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_health_events" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "eventType" "AccountHealthEventType" NOT NULL,
    "severity" "IssueSeverity" NOT NULL,
    "previousStatus" "AccountHealthStatus",
    "newStatus" "AccountHealthStatus" NOT NULL,
    "previousScore" INTEGER,
    "newScore" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_health_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_rules" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "platform" "SocialPlatform",
    "category" "PolicyCategory" NOT NULL,
    "ruleType" "PolicyRuleType" NOT NULL,
    "conditions" JSONB NOT NULL,
    "severity" "PolicySeverity" NOT NULL DEFAULT 'WARNING',
    "isBlocking" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sourceUrl" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policy_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_checks" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "contentType" "PolicyContentType" NOT NULL,
    "contentId" TEXT,
    "contentText" TEXT NOT NULL,
    "contentMetadata" JSONB,
    "platform" "SocialPlatform",
    "checkScope" "PolicyCheckScope" NOT NULL DEFAULT 'FULL',
    "status" "PolicyCheckStatus" NOT NULL DEFAULT 'PENDING',
    "passedRules" INTEGER NOT NULL DEFAULT 0,
    "failedRules" INTEGER NOT NULL DEFAULT 0,
    "warningRules" INTEGER NOT NULL DEFAULT 0,
    "overallResult" "PolicyCheckResult",
    "summary" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "checkedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_violations" (
    "id" TEXT NOT NULL,
    "checkId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "severity" "PolicySeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "matchedContent" TEXT,
    "matchLocation" JSONB,
    "confidence" DOUBLE PRECISION,
    "suggestedFix" TEXT,
    "isOverridden" BOOLEAN NOT NULL DEFAULT false,
    "overriddenById" TEXT,
    "overrideReason" TEXT,
    "overriddenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_violations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scout_topics" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keywords" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scout_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scout_results" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "platformId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "authorUrl" TEXT,
    "postUrl" TEXT NOT NULL,
    "engagement" JSONB NOT NULL,
    "foundAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scout_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_suggestions" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "draftContent" TEXT NOT NULL,
    "contentType" "SuggestionContentType" NOT NULL,
    "suggestedPlatforms" TEXT[],
    "trendData" JSONB[],
    "relevanceScore" DOUBLE PRECISION NOT NULL,
    "timelinessScore" DOUBLE PRECISION NOT NULL,
    "brandAlignmentScore" DOUBLE PRECISION NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "dismissalReason" TEXT,
    "feedback" TEXT,

    CONSTRAINT "content_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocator_campaigns" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "platform" "AllocatorPlatform" NOT NULL,
    "platformCampaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "budget" DECIMAL(10,2),
    "spend" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "metrics" JSONB,
    "lastSyncAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allocator_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocator_ad_sets" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "platformAdSetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "budget" DECIMAL(10,2),
    "spend" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allocator_ad_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocator_autopilot_configs" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "campaignId" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mode" "AutopilotMode" NOT NULL DEFAULT 'CONSERVATIVE',
    "maxDailyBudgetChange" DECIMAL(10,2) NOT NULL DEFAULT 10.0,
    "maxSingleChange" DECIMAL(10,2) NOT NULL DEFAULT 5.0,
    "minRoasThreshold" DECIMAL(10,2),
    "maxCpaThreshold" DECIMAL(10,2),
    "pauseOnAnomaly" BOOLEAN NOT NULL DEFAULT true,
    "requireApprovalAbove" DECIMAL(10,2),
    "encryptedSettings" TEXT,
    "minBudget" DECIMAL(12,2),
    "maxBudget" DECIMAL(12,2),
    "cooldownMinutes" INTEGER NOT NULL DEFAULT 60,
    "isEmergencyStopped" BOOLEAN NOT NULL DEFAULT false,
    "emergencyStoppedAt" TIMESTAMP(3),
    "emergencyStoppedBy" TEXT,
    "emergencyStopReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allocator_autopilot_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocator_guardrail_alerts" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "campaignId" TEXT,
    "alertType" "AllocatorAlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allocator_guardrail_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocator_autopilot_executions" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "recommendationId" TEXT,
    "recommendationType" TEXT NOT NULL,
    "status" "AutopilotExecutionStatus" NOT NULL,
    "previousBudget" DECIMAL(10,2) NOT NULL,
    "newBudget" DECIMAL(10,2) NOT NULL,
    "budgetChange" DECIMAL(10,2) NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "rollbackOfId" TEXT,
    "rolledBackAt" TIMESTAMP(3),
    "rolledBackReason" TEXT,
    "rolledBackByUserId" TEXT,

    CONSTRAINT "allocator_autopilot_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflows" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'DRAFT',
    "workspaceId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_versions" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "description" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_steps" (
    "id" TEXT NOT NULL,
    "workflowVersionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "WorkflowStepType" NOT NULL,
    "sequence" INTEGER NOT NULL,
    "config" JSONB NOT NULL,
    "dependencies" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentStepId" TEXT,
    "branchType" "BranchType",
    "branchCondition" TEXT,

    CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_runs" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "status" "WorkflowRunStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "workflow_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_run_logs" (
    "id" TEXT NOT NULL,
    "workflowRunId" TEXT NOT NULL,
    "stepId" TEXT,
    "stepStatus" "StepRunStatus",
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_run_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_schedules" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "cronExpression" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "nextRunAt" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_webhooks" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "webhookToken" TEXT NOT NULL,
    "secretHash" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_event_subscriptions" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "eventType" "WorkflowEventType" NOT NULL,
    "filterConfig" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_event_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocator_daily_budget_moves" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalMoved" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "netChange" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allocator_daily_budget_moves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocator_audit_logs" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "campaignId" TEXT,
    "decisionType" "AllocatorDecisionType" NOT NULL,
    "decisionOutcome" "AllocatorDecisionOutcome" NOT NULL,
    "recommendationSnapshot" JSONB,
    "performanceSnapshot" JSONB,
    "configSnapshot" JSONB,
    "guardrailEvaluation" JSONB,
    "previousState" JSONB,
    "newState" JSONB,
    "aiReasoning" TEXT,
    "supportingData" JSONB,
    "confidence" TEXT,
    "executionId" TEXT,
    "triggeredBy" TEXT NOT NULL,
    "userId" TEXT,
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allocator_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbTest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "AbTestStatus" NOT NULL DEFAULT 'DRAFT',
    "winnerVariantId" TEXT,
    "significanceLevel" DOUBLE PRECISION NOT NULL DEFAULT 0.95,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbTestVariant" (
    "id" TEXT NOT NULL,
    "abTestId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "splitPercentage" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "AbTestVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbTestResult" (
    "id" TEXT NOT NULL,
    "visitorSessionId" TEXT NOT NULL,
    "abTestVariantId" TEXT NOT NULL,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbTestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "percentage" INTEGER NOT NULL DEFAULT 0,
    "enabledFor" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "folderId" TEXT,
    "filename" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "duration" DOUBLE PRECISION,
    "storageProvider" TEXT NOT NULL DEFAULT 'R2',
    "r2Bucket" TEXT NOT NULL,
    "r2Key" TEXT NOT NULL,
    "altText" TEXT,
    "qualityScore" DOUBLE PRECISION,
    "analysisJson" JSONB,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_tag_assignments" (
    "assetId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedById" TEXT NOT NULL,

    CONSTRAINT "asset_tag_assignments_pkey" PRIMARY KEY ("assetId","tagId")
);

-- CreateTable
CREATE TABLE "post_assets" (
    "postId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,

    CONSTRAINT "post_assets_pkey" PRIMARY KEY ("postId","assetId")
);

-- CreateTable
CREATE TABLE "scheduled_post_assets" (
    "postId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,

    CONSTRAINT "scheduled_post_assets_pkey" PRIMARY KEY ("postId","assetId")
);

-- CreateTable
CREATE TABLE "post_performance" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "postType" "PostType" NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "engagementCount" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "conversionValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "engagementVelocity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impressionVelocity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "boostScore" DOUBLE PRECISION,
    "boostTrigger" TEXT,
    "estimatedROI" DOUBLE PRECISION,
    "metricPeriod" TIMESTAMP(3) NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_boost_recommendations" (
    "id" TEXT NOT NULL,
    "postPerformanceId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "postType" "PostType" NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "BoostRecommendationStatus" NOT NULL DEFAULT 'PENDING',
    "reasoning" TEXT NOT NULL,
    "suggestedBudget" DOUBLE PRECISION NOT NULL,
    "estimatedImpressions" INTEGER NOT NULL,
    "estimatedClicks" INTEGER NOT NULL,
    "estimatedConversions" INTEGER NOT NULL,
    "estimatedCost" DOUBLE PRECISION NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "recommendedPlatforms" TEXT[],
    "targetAudience" JSONB,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),
    "actualSpend" DOUBLE PRECISION,
    "actualROI" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_boost_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applied_boosts" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "postType" "PostType" NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "platform" "MarketingPlatform" NOT NULL,
    "externalCampaignId" TEXT,
    "budget" DOUBLE PRECISION NOT NULL,
    "actualImpressions" INTEGER NOT NULL DEFAULT 0,
    "actualClicks" INTEGER NOT NULL DEFAULT 0,
    "actualConversions" INTEGER NOT NULL DEFAULT 0,
    "actualSpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualROI" DOUBLE PRECISION,
    "status" "AppliedBoostStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "applied_boosts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organic_post_conversions" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "status" "ConversionStatus" NOT NULL DEFAULT 'DRAFT',
    "organicLikes" INTEGER NOT NULL DEFAULT 0,
    "organicComments" INTEGER NOT NULL DEFAULT 0,
    "organicShares" INTEGER NOT NULL DEFAULT 0,
    "organicImpressions" INTEGER NOT NULL DEFAULT 0,
    "organicReach" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DECIMAL(5,4) NOT NULL,
    "targetingData" JSONB,
    "recommendedBudget" JSONB,
    "selectedVariantId" TEXT,
    "platformCampaignId" TEXT,
    "campaignStartDate" TIMESTAMP(3),
    "campaignEndDate" TIMESTAMP(3),
    "dailyBudget" DECIMAL(10,2),
    "totalBudget" DECIMAL(10,2),
    "adSpend" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "adImpressions" INTEGER NOT NULL DEFAULT 0,
    "adReach" INTEGER NOT NULL DEFAULT 0,
    "adClicks" INTEGER NOT NULL DEFAULT 0,
    "adConversions" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "errorDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organic_post_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organic_post_engagers" (
    "id" TEXT NOT NULL,
    "conversionId" TEXT NOT NULL,
    "ageRange" TEXT,
    "gender" TEXT,
    "location" TEXT,
    "interests" TEXT[],
    "engagementType" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataQuality" "EngagerDataStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organic_post_engagers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_creative_variants" (
    "id" TEXT NOT NULL,
    "conversionId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "placement" TEXT NOT NULL,
    "headline" TEXT,
    "primaryText" TEXT,
    "description" TEXT,
    "callToAction" TEXT,
    "mediaUrl" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "aspectRatio" TEXT NOT NULL,
    "textOptimized" BOOLEAN NOT NULL DEFAULT false,
    "ctaOptimized" BOOLEAN NOT NULL DEFAULT false,
    "aspectRatioAdjusted" BOOLEAN NOT NULL DEFAULT false,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_creative_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identities" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identifiers" (
    "id" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "type" "IdentifierType" NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "identifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_white_label_configs" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "customDomain" TEXT,
    "customDomainVerified" BOOLEAN NOT NULL DEFAULT false,
    "dnsVerificationToken" TEXT,
    "dnsVerificationStatus" "DomainVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "sslCertificateStatus" "SslCertificateStatus" NOT NULL DEFAULT 'PENDING',
    "sslCertificateIssuedAt" TIMESTAMP(3),
    "sslCertificateExpiresAt" TIMESTAMP(3),
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "accentColor" TEXT,
    "fontFamily" TEXT,
    "logoUrl" TEXT,
    "logoR2Key" TEXT,
    "faviconUrl" TEXT,
    "faviconR2Key" TEXT,
    "emailSenderName" TEXT,
    "emailSenderDomain" TEXT,
    "emailSenderVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailHeaderLogoUrl" TEXT,
    "emailFooterText" TEXT,
    "loginPageTitle" TEXT,
    "loginPageDescription" TEXT,
    "loginBackgroundUrl" TEXT,
    "loginBackgroundR2Key" TEXT,
    "showPoweredBySpikeLand" BOOLEAN NOT NULL DEFAULT true,
    "pdfHeaderLogoUrl" TEXT,
    "pdfFooterText" TEXT,
    "pdfWatermarkUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_white_label_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brief_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "workspaceId" TEXT NOT NULL,
    "fieldsSchema" JSONB NOT NULL,
    "defaultObjectives" TEXT[],
    "defaultChannels" TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brief_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creative_channels" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "adFormats" TEXT[],
    "dimensions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creative_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creative_sets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "briefId" TEXT,
    "seedContent" TEXT,
    "variationConfig" JSONB,
    "errorMessage" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "jobStatus" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedById" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "generationPrompt" TEXT NOT NULL,
    "status" "CreativeSetStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creative_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creative_variants" (
    "id" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "variantType" "CreativeVariantType" NOT NULL,
    "headline" TEXT,
    "bodyText" TEXT,
    "callToAction" TEXT,
    "tone" TEXT,
    "length" TEXT,
    "aiPrompt" TEXT,
    "aiModel" TEXT,
    "format" TEXT,
    "placement" TEXT,
    "assetId" TEXT,
    "imageJobId" TEXT,
    "variantNumber" INTEGER NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "VariantStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creative_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_performance_predictions" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "predictedCTR" DOUBLE PRECISION NOT NULL,
    "predictedER" DOUBLE PRECISION NOT NULL,
    "predictedCR" DOUBLE PRECISION NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "factorsAnalyzed" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variant_performance_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creative_performance" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cpc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cvr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creative_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creative_fatigue_alerts" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "severity" "FatigueSeverity" NOT NULL,
    "ctrDecayPercent" DOUBLE PRECISION NOT NULL,
    "daysActive" INTEGER NOT NULL,
    "recommendedAction" TEXT NOT NULL,
    "estimatedRefreshDate" TIMESTAMP(3),
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creative_fatigue_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learnit_content" (
    "id" TEXT NOT NULL,
    "path" TEXT[],
    "slug" TEXT NOT NULL,
    "parentSlug" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "wikiLinks" TEXT[],
    "status" "LearnItStatus" NOT NULL DEFAULT 'PUBLISHED',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aiModel" TEXT NOT NULL DEFAULT 'gemini-3-flash-preview',
    "generatedById" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "learnit_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learnit_relations" (
    "id" TEXT NOT NULL,
    "fromTopicId" TEXT NOT NULL,
    "toTopicId" TEXT NOT NULL,
    "type" "LearnItRelationType" NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learnit_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agency_portfolio_items" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT,
    "githubUrl" TEXT,
    "screenshots" TEXT[],
    "technologies" TEXT[],
    "category" "AgencyPortfolioCategory" NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agency_portfolio_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agency_personas" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "demographics" JSONB NOT NULL,
    "psychographics" TEXT[],
    "painPoints" TEXT[],
    "triggers" TEXT[],
    "primaryHook" TEXT NOT NULL,
    "adCopyVariations" TEXT[],
    "predictedProfit" DOUBLE PRECISION NOT NULL,
    "stressLevel" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "landingPageSlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agency_personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agency_inquiries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "projectType" TEXT,
    "budget" TEXT,
    "timeline" TEXT,
    "description" TEXT NOT NULL,
    "source" TEXT,
    "personaSlug" TEXT,
    "status" "AgencyInquiryStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agency_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "created_apps" (
    "id" TEXT NOT NULL,
    "path" TEXT[],
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "codespaceId" TEXT NOT NULL,
    "codespaceUrl" TEXT NOT NULL,
    "status" "CreatedAppStatus" NOT NULL DEFAULT 'GENERATING',
    "promptUsed" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "outgoingLinks" TEXT[],
    "generatedById" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "created_apps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subscribers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribed" BOOLEAN NOT NULL DEFAULT false,
    "unsubscribedAt" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'footer',

    CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ConnectionTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ConnectionTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripeCustomerId_key" ON "users"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "campaign_briefs_userId_idx" ON "campaign_briefs"("userId");

-- CreateIndex
CREATE INDEX "campaign_briefs_workspaceId_idx" ON "campaign_briefs"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_target_audiences_briefId_key" ON "campaign_target_audiences"("briefId");

-- CreateIndex
CREATE INDEX "campaign_objectives_briefId_idx" ON "campaign_objectives"("briefId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "marketing_accounts_userId_idx" ON "marketing_accounts"("userId");

-- CreateIndex
CREATE INDEX "marketing_accounts_platform_idx" ON "marketing_accounts"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_accounts_userId_platform_accountId_key" ON "marketing_accounts"("userId", "platform", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "google_ads_campaigns_campaignId_key" ON "google_ads_campaigns"("campaignId");

-- CreateIndex
CREATE INDEX "google_ads_campaigns_marketingAccountId_idx" ON "google_ads_campaigns"("marketingAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "apps_slug_key" ON "apps"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "apps_domain_key" ON "apps"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "apps_codespaceId_key" ON "apps"("codespaceId");

-- CreateIndex
CREATE INDEX "apps_userId_idx" ON "apps"("userId");

-- CreateIndex
CREATE INDEX "apps_forkedFrom_idx" ON "apps"("forkedFrom");

-- CreateIndex
CREATE INDEX "apps_status_idx" ON "apps"("status");

-- CreateIndex
CREATE INDEX "apps_codespaceId_idx" ON "apps"("codespaceId");

-- CreateIndex
CREATE INDEX "apps_isCurated_isPublic_idx" ON "apps"("isCurated", "isPublic");

-- CreateIndex
CREATE INDEX "apps_lastAgentActivity_idx" ON "apps"("lastAgentActivity");

-- CreateIndex
CREATE INDEX "apps_slug_idx" ON "apps"("slug");

-- CreateIndex
CREATE INDEX "apps_deletedAt_idx" ON "apps"("deletedAt");

-- CreateIndex
CREATE INDEX "requirements_appId_idx" ON "requirements"("appId");

-- CreateIndex
CREATE INDEX "requirements_status_idx" ON "requirements"("status");

-- CreateIndex
CREATE INDEX "requirements_priority_idx" ON "requirements"("priority");

-- CreateIndex
CREATE INDEX "monetization_models_appId_idx" ON "monetization_models"("appId");

-- CreateIndex
CREATE INDEX "monetization_models_type_idx" ON "monetization_models"("type");

-- CreateIndex
CREATE INDEX "app_messages_appId_createdAt_idx" ON "app_messages"("appId", "createdAt");

-- CreateIndex
CREATE INDEX "app_messages_appId_isRead_idx" ON "app_messages"("appId", "isRead");

-- CreateIndex
CREATE INDEX "app_messages_role_isRead_idx" ON "app_messages"("role", "isRead");

-- CreateIndex
CREATE INDEX "app_messages_appId_deletedAt_idx" ON "app_messages"("appId", "deletedAt");

-- CreateIndex
CREATE INDEX "app_status_history_appId_createdAt_idx" ON "app_status_history"("appId", "createdAt");

-- CreateIndex
CREATE INDEX "app_images_appId_idx" ON "app_images"("appId");

-- CreateIndex
CREATE INDEX "app_images_appId_createdAt_idx" ON "app_images"("appId", "createdAt");

-- CreateIndex
CREATE INDEX "app_attachments_messageId_idx" ON "app_attachments"("messageId");

-- CreateIndex
CREATE INDEX "app_attachments_imageId_idx" ON "app_attachments"("imageId");

-- CreateIndex
CREATE UNIQUE INDEX "app_attachments_messageId_imageId_key" ON "app_attachments"("messageId", "imageId");

-- CreateIndex
CREATE UNIQUE INDEX "app_code_versions_messageId_key" ON "app_code_versions"("messageId");

-- CreateIndex
CREATE INDEX "app_code_versions_appId_createdAt_idx" ON "app_code_versions"("appId", "createdAt");

-- CreateIndex
CREATE INDEX "app_code_versions_hash_idx" ON "app_code_versions"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "enhanced_images_shareToken_key" ON "enhanced_images"("shareToken");

-- CreateIndex
CREATE INDEX "enhanced_images_userId_createdAt_idx" ON "enhanced_images"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "enhanced_images_isPublic_createdAt_idx" ON "enhanced_images"("isPublic", "createdAt");

-- CreateIndex
CREATE INDEX "enhanced_images_shareToken_idx" ON "enhanced_images"("shareToken");

-- CreateIndex
CREATE INDEX "enhanced_images_tags_idx" ON "enhanced_images"("tags");

-- CreateIndex
CREATE INDEX "image_enhancement_jobs_userId_status_createdAt_idx" ON "image_enhancement_jobs"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "image_enhancement_jobs_imageId_idx" ON "image_enhancement_jobs"("imageId");

-- CreateIndex
CREATE INDEX "image_enhancement_jobs_status_updatedAt_idx" ON "image_enhancement_jobs"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "image_enhancement_jobs_workflowRunId_idx" ON "image_enhancement_jobs"("workflowRunId");

-- CreateIndex
CREATE INDEX "image_enhancement_jobs_pipelineId_idx" ON "image_enhancement_jobs"("pipelineId");

-- CreateIndex
CREATE INDEX "image_enhancement_jobs_status_currentStage_idx" ON "image_enhancement_jobs"("status", "currentStage");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "subscriptions_stripeSubscriptionId_idx" ON "subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_tier_idx" ON "subscriptions"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_stripePriceId_key" ON "subscription_plans"("stripePriceId");

-- CreateIndex
CREATE INDEX "subscription_plans_active_sortOrder_idx" ON "subscription_plans"("active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "albums_shareToken_key" ON "albums"("shareToken");

-- CreateIndex
CREATE INDEX "albums_userId_createdAt_idx" ON "albums"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "albums_privacy_idx" ON "albums"("privacy");

-- CreateIndex
CREATE INDEX "albums_shareToken_idx" ON "albums"("shareToken");

-- CreateIndex
CREATE INDEX "albums_pipelineId_idx" ON "albums"("pipelineId");

-- CreateIndex
CREATE UNIQUE INDEX "albums_userId_name_privacy_key" ON "albums"("userId", "name", "privacy");

-- CreateIndex
CREATE INDEX "album_images_albumId_sortOrder_idx" ON "album_images"("albumId", "sortOrder");

-- CreateIndex
CREATE INDEX "album_images_imageId_idx" ON "album_images"("imageId");

-- CreateIndex
CREATE INDEX "album_images_albumId_addedAt_idx" ON "album_images"("albumId", "addedAt");

-- CreateIndex
CREATE UNIQUE INDEX "album_images_albumId_imageId_key" ON "album_images"("albumId", "imageId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_targetId_idx" ON "audit_logs"("targetId");

-- CreateIndex
CREATE INDEX "audit_logs_targetType_idx" ON "audit_logs"("targetType");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_resourceId_resourceType_idx" ON "audit_logs"("resourceId", "resourceType");

-- CreateIndex
CREATE INDEX "workspace_audit_logs_workspaceId_idx" ON "workspace_audit_logs"("workspaceId");

-- CreateIndex
CREATE INDEX "workspace_audit_logs_userId_idx" ON "workspace_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "workspace_audit_logs_action_idx" ON "workspace_audit_logs"("action");

-- CreateIndex
CREATE INDEX "workspace_audit_logs_targetId_targetType_idx" ON "workspace_audit_logs"("targetId", "targetType");

-- CreateIndex
CREATE INDEX "workspace_audit_logs_createdAt_idx" ON "workspace_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "workspace_audit_logs_workspaceId_createdAt_idx" ON "workspace_audit_logs"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_decision_logs_workspaceId_idx" ON "ai_decision_logs"("workspaceId");

-- CreateIndex
CREATE INDEX "ai_decision_logs_userId_idx" ON "ai_decision_logs"("userId");

-- CreateIndex
CREATE INDEX "ai_decision_logs_requestType_idx" ON "ai_decision_logs"("requestType");

-- CreateIndex
CREATE INDEX "ai_decision_logs_status_idx" ON "ai_decision_logs"("status");

-- CreateIndex
CREATE INDEX "ai_decision_logs_createdAt_idx" ON "ai_decision_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_retention_policies_workspaceId_idx" ON "audit_retention_policies"("workspaceId");

-- CreateIndex
CREATE INDEX "audit_retention_policies_isActive_idx" ON "audit_retention_policies"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "audit_retention_policies_workspaceId_name_key" ON "audit_retention_policies"("workspaceId", "name");

-- CreateIndex
CREATE INDEX "archived_audit_logs_workspaceId_idx" ON "archived_audit_logs"("workspaceId");

-- CreateIndex
CREATE INDEX "archived_audit_logs_userId_idx" ON "archived_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "archived_audit_logs_action_idx" ON "archived_audit_logs"("action");

-- CreateIndex
CREATE INDEX "archived_audit_logs_originalCreatedAt_idx" ON "archived_audit_logs"("originalCreatedAt");

-- CreateIndex
CREATE INDEX "archived_audit_logs_archivedAt_idx" ON "archived_audit_logs"("archivedAt");

-- CreateIndex
CREATE INDEX "error_logs_timestamp_idx" ON "error_logs"("timestamp");

-- CreateIndex
CREATE INDEX "error_logs_sourceFile_idx" ON "error_logs"("sourceFile");

-- CreateIndex
CREATE INDEX "error_logs_errorType_idx" ON "error_logs"("errorType");

-- CreateIndex
CREATE INDEX "error_logs_environment_idx" ON "error_logs"("environment");

-- CreateIndex
CREATE INDEX "inbox_suggested_responses_inboxItemId_idx" ON "inbox_suggested_responses"("inboxItemId");

-- CreateIndex
CREATE INDEX "escalation_events_inboxItemId_idx" ON "escalation_events"("inboxItemId");

-- CreateIndex
CREATE INDEX "featured_gallery_items_isActive_sortOrder_idx" ON "featured_gallery_items"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "featured_gallery_items_isActive_category_sortOrder_idx" ON "featured_gallery_items"("isActive", "category", "sortOrder");

-- CreateIndex
CREATE INDEX "boxes_userId_createdAt_idx" ON "boxes"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "boxes_status_idx" ON "boxes"("status");

-- CreateIndex
CREATE INDEX "claude_code_agents_userId_lastSeenAt_idx" ON "claude_code_agents"("userId", "lastSeenAt");

-- CreateIndex
CREATE INDEX "claude_code_agents_machineId_idx" ON "claude_code_agents"("machineId");

-- CreateIndex
CREATE UNIQUE INDEX "claude_code_agents_userId_machineId_sessionId_key" ON "claude_code_agents"("userId", "machineId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_connection_requests_connectId_key" ON "agent_connection_requests"("connectId");

-- CreateIndex
CREATE INDEX "agent_connection_requests_connectId_status_idx" ON "agent_connection_requests"("connectId", "status");

-- CreateIndex
CREATE INDEX "agent_connection_requests_expiresAt_idx" ON "agent_connection_requests"("expiresAt");

-- CreateIndex
CREATE INDEX "agent_messages_agentId_createdAt_idx" ON "agent_messages"("agentId", "createdAt");

-- CreateIndex
CREATE INDEX "agent_messages_agentId_isRead_idx" ON "agent_messages"("agentId", "isRead");

-- CreateIndex
CREATE INDEX "box_actions_boxId_createdAt_idx" ON "box_actions"("boxId", "createdAt");

-- CreateIndex
CREATE INDEX "agent_tasks_boxId_status_idx" ON "agent_tasks"("boxId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "sandbox_jobs_messageId_key" ON "sandbox_jobs"("messageId");

-- CreateIndex
CREATE INDEX "sandbox_jobs_appId_startedAt_idx" ON "sandbox_jobs"("appId", "startedAt");

-- CreateIndex
CREATE INDEX "sandbox_jobs_status_idx" ON "sandbox_jobs"("status");

-- CreateIndex
CREATE INDEX "sandbox_jobs_sandboxId_idx" ON "sandbox_jobs"("sandboxId");

-- CreateIndex
CREATE UNIQUE INDEX "email_logs_resendId_key" ON "email_logs"("resendId");

-- CreateIndex
CREATE INDEX "email_logs_userId_idx" ON "email_logs"("userId");

-- CreateIndex
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");

-- CreateIndex
CREATE INDEX "email_logs_sentAt_idx" ON "email_logs"("sentAt");

-- CreateIndex
CREATE INDEX "email_logs_template_idx" ON "email_logs"("template");

-- CreateIndex
CREATE UNIQUE INDEX "tracked_urls_path_key" ON "tracked_urls"("path");

-- CreateIndex
CREATE INDEX "tracked_urls_isActive_idx" ON "tracked_urls"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_userId_isActive_idx" ON "api_keys"("userId", "isActive");

-- CreateIndex
CREATE INDEX "api_keys_keyHash_idx" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "mcp_generation_jobs_userId_status_createdAt_idx" ON "mcp_generation_jobs"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "mcp_generation_jobs_apiKeyId_idx" ON "mcp_generation_jobs"("apiKeyId");

-- CreateIndex
CREATE INDEX "mcp_generation_jobs_status_updatedAt_idx" ON "mcp_generation_jobs"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "box_messages_boxId_createdAt_idx" ON "box_messages"("boxId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "enhancement_pipelines_shareToken_key" ON "enhancement_pipelines"("shareToken");

-- CreateIndex
CREATE INDEX "enhancement_pipelines_userId_idx" ON "enhancement_pipelines"("userId");

-- CreateIndex
CREATE INDEX "enhancement_pipelines_visibility_idx" ON "enhancement_pipelines"("visibility");

-- CreateIndex
CREATE INDEX "visitor_sessions_visitorId_idx" ON "visitor_sessions"("visitorId");

-- CreateIndex
CREATE INDEX "visitor_sessions_userId_idx" ON "visitor_sessions"("userId");

-- CreateIndex
CREATE INDEX "visitor_sessions_utmCampaign_idx" ON "visitor_sessions"("utmCampaign");

-- CreateIndex
CREATE INDEX "visitor_sessions_utmSource_idx" ON "visitor_sessions"("utmSource");

-- CreateIndex
CREATE INDEX "visitor_sessions_sessionStart_idx" ON "visitor_sessions"("sessionStart");

-- CreateIndex
CREATE INDEX "visitor_sessions_gclid_idx" ON "visitor_sessions"("gclid");

-- CreateIndex
CREATE INDEX "visitor_sessions_fbclid_idx" ON "visitor_sessions"("fbclid");

-- CreateIndex
CREATE INDEX "page_views_sessionId_timestamp_idx" ON "page_views"("sessionId", "timestamp");

-- CreateIndex
CREATE INDEX "page_views_path_idx" ON "page_views"("path");

-- CreateIndex
CREATE INDEX "analytics_events_sessionId_timestamp_idx" ON "analytics_events"("sessionId", "timestamp");

-- CreateIndex
CREATE INDEX "analytics_events_name_idx" ON "analytics_events"("name");

-- CreateIndex
CREATE INDEX "analytics_events_category_idx" ON "analytics_events"("category");

-- CreateIndex
CREATE INDEX "campaign_attributions_userId_idx" ON "campaign_attributions"("userId");

-- CreateIndex
CREATE INDEX "campaign_attributions_conversionId_idx" ON "campaign_attributions"("conversionId");

-- CreateIndex
CREATE INDEX "campaign_attributions_utmCampaign_idx" ON "campaign_attributions"("utmCampaign");

-- CreateIndex
CREATE INDEX "campaign_attributions_externalCampaignId_idx" ON "campaign_attributions"("externalCampaignId");

-- CreateIndex
CREATE INDEX "campaign_attributions_convertedAt_idx" ON "campaign_attributions"("convertedAt");

-- CreateIndex
CREATE INDEX "campaign_attributions_conversionType_idx" ON "campaign_attributions"("conversionType");

-- CreateIndex
CREATE INDEX "campaign_attributions_attributionType_idx" ON "campaign_attributions"("attributionType");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_metrics_cache_cacheKey_key" ON "campaign_metrics_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "campaign_metrics_cache_cacheKey_idx" ON "campaign_metrics_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "campaign_metrics_cache_expiresAt_idx" ON "campaign_metrics_cache"("expiresAt");

-- CreateIndex
CREATE INDEX "campaign_links_platform_idx" ON "campaign_links"("platform");

-- CreateIndex
CREATE INDEX "campaign_links_externalCampaignId_idx" ON "campaign_links"("externalCampaignId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_links_utmCampaign_platform_key" ON "campaign_links"("utmCampaign", "platform");

-- CreateIndex
CREATE INDEX "audio_mixer_projects_userId_createdAt_idx" ON "audio_mixer_projects"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audio_tracks_projectId_sortOrder_idx" ON "audio_tracks"("projectId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "merch_categories_name_key" ON "merch_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "merch_categories_slug_key" ON "merch_categories"("slug");

-- CreateIndex
CREATE INDEX "merch_categories_isActive_sortOrder_idx" ON "merch_categories"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "merch_products_categoryId_isActive_idx" ON "merch_products"("categoryId", "isActive");

-- CreateIndex
CREATE INDEX "merch_products_provider_providerSku_idx" ON "merch_products"("provider", "providerSku");

-- CreateIndex
CREATE INDEX "merch_products_isActive_sortOrder_idx" ON "merch_products"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "merch_variants_productId_isActive_idx" ON "merch_variants"("productId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "merch_carts_userId_key" ON "merch_carts"("userId");

-- CreateIndex
CREATE INDEX "merch_cart_items_cartId_idx" ON "merch_cart_items"("cartId");

-- CreateIndex
CREATE INDEX "merch_cart_items_productId_idx" ON "merch_cart_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "merch_cart_items_cartId_productId_variantId_imageId_uploade_key" ON "merch_cart_items"("cartId", "productId", "variantId", "imageId", "uploadedImageR2Key");

-- CreateIndex
CREATE UNIQUE INDEX "merch_orders_orderNumber_key" ON "merch_orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "merch_orders_stripePaymentIntentId_key" ON "merch_orders"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "merch_orders_userId_createdAt_idx" ON "merch_orders"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "merch_orders_status_idx" ON "merch_orders"("status");

-- CreateIndex
CREATE INDEX "merch_orders_orderNumber_idx" ON "merch_orders"("orderNumber");

-- CreateIndex
CREATE INDEX "merch_orders_stripePaymentIntentId_idx" ON "merch_orders"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "merch_order_items_orderId_idx" ON "merch_order_items"("orderId");

-- CreateIndex
CREATE INDEX "merch_order_items_podOrderId_idx" ON "merch_order_items"("podOrderId");

-- CreateIndex
CREATE INDEX "merch_shipments_orderId_idx" ON "merch_shipments"("orderId");

-- CreateIndex
CREATE INDEX "merch_shipments_trackingNumber_idx" ON "merch_shipments"("trackingNumber");

-- CreateIndex
CREATE INDEX "merch_order_events_orderId_createdAt_idx" ON "merch_order_events"("orderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "merch_webhook_events_eventId_key" ON "merch_webhook_events"("eventId");

-- CreateIndex
CREATE INDEX "merch_webhook_events_provider_eventType_idx" ON "merch_webhook_events"("provider", "eventType");

-- CreateIndex
CREATE INDEX "merch_webhook_events_processed_createdAt_idx" ON "merch_webhook_events"("processed", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "external_agent_sessions_externalId_key" ON "external_agent_sessions"("externalId");

-- CreateIndex
CREATE INDEX "external_agent_sessions_provider_status_idx" ON "external_agent_sessions"("provider", "status");

-- CreateIndex
CREATE INDEX "external_agent_sessions_status_lastActivityAt_idx" ON "external_agent_sessions"("status", "lastActivityAt");

-- CreateIndex
CREATE INDEX "agent_session_activities_sessionId_createdAt_idx" ON "agent_session_activities"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "scout_competitors_workspaceId_idx" ON "scout_competitors"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "scout_competitors_workspaceId_platform_handle_key" ON "scout_competitors"("workspaceId", "platform", "handle");

-- CreateIndex
CREATE INDEX "scout_competitor_posts_competitorId_idx" ON "scout_competitor_posts"("competitorId");

-- CreateIndex
CREATE INDEX "scout_competitor_posts_postedAt_idx" ON "scout_competitor_posts"("postedAt");

-- CreateIndex
CREATE UNIQUE INDEX "scout_competitor_posts_competitorId_platformPostId_key" ON "scout_competitor_posts"("competitorId", "platformPostId");

-- CreateIndex
CREATE INDEX "scout_benchmarks_workspaceId_idx" ON "scout_benchmarks"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "scout_benchmarks_workspaceId_period_key" ON "scout_benchmarks"("workspaceId", "period");

-- CreateIndex
CREATE INDEX "social_accounts_userId_idx" ON "social_accounts"("userId");

-- CreateIndex
CREATE INDEX "social_accounts_workspaceId_idx" ON "social_accounts"("workspaceId");

-- CreateIndex
CREATE INDEX "social_accounts_status_idx" ON "social_accounts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "social_accounts_workspaceId_platform_accountId_key" ON "social_accounts"("workspaceId", "platform", "accountId");

-- CreateIndex
CREATE INDEX "social_posts_createdById_idx" ON "social_posts"("createdById");

-- CreateIndex
CREATE INDEX "social_posts_createdById_createdAt_idx" ON "social_posts"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "social_posts_status_idx" ON "social_posts"("status");

-- CreateIndex
CREATE INDEX "social_posts_isEligibleForAd_idx" ON "social_posts"("isEligibleForAd");

-- CreateIndex
CREATE INDEX "social_post_accounts_postId_idx" ON "social_post_accounts"("postId");

-- CreateIndex
CREATE INDEX "social_post_accounts_accountId_idx" ON "social_post_accounts"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "social_post_accounts_postId_accountId_key" ON "social_post_accounts"("postId", "accountId");

-- CreateIndex
CREATE INDEX "social_metrics_accountId_idx" ON "social_metrics"("accountId");

-- CreateIndex
CREATE INDEX "social_metrics_date_idx" ON "social_metrics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "social_metrics_accountId_date_key" ON "social_metrics"("accountId", "date");

-- CreateIndex
CREATE INDEX "social_metric_anomalies_accountId_idx" ON "social_metric_anomalies"("accountId");

-- CreateIndex
CREATE INDEX "social_metric_anomalies_detectedAt_idx" ON "social_metric_anomalies"("detectedAt");

-- CreateIndex
CREATE INDEX "social_metric_anomalies_severity_idx" ON "social_metric_anomalies"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "Hypothesis_experimentId_key" ON "Hypothesis"("experimentId");

-- CreateIndex
CREATE INDEX "Hypothesis_workspaceId_idx" ON "Hypothesis"("workspaceId");

-- CreateIndex
CREATE INDEX "Hypothesis_status_idx" ON "Hypothesis"("status");

-- CreateIndex
CREATE INDEX "Hypothesis_priority_idx" ON "Hypothesis"("priority");

-- CreateIndex
CREATE INDEX "social_post_ab_tests_workspaceId_idx" ON "social_post_ab_tests"("workspaceId");

-- CreateIndex
CREATE INDEX "social_post_ab_tests_status_idx" ON "social_post_ab_tests"("status");

-- CreateIndex
CREATE INDEX "social_post_ab_tests_originalPostId_idx" ON "social_post_ab_tests"("originalPostId");

-- CreateIndex
CREATE INDEX "social_post_ab_test_variants_testId_idx" ON "social_post_ab_test_variants"("testId");

-- CreateIndex
CREATE INDEX "ExperimentResult_experimentId_idx" ON "ExperimentResult"("experimentId");

-- CreateIndex
CREATE INDEX "ExperimentResult_variantId_idx" ON "ExperimentResult"("variantId");

-- CreateIndex
CREATE INDEX "ExperimentResult_metricName_idx" ON "ExperimentResult"("metricName");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_stripeSubscriptionId_key" ON "workspaces"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "workspaces_slug_idx" ON "workspaces"("slug");

-- CreateIndex
CREATE INDEX "workspaces_isPersonal_idx" ON "workspaces"("isPersonal");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_apps_appId_key" ON "workspace_apps"("appId");

-- CreateIndex
CREATE INDEX "workspace_apps_workspaceId_idx" ON "workspace_apps"("workspaceId");

-- CreateIndex
CREATE INDEX "workspace_apps_appId_idx" ON "workspace_apps"("appId");

-- CreateIndex
CREATE INDEX "workspace_apps_purpose_idx" ON "workspace_apps"("purpose");

-- CreateIndex
CREATE INDEX "workspace_favorites_userId_idx" ON "workspace_favorites"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_favorites_userId_workspaceId_key" ON "workspace_favorites"("userId", "workspaceId");

-- CreateIndex
CREATE INDEX "workspace_recent_access_userId_accessedAt_idx" ON "workspace_recent_access"("userId", "accessedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "workspace_recent_access_userId_workspaceId_key" ON "workspace_recent_access"("userId", "workspaceId");

-- CreateIndex
CREATE INDEX "workspace_members_workspaceId_idx" ON "workspace_members"("workspaceId");

-- CreateIndex
CREATE INDEX "workspace_members_userId_idx" ON "workspace_members"("userId");

-- CreateIndex
CREATE INDEX "workspace_members_role_idx" ON "workspace_members"("role");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_workspaceId_userId_key" ON "workspace_members"("workspaceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "connections_identityId_key" ON "connections"("identityId");

-- CreateIndex
CREATE INDEX "connections_workspaceId_idx" ON "connections"("workspaceId");

-- CreateIndex
CREATE INDEX "connections_workspaceId_warmthScore_idx" ON "connections"("workspaceId", "warmthScore");

-- CreateIndex
CREATE INDEX "connections_workspaceId_meetupStatus_idx" ON "connections"("workspaceId", "meetupStatus");

-- CreateIndex
CREATE UNIQUE INDEX "connection_platform_presence_connectionId_platform_key" ON "connection_platform_presence"("connectionId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "connection_tags_workspaceId_name_key" ON "connection_tags"("workspaceId", "name");

-- CreateIndex
CREATE INDEX "connection_reminders_workspaceId_dueDate_idx" ON "connection_reminders"("workspaceId", "dueDate");

-- CreateIndex
CREATE INDEX "connection_reminders_workspaceId_status_idx" ON "connection_reminders"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "meetup_status_history_connectionId_idx" ON "meetup_status_history"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "brand_profiles_workspaceId_key" ON "brand_profiles"("workspaceId");

-- CreateIndex
CREATE INDEX "brand_profiles_workspaceId_idx" ON "brand_profiles"("workspaceId");

-- CreateIndex
CREATE INDEX "brand_profiles_isActive_idx" ON "brand_profiles"("isActive");

-- CreateIndex
CREATE INDEX "brand_profiles_createdById_idx" ON "brand_profiles"("createdById");

-- CreateIndex
CREATE INDEX "brand_guardrails_brandProfileId_idx" ON "brand_guardrails"("brandProfileId");

-- CreateIndex
CREATE INDEX "brand_guardrails_brandProfileId_type_idx" ON "brand_guardrails"("brandProfileId", "type");

-- CreateIndex
CREATE INDEX "brand_guardrails_brandProfileId_isActive_idx" ON "brand_guardrails"("brandProfileId", "isActive");

-- CreateIndex
CREATE INDEX "brand_guardrails_type_severity_idx" ON "brand_guardrails"("type", "severity");

-- CreateIndex
CREATE INDEX "brand_vocabulary_brandProfileId_idx" ON "brand_vocabulary"("brandProfileId");

-- CreateIndex
CREATE INDEX "brand_vocabulary_brandProfileId_type_idx" ON "brand_vocabulary"("brandProfileId", "type");

-- CreateIndex
CREATE INDEX "brand_vocabulary_brandProfileId_isActive_idx" ON "brand_vocabulary"("brandProfileId", "isActive");

-- CreateIndex
CREATE INDEX "brand_vocabulary_term_idx" ON "brand_vocabulary"("term");

-- CreateIndex
CREATE INDEX "content_rewrites_workspaceId_idx" ON "content_rewrites"("workspaceId");

-- CreateIndex
CREATE INDEX "content_rewrites_brandProfileId_idx" ON "content_rewrites"("brandProfileId");

-- CreateIndex
CREATE INDEX "content_rewrites_createdById_idx" ON "content_rewrites"("createdById");

-- CreateIndex
CREATE INDEX "content_rewrites_status_idx" ON "content_rewrites"("status");

-- CreateIndex
CREATE INDEX "content_rewrites_createdAt_idx" ON "content_rewrites"("createdAt");

-- CreateIndex
CREATE INDEX "scheduled_posts_workspaceId_idx" ON "scheduled_posts"("workspaceId");

-- CreateIndex
CREATE INDEX "scheduled_posts_workspaceId_scheduledAt_idx" ON "scheduled_posts"("workspaceId", "scheduledAt");

-- CreateIndex
CREATE INDEX "scheduled_posts_workspaceId_status_idx" ON "scheduled_posts"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "scheduled_posts_createdById_idx" ON "scheduled_posts"("createdById");

-- CreateIndex
CREATE INDEX "scheduled_posts_status_idx" ON "scheduled_posts"("status");

-- CreateIndex
CREATE INDEX "scheduled_posts_scheduledAt_idx" ON "scheduled_posts"("scheduledAt");

-- CreateIndex
CREATE INDEX "scheduled_posts_nextOccurrenceAt_idx" ON "scheduled_posts"("nextOccurrenceAt");

-- CreateIndex
CREATE INDEX "scheduled_post_accounts_postId_idx" ON "scheduled_post_accounts"("postId");

-- CreateIndex
CREATE INDEX "scheduled_post_accounts_accountId_idx" ON "scheduled_post_accounts"("accountId");

-- CreateIndex
CREATE INDEX "scheduled_post_accounts_status_idx" ON "scheduled_post_accounts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_post_accounts_postId_accountId_key" ON "scheduled_post_accounts"("postId", "accountId");

-- CreateIndex
CREATE INDEX "posting_time_recommendations_accountId_idx" ON "posting_time_recommendations"("accountId");

-- CreateIndex
CREATE INDEX "posting_time_recommendations_score_idx" ON "posting_time_recommendations"("score");

-- CreateIndex
CREATE UNIQUE INDEX "posting_time_recommendations_accountId_dayOfWeek_hourUtc_key" ON "posting_time_recommendations"("accountId", "dayOfWeek", "hourUtc");

-- CreateIndex
CREATE INDEX "calendar_content_suggestions_workspaceId_idx" ON "calendar_content_suggestions"("workspaceId");

-- CreateIndex
CREATE INDEX "calendar_content_suggestions_status_idx" ON "calendar_content_suggestions"("status");

-- CreateIndex
CREATE INDEX "calendar_content_suggestions_suggestedFor_idx" ON "calendar_content_suggestions"("suggestedFor");

-- CreateIndex
CREATE INDEX "calendar_content_suggestions_platform_idx" ON "calendar_content_suggestions"("platform");

-- CreateIndex
CREATE INDEX "inbox_items_workspaceId_idx" ON "inbox_items"("workspaceId");

-- CreateIndex
CREATE INDEX "inbox_items_workspaceId_status_idx" ON "inbox_items"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "inbox_items_workspaceId_platform_idx" ON "inbox_items"("workspaceId", "platform");

-- CreateIndex
CREATE INDEX "inbox_items_accountId_idx" ON "inbox_items"("accountId");

-- CreateIndex
CREATE INDEX "inbox_items_assignedToId_idx" ON "inbox_items"("assignedToId");

-- CreateIndex
CREATE INDEX "inbox_items_receivedAt_idx" ON "inbox_items"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "inbox_items_workspaceId_platform_platformItemId_key" ON "inbox_items"("workspaceId", "platform", "platformItemId");

-- CreateIndex
CREATE INDEX "relay_drafts_inboxItemId_idx" ON "relay_drafts"("inboxItemId");

-- CreateIndex
CREATE INDEX "relay_drafts_inboxItemId_status_idx" ON "relay_drafts"("inboxItemId", "status");

-- CreateIndex
CREATE INDEX "relay_drafts_status_idx" ON "relay_drafts"("status");

-- CreateIndex
CREATE INDEX "draft_edit_history_draftId_idx" ON "draft_edit_history"("draftId");

-- CreateIndex
CREATE INDEX "draft_edit_history_editedById_idx" ON "draft_edit_history"("editedById");

-- CreateIndex
CREATE INDEX "draft_edit_history_editType_idx" ON "draft_edit_history"("editType");

-- CreateIndex
CREATE INDEX "draft_audit_logs_draftId_idx" ON "draft_audit_logs"("draftId");

-- CreateIndex
CREATE INDEX "draft_audit_logs_performedById_idx" ON "draft_audit_logs"("performedById");

-- CreateIndex
CREATE INDEX "draft_audit_logs_action_idx" ON "draft_audit_logs"("action");

-- CreateIndex
CREATE INDEX "draft_audit_logs_createdAt_idx" ON "draft_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "crisis_detection_events_workspaceId_idx" ON "crisis_detection_events"("workspaceId");

-- CreateIndex
CREATE INDEX "crisis_detection_events_status_idx" ON "crisis_detection_events"("status");

-- CreateIndex
CREATE INDEX "crisis_detection_events_severity_idx" ON "crisis_detection_events"("severity");

-- CreateIndex
CREATE INDEX "crisis_detection_events_detectedAt_idx" ON "crisis_detection_events"("detectedAt");

-- CreateIndex
CREATE INDEX "crisis_detection_events_workspaceId_status_idx" ON "crisis_detection_events"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "crisis_response_templates_workspaceId_idx" ON "crisis_response_templates"("workspaceId");

-- CreateIndex
CREATE INDEX "crisis_response_templates_category_idx" ON "crisis_response_templates"("category");

-- CreateIndex
CREATE INDEX "crisis_response_templates_isActive_idx" ON "crisis_response_templates"("isActive");

-- CreateIndex
CREATE INDEX "crisis_alert_rules_workspaceId_idx" ON "crisis_alert_rules"("workspaceId");

-- CreateIndex
CREATE INDEX "crisis_alert_rules_isActive_idx" ON "crisis_alert_rules"("isActive");

-- CreateIndex
CREATE INDEX "crisis_alert_rules_ruleType_idx" ON "crisis_alert_rules"("ruleType");

-- CreateIndex
CREATE UNIQUE INDEX "social_account_health_accountId_key" ON "social_account_health"("accountId");

-- CreateIndex
CREATE INDEX "social_account_health_accountId_idx" ON "social_account_health"("accountId");

-- CreateIndex
CREATE INDEX "social_account_health_status_idx" ON "social_account_health"("status");

-- CreateIndex
CREATE INDEX "social_account_health_healthScore_idx" ON "social_account_health"("healthScore");

-- CreateIndex
CREATE INDEX "recovery_guidance_issueType_idx" ON "recovery_guidance"("issueType");

-- CreateIndex
CREATE INDEX "recovery_guidance_severity_idx" ON "recovery_guidance"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "recovery_guidance_platform_issueType_key" ON "recovery_guidance"("platform", "issueType");

-- CreateIndex
CREATE INDEX "account_health_events_accountId_createdAt_idx" ON "account_health_events"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "account_health_events_workspaceId_createdAt_idx" ON "account_health_events"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "account_health_events_eventType_idx" ON "account_health_events"("eventType");

-- CreateIndex
CREATE INDEX "account_health_events_severity_idx" ON "account_health_events"("severity");

-- CreateIndex
CREATE INDEX "notifications_workspaceId_read_createdAt_idx" ON "notifications"("workspaceId", "read", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_workspaceId_userId_idx" ON "notifications"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "policy_rules_workspaceId_idx" ON "policy_rules"("workspaceId");

-- CreateIndex
CREATE INDEX "policy_rules_platform_idx" ON "policy_rules"("platform");

-- CreateIndex
CREATE INDEX "policy_rules_category_idx" ON "policy_rules"("category");

-- CreateIndex
CREATE INDEX "policy_rules_isActive_idx" ON "policy_rules"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "policy_rules_workspaceId_platform_name_key" ON "policy_rules"("workspaceId", "platform", "name");

-- CreateIndex
CREATE INDEX "policy_checks_workspaceId_createdAt_idx" ON "policy_checks"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "policy_checks_contentType_contentId_idx" ON "policy_checks"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "policy_checks_status_idx" ON "policy_checks"("status");

-- CreateIndex
CREATE INDEX "policy_checks_overallResult_idx" ON "policy_checks"("overallResult");

-- CreateIndex
CREATE INDEX "policy_violations_checkId_idx" ON "policy_violations"("checkId");

-- CreateIndex
CREATE INDEX "policy_violations_ruleId_idx" ON "policy_violations"("ruleId");

-- CreateIndex
CREATE INDEX "policy_violations_workspaceId_createdAt_idx" ON "policy_violations"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "policy_violations_severity_idx" ON "policy_violations"("severity");

-- CreateIndex
CREATE INDEX "scout_topics_workspaceId_idx" ON "scout_topics"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "scout_topics_workspaceId_name_key" ON "scout_topics"("workspaceId", "name");

-- CreateIndex
CREATE INDEX "scout_results_topicId_idx" ON "scout_results"("topicId");

-- CreateIndex
CREATE INDEX "scout_results_foundAt_idx" ON "scout_results"("foundAt");

-- CreateIndex
CREATE UNIQUE INDEX "scout_results_platform_platformId_topicId_key" ON "scout_results"("platform", "platformId", "topicId");

-- CreateIndex
CREATE INDEX "content_suggestions_workspaceId_status_idx" ON "content_suggestions"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "content_suggestions_workspaceId_overallScore_idx" ON "content_suggestions"("workspaceId", "overallScore");

-- CreateIndex
CREATE INDEX "content_suggestions_expiresAt_idx" ON "content_suggestions"("expiresAt");

-- CreateIndex
CREATE INDEX "allocator_campaigns_workspaceId_idx" ON "allocator_campaigns"("workspaceId");

-- CreateIndex
CREATE INDEX "allocator_campaigns_platform_idx" ON "allocator_campaigns"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "allocator_campaigns_workspaceId_platform_platformCampaignId_key" ON "allocator_campaigns"("workspaceId", "platform", "platformCampaignId");

-- CreateIndex
CREATE INDEX "allocator_ad_sets_campaignId_idx" ON "allocator_ad_sets"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "allocator_ad_sets_campaignId_platformAdSetId_key" ON "allocator_ad_sets"("campaignId", "platformAdSetId");

-- CreateIndex
CREATE INDEX "allocator_autopilot_configs_workspaceId_idx" ON "allocator_autopilot_configs"("workspaceId");

-- CreateIndex
CREATE INDEX "allocator_autopilot_configs_campaignId_idx" ON "allocator_autopilot_configs"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "allocator_autopilot_configs_workspaceId_campaignId_key" ON "allocator_autopilot_configs"("workspaceId", "campaignId");

-- CreateIndex
CREATE INDEX "allocator_guardrail_alerts_workspaceId_createdAt_idx" ON "allocator_guardrail_alerts"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "allocator_guardrail_alerts_workspaceId_acknowledged_idx" ON "allocator_guardrail_alerts"("workspaceId", "acknowledged");

-- CreateIndex
CREATE INDEX "allocator_guardrail_alerts_alertType_idx" ON "allocator_guardrail_alerts"("alertType");

-- CreateIndex
CREATE UNIQUE INDEX "allocator_autopilot_executions_rollbackOfId_key" ON "allocator_autopilot_executions"("rollbackOfId");

-- CreateIndex
CREATE INDEX "allocator_autopilot_executions_workspaceId_idx" ON "allocator_autopilot_executions"("workspaceId");

-- CreateIndex
CREATE INDEX "allocator_autopilot_executions_campaignId_idx" ON "allocator_autopilot_executions"("campaignId");

-- CreateIndex
CREATE INDEX "allocator_autopilot_executions_executedAt_idx" ON "allocator_autopilot_executions"("executedAt");

-- CreateIndex
CREATE INDEX "workflows_workspaceId_idx" ON "workflows"("workspaceId");

-- CreateIndex
CREATE INDEX "workflows_createdById_idx" ON "workflows"("createdById");

-- CreateIndex
CREATE INDEX "workflows_status_idx" ON "workflows"("status");

-- CreateIndex
CREATE INDEX "workflow_versions_workflowId_idx" ON "workflow_versions"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_versions_workflowId_version_key" ON "workflow_versions"("workflowId", "version");

-- CreateIndex
CREATE INDEX "workflow_steps_workflowVersionId_idx" ON "workflow_steps"("workflowVersionId");

-- CreateIndex
CREATE INDEX "workflow_steps_parentStepId_idx" ON "workflow_steps"("parentStepId");

-- CreateIndex
CREATE INDEX "workflow_runs_workflowId_idx" ON "workflow_runs"("workflowId");

-- CreateIndex
CREATE INDEX "workflow_runs_status_idx" ON "workflow_runs"("status");

-- CreateIndex
CREATE INDEX "workflow_run_logs_workflowRunId_idx" ON "workflow_run_logs"("workflowRunId");

-- CreateIndex
CREATE INDEX "workflow_run_logs_stepId_idx" ON "workflow_run_logs"("stepId");

-- CreateIndex
CREATE INDEX "workflow_schedules_workflowId_idx" ON "workflow_schedules"("workflowId");

-- CreateIndex
CREATE INDEX "workflow_schedules_nextRunAt_isActive_idx" ON "workflow_schedules"("nextRunAt", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_webhooks_webhookToken_key" ON "workflow_webhooks"("webhookToken");

-- CreateIndex
CREATE INDEX "workflow_webhooks_workflowId_idx" ON "workflow_webhooks"("workflowId");

-- CreateIndex
CREATE INDEX "workflow_webhooks_webhookToken_idx" ON "workflow_webhooks"("webhookToken");

-- CreateIndex
CREATE INDEX "workflow_event_subscriptions_eventType_isActive_idx" ON "workflow_event_subscriptions"("eventType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_event_subscriptions_workflowId_eventType_key" ON "workflow_event_subscriptions"("workflowId", "eventType");

-- CreateIndex
CREATE INDEX "allocator_daily_budget_moves_campaignId_idx" ON "allocator_daily_budget_moves"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "allocator_daily_budget_moves_campaignId_date_key" ON "allocator_daily_budget_moves"("campaignId", "date");

-- CreateIndex
CREATE INDEX "allocator_audit_logs_workspaceId_createdAt_idx" ON "allocator_audit_logs"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "allocator_audit_logs_campaignId_createdAt_idx" ON "allocator_audit_logs"("campaignId", "createdAt");

-- CreateIndex
CREATE INDEX "allocator_audit_logs_decisionType_idx" ON "allocator_audit_logs"("decisionType");

-- CreateIndex
CREATE INDEX "allocator_audit_logs_correlationId_idx" ON "allocator_audit_logs"("correlationId");

-- CreateIndex
CREATE INDEX "AbTest_status_idx" ON "AbTest"("status");

-- CreateIndex
CREATE INDEX "AbTestVariant_abTestId_idx" ON "AbTestVariant"("abTestId");

-- CreateIndex
CREATE UNIQUE INDEX "AbTestVariant_abTestId_name_key" ON "AbTestVariant"("abTestId", "name");

-- CreateIndex
CREATE INDEX "AbTestResult_visitorSessionId_idx" ON "AbTestResult"("visitorSessionId");

-- CreateIndex
CREATE INDEX "AbTestResult_abTestVariantId_idx" ON "AbTestResult"("abTestVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_name_key" ON "feature_flags"("name");

-- CreateIndex
CREATE INDEX "asset_folders_workspaceId_idx" ON "asset_folders"("workspaceId");

-- CreateIndex
CREATE INDEX "asset_folders_parentId_idx" ON "asset_folders"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "asset_folders_workspaceId_name_parentId_key" ON "asset_folders"("workspaceId", "name", "parentId");

-- CreateIndex
CREATE INDEX "asset_tags_workspaceId_idx" ON "asset_tags"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "asset_tags_workspaceId_name_key" ON "asset_tags"("workspaceId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "assets_r2Key_key" ON "assets"("r2Key");

-- CreateIndex
CREATE INDEX "assets_workspaceId_idx" ON "assets"("workspaceId");

-- CreateIndex
CREATE INDEX "assets_folderId_idx" ON "assets"("folderId");

-- CreateIndex
CREATE INDEX "assets_uploadedById_idx" ON "assets"("uploadedById");

-- CreateIndex
CREATE INDEX "assets_fileType_idx" ON "assets"("fileType");

-- CreateIndex
CREATE INDEX "asset_tag_assignments_assetId_idx" ON "asset_tag_assignments"("assetId");

-- CreateIndex
CREATE INDEX "asset_tag_assignments_tagId_idx" ON "asset_tag_assignments"("tagId");

-- CreateIndex
CREATE INDEX "post_assets_postId_idx" ON "post_assets"("postId");

-- CreateIndex
CREATE INDEX "post_assets_assetId_idx" ON "post_assets"("assetId");

-- CreateIndex
CREATE INDEX "scheduled_post_assets_postId_idx" ON "scheduled_post_assets"("postId");

-- CreateIndex
CREATE INDEX "scheduled_post_assets_assetId_idx" ON "scheduled_post_assets"("assetId");

-- CreateIndex
CREATE INDEX "post_performance_workspaceId_boostScore_idx" ON "post_performance"("workspaceId", "boostScore");

-- CreateIndex
CREATE INDEX "post_performance_workspaceId_metricPeriod_idx" ON "post_performance"("workspaceId", "metricPeriod");

-- CreateIndex
CREATE INDEX "post_performance_postId_postType_idx" ON "post_performance"("postId", "postType");

-- CreateIndex
CREATE INDEX "post_boost_recommendations_workspaceId_status_idx" ON "post_boost_recommendations"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "post_boost_recommendations_userId_status_idx" ON "post_boost_recommendations"("userId", "status");

-- CreateIndex
CREATE INDEX "post_boost_recommendations_expiresAt_idx" ON "post_boost_recommendations"("expiresAt");

-- CreateIndex
CREATE INDEX "post_boost_recommendations_postId_postType_idx" ON "post_boost_recommendations"("postId", "postType");

-- CreateIndex
CREATE UNIQUE INDEX "applied_boosts_recommendationId_key" ON "applied_boosts"("recommendationId");

-- CreateIndex
CREATE INDEX "applied_boosts_workspaceId_idx" ON "applied_boosts"("workspaceId");

-- CreateIndex
CREATE INDEX "applied_boosts_status_idx" ON "applied_boosts"("status");

-- CreateIndex
CREATE INDEX "applied_boosts_externalCampaignId_idx" ON "applied_boosts"("externalCampaignId");

-- CreateIndex
CREATE INDEX "organic_post_conversions_workspaceId_status_idx" ON "organic_post_conversions"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "organic_post_conversions_workspaceId_createdAt_idx" ON "organic_post_conversions"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "organic_post_conversions_platform_idx" ON "organic_post_conversions"("platform");

-- CreateIndex
CREATE INDEX "organic_post_conversions_postId_idx" ON "organic_post_conversions"("postId");

-- CreateIndex
CREATE INDEX "organic_post_engagers_conversionId_idx" ON "organic_post_engagers"("conversionId");

-- CreateIndex
CREATE INDEX "organic_post_engagers_platform_idx" ON "organic_post_engagers"("platform");

-- CreateIndex
CREATE INDEX "ad_creative_variants_conversionId_idx" ON "ad_creative_variants"("conversionId");

-- CreateIndex
CREATE INDEX "ad_creative_variants_format_placement_idx" ON "ad_creative_variants"("format", "placement");

-- CreateIndex
CREATE UNIQUE INDEX "identities_userId_key" ON "identities"("userId");

-- CreateIndex
CREATE INDEX "identities_userId_idx" ON "identities"("userId");

-- CreateIndex
CREATE INDEX "identifiers_identityId_idx" ON "identifiers"("identityId");

-- CreateIndex
CREATE UNIQUE INDEX "identifiers_type_value_key" ON "identifiers"("type", "value");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_white_label_configs_workspaceId_key" ON "workspace_white_label_configs"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_white_label_configs_customDomain_key" ON "workspace_white_label_configs"("customDomain");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_white_label_configs_dnsVerificationToken_key" ON "workspace_white_label_configs"("dnsVerificationToken");

-- CreateIndex
CREATE INDEX "workspace_white_label_configs_workspaceId_idx" ON "workspace_white_label_configs"("workspaceId");

-- CreateIndex
CREATE INDEX "workspace_white_label_configs_customDomain_idx" ON "workspace_white_label_configs"("customDomain");

-- CreateIndex
CREATE INDEX "workspace_white_label_configs_dnsVerificationStatus_idx" ON "workspace_white_label_configs"("dnsVerificationStatus");

-- CreateIndex
CREATE INDEX "brief_templates_workspaceId_idx" ON "brief_templates"("workspaceId");

-- CreateIndex
CREATE INDEX "creative_channels_briefId_idx" ON "creative_channels"("briefId");

-- CreateIndex
CREATE INDEX "creative_sets_briefId_idx" ON "creative_sets"("briefId");

-- CreateIndex
CREATE UNIQUE INDEX "creative_variants_imageJobId_key" ON "creative_variants"("imageJobId");

-- CreateIndex
CREATE INDEX "creative_variants_setId_idx" ON "creative_variants"("setId");

-- CreateIndex
CREATE INDEX "creative_variants_assetId_idx" ON "creative_variants"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "variant_performance_predictions_variantId_key" ON "variant_performance_predictions"("variantId");

-- CreateIndex
CREATE INDEX "creative_performance_variantId_idx" ON "creative_performance"("variantId");

-- CreateIndex
CREATE INDEX "creative_performance_date_idx" ON "creative_performance"("date");

-- CreateIndex
CREATE UNIQUE INDEX "creative_performance_variantId_date_key" ON "creative_performance"("variantId", "date");

-- CreateIndex
CREATE INDEX "creative_fatigue_alerts_variantId_idx" ON "creative_fatigue_alerts"("variantId");

-- CreateIndex
CREATE INDEX "creative_fatigue_alerts_severity_idx" ON "creative_fatigue_alerts"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "learnit_content_slug_key" ON "learnit_content"("slug");

-- CreateIndex
CREATE INDEX "learnit_content_slug_idx" ON "learnit_content"("slug");

-- CreateIndex
CREATE INDEX "learnit_content_path_idx" ON "learnit_content"("path");

-- CreateIndex
CREATE INDEX "learnit_content_viewCount_idx" ON "learnit_content"("viewCount");

-- CreateIndex
CREATE INDEX "learnit_content_status_idx" ON "learnit_content"("status");

-- CreateIndex
CREATE INDEX "learnit_relations_fromTopicId_idx" ON "learnit_relations"("fromTopicId");

-- CreateIndex
CREATE INDEX "learnit_relations_toTopicId_idx" ON "learnit_relations"("toTopicId");

-- CreateIndex
CREATE INDEX "learnit_relations_type_idx" ON "learnit_relations"("type");

-- CreateIndex
CREATE UNIQUE INDEX "learnit_relations_fromTopicId_toTopicId_type_key" ON "learnit_relations"("fromTopicId", "toTopicId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "agency_portfolio_items_slug_key" ON "agency_portfolio_items"("slug");

-- CreateIndex
CREATE INDEX "agency_portfolio_items_category_idx" ON "agency_portfolio_items"("category");

-- CreateIndex
CREATE INDEX "agency_portfolio_items_featured_idx" ON "agency_portfolio_items"("featured");

-- CreateIndex
CREATE UNIQUE INDEX "agency_personas_slug_key" ON "agency_personas"("slug");

-- CreateIndex
CREATE INDEX "agency_personas_rank_idx" ON "agency_personas"("rank");

-- CreateIndex
CREATE INDEX "agency_personas_predictedProfit_idx" ON "agency_personas"("predictedProfit");

-- CreateIndex
CREATE INDEX "agency_inquiries_status_idx" ON "agency_inquiries"("status");

-- CreateIndex
CREATE INDEX "agency_inquiries_createdAt_idx" ON "agency_inquiries"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "created_apps_slug_key" ON "created_apps"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "created_apps_codespaceId_key" ON "created_apps"("codespaceId");

-- CreateIndex
CREATE INDEX "created_apps_slug_idx" ON "created_apps"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_email_key" ON "newsletter_subscribers"("email");

-- CreateIndex
CREATE INDEX "newsletter_subscribers_email_idx" ON "newsletter_subscribers"("email");

-- CreateIndex
CREATE INDEX "_ConnectionTags_B_index" ON "_ConnectionTags"("B");

-- AddForeignKey
ALTER TABLE "campaign_briefs" ADD CONSTRAINT "campaign_briefs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_briefs" ADD CONSTRAINT "campaign_briefs_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "brief_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_briefs" ADD CONSTRAINT "campaign_briefs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_target_audiences" ADD CONSTRAINT "campaign_target_audiences_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "campaign_briefs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_objectives" ADD CONSTRAINT "campaign_objectives_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "campaign_briefs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_accounts" ADD CONSTRAINT "marketing_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_ads_campaigns" ADD CONSTRAINT "google_ads_campaigns_marketingAccountId_fkey" FOREIGN KEY ("marketingAccountId") REFERENCES "marketing_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apps" ADD CONSTRAINT "apps_forkedFrom_fkey" FOREIGN KEY ("forkedFrom") REFERENCES "apps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apps" ADD CONSTRAINT "apps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monetization_models" ADD CONSTRAINT "monetization_models_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_messages" ADD CONSTRAINT "app_messages_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_status_history" ADD CONSTRAINT "app_status_history_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_images" ADD CONSTRAINT "app_images_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_attachments" ADD CONSTRAINT "app_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "app_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_attachments" ADD CONSTRAINT "app_attachments_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "app_images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_code_versions" ADD CONSTRAINT "app_code_versions_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_code_versions" ADD CONSTRAINT "app_code_versions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "app_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enhanced_images" ADD CONSTRAINT "enhanced_images_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_enhancement_jobs" ADD CONSTRAINT "image_enhancement_jobs_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "enhancement_pipelines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_enhancement_jobs" ADD CONSTRAINT "image_enhancement_jobs_sourceImageId_fkey" FOREIGN KEY ("sourceImageId") REFERENCES "enhanced_images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_enhancement_jobs" ADD CONSTRAINT "image_enhancement_jobs_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "enhanced_images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_enhancement_jobs" ADD CONSTRAINT "image_enhancement_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "albums" ADD CONSTRAINT "albums_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "enhancement_pipelines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "albums" ADD CONSTRAINT "albums_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_images" ADD CONSTRAINT "album_images_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_images" ADD CONSTRAINT "album_images_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "enhanced_images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_audit_logs" ADD CONSTRAINT "workspace_audit_logs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_audit_logs" ADD CONSTRAINT "workspace_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_decision_logs" ADD CONSTRAINT "ai_decision_logs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_decision_logs" ADD CONSTRAINT "ai_decision_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_retention_policies" ADD CONSTRAINT "audit_retention_policies_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_suggested_responses" ADD CONSTRAINT "inbox_suggested_responses_inboxItemId_fkey" FOREIGN KEY ("inboxItemId") REFERENCES "inbox_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalation_events" ADD CONSTRAINT "escalation_events_inboxItemId_fkey" FOREIGN KEY ("inboxItemId") REFERENCES "inbox_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "featured_gallery_items" ADD CONSTRAINT "featured_gallery_items_sourceImageId_fkey" FOREIGN KEY ("sourceImageId") REFERENCES "enhanced_images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "featured_gallery_items" ADD CONSTRAINT "featured_gallery_items_sourceJobId_fkey" FOREIGN KEY ("sourceJobId") REFERENCES "image_enhancement_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "featured_gallery_items" ADD CONSTRAINT "featured_gallery_items_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boxes" ADD CONSTRAINT "boxes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boxes" ADD CONSTRAINT "boxes_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "box_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claude_code_agents" ADD CONSTRAINT "claude_code_agents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "claude_code_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "box_actions" ADD CONSTRAINT "box_actions_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "boxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_tasks" ADD CONSTRAINT "agent_tasks_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "boxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sandbox_jobs" ADD CONSTRAINT "sandbox_jobs_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracked_urls" ADD CONSTRAINT "tracked_urls_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mcp_generation_jobs" ADD CONSTRAINT "mcp_generation_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mcp_generation_jobs" ADD CONSTRAINT "mcp_generation_jobs_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "box_messages" ADD CONSTRAINT "box_messages_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "boxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enhancement_pipelines" ADD CONSTRAINT "enhancement_pipelines_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_sessions" ADD CONSTRAINT "visitor_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "visitor_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "visitor_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_attributions" ADD CONSTRAINT "campaign_attributions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audio_mixer_projects" ADD CONSTRAINT "audio_mixer_projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audio_tracks" ADD CONSTRAINT "audio_tracks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "audio_mixer_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merch_products" ADD CONSTRAINT "merch_products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "merch_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merch_variants" ADD CONSTRAINT "merch_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "merch_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merch_carts" ADD CONSTRAINT "merch_carts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merch_cart_items" ADD CONSTRAINT "merch_cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "merch_carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merch_cart_items" ADD CONSTRAINT "merch_cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "merch_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merch_cart_items" ADD CONSTRAINT "merch_cart_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "merch_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merch_cart_items" ADD CONSTRAINT "merch_cart_items_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "enhanced_images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merch_orders" ADD CONSTRAINT "merch_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merch_order_items" ADD CONSTRAINT "merch_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "merch_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merch_order_items" ADD CONSTRAINT "merch_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "merch_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merch_order_items" ADD CONSTRAINT "merch_order_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "merch_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merch_order_items" ADD CONSTRAINT "merch_order_items_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "merch_shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merch_shipments" ADD CONSTRAINT "merch_shipments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "merch_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merch_order_events" ADD CONSTRAINT "merch_order_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "merch_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_session_activities" ADD CONSTRAINT "agent_session_activities_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "external_agent_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scout_competitors" ADD CONSTRAINT "scout_competitors_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scout_competitor_posts" ADD CONSTRAINT "scout_competitor_posts_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "scout_competitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scout_benchmarks" ADD CONSTRAINT "scout_benchmarks_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_accounts" ADD CONSTRAINT "social_post_accounts_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_accounts" ADD CONSTRAINT "social_post_accounts_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_metrics" ADD CONSTRAINT "social_metrics_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_metric_anomalies" ADD CONSTRAINT "social_metric_anomalies_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hypothesis" ADD CONSTRAINT "Hypothesis_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hypothesis" ADD CONSTRAINT "Hypothesis_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "social_post_ab_tests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_ab_tests" ADD CONSTRAINT "social_post_ab_tests_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_ab_tests" ADD CONSTRAINT "social_post_ab_tests_originalPostId_fkey" FOREIGN KEY ("originalPostId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_ab_test_variants" ADD CONSTRAINT "social_post_ab_test_variants_testId_fkey" FOREIGN KEY ("testId") REFERENCES "social_post_ab_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentResult" ADD CONSTRAINT "ExperimentResult_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "social_post_ab_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentResult" ADD CONSTRAINT "ExperimentResult_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "social_post_ab_test_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_apps" ADD CONSTRAINT "workspace_apps_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_apps" ADD CONSTRAINT "workspace_apps_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_favorites" ADD CONSTRAINT "workspace_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_favorites" ADD CONSTRAINT "workspace_favorites_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_recent_access" ADD CONSTRAINT "workspace_recent_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_recent_access" ADD CONSTRAINT "workspace_recent_access_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "identities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_platform_presence" ADD CONSTRAINT "connection_platform_presence_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_tags" ADD CONSTRAINT "connection_tags_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_reminders" ADD CONSTRAINT "connection_reminders_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetup_status_history" ADD CONSTRAINT "meetup_status_history_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_profiles" ADD CONSTRAINT "brand_profiles_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_profiles" ADD CONSTRAINT "brand_profiles_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_profiles" ADD CONSTRAINT "brand_profiles_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_guardrails" ADD CONSTRAINT "brand_guardrails_brandProfileId_fkey" FOREIGN KEY ("brandProfileId") REFERENCES "brand_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_vocabulary" ADD CONSTRAINT "brand_vocabulary_brandProfileId_fkey" FOREIGN KEY ("brandProfileId") REFERENCES "brand_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_rewrites" ADD CONSTRAINT "content_rewrites_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_rewrites" ADD CONSTRAINT "content_rewrites_brandProfileId_fkey" FOREIGN KEY ("brandProfileId") REFERENCES "brand_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_rewrites" ADD CONSTRAINT "content_rewrites_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_post_accounts" ADD CONSTRAINT "scheduled_post_accounts_postId_fkey" FOREIGN KEY ("postId") REFERENCES "scheduled_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_post_accounts" ADD CONSTRAINT "scheduled_post_accounts_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posting_time_recommendations" ADD CONSTRAINT "posting_time_recommendations_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_content_suggestions" ADD CONSTRAINT "calendar_content_suggestions_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_items" ADD CONSTRAINT "inbox_items_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_items" ADD CONSTRAINT "inbox_items_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_items" ADD CONSTRAINT "inbox_items_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "workspace_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_items" ADD CONSTRAINT "inbox_items_escalatedToId_fkey" FOREIGN KEY ("escalatedToId") REFERENCES "workspace_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relay_drafts" ADD CONSTRAINT "relay_drafts_inboxItemId_fkey" FOREIGN KEY ("inboxItemId") REFERENCES "inbox_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relay_drafts" ADD CONSTRAINT "relay_drafts_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_edit_history" ADD CONSTRAINT "draft_edit_history_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_edit_history" ADD CONSTRAINT "draft_edit_history_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "relay_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_audit_logs" ADD CONSTRAINT "draft_audit_logs_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_audit_logs" ADD CONSTRAINT "draft_audit_logs_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "relay_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crisis_detection_events" ADD CONSTRAINT "crisis_detection_events_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crisis_detection_events" ADD CONSTRAINT "crisis_detection_events_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crisis_detection_events" ADD CONSTRAINT "crisis_detection_events_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crisis_response_templates" ADD CONSTRAINT "crisis_response_templates_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crisis_alert_rules" ADD CONSTRAINT "crisis_alert_rules_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_account_health" ADD CONSTRAINT "social_account_health_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_health_events" ADD CONSTRAINT "account_health_events_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_health_events" ADD CONSTRAINT "account_health_events_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_health_events" ADD CONSTRAINT "account_health_events_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_rules" ADD CONSTRAINT "policy_rules_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_checks" ADD CONSTRAINT "policy_checks_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_checks" ADD CONSTRAINT "policy_checks_checkedById_fkey" FOREIGN KEY ("checkedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_violations" ADD CONSTRAINT "policy_violations_checkId_fkey" FOREIGN KEY ("checkId") REFERENCES "policy_checks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_violations" ADD CONSTRAINT "policy_violations_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "policy_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_violations" ADD CONSTRAINT "policy_violations_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_violations" ADD CONSTRAINT "policy_violations_overriddenById_fkey" FOREIGN KEY ("overriddenById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scout_topics" ADD CONSTRAINT "scout_topics_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scout_results" ADD CONSTRAINT "scout_results_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "scout_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_suggestions" ADD CONSTRAINT "content_suggestions_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocator_campaigns" ADD CONSTRAINT "allocator_campaigns_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocator_ad_sets" ADD CONSTRAINT "allocator_ad_sets_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "allocator_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocator_autopilot_configs" ADD CONSTRAINT "allocator_autopilot_configs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocator_autopilot_configs" ADD CONSTRAINT "allocator_autopilot_configs_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "allocator_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocator_guardrail_alerts" ADD CONSTRAINT "allocator_guardrail_alerts_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocator_guardrail_alerts" ADD CONSTRAINT "allocator_guardrail_alerts_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "allocator_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocator_autopilot_executions" ADD CONSTRAINT "allocator_autopilot_executions_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocator_autopilot_executions" ADD CONSTRAINT "allocator_autopilot_executions_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "allocator_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocator_autopilot_executions" ADD CONSTRAINT "allocator_autopilot_executions_rollbackOfId_fkey" FOREIGN KEY ("rollbackOfId") REFERENCES "allocator_autopilot_executions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_versions" ADD CONSTRAINT "workflow_versions_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_workflowVersionId_fkey" FOREIGN KEY ("workflowVersionId") REFERENCES "workflow_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_parentStepId_fkey" FOREIGN KEY ("parentStepId") REFERENCES "workflow_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_run_logs" ADD CONSTRAINT "workflow_run_logs_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "workflow_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_schedules" ADD CONSTRAINT "workflow_schedules_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_webhooks" ADD CONSTRAINT "workflow_webhooks_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_event_subscriptions" ADD CONSTRAINT "workflow_event_subscriptions_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocator_daily_budget_moves" ADD CONSTRAINT "allocator_daily_budget_moves_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "allocator_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocator_audit_logs" ADD CONSTRAINT "allocator_audit_logs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocator_audit_logs" ADD CONSTRAINT "allocator_audit_logs_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "allocator_autopilot_executions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbTestVariant" ADD CONSTRAINT "AbTestVariant_abTestId_fkey" FOREIGN KEY ("abTestId") REFERENCES "AbTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbTestResult" ADD CONSTRAINT "AbTestResult_visitorSessionId_fkey" FOREIGN KEY ("visitorSessionId") REFERENCES "visitor_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbTestResult" ADD CONSTRAINT "AbTestResult_abTestVariantId_fkey" FOREIGN KEY ("abTestVariantId") REFERENCES "AbTestVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_folders" ADD CONSTRAINT "asset_folders_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_folders" ADD CONSTRAINT "asset_folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "asset_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_folders" ADD CONSTRAINT "asset_folders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_tags" ADD CONSTRAINT "asset_tags_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "asset_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_tag_assignments" ADD CONSTRAINT "asset_tag_assignments_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_tag_assignments" ADD CONSTRAINT "asset_tag_assignments_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "asset_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_tag_assignments" ADD CONSTRAINT "asset_tag_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_assets" ADD CONSTRAINT "post_assets_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_assets" ADD CONSTRAINT "post_assets_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_post_assets" ADD CONSTRAINT "scheduled_post_assets_postId_fkey" FOREIGN KEY ("postId") REFERENCES "scheduled_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_post_assets" ADD CONSTRAINT "scheduled_post_assets_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_performance" ADD CONSTRAINT "post_performance_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_boost_recommendations" ADD CONSTRAINT "post_boost_recommendations_postPerformanceId_fkey" FOREIGN KEY ("postPerformanceId") REFERENCES "post_performance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_boost_recommendations" ADD CONSTRAINT "post_boost_recommendations_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_boost_recommendations" ADD CONSTRAINT "post_boost_recommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applied_boosts" ADD CONSTRAINT "applied_boosts_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "post_boost_recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applied_boosts" ADD CONSTRAINT "applied_boosts_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organic_post_conversions" ADD CONSTRAINT "organic_post_conversions_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organic_post_engagers" ADD CONSTRAINT "organic_post_engagers_conversionId_fkey" FOREIGN KEY ("conversionId") REFERENCES "organic_post_conversions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_creative_variants" ADD CONSTRAINT "ad_creative_variants_conversionId_fkey" FOREIGN KEY ("conversionId") REFERENCES "organic_post_conversions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identities" ADD CONSTRAINT "identities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identifiers" ADD CONSTRAINT "identifiers_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_white_label_configs" ADD CONSTRAINT "workspace_white_label_configs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brief_templates" ADD CONSTRAINT "brief_templates_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brief_templates" ADD CONSTRAINT "brief_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_channels" ADD CONSTRAINT "creative_channels_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "campaign_briefs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_sets" ADD CONSTRAINT "creative_sets_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "campaign_briefs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_sets" ADD CONSTRAINT "creative_sets_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_variants" ADD CONSTRAINT "creative_variants_setId_fkey" FOREIGN KEY ("setId") REFERENCES "creative_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_variants" ADD CONSTRAINT "creative_variants_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_variants" ADD CONSTRAINT "creative_variants_imageJobId_fkey" FOREIGN KEY ("imageJobId") REFERENCES "mcp_generation_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_performance_predictions" ADD CONSTRAINT "variant_performance_predictions_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "creative_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_performance" ADD CONSTRAINT "creative_performance_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "creative_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_fatigue_alerts" ADD CONSTRAINT "creative_fatigue_alerts_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "creative_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_fatigue_alerts" ADD CONSTRAINT "creative_fatigue_alerts_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learnit_content" ADD CONSTRAINT "learnit_content_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learnit_relations" ADD CONSTRAINT "learnit_relations_fromTopicId_fkey" FOREIGN KEY ("fromTopicId") REFERENCES "learnit_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learnit_relations" ADD CONSTRAINT "learnit_relations_toTopicId_fkey" FOREIGN KEY ("toTopicId") REFERENCES "learnit_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "created_apps" ADD CONSTRAINT "created_apps_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConnectionTags" ADD CONSTRAINT "_ConnectionTags_A_fkey" FOREIGN KEY ("A") REFERENCES "connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConnectionTags" ADD CONSTRAINT "_ConnectionTags_B_fkey" FOREIGN KEY ("B") REFERENCES "connection_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
