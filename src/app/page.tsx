import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const roles = session.roles || [];
  const hasAdmin = roles.some((r) => r.name === "ADMIN" && r.status === "approved");
  const hasApprovedRole = roles.some((r) => r.status === "approved");

  if (hasAdmin) {
    redirect("/admin");
  } else if (hasApprovedRole) {
    redirect("/dashboard");
  } else {
    redirect("/awaiting-approval");
  }
}
