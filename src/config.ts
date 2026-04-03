import "dotenv/config";
import { z } from "zod";

const ProviderSchema = z.enum(["rapidapi", "apify"]);
export type Provider = z.infer<typeof ProviderSchema>;

const EnvSchema = z.object({
  PROVIDER: ProviderSchema.default("apify"),
  RAPIDAPI_KEY: z.string().optional(),
  RAPIDAPI_HOST: z.string().optional(),
  RAPIDAPI_BASE_URL: z.string().url().default("https://linkedin-posts-search.p.rapidapi.com"),
  APIFY_TOKEN: z.string().optional(),
  APIFY_BASE_URL: z.string().url().default("https://api.apify.com/v2"),
  APIFY_ACTOR_ID: z.string().default("sandhive/linkedin-posts-parser"),
  HTTP_TIMEOUT_MS: z.coerce.number().int().min(1000).default(30000),
  DEBUG: z
    .string()
    .optional()
    .transform((value) => value === "1" || value === "true"),
});

export type RuntimeConfig = z.infer<typeof EnvSchema>;

export function getConfig(): RuntimeConfig {
  return EnvSchema.parse(process.env);
}

export function ensureProviderCredentials(config: RuntimeConfig): void {
  if (config.PROVIDER === "rapidapi") {
    if (!config.RAPIDAPI_KEY || !config.RAPIDAPI_HOST) {
      throw new Error(
        "Missing RapidAPI credentials. Set RAPIDAPI_KEY and RAPIDAPI_HOST (BYO credentials; billing remains on RapidAPI).",
      );
    }
    return;
  }

  if (config.PROVIDER === "apify" && !config.APIFY_TOKEN) {
    throw new Error("Missing APIFY_TOKEN. Use your own Apify token (billing remains on Apify).");
  }
}

export function maskSecret(value: string | undefined): string {
  if (!value) return "<missing>";
  if (value.length <= 6) return "***";
  return `${value.slice(0, 3)}***${value.slice(-3)}`;
}
