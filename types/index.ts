/**
 * CHARBON — types partagés.
 */

/* ── Waitlist ─────────────────────────────────────────────── */

export type WaitlistStatus = 'waiting' | 'invited' | 'activated' | 'unsubscribed';

export interface WaitlistEntry {
  email: string;
  source: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  locale: string;
}

export type WaitlistErrorCode =
  | 'invalid_email'
  | 'duplicate'
  | 'rate_limited'
  | 'backend_unavailable'
  | 'unexpected';

export type WaitlistApiResponse =
  | { ok: true; ignored?: boolean }
  | { ok: false; code: WaitlistErrorCode };

/* ── Analytics ────────────────────────────────────────────── */

export type AnalyticsEventName =
  | 'page_view'
  | 'hero_beta_clicked'
  | 'secondary_cta_clicked'
  | 'waitlist_modal_opened'
  | 'waitlist_started'
  | 'waitlist_completed'
  | 'waitlist_duplicate'
  | 'pricing_viewed'
  | 'pro_clicked'
  | 'faq_opened'
  | 'scroll_50'
  | 'scroll_90';

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export interface UtmParams {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
}

/* ── App / mockups ────────────────────────────────────────── */

export type Priority = 'critical' | 'high' | 'medium';

export interface EngagementRow {
  index?: number;
  title: string;
  duration: string;
  priority: Priority;
}
