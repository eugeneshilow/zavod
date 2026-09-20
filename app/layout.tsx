import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/components/convex-provider";

export const metadata: Metadata = {
  title: "zavod",
  description: "Проект, собранный как Spec-Driven Company",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
