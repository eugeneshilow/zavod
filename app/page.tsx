import Link from "next/link";
import { projectSentence, projectTitle, readDoc } from "@/lib/docs";

export default async function Home() {
  const readme = await readDoc("README.md");
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{projectTitle(readme)}</h1>
      <p className="text-lg leading-8 text-zinc-700">{projectSentence(readme)}</p>
      <p>
        <Link href="/admin" className="underline underline-offset-4">
          Стекло проекта: /admin
        </Link>
      </p>
    </main>
  );
}
