import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VoltSupply | Admin",
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="min-h-screen bg-canvas">{children}</div>;
}
