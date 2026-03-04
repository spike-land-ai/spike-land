import { Link } from "@tanstack/react-router";

const conversations = [
  {
    userId: "alice",
    name: "Alice",
    lastMessage: "Sounds good, let me check.",
    time: "2m ago",
    unread: true,
  },
  {
    userId: "bob",
    name: "Bob",
    lastMessage: "The deployment looks fine.",
    time: "1h ago",
    unread: false,
  },
  {
    userId: "carol",
    name: "Carol",
    lastMessage: "Can you review my PR?",
    time: "3h ago",
    unread: false,
  },
];

export function MessagesIndexPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Messages</h1>
      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {conversations.map((conv) => (
          <Link
            key={conv.userId}
            to="/messages/$userId"
            params={{ userId: conv.userId }}
            className="flex items-center gap-4 p-4 hover:bg-muted transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/10 text-sm font-semibold text-info-foreground">
              {conv.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-sm ${conv.unread ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
                  {conv.name}
                </span>
                <span className="text-xs text-muted-foreground">{conv.time}</span>
              </div>
              <p className="truncate text-sm text-muted-foreground">{conv.lastMessage}</p>
            </div>
            {conv.unread && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
          </Link>
        ))}
      </div>
    </div>
  );
}
