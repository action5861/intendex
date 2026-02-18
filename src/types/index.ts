import { z } from "zod";

// Recommended site schema
export const RecommendedSiteSchema = z.object({
  url: z.string().url(),
  name: z.string(),
  reason: z.string(),
});

export type RecommendedSite = z.infer<typeof RecommendedSiteSchema>;

// Intent extraction schema from AI
export const ExtractedIntentSchema = z.object({
  category: z.string(),
  subcategory: z.string().optional(),
  keyword: z.string(),
  description: z.string(),
  confidence: z.number().min(0).max(1),
  isCommercial: z.boolean().default(true),
  pointValue: z.number().min(0).max(1000).default(0),
  recommendedSites: z.array(RecommendedSiteSchema).optional(),
});

export type ExtractedIntent = z.infer<typeof ExtractedIntentSchema>;

export const ExtractedIntentsSchema = z.object({
  intents: z.array(ExtractedIntentSchema),
  response: z.string(),
});

export type ExtractedIntents = z.infer<typeof ExtractedIntentsSchema>;

// Chat message types
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  intents?: ExtractedIntent[];
}

// Intent categories
export const INTENT_CATEGORIES = [
  "여행",
  "쇼핑",
  "건강",
  "교육",
  "금융",
  "음식",
  "패션",
  "테크",
  "부동산",
  "자동차",
  "취미",
  "지역정보",
  "기타",
] as const;

export type IntentCategory = (typeof INTENT_CATEGORIES)[number];

// Transaction types
export type TransactionType = "earn" | "withdraw" | "convert";

// Match status
export type MatchStatus = "pending" | "accepted" | "rejected";

// Intent status
export type IntentStatus = "active" | "matched" | "expired";

// Campaign status
export type CampaignStatus = "active" | "paused" | "completed";

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Dashboard stats
export interface DashboardStats {
  totalIntents: number;
  activeIntents: number;
  totalPoints: number;
  totalMatches: number;
  pendingMatches: number;
  categoryDistribution: { category: string; count: number }[];
  recentTransactions: {
    id: string;
    type: TransactionType;
    amount: number;
    createdAt: Date;
  }[];
}
