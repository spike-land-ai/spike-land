/**
 * COMPASS Messaging Adapters — Core Types
 *
 * Shared type definitions for the unified adapter layer that abstracts
 * WhatsApp Cloud API, Telegram Bot API, and Twilio-style SMS delivery.
 */

// ---------------------------------------------------------------------------
// Platform
// ---------------------------------------------------------------------------

export enum Platform {
  WHATSAPP = "whatsapp",
  TELEGRAM = "telegram",
  SMS = "sms",
}

// ---------------------------------------------------------------------------
// Button and media primitives
// ---------------------------------------------------------------------------

/**
 * An interactive button presented to the user.
 *
 * - WhatsApp: rendered as a reply button (max 3 per message) or list-item row.
 * - Telegram: rendered as an InlineKeyboardButton.
 * - SMS: rendered as a numbered option in plain text (buttons fall back to text).
 */
export interface Button {
  /** Stable identifier used for deduplication and analytics. */
  readonly id: string;
  /** Human-readable label shown on the button face. */
  readonly label: string;
  /**
   * Opaque string returned in the webhook when the user taps this button.
   * For WhatsApp this maps to `reply.id`. For Telegram, `callback_data`.
   */
  readonly payload: string;
}

export type MediaType = "image" | "document" | "voice";

export interface MediaAttachment {
  readonly type: MediaType;
  /** Publicly reachable URL that the messaging platform will fetch. */
  readonly url: string;
  /** Optional caption displayed below the media item. */
  readonly caption?: string;
}

// ---------------------------------------------------------------------------
// IncomingMessage
// ---------------------------------------------------------------------------

export interface IncomingMessageMetadata {
  /** GeoJSON-style point if the user shared a location. */
  readonly location?: {
    readonly latitude: number;
    readonly longitude: number;
  };
  /** Media attachment included in the inbound message, if any. */
  readonly media?: MediaAttachment;
  /** Message ID the inbound message is replying to, if applicable. */
  readonly replyTo?: string;
}

/**
 * Normalised representation of a message received from any platform.
 * All platform-specific payload details are stripped; callers work only
 * with this interface.
 */
export interface IncomingMessage {
  /** Platform the message arrived on. */
  readonly platform: Platform;
  /** Stable identifier for the sending user on this platform. */
  readonly userId: string;
  /**
   * Conversation thread identifier.
   * - WhatsApp: the sender phone number.
   * - Telegram: the numeric chat_id (string-encoded).
   * - SMS: the sender phone number (E.164).
   */
  readonly chatId: string;
  /** Plain text content of the message. Empty string when media-only. */
  readonly text: string;
  /** Unix epoch milliseconds. */
  readonly timestamp: number;
  readonly metadata?: IncomingMessageMetadata;
}

// ---------------------------------------------------------------------------
// OutgoingMessage
// ---------------------------------------------------------------------------

/**
 * Platform-agnostic message to be sent. The adapter is responsible for
 * converting this to the wire format required by the target platform.
 */
export interface OutgoingMessage {
  /** Destination chat / conversation. */
  readonly chatId: string;
  /** Primary text body. */
  readonly text: string;
  /**
   * Optional interactive buttons.
   * - WhatsApp: max 3 reply buttons; use list messages for more.
   * - SMS: ignored by the adapter (falls back to numbered text options).
   */
  readonly buttons?: Button[];
  /** Optional media to attach. */
  readonly media?: MediaAttachment;
}

// ---------------------------------------------------------------------------
// WebhookConfig
// ---------------------------------------------------------------------------

/**
 * Platform-level webhook configuration supplied to WebhookHandler.
 */
export interface WebhookConfig {
  /**
   * Shared secret used to verify incoming webhook requests.
   * - WhatsApp: HMAC-SHA256 signing secret.
   * - Telegram: not used for signature (bot token is the bearer secret, set here for consistency).
   * - SMS/Twilio: Auth Token used for request validation.
   */
  readonly secret: string;
  /**
   * WhatsApp-specific token returned during hub.challenge verification.
   * Set when handling GET /webhook from the Meta developer console.
   */
  readonly verifyToken?: string;
  /** URL path this platform's webhooks are delivered to (e.g. "/webhook/whatsapp"). */
  readonly path: string;
}

// ---------------------------------------------------------------------------
// DeliveryStatus
// ---------------------------------------------------------------------------

export type DeliveryStatusValue = "sent" | "delivered" | "read" | "failed";

/**
 * Delivery receipt reported by the platform after a message is sent.
 */
export interface DeliveryStatus {
  /** Platform-assigned message identifier returned at send time. */
  readonly messageId: string;
  readonly status: DeliveryStatusValue;
  /** Unix epoch milliseconds when the status was recorded. */
  readonly timestamp: number;
}

// ---------------------------------------------------------------------------
// HttpClient — injectable boundary for actual network I/O
// ---------------------------------------------------------------------------

export interface HttpRequest {
  readonly url: string;
  readonly method: "GET" | "POST";
  readonly headers?: Record<string, string>;
  readonly body?: unknown;
}

export interface HttpResponse {
  readonly status: number;
  readonly body: unknown;
}

/**
 * Abstraction over HTTP I/O. Adapters call this instead of fetch/axios so
 * the concrete implementation can be swapped (real HTTP, mock, test double).
 */
export interface HttpClient {
  request(req: HttpRequest): Promise<HttpResponse>;
}

// ---------------------------------------------------------------------------
// MessagingAdapter
// ---------------------------------------------------------------------------

/**
 * Contract that every platform adapter must satisfy.
 * Adapters are pure message formatters/parsers — they delegate actual HTTP
 * calls to the injected HttpClient.
 */
export interface MessagingAdapter {
  readonly platform: Platform;

  /**
   * Format and deliver an outgoing message to the given chat.
   */
  sendMessage(msg: OutgoingMessage): Promise<void>;

  /**
   * Convenience method for sending interactive button prompts.
   * For SMS this falls back to numbered plain-text options.
   */
  sendButtons(chatId: string, text: string, buttons: Button[]): Promise<void>;

  /**
   * Extract a normalised IncomingMessage from a raw webhook payload.
   * Throws ParseError when the payload cannot be understood.
   */
  parseWebhook(body: unknown): IncomingMessage;
}
