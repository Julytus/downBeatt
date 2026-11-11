export type RecommendEventType = "VIEW" | "PREVIEW" | "SEARCH" | "FILTER_STYLE";

export interface RecommendEventRequest {
  anonId: string;
  type: RecommendEventType;
  lutId?: number;
  value?: string | null;
  impressionId?: number | null;
}

export interface PreferenceDTO {
  categorySlugs: string[];
}

export const PREFERENCE_MAX_STYLES = 5;

export interface PreferenceOption {
  slug: string;
  label: string;
}

export const PREFERENCE_SHOOT_OPTIONS: PreferenceOption[] = [
  { slug: "dam-cuoi", label: "Đám cưới" },
  { slug: "chan-dung", label: "Chân dung" },
  { slug: "ban-dem", label: "Ban đêm" }
];

export const PREFERENCE_SOFTWARE_OPTIONS: PreferenceOption[] = [
  { slug: "premiere-pro", label: "Premiere Pro" },
  { slug: "davinci-resolve", label: "DaVinci Resolve" },
  { slug: "final-cut-pro", label: "Final Cut Pro" },
  { slug: "capcut", label: "CapCut" }
];
