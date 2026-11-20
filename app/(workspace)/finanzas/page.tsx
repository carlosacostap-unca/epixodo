import { redirect } from "next/navigation";
import FinanceScreen from "../../modules/finance/screen";
import { getPageUser } from "../../lib/auth";

export const metadata = { title: "Finanzas | Epixodo" };

export default async function FinancePage() {
  if (!(await getPageUser())) redirect("/");
  return <FinanceScreen />;
}
