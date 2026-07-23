import TaskManager from "./components/task-manager";
import LoginForm from "./components/login-form";
import { getAuthenticatedUser } from "./lib/auth";

export default async function Home() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return <LoginForm />;
  }

  return <TaskManager />;
}
