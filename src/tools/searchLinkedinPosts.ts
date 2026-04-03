import { RuntimeConfig } from "../config.js";
import { LinkedinSearchInputSchema, NormalizedPost } from "../normalize.js";
import { searchViaApify } from "../providers/apify.js";
import { searchViaRapidApi } from "../providers/rapidapi.js";

export async function searchLinkedinPosts(
  rawInput: unknown,
  config: RuntimeConfig,
): Promise<NormalizedPost[]> {
  const input = LinkedinSearchInputSchema.parse(rawInput ?? {});

  if (config.PROVIDER === "rapidapi") {
    return searchViaRapidApi(input, config);
  }
  if (config.PROVIDER === "apify") {
    return searchViaApify(input, config);
  }

  throw new Error(`Provider mismatch. Supported values: rapidapi | apify. Got: ${String(config.PROVIDER)}`);
}
