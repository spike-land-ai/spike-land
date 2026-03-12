export interface VariantDef {
  id: string;
  config: Record<string, unknown>;
  weight: number;
}

export interface MetricRow {
  variant_id: string;
  metric_name: string;
  metric_value: number;
  sample_size: number;
}

export interface TrackEventInput {
  clientId?: string;
  slug?: string;
  eventType?: string;
  eventData?: Record<string, unknown>;
  experimentId?: string;
  variantId?: string;
}

export interface NormalizedTrackEvent {
  clientId: string;
  slug: string;
  eventType: string;
  eventData: Record<string, unknown> | null;
  experimentId: string | null;
  variantId: string | null;
}

export interface MetricUpdate {
  experimentId: string;
  variantId: string;
  metricName: string;
  value: number;
}

export interface MonitorEventCount {
  experiment_id: string;
  variant_id: string;
  event_type: string;
  cnt: number;
}

export interface ActiveExperimentMonitorRow {
  id: string;
  name: string;
  variants: string;
}

export interface EvaluationVariantData {
  id: string;
  impressions: number;
  donations: number;
}

export type EvaluationGate =
  | {
      ready: false;
      reason: string;
      runtimeHours?: number;
    }
  | {
      ready: true;
      variantData: EvaluationVariantData[];
    };

const MIN_RUNTIME_MS = 48 * 60 * 60 * 1000;
const MIN_IMPRESSIONS_PER_VARIANT = 500;
const TRACK_EVENT_BATCH_LIMIT = 150;

const METRIC_EVENT_MAP: Record<string, string> = {
  widget_impression: "impressions",
  donate_click: "donations",
  fistbump_click: "fistbumps",
};

export const VALID_EVENT_TYPES = new Set([
  "widget_impression",
  "slider_start",
  "slider_change",
  "slider_final",
  "fistbump_click",
  "donate_click",
  "custom_toggle",
  "custom_value",
  "share_click",
  "visibility_time",
  "checkout_started",
  "thankyou_viewed",
]);

export function isValidAssignClientId(clientId: unknown): clientId is string {
  return typeof clientId === "string" && clientId.length > 0 && clientId.length <= 100;
}

export function groupMetricsByVariant(
  metrics: MetricRow[],
): Record<string, Record<string, { value: number; sampleSize: number }>> {
  const byVariant: Record<string, Record<string, { value: number; sampleSize: number }>> = {};
  for (const metric of metrics) {
    if (!byVariant[metric.variant_id]) {
      byVariant[metric.variant_id] = {};
    }
    const variantBucket = byVariant[metric.variant_id];
    variantBucket[metric.metric_name] = {
      value: metric.metric_value,
      sampleSize: metric.sample_size,
    };
  }
  return byVariant;
}

export function normalizeTrackEvents(events: TrackEventInput[] | undefined): {
  acceptedEvents: NormalizedTrackEvent[];
  metricUpdates: MetricUpdate[];
} {
  if (!Array.isArray(events) || events.length === 0) {
    return { acceptedEvents: [], metricUpdates: [] };
  }

  const acceptedEvents: NormalizedTrackEvent[] = [];
  const metricUpdates: MetricUpdate[] = [];

  for (const event of events.slice(0, TRACK_EVENT_BATCH_LIMIT)) {
    if (
      typeof event.clientId !== "string" ||
      typeof event.slug !== "string" ||
      typeof event.eventType !== "string" ||
      !VALID_EVENT_TYPES.has(event.eventType)
    ) {
      continue;
    }

    const acceptedEvent: NormalizedTrackEvent = {
      clientId: event.clientId,
      slug: event.slug,
      eventType: event.eventType,
      eventData: event.eventData ?? null,
      experimentId: event.experimentId ?? null,
      variantId: event.variantId ?? null,
    };

    acceptedEvents.push(acceptedEvent);

    const metricName = METRIC_EVENT_MAP[event.eventType];
    if (!metricName || !acceptedEvent.experimentId || !acceptedEvent.variantId) {
      continue;
    }

    metricUpdates.push({
      experimentId: acceptedEvent.experimentId,
      variantId: acceptedEvent.variantId,
      metricName,
      value: 1,
    });
  }

  return { acceptedEvents, metricUpdates };
}

export function getMonitorWindow(
  rawHours: string | undefined,
  now: number,
): {
  requestedHours: number;
  clampedHours: number;
  since: number;
} {
  const parsedHours = rawHours ? Number.parseInt(rawHours, 10) : 4;
  const requestedHours = Number.isFinite(parsedHours) ? parsedHours : 4;
  const clampedHours = Math.min(Math.max(requestedHours, 1), 168);

  return {
    requestedHours,
    clampedHours,
    since: now - clampedHours * 60 * 60 * 1000,
  };
}

export function detectZeroImpressionAnomalies(
  counts: MonitorEventCount[],
  activeExperiments: ActiveExperimentMonitorRow[],
  requestedHours: number,
): Array<{ experimentId: string; variantId: string; issue: string }> {
  const impressionSet = new Set<string>();

  for (const row of counts) {
    if (row.event_type === "widget_impression") {
      impressionSet.add(`${row.experiment_id}:${row.variant_id}`);
    }
  }

  const anomalies: Array<{ experimentId: string; variantId: string; issue: string }> = [];

  for (const experiment of activeExperiments) {
    const variants = JSON.parse(experiment.variants) as Array<{ id: string }>;
    for (const variant of variants) {
      if (!impressionSet.has(`${experiment.id}:${variant.id}`)) {
        anomalies.push({
          experimentId: experiment.id,
          variantId: variant.id,
          issue: `Zero impressions in last ${requestedHours}h`,
        });
      }
    }
  }

  return anomalies;
}

export function buildEvaluationGate(params: {
  createdAt: number;
  now: number;
  variants: VariantDef[];
  byVariant: Record<string, Record<string, { value: number; sampleSize: number }>>;
}): EvaluationGate {
  const runtimeMs = params.now - params.createdAt;
  if (runtimeMs < MIN_RUNTIME_MS) {
    return {
      ready: false,
      reason: "Minimum 48h runtime not met",
      runtimeHours: Math.round(runtimeMs / 3600000),
    };
  }

  for (const variant of params.variants) {
    const impressions = params.byVariant[variant.id]?.["impressions"]?.value ?? 0;
    if (impressions < MIN_IMPRESSIONS_PER_VARIANT) {
      return {
        ready: false,
        reason: `Variant ${variant.id} has ${impressions} impressions (need 500)`,
      };
    }
  }

  return {
    ready: true,
    variantData: params.variants.map((variant) => {
      const variantMetrics = params.byVariant[variant.id] ?? {};
      return {
        id: variant.id,
        impressions: variantMetrics["impressions"]?.value ?? 0,
        donations: variantMetrics["donations"]?.value ?? 0,
      };
    }),
  };
}

export function mapRevenueCentsToDollars(total: number | null | undefined): number {
  return (total ?? 0) / 100;
}
