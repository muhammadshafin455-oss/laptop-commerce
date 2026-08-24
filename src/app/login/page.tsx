import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";
import { getCurrentUser } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

/** Only same-origin paths, so `?next=` cannot bounce a visitor off-site. */
function safeNext(value: string | string[] | undefined): string {
  const target = Array.isArray(value) ? value[0] : value;
  return target && target.startsWith("/") && !target.startsWith("//") ? target : "/";
}

export default async function LoginPage(props: PageProps<"/login">) {
  const params = await props.searchParams;
  const next = safeNext(params.next);

  if (await getCurrentUser()) redirect(next);

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in with the phone number you registered."
    >
      <SignInForm next={next} />
    </AuthShell>
  );
}
