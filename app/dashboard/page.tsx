"use client";

import { pb } from "@/lib/pocketbase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";
import { TodayTasksCard } from "@/components/dashboard/today-tasks-card";
import { OverdueTasksCard } from "@/components/dashboard/overdue-tasks-card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Verificar si hay usuario logueado
    if (!pb.authStore.isValid) {
      router.push("/");
      return;
    }
    
    // Obtener datos del usuario
    setUser(pb.authStore.model);
  }, [router]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 border-t-transparent dark:border-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <DashboardHeader user={user} />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <Link 
          href="/principal" 
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Principal
        </Link>
        <div className="w-full space-y-6">
          <OverdueTasksCard />
          <TodayTasksCard />
        </div>
      </main>
    </div>
  );
}
