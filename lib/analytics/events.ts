import type { AnalyticsEventName } from '@/types';

/** Registre central des événements analytics du site. */
export const ANALYTICS_EVENTS: Record<AnalyticsEventName, true> = {
  page_view: true,
  hero_beta_clicked: true,
  secondary_cta_clicked: true,
  waitlist_modal_opened: true,
  waitlist_started: true,
  waitlist_completed: true,
  waitlist_duplicate: true,
  pricing_viewed: true,
  pro_clicked: true,
  faq_opened: true,
  scroll_50: true,
  scroll_90: true,
};

export function isAnalyticsEvent(name: string): name is AnalyticsEventName {
  return Object.prototype.hasOwnProperty.call(ANALYTICS_EVENTS, name);
}
