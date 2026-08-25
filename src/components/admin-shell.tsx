import type { ReactNode } from "react";

/**
 * Page header and content padding. The sidebar is rendered once by the
 * dashboard layout, not here.
 */
export function AdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <main className="px-4 py-8 sm:px-6 lg:px-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-[-0.025em] sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-muted">{description}</p>
        ) : null}
      </header>
      {children}
    </main>
  );
}
