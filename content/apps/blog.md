---
slug: "blog"
name: "Blog"
description: "Read the latest updates, tutorials, and announcements from the spike.land team. Access published articles directly via AI tools."
emoji: "📰"
status: "live"
sort_order: 3
tools:
  - "blog_list_posts"
  - "blog_get_post"
graph:
  blog_list_posts:
    inputs: {}
    outputs:
      slug: "string"
    always_available: true
  blog_get_post:
    inputs:
      slug: "from:blog_list_posts.slug"
    outputs: {}
    always_available: true
---

# Blog

Stay up to date with the latest developments, deep dives, and community highlights from spike.land.

Our official blog isn't just a website you browse—it's fully integrated into your AI environment.

## 1. List Posts

Browse the latest published articles. You can filter by category, tag, or fetch only featured posts to find exactly what you're interested in.

<ToolRun name="blog_list_posts" />

## 2. Read a Post

Found an interesting article? Fetch the complete, rich-text markdown content directly into your workspace.

<ToolRun name="blog_get_post" />
