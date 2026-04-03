# Example prompts / workflows

## 1) Hiring post discovery

"Use `find_hiring_posts` to find recent product management hiring posts in the US from the last 72 hours. Return top 20 sorted by newest."

Suggested input:

```json
{
  "query": "product management US",
  "postedWithinHours": 72,
  "authorType": "any",
  "sortBy": "newest",
  "limit": 20
}
```

## 2) AI posts with links from people

"Use `search_linkedin_posts` to find AI posts with links from people only, posted within the last week."

Suggested input:

```json
{
  "query": "AI",
  "hasLink": true,
  "authorType": "person",
  "postedWithinHours": 168,
  "sortBy": "newest",
  "limit": 25
}
```

## 3) Fresh low-competition fundraising posts

"Use `find_fresh_low_competition_posts` for startup fundraising posts from the last 24 hours with very low comments."

Suggested input:

```json
{
  "query": "startup fundraising seed round",
  "postedWithinHours": 24,
  "maxComments": 5,
  "sortBy": "newest",
  "limit": 30
}
```

## 4) High-engagement GTM research

"Use `find_high_engagement_posts` to find high-engagement GTM posts from people and companies, minimum 300 likes, sorted by top."

Suggested input:

```json
{
  "query": "go to market GTM",
  "authorType": "any",
  "minLikes": 300,
  "sortBy": "top",
  "limit": 40
}
```
