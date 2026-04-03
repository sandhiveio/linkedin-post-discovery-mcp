import { LinkedinSearchInput, NormalizedPost, normalizePost } from "../normalize.js";
import { RuntimeConfig } from "../config.js";

function toApifyActorIdPath(actorId: string): string {
  return actorId.replace("/", "~");
}

function mapHttpError(status: number, body: string): never {
  if (status === 401 || status === 403) {
    throw new Error(`Apify authentication failed (${status}). Check APIFY_TOKEN and token scope.`);
  }
  if (status === 429) {
    throw new Error("Apify rate limit reached (429). Retry later or increase plan/concurrency.");
  }
  if (status >= 500) {
    throw new Error(`Apify upstream server error (${status}). Body: ${body.slice(0, 300)}`);
  }
  throw new Error(`Apify request failed (${status}). Body: ${body.slice(0, 300)}`);
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
        throw new Error(`Apify request failed after retries: ${(error as Error).message}`);
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
  throw new Error("Unreachable retry branch");
}

export async function searchViaApify(
  input: LinkedinSearchInput,
  config: RuntimeConfig,
): Promise<NormalizedPost[]> {
  const actorPath = toApifyActorIdPath(config.APIFY_ACTOR_ID);
  const url = `${config.APIFY_BASE_URL}/acts/${actorPath}/run-sync-get-dataset-items?format=json&clean=true`;

  const response = await fetchWithRetry(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.APIFY_TOKEN}`,
      },
      body: JSON.stringify(input),
    },
    config.HTTP_TIMEOUT_MS,
  );

  const body = await response.text();
  if (!response.ok) {
    mapHttpError(response.status, body);
  }

  const parsed = JSON.parse(body) as unknown[];
  return parsed.map((item) => normalizePost((item ?? {}) as Record<string, unknown>));
}
