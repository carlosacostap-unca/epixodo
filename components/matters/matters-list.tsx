"use client";

import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";
import { Plus, Briefcase, Calendar, Loader2, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/date-utils";
import { useRouter } from "next/navigation";
import { MatterDetailModal } from "./matter-detail-modal";
import { CreateMatterModal } from "./create-matter-modal";

export function MattersList() {
  const router = useRouter();
  const [matters, setMatters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatterId, setSelectedMatterId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const fetchMatters = async () => {
    try {
      const records = await pb.collection("matters").getFullList({
        sort: "-created",
        requestKey: null 
      });
      setMatters(records);
    } catch (error: any) {
      console.error("Error fetching matters:", error);
      if (error.status === 404) {
        setError("La colección 'matters' no existe. Por favor, créala en PocketBase.");
      } else {
        setError("Error al cargar los asuntos.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatters();

    pb.collection("matters").subscribe("*", (e) => {
        if (e.action === "create" || e.action === "update" || e.action === "delete") {
             fetchMatters();
        }
    });

    return () => {
      pb.collection("matters").unsubscribe("*");
    };
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("¿Estás seguro de que quieres eliminar este asunto?")) return;
    
    try {
      await pb.collection("matters").delete(id);
      setMatters(matters.filter((m) => m.id !== id));
    } catch (error) {
      console.error("Error deleting matter:", error);
      alert("Error al eliminar el asunto");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-red-300 bg-red-50 p-12 text-center dark:border-red-900/50 dark:bg-red-900/20">
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-400">Error</h3>
        <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>
        {error.includes("La colección 'matters' no existe") && (
          <div className="mt-4 text-left text-xs text-red-600 dark:text-red-400">
            <p className="font-semibold">Instrucciones para crear la colección:</p>
            <ul className="list-disc pl-5">
              <li>Ve a tu panel de administración de PocketBase</li>
              <li>Crea una nueva colección llamada <strong>matters</strong></li>
              <li>Añade los campos: <strong>title</strong> (text), <strong>description</strong> (editor), <strong>due_date</strong> (date), <strong>user</strong> (relation)</li>
              <li>Ve a la colección <strong>activities</strong> y añade un campo: <strong>matter</strong> (relation &rarr; matters)</li>
              <li>Ve a la colección <strong>tasks</strong> y añade un campo: <strong>matter</strong> (relation &rarr; matters)</li>
              <li className="mt-1 font-semibold text-red-700 dark:text-red-300">Configura API Rules (Seguridad):</li>
              <li>Establece todas las reglas a: <code>user = @request.auth.id</code></li>
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Mis Asuntos
        </h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-blue-500 dark:hover:bg-blue-400"
        >
          <Plus className="h-4 w-4" />
          Nuevo Asunto
        </button>
      </div>

      {matters.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
            No hay asuntos
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comienza creando tu primer asunto para organizar actividades y tareas.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              <Plus className="h-4 w-4" />
              Nuevo Asunto
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matters.map((matter) => (
            <div
              key={matter.id}
              onClick={() => setSelectedMatterId(matter.id)}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 transition hover:shadow-md hover:ring-gray-900/10 dark:bg-zinc-900 dark:ring-white/10 dark:hover:ring-white/20 cursor-pointer"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                    {matter.title}
                  </h3>
                  <button
                    onClick={(e) => handleDelete(matter.id, e)}
                    className="rounded-full p-1 text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="mt-4 space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  {matter.due_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Vence: {formatDate(matter.due_date)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-blue-600 opacity-0 transition group-hover:opacity-100 dark:text-blue-400">
                <Edit className="h-3 w-3" />
                Editar detalles
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedMatterId && (
        <MatterDetailModal
          matterId={selectedMatterId}
          onClose={() => setSelectedMatterId(null)}
          onUpdate={() => {
            fetchMatters();
            setSelectedMatterId(null);
          }}
        />
      )}

      <CreateMatterModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchMatters}
      />
    </div>
  );
}
