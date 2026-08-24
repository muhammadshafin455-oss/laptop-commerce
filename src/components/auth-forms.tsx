"use client";

import { Eye, EyeOff, Lock, Mail, Phone, UserRound } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { signIn, signUp } from "@/app/actions/auth";
import { Button, Field, Notice, inputClass, inputErrorClass } from "@/components/ui";
import type { ActionResult } from "@/lib/types";

const iconClass =
  "pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-subtle";

function PasswordInput({
  name,
  autoComplete,
  placeholder,
  invalid,
}: {
  name: string;
  autoComplete: string;
  placeholder: string;
  invalid?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Lock className={iconClass} />
      <input
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        className={`${invalid ? inputErrorClass : inputClass} pl-10 pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 mt-[3px] -translate-y-1/2 rounded-md p-1.5 text-subtle transition-colors hover:bg-canvas hover:text-ink"
      >
        {visible ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
      </button>
    </div>
  );
}

export function SignInForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    signIn,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <Field label="Phone number" error={state?.fieldErrors?.phone}>
        <div className="relative">
          <Phone className={iconClass} />
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+1 555 010 9999"
            required
            className={`${inputClass} pl-10`}
          />
        </div>
      </Field>

      <Field label="Password" error={state?.fieldErrors?.password}>
        <PasswordInput
          name="password"
          autoComplete="current-password"
          placeholder="Your password"
        />
      </Field>

      <Notice result={state} />

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-muted">
        New to VoltSupply?{" "}
        <Link
          href={`/signup?next=${encodeURIComponent(next)}`}
          className="font-semibold text-brand hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function SignUpForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    signUp,
    null,
  );
  const errors = state?.fieldErrors;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <Field label="Full name" error={errors?.name}>
        <div className="relative">
          <UserRound className={iconClass} />
          <input
            name="name"
            autoComplete="name"
            placeholder="Ada Lovelace"
            required
            className={`${errors?.name ? inputErrorClass : inputClass} pl-10`}
          />
        </div>
      </Field>

      <Field
        label="Phone number"
        hint="This is how you sign in."
        error={errors?.phone}
      >
        <div className="relative">
          <Phone className={iconClass} />
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+1 555 010 9999"
            required
            className={`${errors?.phone ? inputErrorClass : inputClass} pl-10`}
          />
        </div>
      </Field>

      <Field label="Email" optional error={errors?.email}>
        <div className="relative">
          <Mail className={iconClass} />
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={`${errors?.email ? inputErrorClass : inputClass} pl-10`}
          />
        </div>
      </Field>

      <Field label="Password" hint="At least 8 characters." error={errors?.password}>
        <PasswordInput
          name="password"
          autoComplete="new-password"
          placeholder="Create a password"
          invalid={!!errors?.password}
        />
      </Field>

      <Field label="Confirm password" error={errors?.confirmPassword}>
        <PasswordInput
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Repeat the password"
          invalid={!!errors?.confirmPassword}
        />
      </Field>

      <Notice result={state} />

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="font-semibold text-brand hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
