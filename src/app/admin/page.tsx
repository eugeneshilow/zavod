import ProjectDocuments from "@/components/project-documents";
import Studio from "@/components/studio";

export const dynamic = "force-dynamic";
export const metadata = { title: "Завод · Пульт" };

export default async function AdminPage() {
  return <Studio documents={await ProjectDocuments()} />;
}
