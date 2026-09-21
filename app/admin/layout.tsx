import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Shell } from "./_components/shell";

export const metadata: Metadata = {
  title: "zavod — админка",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <Shell>{children}</Shell>;
}
