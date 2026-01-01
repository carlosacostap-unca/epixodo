"use client";

import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";
import { Plus, StickyNote, Loader2 } from "lucide-react";
import { CreateNoteModal } from "./create-note-modal";
import { NoteDetailModal } from "./note-detail-modal";
import { formatDate } from "@/lib/date-utils";

export function NotesList() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchNotes = async () => {
    try {
      const records = await pb.collection("notes").getList(1, 200, {
        sort: "-updated", // Most recently updated first
        filter: `user = "${pb.authStore.model?.id}"`,
        requestKey: null,
      });
      setNotes(records.items);
    } catch (error: any) {
      if (error.status !== 0) {
        console.error("Error fetching notes:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();

    pb.collection("notes").subscribe("*", (e) => {
        if (e.action === "create" || e.action === "update" || e.action === "delete") {
             fetchNotes();
        }
    });

    return () => {
      pb.collection("notes").unsubscribe("*");
    };
  }, []);

  // Helper to strip HTML for preview
  const getPreviewText = (html: string) => {
    if (typeof window === "undefined") return ""; // Server-side safety
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mis Notas</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <Plus className="h-4 w-4" />
          Nueva Nota
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-zinc-700">
          <StickyNote className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No hay notas</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Comienza creando una nueva nota.</p>
          <div className="mt-6">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <Plus className="h-4 w-4" />
              Nueva Nota
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => setSelectedNoteId(note.id)}
              className="group relative flex h-48 cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-2">
                <h3 className="line-clamp-1 font-medium text-gray-900 dark:text-white">
                  {note.title}
                </h3>
              </div>
              <div className="flex-1 overflow-hidden">
                 <p className="line-clamp-4 text-sm text-gray-500 dark:text-gray-400 break-words">
                   {note.content ? getPreviewText(note.content) : <span className="italic text-gray-300">Sin contenido</span>}
                 </p>
              </div>
              <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                Actualizado: {formatDate(note.updated)}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateNoteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          fetchNotes();
        }}
      />

      {selectedNoteId && (
        <NoteDetailModal
          noteId={selectedNoteId}
          onClose={() => setSelectedNoteId(null)}
          onUpdate={fetchNotes}
        />
      )}
    </div>
  );
}
