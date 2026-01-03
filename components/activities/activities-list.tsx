"use client";

import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";
import { Plus, Calendar, Clock, Loader2, Edit, Trash2, ChevronRight, Filter, Eye, Pencil, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/date-utils";
import { useRouter } from "next/navigation";
import { ActivityDetailModal } from "./activity-detail-modal";
import { CreateActivityModal } from "./create-activity-modal";

// ActivityCard Component
const ActivityCard = ({ 
  activity, 
  sectionKey, 
  onSelect 
}: { 
  activity: any, 
  sectionKey: string, 
  onSelect: (id: string) => void 
}) => {
  const isActive = sectionKey === 'active';
  const isPast = sectionKey === 'past';
  const isUpcoming = sectionKey === 'upcoming';
  
  return (
    <div
      onClick={() => onSelect(activity.id)}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-lg border p-4 transition-all duration-300 hover:shadow-md cursor-pointer
        ${isActive 
          ? 'bg-white border-l-4 border-l-blue-500 border-y-gray-200 border-r-gray-200 dark:bg-zinc-900 dark:border-l-blue-500 dark:border-y-zinc-800 dark:border-r-zinc-800' 
          : isUpcoming
            ? 'bg-gray-50/50 border-gray-100 dark:bg-zinc-900/30 dark:border-zinc-800'
            : 'bg-white border-gray-200 opacity-75 hover:opacity-100 dark:bg-zinc-900 dark:border-zinc-800'
        }
      `}
    >
      <div>
        <div className="flex items-start justify-between gap-4">
          <h3 className={`font-semibold text-sm ${isPast ? 'text-gray-500' : 'text-gray-900 dark:text-white'} group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors`}>
            {activity.title}
          </h3>
        </div>
        
        <div className="mt-3 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
          {activity.start_date && (
            <div className={`flex items-center gap-2 ${isActive ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}`}>
              <Clock className="h-3.5 w-3.5" />
              <span>Inicio: {formatDateTime(activity.start_date)}</span>
            </div>
          )}
          {activity.end_date && (
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              <span>Fin: {formatDateTime(activity.end_date)}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Actions on Hover */}
      <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-white/90 dark:bg-zinc-900/90 rounded-md px-1 backdrop-blur-sm shadow-sm border border-gray-100 dark:border-zinc-800">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onSelect(activity.id);
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
  onSelect
}: { 
  sectionKey: string, 
  items: any[], 
  title: string, 
  isOpen: boolean,
  onToggle: (key: string) => void,
  viewMode: 'all' | 'focus',
  onSelect: (id: string) => void
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
          sectionKey === 'upcoming' ? 'text-gray-700 dark:text-gray-200' : 
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
          {items.map(activity => (
            <ActivityCard 
              key={activity.id} 
              activity={activity} 
              sectionKey={sectionKey} 
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export function ActivitiesList() {
  const router = useRouter();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'focus'>('all');
  const [error, setError] = useState<string | null>(null);

  // Section collapse states
  const [sectionStates, setSectionStates] = useState<Record<string, boolean>>({
    active: true,
    upcoming: true,
    past: false,
    noDate: true
  });

  const toggleSection = (section: string) => {
    setSectionStates(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const fetchActivities = async () => {
    try {
      const records = await pb.collection("activities").getFullList({
        sort: "-created", // Initial sort, but we will categorize manually
        requestKey: null 
      });
      setActivities(records);
    } catch (error: any) {
      console.error("Error fetching activities:", error);
      if (error.status === 404) {
        setError("La colección 'activities' no existe. Por favor, créala en PocketBase.");
      } else {
        setError("Error al cargar las actividades.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();

    pb.collection("activities").subscribe("*", (e) => {
        if (e.action === "create" || e.action === "update" || e.action === "delete") {
             fetchActivities();
        }
    });

    return () => {
      pb.collection("activities").unsubscribe("*");
    };
  }, []);

  const categorizeActivities = () => {
    const sections = {
      active: [] as any[],
      upcoming: [] as any[],
      past: [] as any[],
      noDate: [] as any[],
    };

    const now = new Date();

    activities.forEach(activity => {
      if (!activity.start_date) {
        sections.noDate.push(activity);
        return;
      }

      const startDate = new Date(activity.start_date);
      const endDate = activity.end_date ? new Date(activity.end_date) : null;

      if (endDate && endDate < now) {
        sections.past.push(activity);
      } else if (startDate > now) {
        sections.upcoming.push(activity);
      } else {
        // If start date is past (or now) and end date is future (or null) -> Active
        sections.active.push(activity);
      }
    });

    return sections;
  };

  const sections = categorizeActivities();
  const focusCount = sections.active.length;

  const sectionsConfig = [
    { key: 'active', title: 'En Curso' },
    { key: 'upcoming', title: 'Próximas' },
    { key: 'noDate', title: 'Sin Fecha' },
    { key: 'past', title: 'Finalizadas' },
  ];

  const visibleSections = viewMode === 'focus' 
    ? sectionsConfig.filter(s => ['active', 'upcoming'].includes(s.key))
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
        {error.includes("La colección 'activities' no existe") && (
          <div className="mt-4 text-left text-xs text-red-600 dark:text-red-400">
             {/* Instructions omitted for brevity, keeping original logic if needed but likely simplified */}
             <p>Por favor crea la colección en PocketBase.</p>
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
                Todas
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
                Activas
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
          Nueva Actividad
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
            onSelect={setSelectedActivityId}
          />
        ))}

        {activities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500 dark:text-gray-400">
             <div className="bg-gray-100 dark:bg-zinc-800 p-4 rounded-full mb-4">
               <Calendar className="h-8 w-8 text-gray-400" />
             </div>
             <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sin actividades</h3>
             <p className="max-w-sm mt-1">No tienes actividades registradas. ¡Comienza a planificar tu tiempo!</p>
             <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-6 text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline"
             >
                Crear actividad ahora
             </button>
          </div>
        )}
      </div>

      {selectedActivityId && (
        <ActivityDetailModal
          activityId={selectedActivityId}
          onClose={() => setSelectedActivityId(null)}
          onUpdate={() => {
            fetchActivities();
            setSelectedActivityId(null);
          }}
        />
      )}

      <CreateActivityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchActivities}
      />
    </div>
  );
}
