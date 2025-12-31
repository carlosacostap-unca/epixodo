"use client";

import { pb } from "@/lib/pocketbase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TasksHeader } from "@/components/tasks/tasks-header";
import { TasksList } from "@/components/tasks/tasks-list";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TasksPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push("/");
      return;
    }
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
      <TasksHeader user={user} />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <Link 
          href="/principal" 
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Principal
        </Link>
        <TasksList />
      </main>
    </div>
  );
}
