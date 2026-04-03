import { z } from "zod";

export const LinkedinSearchInputSchema = z
  .object({
    query: z.string().trim().min(1).optional(),
    isHiring: z.boolean().default(false),
    hasLink: z.boolean().default(false),
    minLikes: z.number().int().min(0).optional(),
    maxComments: z.number().int().min(0).optional(),
    postedWithinHours: z.number().int().min(0).max(8760).optional(),
    authorType: z.enum(["person", "company", "any"]).default("any"),
    sortBy: z.enum(["newest", "top", "hot"]).default("newest"),
    limit: z.number().int().min(1).max(100).default(25),
  })
  .superRefine((value, ctx) => {
    if (value.maxComments !== undefined && value.maxComments < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "maxComments must be >= 0" });
    }
  });

export type LinkedinSearchInput = z.infer<typeof LinkedinSearchInputSchema>;

export const NormalizedPostSchema = z.object({
  postKey: z.string().optional(),
  text: z.string().default(""),
  author: z.string().default("unknown"),
  authorUrl: z.string().optional(),
  authorType: z.enum(["person", "company", "any"]).default("any"),
  createdAt: z.string().optional(),
  geo: z.string().optional(),
  likes: z.number().int().nonnegative().default(0),
  commentsCount: z.number().int().nonnegative().default(0),
  hasLink: z.boolean().default(false),
  isHiring: z.boolean().default(false),
  postUrl: z.string().optional(),
});

export type NormalizedPost = z.infer<typeof NormalizedPostSchema>;

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function inferAuthorType(value: unknown): "person" | "company" | "any" {
  const asText = String(value ?? "").toLowerCase();
  if (asText.includes("company")) return "company";
  if (asText.includes("person") || asText.includes("individual")) return "person";
  return "any";
}

export function normalizePost(raw: Record<string, unknown>): NormalizedPost {
  const text = String(raw.text ?? raw.content ?? raw.description ?? "");
  const likes = asNumber(raw.likes ?? raw.likeCount ?? raw.reactions) ?? 0;
  const commentsCount = asNumber(raw.commentsCount ?? raw.commentCount ?? raw.comments) ?? 0;
  const authorUrl = (raw.authorUrl ?? raw.authorProfileUrl ?? raw.profileUrl) as string | undefined;
  const postUrl = (raw.postUrl ?? raw.url ?? raw.postLink) as string | undefined;

  return NormalizedPostSchema.parse({
    postKey: String(raw.postKey ?? raw.id ?? raw.urn ?? ""),
    text,
    author: String(raw.author ?? raw.authorName ?? raw.owner ?? "unknown"),
    authorUrl,
    authorType: inferAuthorType(raw.authorType ?? raw.ownerType),
    createdAt: (raw.createdAt ?? raw.timestamp ?? raw.postedAt) as string | undefined,
    geo: (raw.geo ?? raw.location ?? raw.country) as string | undefined,
    likes,
    commentsCount,
    hasLink: Boolean(raw.hasLink ?? raw.containsLink ?? (postUrl && postUrl.length > 0)),
    isHiring: Boolean(raw.isHiring ?? /hiring|we are hiring|job opening/i.test(text)),
    postUrl,
  });
}
