import { lucia } from "@/lib/auth/lucia";
import { validateSession } from "@/lib/auth/session";
import { cookies } from "next/headers";

export async function POST() {
  const validated = await validateSession();

  if (validated) {
    await lucia.invalidateSession(validated.session.id);
  }

  // Always clear the session cookie, even if no session was found
  const blankCookie = lucia.createBlankSessionCookie();
  const cookieStore = cookies();
  cookieStore.set(
    blankCookie.name,
    blankCookie.value,
    blankCookie.attributes
  );

  return Response.json({ ok: true });
}
