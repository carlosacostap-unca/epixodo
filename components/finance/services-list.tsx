"use client";

import { useState, useEffect } from "react";
import { Zap, Pencil, Trash2 } from "lucide-react";
import { pb } from "@/lib/pocketbase";
import { ServiceSummariesModal } from "./service-summaries-modal";
import { formatDate } from "@/lib/date-utils";

interface ServicesListProps {
  services: any[];
  onEdit: (service: any) => void;
  onUpdate: () => void;
}

interface ServiceStats {
  [serviceId: string]: {
    pendingCount: number;
    pendingAmount: number;
    nextDueDate?: string;
  }
}

export function ServicesList({ services, onEdit, onUpdate }: ServicesListProps) {
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isSummariesModalOpen, setIsSummariesModalOpen] = useState(false);
  const [stats, setStats] = useState<ServiceStats>({});

  const loadStats = async () => {
    try {
      const user = pb.authStore.model?.id;
      if (!user) return;
      
      const summaries = await pb.collection("service_summaries").getFullList({
        filter: `user = "${user}" && status = "pending"`,
        sort: 'due_date',
      });
      
      const newStats: ServiceStats = {};
      
      summaries.forEach((summary: any) => {
        if (!newStats[summary.service]) {
          newStats[summary.service] = { pendingCount: 0, pendingAmount: 0 };
        }
        
        newStats[summary.service].pendingCount++;
        newStats[summary.service].pendingAmount += (summary.amount || 0);
        
        // As it's sorted by due_date, the first one is the next due
        if (!newStats[summary.service].nextDueDate) {
          newStats[summary.service].nextDueDate = summary.due_date;
        }
      });
      
      setStats(newStats);
    } catch (error: any) {
      if (error.isAbort) return;
      // Ignore 404 missing collection error while the user sets it up
      if (error.status === 404) return;
      console.error("Error loading stats:", error);
    }
  };

  useEffect(() => {
    loadStats();
  }, [services]);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este servicio?")) return;
    
    try {
      await pb.collection("services").delete(id);
      onUpdate();
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("No se pudo eliminar el servicio");
    }
  };

  if (services.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-zinc-700">
        <Zap className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No tienes servicios registrados</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Agrega tus servicios recurrentes (Luz, Agua, Internet) aquí.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => {
          const serviceStats = stats[service.id];
          
          return (
            <div
              key={service.id}
              className="group relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-yellow-50 p-2.5 dark:bg-yellow-900/20">
                    <Zap className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{service.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{service.provider}</p>
                  </div>
                </div>
                
                <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => onEdit(service)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-zinc-800 dark:hover:text-gray-300"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {serviceStats ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Resúmenes Pendientes</span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {serviceStats.pendingCount} ({service.currency === 'USD' ? 'US$' : '$'} {serviceStats.pendingAmount.toLocaleString('es-AR')})
                      </span>
                    </div>
                    {serviceStats.nextDueDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Próximo Vencimiento</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatDate(serviceStats.nextDueDate)}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Estado</span>
                    <span className={`font-medium ${service.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                      {service.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                )}
                
                <div className="pt-2">
                  <button 
                    onClick={() => {
                      setSelectedService(service);
                      setIsSummariesModalOpen(true);
                    }}
                    className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
                  >
                    Ver Resúmenes
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ServiceSummariesModal
        isOpen={isSummariesModalOpen}
        onClose={() => {
          setIsSummariesModalOpen(false);
          setSelectedService(null);
        }}
        service={selectedService}
        onChange={() => {
          loadStats();
          onUpdate();
        }}
      />
    </>
  );
}
