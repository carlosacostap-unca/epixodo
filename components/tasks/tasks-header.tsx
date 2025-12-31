"use client";

import { pb } from "@/lib/pocketbase";
import { useRouter } from "next/navigation";

export function TasksHeader({ user }: { user: any }) {
  const router = useRouter();

  const handleLogout = () => {
    pb.authStore.clear();
    document.cookie = pb.authStore.exportToCookie({ httpOnly: false });
    router.push("/");
  };

  return (
    <nav className="border-b bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Gestión de Tareas
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {user.email}
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  );
}
