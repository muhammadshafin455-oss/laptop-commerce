import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";
import { getCurrentUser } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

/** Only same-origin paths, so `?next=` cannot bounce a visitor off-site. */
function safeNext(value: string | string[] | undefined): string {
  const target = Array.isArray(value) ? value[0] : value;
  return target && target.startsWith("/") && !target.startsWith("//") ? target : "/";
}

export default async function SignupPage(props: PageProps<"/signup">) {
  const params = await props.searchParams;
  const next = safeNext(params.next);

  if (await getCurrentUser()) redirect(next);

  return (
    <AuthShell
      title="Create your account"
      subtitle="Sign up with your phone number to track orders and check out faster."
    >
      <SignUpForm next={next} />
    </AuthShell>
  );
}
