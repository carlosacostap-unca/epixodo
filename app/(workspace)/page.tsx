import LoginForm from "../components/login-form";
import ModuleLauncher from "../components/module-launcher";
import { getPageUser } from "../lib/auth";

export default async function Home() {
  return (await getPageUser()) ? <ModuleLauncher /> : <LoginForm />;
}
