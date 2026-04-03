import { LinkedinSearchInput, NormalizedPost, normalizePost } from "../normalize.js";
import { RuntimeConfig } from "../config.js";

const RAPIDAPI_ENDPOINT = "/search";

function mapHttpError(status: number, body: string): never {
  if (status === 401 || status === 403) {
    throw new Error(`RapidAPI authentication failed (${status}). Check RAPIDAPI_KEY/RAPIDAPI_HOST headers.`);
  }
  if (status === 429) {
    throw new Error("RapidAPI rate limit reached (429). Retry later or upgrade your RapidAPI plan.");
  }
  if (status >= 500) {
    throw new Error(`RapidAPI upstream server error (${status}). Body: ${body.slice(0, 300)}`);
  }
  throw new Error(`RapidAPI request failed (${status}). Body: ${body.slice(0, 300)}`);
}

async function fetchWithRetry(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);

      if (response.status === 401 || response.status === 403) {
        return response;
      }
      if ((response.status === 429 || response.status >= 500) && attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
        continue;
      }
      return response;
    } catch (error) {
      clearTimeout(timer);
      if (attempt === maxAttempts) {
        throw new Error(`RapidAPI request failed after retries: ${(error as Error).message}`);
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }

  throw new Error("Unreachable retry branch");
}

export async function searchViaRapidApi(
  input: LinkedinSearchInput,
  config: RuntimeConfig,
): Promise<NormalizedPost[]> {
  const response = await fetchWithRetry(
    `${config.RAPIDAPI_BASE_URL}${RAPIDAPI_ENDPOINT}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": config.RAPIDAPI_HOST ?? "",
        "x-rapidapi-key": config.RAPIDAPI_KEY ?? "",
        "x-api-host": config.RAPIDAPI_HOST ?? "",
        "x-api-key": config.RAPIDAPI_KEY ?? "",
      },
      body: JSON.stringify(input),
    },
    config.HTTP_TIMEOUT_MS,
  );

  const body = await response.text();
  if (!response.ok) {
    mapHttpError(response.status, body);
  }

  const parsed = JSON.parse(body) as { data?: unknown[] } | unknown[];
  const items = Array.isArray(parsed) ? parsed : parsed.data ?? [];
  return items.map((item) => normalizePost((item ?? {}) as Record<string, unknown>));
}
