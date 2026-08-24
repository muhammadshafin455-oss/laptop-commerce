"use client";

import { Lock } from "lucide-react";
import { useActionState } from "react";
import { login } from "@/app/admin/actions";
import { Button, Field, Notice, inputClass } from "@/components/ui";
import type { ActionResult } from "@/lib/types";

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    login,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Admin password">
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-subtle" />
          <input
            className={`${inputClass} pl-10`}
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
      </Field>

      <Notice result={state} />

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Checking…" : "Sign in"}
      </Button>
    </form>
  );
}
