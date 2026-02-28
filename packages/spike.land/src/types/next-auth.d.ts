/**
 * NextAuth.js type augmentation
 *
 * This file extends the default NextAuth types to include custom properties
 * for our application. TypeScript module augmentation allows us to add
 * properties to the Session and User interfaces provided by NextAuth.
 *
 * @see https://next-auth.js.org/getting-started/typescript
 */

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  /**
   * Extended Session interface
   *
   * Augments the default NextAuth Session type to include user id
   * in addition to the standard user properties (name, email, image).
   */
  interface Session {
    user: {
      /** Unique identifier for the user */
      id: string;
      /** User's display name */
      name?: string | null;
      /** User's email address */
      email?: string | null;
      /** URL to user's profile image */
      image?: string | null;
    };
  }

  /**
   * Extended User interface
   *
   * Augments the default NextAuth User type to ensure consistency
   * with our Session user type. The id field is guaranteed to be present.
   */
  interface User {
    /** Unique identifier for the user */
    id: string;
    /** User's display name */
    name?: string | null;
    /** User's email address */
    email?: string | null;
    /** URL to user's profile image */
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  /**
   * Extended JWT interface
   *
   * Augments the JWT token type to include user id.
   * This ensures the user id is available in JWT tokens for server-side
   * session handling and API route protection.
   */
  interface JWT {
    /** Unique identifier for the user */
    id: string;
    /** User's display name */
    name?: string | null;
    /** User's email address */
    email?: string | null;
    /** URL to user's profile image */
    image?: string | null;
  }
}
