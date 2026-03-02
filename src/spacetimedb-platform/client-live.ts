/**
 * Live SpacetimeDB Platform Client
 *
 * Uses native HTTP fetch instead of the spacetimedb npm SDK.
 * All reads use SQL queries, all writes call reducers via HTTP.
 */

import type { SpacetimePlatformClient } from "./client.js";
import { createStdbHttpClient, type StdbHttpClient } from "./stdb-http-client.js";
import type {
  Agent,
  AgentMessage,
  App,
  AppMessage,
  AppVersion,
  ConnectionState,
  DirectMessage,
  HealthCheck,
  OAuthLink,
  Page,
  PlatformEvent,
  Task,
  ToolEntry,
  ToolUsage,
  User,
  UserToolPreference,
} from "./types.js";

// ─── Live Client Factory ───

export function createLivePlatformClient(): SpacetimePlatformClient {
  let state: ConnectionState = {
    connected: false,
    uri: null,
    moduleName: null,
    identity: null,
    token: null,
  };

  let httpClient: StdbHttpClient | null = null;

  function requireClient(): StdbHttpClient {
    if (!httpClient) throw new Error("Not connected");
    return httpClient;
  }

  return {
    getState() {
      return { ...state };
    },

    async connect(uri: string, moduleName: string, token?: string): Promise<ConnectionState> {
      if (state.connected) {
        throw new Error("Already connected. Disconnect first.");
      }

      // Convert ws:// to http:// for HTTP API
      const httpHost = uri.replace(/^ws(s?):\/\//, "http$1://");

      httpClient = createStdbHttpClient({
        host: httpHost,
        database: moduleName,
        token,
      });

      // Verify connectivity with a simple query
      await httpClient.sql("SELECT 1");

      state = {
        connected: true,
        uri,
        moduleName,
        identity: null, // HTTP API doesn't return identity on connect
        token: token ?? null,
      };

      return { ...state };
    },

    disconnect() {
      httpClient = null;
      state = { connected: false, uri: null, moduleName: null, identity: null, token: null };
    },

    // ─── Users ───

    async registerUser(handle: string, displayName: string, email: string) {
      await requireClient().callReducer("register_user", [handle, displayName, email]);
    },

    getUser(_identity: string): User | undefined {
      throw new Error("Use getUserAsync() — HTTP client requires async. Sync getUser not supported.");
    },

    listUsers(_onlineOnly = false): User[] {
      throw new Error("Use listUsersAsync() — HTTP client requires async. Sync listUsers not supported.");
    },

    async updateProfile(fields: { displayName?: string; email?: string }) {
      await requireClient().callReducer("update_profile", [fields.displayName, fields.email]);
    },

    // ─── OAuth ───

    async linkOAuth(provider: string, providerAccountId: string) {
      await requireClient().callReducer("link_oauth", [provider, providerAccountId]);
    },

    getOAuthLinks(_userIdentity: string): OAuthLink[] {
      throw new Error("Sync getOAuthLinks not supported with HTTP client.");
    },

    // ─── Tools ───

    searchTools(_query?: string, _category?: string): ToolEntry[] {
      throw new Error("Sync searchTools not supported with HTTP client.");
    },

    getToolEntry(_name: string): ToolEntry | undefined {
      throw new Error("Sync getToolEntry not supported with HTTP client.");
    },

    listCategories(): string[] {
      throw new Error("Sync listCategories not supported with HTTP client.");
    },

    async enableTool(name: string) {
      await requireClient().callReducer("enable_tool", [name]);
    },

    async disableTool(name: string) {
      await requireClient().callReducer("disable_tool", [name]);
    },

    async recordToolUsage(toolName: string, durationMs: number, success: boolean) {
      await requireClient().callReducer("record_tool_usage", [toolName, durationMs, success]);
    },

    getToolUsageStats(_toolName?: string): ToolUsage[] {
      throw new Error("Sync getToolUsageStats not supported with HTTP client.");
    },

    getUserToolPreferences(_userIdentity: string): UserToolPreference[] {
      throw new Error("Sync getUserToolPreferences not supported with HTTP client.");
    },

    // ─── Apps ───

    async createApp(slug: string, name: string, description: string, r2CodeKey: string) {
      await requireClient().callReducer("create_app", [slug, name, description, r2CodeKey]);
    },

    getApp(_slugOrId: string | bigint): App | undefined {
      throw new Error("Sync getApp not supported with HTTP client.");
    },

    listApps(_ownerIdentity?: string): App[] {
      throw new Error("Sync listApps not supported with HTTP client.");
    },

    async updateAppStatus(appId: bigint, status: string) {
      await requireClient().callReducer("update_app_status", [appId, status]);
    },

    async deleteApp(appId: bigint) {
      await requireClient().callReducer("delete_app", [appId]);
    },

    async restoreApp(appId: bigint) {
      await requireClient().callReducer("restore_app", [appId]);
    },

    async createAppVersion(
      appId: bigint,
      version: string,
      codeHash: string,
      changeDescription: string,
    ) {
      await requireClient().callReducer("create_app_version", [appId, version, codeHash, changeDescription]);
    },

    listAppVersions(_appId: bigint): AppVersion[] {
      throw new Error("Sync listAppVersions not supported with HTTP client.");
    },

    async sendAppMessage(appId: bigint, role: string, content: string) {
      await requireClient().callReducer("send_app_message", [appId, role, content]);
    },

    getAppMessages(_appId: bigint): AppMessage[] {
      throw new Error("Sync getAppMessages not supported with HTTP client.");
    },

    // ─── Content ───

    async createPage(slug: string, title: string, description: string) {
      await requireClient().callReducer("create_page", [slug, title, description]);
    },

    getPage(_slug: string): Page | undefined {
      throw new Error("Sync getPage not supported with HTTP client.");
    },

    async updatePage(slug: string, fields: { title?: string; description?: string }) {
      await requireClient().callReducer("update_page", [slug, fields.title, fields.description]);
    },

    async deletePage(slug: string) {
      await requireClient().callReducer("delete_page", [slug]);
    },

    async createBlock(pageId: bigint, blockType: string, contentJson: string, sortOrder: number) {
      await requireClient().callReducer("create_page_block", [pageId, blockType, contentJson, sortOrder]);
    },

    async updateBlock(blockId: bigint, fields: { contentJson?: string; sortOrder?: number }) {
      await requireClient().callReducer("update_page_block", [blockId, fields.contentJson, fields.sortOrder]);
    },

    async deleteBlock(blockId: bigint) {
      await requireClient().callReducer("delete_page_block", [blockId]);
    },

    async reorderBlocks(pageId: bigint, blockIds: bigint[]) {
      await requireClient().callReducer("reorder_page_blocks", [pageId, blockIds]);
    },

    // ─── Direct Messages ───

    async sendDM(toIdentity: string, content: string) {
      await requireClient().callReducer("send_dm", [toIdentity, content]);
    },

    listDMs(_withIdentity?: string): DirectMessage[] {
      throw new Error("Sync listDMs not supported with HTTP client.");
    },

    async markDMRead(messageId: bigint) {
      await requireClient().callReducer("mark_dm_read", [messageId]);
    },

    // ─── Agents ───

    async registerAgent(displayName: string, capabilities: string[]) {
      await requireClient().callReducer("register_agent", [displayName, capabilities]);
    },

    listAgents(_onlineOnly = false): Agent[] {
      throw new Error("Sync listAgents not supported with HTTP client.");
    },

    async sendAgentMessage(toAgent: string, content: string) {
      await requireClient().callReducer("send_agent_message", [toAgent, content]);
    },

    getAgentMessages(_onlyUndelivered = true): AgentMessage[] {
      throw new Error("Sync getAgentMessages not supported with HTTP client.");
    },

    async markAgentMessageDelivered(messageId: bigint) {
      await requireClient().callReducer("mark_agent_message_delivered", [messageId]);
    },

    // ─── Tasks ───

    async createTask(description: string, priority = 0, context = "") {
      await requireClient().callReducer("create_task", [description, priority, context]);
    },

    listTasks(_statusFilter?: string): Task[] {
      throw new Error("Sync listTasks not supported with HTTP client.");
    },

    async claimTask(taskId: bigint) {
      await requireClient().callReducer("claim_task", [taskId]);
    },

    async completeTask(taskId: bigint) {
      await requireClient().callReducer("complete_task", [taskId]);
    },

    // ─── Analytics ───

    async recordEvent(
      source: string,
      eventType: string,
      metadataJson: string,
      userIdentity?: string,
    ) {
      await requireClient().callReducer("record_platform_event", [source, eventType, metadataJson, userIdentity]);
    },

    queryEvents(_filters: {
      source?: string;
      eventType?: string;
      userIdentity?: string;
    }): PlatformEvent[] {
      throw new Error("Sync queryEvents not supported with HTTP client.");
    },

    getHealthStatus(): HealthCheck[] {
      throw new Error("Sync getHealthStatus not supported with HTTP client.");
    },
  };
}
