import { connection } from "next/server";
import Link from "next/link";
import { readProjectSummary } from "@/lib/project";

export default async function Home() {
  if (process.env.GITHUB_PAGES !== "true") await connection();
  const project = await readProjectSummary();
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
      <p className="mb-4 text-sm text-stone-500">Spec-Driven Company</p>
      <h1 className="text-5xl font-semibold tracking-tight">{project.name}</h1>
      <p className="mt-6 max-w-2xl text-xl leading-relaxed text-stone-600">
        {project.description}
      </p>
      <Link className="action-link mt-10 inline-block" href="/admin">
        Открыть управление <span aria-hidden="true">→</span>
      </Link>
    </main>
  );
}
