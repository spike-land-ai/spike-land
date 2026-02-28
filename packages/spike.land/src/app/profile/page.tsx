import { auth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/?auth=required&callbackUrl=/profile");
  }

  const userInitials = session.user.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="container mx-auto pt-24 pb-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>
              Your profile details from your authentication provider
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={session.user.image || undefined}
                  alt={session.user.name || "User"}
                />
                <AvatarFallback className="text-2xl">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-semibold">
                  {session.user.name || "User"}
                </h2>
                <p className="text-muted-foreground">
                  {session.user.email || "No email"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  User ID
                </span>
                <p className="mt-1 text-sm font-mono bg-muted p-2 rounded">
                  {session.user.id || "Not available"}
                </p>
              </div>

              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Account Type
                </span>
                <p className="mt-1">OAuth Provider Account</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
            <CardDescription>Profile pages coming soon</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Additional profile features like bio, location, and social links will be available in
              a future update.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
