import { lucia } from "@/lib/auth/lucia";
import { cookies } from "next/headers";
import type { Session, User } from "lucia";

export interface ValidatedSession {
  user: User;
  session: Session;
}

/**
 * Validates the current session from cookies.
 * Returns null if there's no valid session.
 * Must only be called in Server Components or API Routes.
 */
export async function validateSession(): Promise<ValidatedSession | null> {
  const cookieStore = cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;

  if (!sessionId) return null;

  const result = await lucia.validateSession(sessionId);

  // Refresh session cookie if session was extended
  if (result.session && result.session.fresh) {
    const sessionCookie = lucia.createSessionCookie(result.session.id);
    cookieStore.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );
  }

  if (!result.session) {
    const blankCookie = lucia.createBlankSessionCookie();
    cookieStore.set(
      blankCookie.name,
      blankCookie.value,
      blankCookie.attributes
    );
    return null;
  }

  return { user: result.user, session: result.session };
}
