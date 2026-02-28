export type PostStatus = "published" | "draft" | "scheduled";

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  status: PostStatus;
  date: string;
  reads: string;
  comments: number;
  tags: string[];
  scheduledAt?: string;
}
