import { requireAdmin } from "@/lib/admin";
import { NewClientForm } from "./new-client-form";

export default async function NewClientPage() {
  await requireAdmin();

  return <NewClientForm />;
}
