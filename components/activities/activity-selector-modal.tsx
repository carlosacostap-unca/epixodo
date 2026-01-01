"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { Modal } from "@/components/ui/modal";
import { Search, Loader2 } from "lucide-react";

interface ActivitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (activity: any) => void;
}

export function ActivitySelectorModal({ isOpen, onClose, onSelect }: ActivitySelectorModalProps) {
  const [search, setSearch] = useState("");
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchActivities();
    }
  }, [isOpen, search]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const result = await pb.collection("activities").getList(1, 20, {
        sort: "-created",
        filter: search ? `title ~ "${search}"` : "",
        requestKey: null
      });
      setActivities(result.items);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Seleccionar Actividad</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar actividades..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-200 pl-9 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            autoFocus
          />
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : activities.length > 0 ? (
            activities.map((activity) => (
              <button
                key={activity.id}
                onClick={() => {
                  onSelect(activity);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="font-medium text-gray-900 dark:text-white">{activity.title}</div>
                {activity.description && (
                  <div className="text-sm text-gray-500 truncate">{activity.description.replace(/<[^>]*>?/gm, '')}</div>
                )}
              </button>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              No se encontraron actividades
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
