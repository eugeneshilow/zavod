import type { Metadata } from "next";
import { readProjectSummary } from "@/lib/project";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const project = await readProjectSummary();
  return {
    title: { default: project.name, template: `%s · ${project.name}` },
    description: project.description,
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
