import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/session";

export default async function RootPage() {
  const validated = await validateSession();

  if (validated) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
