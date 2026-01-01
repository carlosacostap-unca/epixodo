"use client";

import { pb } from "@/lib/pocketbase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, CheckSquare, Calendar, Briefcase, StickyNote } from "lucide-react";
import { FeatureCard } from "@/components/ui/feature-card";

export default function PrincipalPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push("/");
      return;
    }
    setUser(pb.authStore.model);
  }, [router]);

  const handleLogout = () => {
    pb.authStore.clear();
    document.cookie = pb.authStore.exportToCookie({ httpOnly: false });
    router.push("/");
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 border-t-transparent dark:border-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <nav className="border-b bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Epixodo
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

      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Bienvenido a Epixodo
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Selecciona una opción para comenzar
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            title="Dashboard"
            description="Accede a tu panel de control, estadísticas y resumen de actividad."
            icon={LayoutDashboard}
            href="/dashboard"
          />
          <FeatureCard
            title="Tareas"
            description="Gestiona tus tareas pendientes y organiza tu trabajo."
            icon={CheckSquare}
            href="/tasks"
          />
          <FeatureCard
            title="Actividades"
            description="Gestiona tus actividades con fechas de inicio y fin."
            icon={Calendar}
            href="/activities"
          />
          <FeatureCard
            title="Asuntos"
            description="Gestiona tus asuntos, proyectos y casos con sus actividades y tareas."
            icon={Briefcase}
            href="/matters"
          />
          <FeatureCard
            title="Notas"
            description="Crea y gestiona tus notas personales."
            icon={StickyNote}
            href="/notes"
          />
        </div>
      </main>
    </div>
  );
}
