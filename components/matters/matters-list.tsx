"use client";

import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";
import { Plus, Briefcase, Calendar, Loader2, Edit, Trash2, FolderTree, ChevronRight, Filter, Eye, Pencil } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/date-utils";
import { useRouter } from "next/navigation";
import { MatterDetailModal } from "./matter-detail-modal";
import { CreateMatterModal } from "./create-matter-modal";

// MatterCard Component
const MatterCard = ({ 
  matter, 
  sectionKey, 
  onSelect,
  subMattersCount
}: { 
  matter: any, 
  sectionKey: string, 
  onSelect: (id: string) => void,
  subMattersCount: number
}) => {
  const isActive = sectionKey === 'active';
  const isOverdue = sectionKey === 'overdue';
  const isNoDate = sectionKey === 'noDate';
  
  return (
    <div
      onClick={() => onSelect(matter.id)}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-lg border p-4 transition-all duration-300 hover:shadow-md cursor-pointer
        ${isActive 
          ? 'bg-white border-l-4 border-l-blue-500 border-y-gray-200 border-r-gray-200 dark:bg-zinc-900 dark:border-l-blue-500 dark:border-y-zinc-800 dark:border-r-zinc-800' 
          : isOverdue
            ? 'bg-red-50/30 border-red-100 dark:bg-red-900/10 dark:border-red-900/30'
            : 'bg-white border-gray-200 opacity-90 hover:opacity-100 dark:bg-zinc-900 dark:border-zinc-800'
        }
      `}
    >
      <div>
        <div className="flex items-start justify-between gap-4">
          <h3 className={`font-semibold text-sm ${isOverdue ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'} group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors`}>
            {matter.title}
          </h3>
        </div>
        
        <div className="mt-3 space-y-2 text-xs text-gray-500 dark:text-gray-400">
          {matter.due_date ? (
            <div className={`flex items-center gap-2 ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : isActive ? 'text-blue-600 dark:text-blue-400' : ''}`}>
              <Calendar className="h-3.5 w-3.5" />
              <span>Vence: {formatDate(matter.due_date)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 italic text-gray-400">
              <Calendar className="h-3.5 w-3.5" />
              <span>Sin fecha límite</span>
            </div>
          )}
          
          {subMattersCount > 0 && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-zinc-800 dark:text-gray-300">
              <FolderTree className="h-3 w-3" />
              {subMattersCount} {subMattersCount === 1 ? 'Subasunto' : 'Subasuntos'}
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Actions on Hover */}
      <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-white/90 dark:bg-zinc-900/90 rounded-md px-1 backdrop-blur-sm shadow-sm border border-gray-100 dark:border-zinc-800">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onSelect(matter.id);
          }}
          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md dark:hover:bg-blue-900/20 transition-colors"
          title="Editar detalles"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

// Section Component
const Section = ({ 
  sectionKey, 
  items, 
  title, 
  isOpen,
  onToggle,
  viewMode,
  onSelect,
  getSubMattersCount
}: { 
  sectionKey: string, 
  items: any[], 
  title: string, 
  isOpen: boolean,
  onToggle: (key: string) => void,
  viewMode: 'all' | 'focus',
  onSelect: (id: string) => void,
  getSubMattersCount: (id: string) => number
}) => {
  if (items.length === 0 && viewMode === 'focus') return null;
  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      <button 
        onClick={() => onToggle(sectionKey)}
        className="flex w-full items-center gap-2 py-2 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/30 rounded-md px-2 -ml-2 transition-colors group"
      >
        <div className={`p-0.5 rounded-md text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
           <ChevronRight className="h-4 w-4" />
        </div>
        <h2 className={`text-sm font-bold flex items-center gap-2 ${
          sectionKey === 'active' ? 'text-blue-600 dark:text-blue-400' : 
          sectionKey === 'overdue' ? 'text-red-600 dark:text-red-400' : 
          'text-gray-500 dark:text-gray-400'
        }`}>
          {title}
          <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
            {items.length}
          </span>
        </h2>
        <div className="flex-1 border-b border-gray-100 dark:border-zinc-800 ml-2"></div>
      </button>
      
      {isOpen && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pl-2 animate-in slide-in-from-top-1 duration-200">
          {items.map(matter => (
            <MatterCard 
              key={matter.id} 
              matter={matter} 
              sectionKey={sectionKey} 
              onSelect={onSelect}
              subMattersCount={getSubMattersCount(matter.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export function MattersList() {
  const router = useRouter();
  const [matters, setMatters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatterId, setSelectedMatterId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'focus'>('all');

  // Section collapse states
  const [sectionStates, setSectionStates] = useState<Record<string, boolean>>({
    active: true,
    overdue: true,
    noDate: true,
    completed: false // Assuming we might have this state later
  });

  const toggleSection = (section: string) => {
    setSectionStates(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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

  // Helper to count sub-matters
  const getSubMattersCount = (matterId: string) => {
    return matters.filter(m => m.parent === matterId).length;
  };

  const categorizeMatters = () => {
    const sections = {
      active: [] as any[],
      overdue: [] as any[],
      noDate: [] as any[],
    };

    const now = new Date();
    // Reset time part for accurate date comparison
    now.setHours(0, 0, 0, 0);

    // Filter only root matters for the main list
    const rootMatters = matters.filter(m => !m.parent);

    rootMatters.forEach(matter => {
      if (!matter.due_date) {
        sections.noDate.push(matter);
        return;
      }

      const dueDate = new Date(matter.due_date);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate < now) {
        sections.overdue.push(matter);
      } else {
        sections.active.push(matter);
      }
    });

    return sections;
  };

  const sections = categorizeMatters();
  const focusCount = sections.active.length + sections.overdue.length;

  const sectionsConfig = [
    { key: 'overdue', title: 'Vencidos' },
    { key: 'active', title: 'En Curso' },
    { key: 'noDate', title: 'Sin Fecha' },
  ];

  const visibleSections = viewMode === 'focus' 
    ? sectionsConfig.filter(s => ['active', 'overdue'].includes(s.key))
    : sectionsConfig;

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
              <li>Añade los campos: <strong>title</strong> (text), <strong>description</strong> (editor), <strong>due_date</strong> (date), <strong>parent</strong> (relation &rarr; matters), <strong>user</strong> (relation)</li>
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-zinc-800">
        <div className="flex items-center gap-4">
           <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-zinc-800">
              <button
                onClick={() => setViewMode('all')}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  viewMode === 'all'
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                Todos
              </button>
              <button
                onClick={() => setViewMode('focus')}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  viewMode === 'focus'
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                Prioritarios
                {focusCount > 0 && (
                   <span className={`ml-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] ${
                     viewMode === 'focus' 
                       ? 'bg-gray-100 text-gray-900 dark:bg-zinc-600 dark:text-white' 
                       : 'bg-gray-200 text-gray-700 dark:bg-zinc-700 dark:text-gray-300'
                   }`}>
                     {focusCount}
                   </span>
                )}
              </button>
           </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 w-full sm:w-auto justify-center"
        >
          <Plus className="h-4 w-4" />
          Nuevo Asunto
        </button>
      </div>

      <div className="space-y-10">
        {visibleSections.map(config => (
          <Section 
            key={config.key}
            sectionKey={config.key}
            items={sections[config.key as keyof typeof sections]}
            title={config.title}
            isOpen={sectionStates[config.key]}
            onToggle={toggleSection}
            viewMode={viewMode}
            onSelect={setSelectedMatterId}
            getSubMattersCount={getSubMattersCount}
          />
        ))}

        {matters.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500 dark:text-gray-400">
             <div className="bg-gray-100 dark:bg-zinc-800 p-4 rounded-full mb-4">
               <Briefcase className="h-8 w-8 text-gray-400" />
             </div>
             <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sin asuntos</h3>
             <p className="max-w-sm mt-1">No tienes asuntos registrados. ¡Comienza a organizar tu trabajo!</p>
             <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-6 text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline"
             >
                Crear asunto ahora
             </button>
          </div>
        )}
      </div>

      {selectedMatterId && (
        <MatterDetailModal
          matterId={selectedMatterId}
          onClose={() => setSelectedMatterId(null)}
          onUpdate={() => {
            fetchMatters();
            // Don't close modal here to allow editing
          }}
          onNavigate={setSelectedMatterId}
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
