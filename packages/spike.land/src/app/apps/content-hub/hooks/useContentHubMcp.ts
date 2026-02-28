"use client";

import { useMcpMutation } from "@/lib/mcp/client/hooks/use-mcp-mutation";

export function useContentHubMcp() {
  // Blog Mutations
  const createPost = useMcpMutation("create_post");
  const publishPost = useMcpMutation("publish_post");
  const listPosts = useMcpMutation("list_posts");

  // Newsletter Mutations
  const createNewsletter = useMcpMutation("create_newsletter");
  const sendNewsletter = useMcpMutation("send_newsletter");
  const manageSubscribers = useMcpMutation("manage_subscribers");

  return {
    mutations: {
      createPost,
      publishPost,
      listPosts,
      createNewsletter,
      sendNewsletter,
      manageSubscribers,
    },
  };
}
