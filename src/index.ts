import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ensureProviderCredentials, getConfig, maskSecret } from "./config.js";
import { LinkedinSearchInputSchema } from "./normalize.js";
import { findFreshLowCompetitionPosts, findHighEngagementPosts, findHiringPosts } from "./tools/presets.js";
import { searchLinkedinPosts } from "./tools/searchLinkedinPosts.js";

const config = getConfig();
ensureProviderCredentials(config);

if (config.DEBUG) {
  console.error(
    `[linkedin-post-discovery-mcp] provider=${config.PROVIDER} rapidapiHost=${config.RAPIDAPI_HOST ?? "<unset>"} rapidapiKey=${maskSecret(config.RAPIDAPI_KEY)} apifyToken=${maskSecret(config.APIFY_TOKEN)}`,
  );
}

const inputShape = {
  query: z.string().optional(),
  isHiring: z.boolean().optional(),
  hasLink: z.boolean().optional(),
  minLikes: z.number().int().nonnegative().optional(),
  maxComments: z.number().int().nonnegative().optional(),
  postedWithinHours: z.number().int().min(0).max(8760).optional(),
  authorType: z.enum(["person", "company", "any"]).optional(),
  sortBy: z.enum(["newest", "top", "hot"]).optional(),
  limit: z.number().int().min(1).max(100).optional(),
};

const server = new Server(
  {
    name: "linkedin-post-discovery-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.tool(
  "search_linkedin_posts",
  "Search and filter LinkedIn posts using the selected upstream provider (RapidAPI or Apify) with BYO credentials.",
  inputShape,
  async (input) => {
    const normalizedInput = LinkedinSearchInputSchema.parse(input);
    const posts = await searchLinkedinPosts(normalizedInput, config);
    return {
      content: [{ type: "text", text: JSON.stringify({ provider: config.PROVIDER, count: posts.length, posts }, null, 2) }],
    };
  },
);

server.tool(
  "find_hiring_posts",
  "Convenience preset: search_linkedin_posts with isHiring=true.",
  inputShape,
  async (input) => {
    const posts = await findHiringPosts(input, config);
    return {
      content: [{ type: "text", text: JSON.stringify({ provider: config.PROVIDER, count: posts.length, posts }, null, 2) }],
    };
  },
);

server.tool(
  "find_fresh_low_competition_posts",
  "Convenience preset for fresh posts (default <=24h) and low comment count (default <=10).",
  inputShape,
  async (input) => {
    const posts = await findFreshLowCompetitionPosts(input, config);
    return {
      content: [{ type: "text", text: JSON.stringify({ provider: config.PROVIDER, count: posts.length, posts }, null, 2) }],
    };
  },
);

server.tool(
  "find_high_engagement_posts",
  "Convenience preset for high engagement (default minLikes=100, sortBy=top).",
  inputShape,
  async (input) => {
    const posts = await findHighEngagementPosts(input, config);
    return {
      content: [{ type: "text", text: JSON.stringify({ provider: config.PROVIDER, count: posts.length, posts }, null, 2) }],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
