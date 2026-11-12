import type { PagedResult } from "@/lib/types/common";
import type { LutDTO } from "@/lib/types/lut";

export type RecommendEventType = "VIEW" | "PREVIEW" | "SEARCH" | "FILTER_STYLE";

export type RecommendStrategy = "PROFILE" | "PREFERENCE" | "POPULAR";

export type ForYouLutDTO = LutDTO & {
  reason?: string;
  score?: number;
};

export interface ForYouDTO {
  impressionId?: number;
  strategy: RecommendStrategy;
  items: ForYouLutDTO[];
}

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

/* ==================== Types cho Quản trị gợi ý (plan §5, §8) ==================== */

export type BlockKey = "tag" | "color" | "category" | "style" | "text" | "creator";

export interface IndexStatusDTO {
  lutCount?: number;
  similarityRows?: number;
  builtTime?: string;
  elapsedMs?: number;
  reason?: string;
  lastError?: string;
  lastErrorTime?: string;
}

export interface RecommendConfigDTO {
  variant: string;
  weights: Record<BlockKey, number>;
  normalizedWeights: Record<BlockKey, number>;
  eventWeights: Record<string, number>;
  params: Record<string, number | string>;
  index?: IndexStatusDTO;
}

export interface FeatureFailureDTO {
  id: number;
  title: string;
  error: string;
}

export interface RebuildResultDTO {
  featureMissing: number;
  featureComputed: number;
  featureFailed: FeatureFailureDTO[];
  lutCount: number;
  similarityRows: number;
  elapsedMs: number;
  builtTime: string;
  reason: string;
}

export interface StatsRowDTO {
  impressions: number;
  clicked: number;
  ctr: number;
  downloaded: number;
  downloadRate: number;
  dismissals: number;
  dismissRate: number;
}

export interface PositionStatDTO {
  position: number;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface VariantStatDTO extends StatsRowDTO {
  variant: string;
  strategy: RecommendStrategy;
}

export interface RecommendStatsDTO {
  from: string;
  to: string;
  summary: StatsRowDTO;
  byVariant: VariantStatDTO[];
  byPosition: PositionStatDTO[];
}

export interface RecommendStatsParams {
  from?: string;
  to?: string;
}

export interface CustomerOptionDTO {
  id: number;
  name: string;
  email: string;
}

export interface ColorTermDTO {
  key: string;
  value: number;
}

export interface SignalDTO {
  type: string;
  lutId?: number;
  slug?: string;
  value?: string | null;
  count: number;
  days?: number;
  weight: number;
  lastTime?: string;
}

export interface TopTermDTO {
  key: string;
  weight: number;
}

export interface UserProfileSummaryDTO {
  strategy: RecommendStrategy;
  alpha: number;
  positiveLutCount: number;
  preference: string[];
  topStyles: TopTermDTO[];
  topCategories: TopTermDTO[];
  topTags: TopTermDTO[];
  signals: SignalDTO[];
}

export interface TryProfileLutDTO {
  id: number;
  slug: string;
  title: string;
  creatorName?: string;
  style: string;
  isPremium: number;
  coverUrl?: string;
  score?: number;
  reason?: string;
  contributions?: Record<BlockKey, number>;
}

export interface TryProfileResultDTO {
  customer?: CustomerOptionDTO;
  anonId?: string;
  strategy: RecommendStrategy;
  premiumLimited: boolean;
  premiumQuota?: number;
  profile: UserProfileSummaryDTO;
  color: ColorTermDTO[];
  categoryNames: Record<string, string>;
  items: TryProfileLutDTO[];
}

export interface TryProfileRequest {
  userId?: number;
  anonId?: string;
  limit?: number;
}

/* ==================== Types cho Đánh giá gợi ý (plan §5, §8) ==================== */

export interface EvalMetricSetDTO {
  precision: number;
  recall: number;
  ndcg: number;
  hitRate: number;
  ild: number;
  styles: number;
  coverage: number;
  novelty: number;
}

export interface RecEvalRunDTO {
  id: number;
  batchCode: string;
  dataset: string;
  algorithm: string;
  userCount: number;
  createdTime: string;
  params: Record<string, unknown>;
  metrics: Record<string, EvalMetricSetDTO>;
}

export interface EvalListParams {
  algorithm?: string;
  batch?: string;
  page?: number;
  limit?: number;
}

export type EvalListResponseDTO = PagedResult<RecEvalRunDTO>;

