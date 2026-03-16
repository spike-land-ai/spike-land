import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import * as Tabs from "@radix-ui/react-tabs";
import { useAuth } from "../hooks/useAuth";
import { trackAnalyticsEvent } from "../hooks/useAnalytics";
import { useToast } from "../components/Toast";
import { usePricing } from "../hooks/usePricing";
import { AuthGuard } from "../components/AuthGuard";
import { CreditWidget } from "../components/CreditWidget";
import { apiFetch } from "../../core-logic/api";
import { trackPurchaseConversion, getStoredGclid } from "../../core-logic/google-ads";
import { UI_ANIMATIONS } from "@spike-land-ai/shared/constants";

type SettingsTab = "profile" | "whatsapp" | "keys" | "billing" | "access";

const TAB_IDS: SettingsTab[] = ["profile", "whatsapp", "keys", "billing", "access"];

type Provider = "openai" | "anthropic" | "google" | "mistral";

interface ApiKey {
  id: string;
  provider: Provider;
  key: string;
  createdAt?: string;
}

const PROVIDERS: Provider[] = ["openai", "anthropic", "google", "mistral"];

// ---------- Profile Tab ----------

function ProfileTab() {
  const { t } = useTranslation("settings");
  const { user, isAuthenticated } = useAuth();
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const name = nameRef.current?.value.trim() ?? "";
    const email = emailRef.current?.value.trim() ?? "";
    if (!name) {
      setError(t("profile.nameRequired"));
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t("profile.emailRequired"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch("/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) throw new Error(`Failed to save: ${res.status}`);
      setSaved(true);
      setTimeout(() => setSaved(false), UI_ANIMATIONS.LONG_FEEDBACK_MS);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.unknown"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <fieldset className="space-y-5">
      <div>
        <label htmlFor="displayName" className="mb-1.5 block text-[13px] font-medium text-foreground">
          {t("profile.displayName")}
        </label>
        <input
          ref={nameRef}
          id="displayName"
          type="text"
          defaultValue={isAuthenticated ? (user?.name ?? "") : ""}
          className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
          placeholder={t("profile.namePlaceholder")}
        />
      </div>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-foreground">
          {t("profile.email")}
        </label>
        <input
          ref={emailRef}
          id="email"
          type="email"
          defaultValue={isAuthenticated ? (user?.email ?? "") : ""}
          className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
          placeholder={t("profile.emailPlaceholder")}
        />
      </div>
      {error && <p className="text-[13px] text-destructive">{error}</p>}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-9 rounded-md bg-foreground px-4 text-[13px] font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
        >
          {saving ? t("profile.saving") : t("profile.saveChanges")}
        </button>
        {saved && (
          <span className="text-[13px] text-muted-foreground">{t("profile.savedSuccess")}</span>
        )}
      </div>
    </fieldset>
  );
}

// ---------- WhatsApp Tab ----------

const OTP_TTL_SECONDS = 300;

function WhatsAppTab() {
  const { t } = useTranslation("settings");
  const [linked, setLinked] = useState(false);
  const [phone] = useState("+1 *** *** 4291");
  const [otp, setOtp] = useState<string | null>(null);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!otp) return;
    setOtpSecondsLeft(OTP_TTL_SECONDS);
    const interval = setInterval(() => {
      setOtpSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          setOtp(null);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [otp]);

  async function handleLink() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/whatsapp/link/initiate", { method: "POST" });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = (await res.json()) as { otp: string };
      setOtp(data.otp);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.unknown"));
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlink() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/whatsapp/link", { method: "DELETE" });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      setLinked(false);
      setOtp(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.unknown"));
    } finally {
      setLoading(false);
    }
  }

  const otpTime = `${Math.floor(otpSecondsLeft / 60)}:${String(otpSecondsLeft % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-md border border-border px-4 py-3">
        <div>
          <p className="text-[13px] font-medium text-foreground">
            {t("whatsapp.statusLabel")}:{" "}
            {linked ? t("whatsapp.statusLinked") : t("whatsapp.statusNotLinked")}
          </p>
          {linked && <p className="text-xs text-muted-foreground">{phone}</p>}
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            linked ? "bg-success/15 text-success-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          {linked ? t("whatsapp.statusLinked") : t("whatsapp.statusNotLinked")}
        </span>
      </div>

      {otp && (
        <div className="rounded-md border border-border bg-muted/50 p-4">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[13px] font-medium text-foreground">{t("whatsapp.otpTitle")}</p>
            <span className="text-xs text-muted-foreground">
              {t("whatsapp.otpExpires", { time: otpTime })}
            </span>
          </div>
          <p className="font-mono text-2xl tracking-widest text-foreground">{otp}</p>
          <p className="mt-2 text-xs text-muted-foreground">{t("whatsapp.otpInstructions")}</p>
        </div>
      )}

      {error && <p className="text-[13px] text-destructive">{error}</p>}

      <div className="flex gap-3">
        {!linked && (
          <button
            onClick={handleLink}
            disabled={loading}
            className="h-9 rounded-md bg-foreground px-4 text-[13px] font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
          >
            {loading ? t("whatsapp.linking") : t("whatsapp.linkButton")}
          </button>
        )}
        {linked && (
          <button
            onClick={handleUnlink}
            disabled={loading}
            className="h-9 rounded-md border border-destructive/30 px-4 text-[13px] font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
          >
            {loading ? t("whatsapp.unlinking") : t("whatsapp.unlinkButton")}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- API Keys Tab ----------

function ApiKeysTab() {
  const { t } = useTranslation("settings");
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider>("openai");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchKeys() {
      try {
        const res = await apiFetch("/keys");
        if (!res.ok) return;
        const data = (await res.json()) as { keys: ApiKey[] };
        setKeys(data.keys.map((k) => ({ ...k, key: "****" })));
      } catch {
        // silently ignore
      } finally {
        setLoadingKeys(false);
      }
    }
    void fetchKeys();
  }, []);

  async function handleSaveKey() {
    if (!newKeyValue.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch("/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selectedProvider, apiKey: newKeyValue }),
      });
      if (!res.ok) throw new Error(`Failed to save: ${res.status}`);
      const data = (await res.json()) as { id: string; provider: string; createdAt: string };
      setKeys((prev) => [
        { id: data.id, provider: selectedProvider, key: "****", createdAt: data.createdAt },
        ...prev,
      ]);
      setNewKeyValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.unknown"));
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(key: ApiKey) {
    setTestingId(key.id);
    try {
      const res = await apiFetch(`/keys/${key.id}/test`, { method: "POST" });
      const data = (await res.json()) as { valid: boolean; status?: number };
      setTestResults((prev) => ({
        ...prev,
        [key.id]: data.valid
          ? t("apiKeys.statusOk")
          : t("apiKeys.statusFailed", { code: data.status ?? "unknown" }),
      }));
    } catch {
      setTestResults((prev) => ({ ...prev, [key.id]: t("apiKeys.statusError") }));
    } finally {
      setTestingId(null);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await apiFetch(`/keys/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Failed to delete: ${res.status}`);
      setKeys((prev) => prev.filter((k) => k.id !== id));
      setTestResults((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.deleteKeyFailed"));
    }
  }

  return (
    <div className="space-y-5">
      {loadingKeys ? (
        <p className="text-[13px] text-muted-foreground">{t("apiKeys.loadingKeys")}</p>
      ) : keys.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">{t("apiKeys.noKeysYet")}</p>
      ) : (
        <div className="divide-y divide-border rounded-md border border-border">
          {keys.map((key) => (
            <div key={key.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <p className="text-[13px] font-medium capitalize text-foreground">{key.provider}</p>
                <p className="font-mono text-xs text-muted-foreground">{key.key}</p>
                {key.createdAt && (
                  <p className="text-[11px] text-muted-foreground">
                    {t("apiKeys.addedOn", { date: new Date(key.createdAt).toLocaleDateString() })}
                  </p>
                )}
                {testResults[key.id] && (
                  <p
                    className={`text-[11px] ${
                      testResults[key.id] === t("apiKeys.statusOk")
                        ? "text-success-foreground"
                        : "text-destructive"
                    }`}
                  >
                    {testResults[key.id]}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleTest(key)}
                  disabled={testingId === key.id}
                  className="h-7 rounded-md border border-border px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  {testingId === key.id ? t("apiKeys.testing") : t("apiKeys.test")}
                </button>
                <button
                  onClick={() => handleDelete(key.id)}
                  className="h-7 rounded-md border border-destructive/30 px-2.5 text-[11px] font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  {t("apiKeys.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3 rounded-md border border-border p-4">
        <p className="text-[13px] font-medium text-foreground">{t("apiKeys.addKey")}</p>
        <div className="flex gap-2">
          <label htmlFor="apiKeyProvider" className="sr-only">
            {t("apiKeys.provider")}
          </label>
          <select
            id="apiKeyProvider"
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value as Provider)}
            className="h-9 rounded-md border border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p} className="capitalize">
                {p}
              </option>
            ))}
          </select>
          <label htmlFor="apiKeyValue" className="sr-only">
            {t("apiKeys.apiKeyLabel")}
          </label>
          <input
            id="apiKeyValue"
            type="password"
            value={newKeyValue}
            onChange={(e) => setNewKeyValue(e.target.value)}
            placeholder={t("apiKeys.pastePlaceholder")}
            className="h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
          />
          <button
            onClick={handleSaveKey}
            disabled={saving || !newKeyValue.trim()}
            className="h-9 rounded-md bg-foreground px-4 text-[13px] font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
          >
            {saving ? t("apiKeys.saving") : t("apiKeys.save")}
          </button>
        </div>
        {error && <p className="text-[13px] text-destructive">{error}</p>}
      </div>
    </div>
  );
}

// ---------- Billing Tab ----------

type Plan = "free" | "pro" | "business";
type SubscriptionStatus = "active" | "canceled" | "past_due";

interface BillingStatus {
  plan: Plan;
  status: SubscriptionStatus;
  currentPeriodEnd: number | null;
  usage: number;
}

function BillingTab() {
  const { t } = useTranslation("settings");
  const { showToast } = useToast();
  const { data: _pricing } = usePricing();
  const search = useSearch({ strict: false }) as { success?: string; canceled?: string };

  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loadingBilling, setLoadingBilling] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [managingPortal, setManagingPortal] = useState(false);
  const toastShownRef = useRef(false);

  useEffect(() => {
    async function fetchBilling() {
      try {
        const res = await apiFetch("/billing/status");
        if (!res.ok) return;
        const data = (await res.json()) as BillingStatus;
        setBilling(data);
      } catch {
        // silently ignore
      } finally {
        setLoadingBilling(false);
      }
    }
    void fetchBilling();
  }, []);

  useEffect(() => {
    if (toastShownRef.current) return;
    if (search.success === "1") {
      toastShownRef.current = true;
      trackAnalyticsEvent("checkout_success", { source: "stripe_redirect" });
      trackPurchaseConversion();
      showToast(t("billing.activated"), "success");
    } else if (search.canceled === "1") {
      toastShownRef.current = true;
      showToast(t("billing.canceledToast"), "info");
    }
  }, [search.success, search.canceled, showToast, t]);

  async function handleUpgrade(tier: "pro" | "business") {
    setUpgrading(true);
    try {
      const gclid = getStoredGclid();
      const res = await apiFetch("/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, ...(gclid && { gclid }) }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        showToast(err.error ?? t("errors.checkoutFailed"), "error");
        return;
      }
      const data = (await res.json()) as { url: string };
      window.location.href = data.url;
    } finally {
      setUpgrading(false);
    }
  }

  async function handleManageSubscription() {
    setManagingPortal(true);
    try {
      const res = await apiFetch("/billing/portal", { method: "POST" });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        showToast(err.error ?? t("errors.openPortalFailed"), "error");
        return;
      }
      const data = (await res.json()) as { url: string };
      window.location.href = data.url;
    } finally {
      setManagingPortal(false);
    }
  }

  if (loadingBilling) {
    return <p className="text-[13px] text-muted-foreground">{t("billing.loadingInfo")}</p>;
  }

  const plan = billing?.plan ?? "free";
  const status = billing?.status ?? "active";
  const planLabel =
    plan === "free"
      ? t("billing.planFree")
      : plan === "pro"
        ? t("billing.planPro")
        : t("billing.planBusiness");
  const periodEnd = billing?.currentPeriodEnd
    ? new Date(billing.currentPeriodEnd * 1000).toLocaleDateString()
    : null;

  const statusLabel =
    status === "active"
      ? t("billing.statusActive")
      : status === "canceled"
        ? t("billing.statusCanceled")
        : t("billing.statusPastDue");

  return (
    <div className="space-y-5">
      {status === "past_due" && (
        <div className="rounded-md border border-warning/40 bg-warning/8 px-4 py-3">
          <p className="text-[13px] font-medium text-warning-foreground">
            {t("billing.pastDueWarning")}
          </p>
        </div>
      )}

      {status === "canceled" && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3">
          <p className="text-[13px] font-medium text-destructive">{t("billing.canceledWarning")}</p>
        </div>
      )}

      <div className="flex items-center justify-between rounded-md border border-border px-4 py-4">
        <div>
          <p className="text-[13px] text-muted-foreground">{t("billing.currentPlan")}</p>
          <p className="mt-0.5 text-base font-semibold text-foreground">{planLabel}</p>
          {periodEnd && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {status === "canceled" ? t("billing.accessUntil") : t("billing.renews")} {periodEnd}
            </p>
          )}
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
            status === "active"
              ? "bg-success/15 text-success-foreground"
              : status === "past_due"
                ? "bg-warning/20 text-warning-foreground"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <CreditWidget />

      {plan !== "free" && (
        <button
          type="button"
          onClick={handleManageSubscription}
          disabled={managingPortal}
          className="h-9 w-full rounded-md border border-border text-[13px] font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          {managingPortal ? t("billing.openingPortal") : t("billing.manageSubscription")}
        </button>
      )}

      {(plan === "free" || status === "canceled") && (
        <div className="flex flex-col gap-3 sm:flex-row">
          {plan !== "pro" && (
            <button
              type="button"
              onClick={() => handleUpgrade("pro")}
              disabled={upgrading}
              className="h-9 flex-1 rounded-md bg-foreground text-[13px] font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
            >
              {upgrading ? t("billing.redirecting") : t("billing.upgradeToPro", { price: 29 })}
            </button>
          )}
          {plan !== "business" && (
            <button
              type="button"
              onClick={() => handleUpgrade("business")}
              disabled={upgrading}
              className="h-9 flex-1 rounded-md border border-border text-[13px] font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              {upgrading ? t("billing.redirecting") : t("billing.upgradeToBusiness", { price: 99 })}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Access Tab ----------

interface EloEvent {
  id: string;
  delta: number;
  reason: string;
  createdAt: string;
}

function AccessTab() {
  const { t } = useTranslation("settings");
  const eloScore = 850;
  const eloHistory: EloEvent[] = [];
  const bugBountyEligible = eloScore >= 1000;

  const tierLabel =
    eloScore >= 1500
      ? t("access.eliteTier")
      : eloScore >= 1000
        ? t("access.proTier")
        : t("access.freeTier");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-md border border-border px-4 py-4">
        <div>
          <p className="text-[13px] text-muted-foreground">{t("access.eloScore")}</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-foreground">{eloScore}</p>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
          {tierLabel}
        </span>
      </div>

      <div className="rounded-md border border-border p-4 space-y-3">
        <p className="text-[13px] font-medium text-foreground">{t("access.tierThresholds")}</p>
        <div className="space-y-2">
          {[
            { label: t("access.freeTier"), range: "0 - 999", active: eloScore < 1000 },
            { label: t("access.proTier"), range: "1000 - 1499", active: eloScore >= 1000 && eloScore < 1500 },
            { label: t("access.eliteTier"), range: "1500+", active: eloScore >= 1500 },
          ].map((tier) => (
            <div key={tier.label} className="flex items-center justify-between text-[13px]">
              <span className={tier.active ? "font-medium text-foreground" : "text-muted-foreground"}>
                {tier.label}
              </span>
              <span className="font-mono text-xs text-muted-foreground">{tier.range}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border border-border px-4 py-3">
        <span className="text-[13px] text-foreground">{t("access.bugBountyEligibility")}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            bugBountyEligible
              ? "bg-success/15 text-success-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {bugBountyEligible ? t("access.eligible") : t("access.notEligible")}
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-[13px] font-medium text-foreground">{t("access.recentEvents")}</p>
        {eloHistory.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">{t("access.noRecentEvents")}</p>
        ) : (
          <div className="divide-y divide-border rounded-md border border-border">
            {eloHistory.map((event) => (
              <div key={event.id} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[13px] text-foreground">{event.reason}</span>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[13px] font-semibold tabular-nums ${
                      event.delta >= 0 ? "text-success-foreground" : "text-destructive"
                    }`}
                  >
                    {event.delta >= 0 ? "+" : ""}
                    {event.delta}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Settings Page ----------

export function SettingsPage() {
  const { t } = useTranslation("settings");
  const search = useSearch({ strict: false }) as { tab?: string };
  const navigate = useNavigate();

  const activeTab: SettingsTab = TAB_IDS.includes(search.tab as SettingsTab)
    ? (search.tab as SettingsTab)
    : "profile";

  const handleTabChange = useCallback(
    (value: string) => {
      navigate({ to: "/settings", search: (prev) => ({ ...prev, tab: value }) });
    },
    [navigate],
  );

  const tabLabels: Record<SettingsTab, string> = {
    profile: t("tabs.profile"),
    whatsapp: t("tabs.whatsapp"),
    keys: t("tabs.apiKeys"),
    billing: t("tabs.billing"),
    access: t("tabs.access"),
  };

  return (
    <AuthGuard>
      <div className="rubik-container py-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">{t("title")}</h1>

          <Tabs.Root value={activeTab} onValueChange={handleTabChange} className="mt-6">
            <Tabs.List
              aria-label={t("sectionsLabel")}
              className="flex gap-1 border-b border-border"
            >
              {TAB_IDS.map((id) => (
                <Tabs.Trigger
                  key={id}
                  value={id}
                  className="relative whitespace-nowrap px-3 pb-2.5 pt-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-transparent data-[state=active]:after:bg-foreground"
                >
                  {tabLabels[id]}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <div className="mt-6">
              <Tabs.Content value="profile" className="outline-none">
                <ProfileTab />
              </Tabs.Content>
              <Tabs.Content value="whatsapp" className="outline-none">
                <WhatsAppTab />
              </Tabs.Content>
              <Tabs.Content value="keys" className="outline-none">
                <ApiKeysTab />
              </Tabs.Content>
              <Tabs.Content value="billing" className="outline-none">
                <BillingTab />
              </Tabs.Content>
              <Tabs.Content value="access" className="outline-none">
                <AccessTab />
              </Tabs.Content>
            </div>
          </Tabs.Root>
        </div>
      </div>
    </AuthGuard>
  );
}
