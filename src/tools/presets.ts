import { RuntimeConfig } from "../config.js";
import { LinkedinSearchInput, NormalizedPost } from "../normalize.js";
import { searchLinkedinPosts } from "./searchLinkedinPosts.js";

export async function findHiringPosts(
  input: Partial<LinkedinSearchInput>,
  config: RuntimeConfig,
): Promise<NormalizedPost[]> {
  return searchLinkedinPosts({ ...input, isHiring: true }, config);
}

export async function findFreshLowCompetitionPosts(
  input: Partial<LinkedinSearchInput>,
  config: RuntimeConfig,
): Promise<NormalizedPost[]> {
  return searchLinkedinPosts(
    {
      ...input,
      postedWithinHours: input.postedWithinHours ?? 24,
      maxComments: input.maxComments ?? 10,
      sortBy: input.sortBy ?? "newest",
    },
    config,
  );
}

export async function findHighEngagementPosts(
  input: Partial<LinkedinSearchInput>,
  config: RuntimeConfig,
): Promise<NormalizedPost[]> {
  return searchLinkedinPosts(
    {
      ...input,
      minLikes: input.minLikes ?? 100,
      sortBy: input.sortBy ?? "top",
    },
    config,
  );
}
