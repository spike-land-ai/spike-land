/**
 * @compass/messaging
 *
 * Unified adapter layer for messaging platforms (WhatsApp, Telegram, SMS).
 *
 * Usage:
 *
 *   import { MessageRouter, WhatsAppAdapter, TelegramAdapter, SMSAdapter, Platform } from "@compass/messaging";
 *
 *   const router = new MessageRouter();
 *   router.registerAdapter(new WhatsAppAdapter(httpClient, phoneNumberId, accessToken));
 *   router.registerAdapter(new TelegramAdapter(httpClient, botToken));
 *   router.registerAdapter(new SMSAdapter(httpClient, accountSid, authToken, fromNumber));
 *
 *   // Parse an inbound webhook:
 *   const incoming = router.routeIncoming(Platform.WHATSAPP, webhookBody);
 *
 *   // Send an outbound message (adapted for the target platform automatically):
 *   await router.routeOutgoing(Platform.TELEGRAM, { chatId, text, buttons });
 */

// Core types
export type {
  Button,
  DeliveryStatus,
  DeliveryStatusValue,
  HttpClient,
  HttpRequest,
  HttpResponse,
  IncomingMessage,
  IncomingMessageMetadata,
  MediaAttachment,
  MediaType,
  MessagingAdapter,
  OutgoingMessage,
  WebhookConfig,
} from "./types.js";
export { Platform } from "./types.js";

// Adapters
export {
  WhatsAppAdapter,
  WhatsAppParseError,
  WhatsAppButtonLimitError,
} from "./core-logic/whatsapp-adapter.js";
export { TelegramAdapter, TelegramParseError } from "./core-logic/telegram-adapter.js";
export {
  SMSAdapter,
  SmsParseError,
  splitSmsSegments,
  formatButtonsAsText,
} from "./core-logic/sms-adapter.js";

// Routing
export { MessageRouter, UnknownPlatformError, adaptMessage } from "./core-logic/message-router.js";

// Webhook handling
export {
  WebhookHandler,
  WebhookVerificationError,
  verifyWhatsAppSignature,
  hasTwilioSignatureHeader,
} from "./core-logic/webhook-handler.js";
export type { WebhookRequest, WebhookResponse } from "./core-logic/webhook-handler.js";
