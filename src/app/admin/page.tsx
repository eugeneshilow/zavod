import { connection } from "next/server";
import ProjectDocuments from "@/components/project-documents";
import Studio from "@/components/studio";

export const metadata = { title: "Завод · Пульт" };

export default async function AdminPage() {
  if (process.env.GITHUB_PAGES !== "true") await connection();
  return <Studio documents={await ProjectDocuments()} />;
}
