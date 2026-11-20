import { redirect } from "next/navigation";
import FinanceScreen from "../../modules/finance/screen";
import { getPageUser } from "../../lib/auth";

export const metadata = { title: "Finanzas | Epixodo" };

export default async function FinancePage({ searchParams }: PageProps<"/finanzas">) {
  if (!(await getPageUser())) redirect("/");
  const { desdeEntrada } = await searchParams;
  return <FinanceScreen returnEntryId={typeof desdeEntrada === "string" ? desdeEntrada : undefined} />;
}
