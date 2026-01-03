"use client";

import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";
import { Plus, StickyNote, Loader2, Archive, ArchiveRestore, Eye, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { CreateNoteModal } from "./create-note-modal";
import { NoteDetailModal } from "./note-detail-modal";
import { formatDate } from "@/lib/date-utils";

export function NotesList() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [view, setView] = useState<'active' | 'archived'>('active');
  const [viewMode, setViewMode] = useState<'all' | 'focus'>('all');
  
  // Section states
  const [sectionStates, setSectionStates] = useState<Record<string, boolean>>({
    recent: true,
    older: true,
    archived: true
  });

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const filter = view === 'active' 
        ? `user = "${pb.authStore.model?.id}" && (is_archived = false || is_archived = null)`
        : `user = "${pb.authStore.model?.id}" && is_archived = true`;

      const records = await pb.collection("notes").getList(1, 200, {
        sort: "-updated", // Most recently updated first
        filter: filter,
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
  }, [view]);

  useEffect(() => {
    pb.collection("notes").subscribe("*", (e) => {
        if (e.action === "create" || e.action === "update" || e.action === "delete") {
             fetchNotes();
        }
    });

    return () => {
      pb.collection("notes").unsubscribe("*");
    };
  }, [view]);

  const toggleSection = (key: string) => {
    setSectionStates(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const categorizeNotes = () => {
    if (view === 'archived') {
      return {
        archived: notes
      };
    }

    const sections = {
      recent: [] as any[],
      older: [] as any[],
    };

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    notes.forEach(note => {
      const updatedDate = new Date(note.updated);
      if (updatedDate >= sevenDaysAgo) {
        sections.recent.push(note);
      } else {
        sections.older.push(note);
      }
    });

    return sections;
  };

  const sections = categorizeNotes();
  
  // Logic for focus view: only show 'recent' notes in focus mode (if active view)
  const visibleSections = viewMode === 'focus' && view === 'active'
    ? ['recent']
    : Object.keys(sections);

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

  const focusCount = (sections as any).recent?.length || 0;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-zinc-800">
            <button
              onClick={() => setView('active')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                view === 'active'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Activas
            </button>
            <button
              onClick={() => setView('archived')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                view === 'archived'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Archivadas
            </button>
          </div>

          {view === 'active' && (
            <>
              <div className="h-6 w-px bg-gray-200 dark:bg-zinc-700 hidden sm:block"></div>
              <button
                onClick={() => setViewMode(viewMode === 'all' ? 'focus' : 'all')}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  viewMode === 'focus'
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                Recientes
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
            </>
          )}
        </div>

        {view === 'active' && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Plus className="h-4 w-4" />
            Nueva Nota
          </button>
        )}
      </div>

      {notes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-zinc-700">
          {view === 'active' ? (
            <>
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
            </>
          ) : (
            <>
              <Archive className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No hay notas archivadas</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Las notas que archives aparecerán aquí.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {visibleSections.map(key => {
            const sectionItems = (sections as any)[key];
            if (!sectionItems?.length && viewMode === 'focus') return null;
            if (!sectionItems?.length) return null;

            return (
              <Section
                key={key}
                sectionKey={key}
                title={
                  key === 'recent' ? 'Recientes (Últimos 7 días)' :
                  key === 'older' ? 'Antiguas' :
                  'Archivadas'
                }
                items={sectionItems}
                isOpen={sectionStates[key]}
                onToggle={toggleSection}
                getPreviewText={getPreviewText}
                onSelect={setSelectedNoteId}
              />
            );
          })}
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

function Section({ 
  sectionKey, 
  items, 
  title, 
  isOpen, 
  onToggle, 
  getPreviewText,
  onSelect
}: { 
  sectionKey: string, 
  items: any[], 
  title: string, 
  isOpen: boolean, 
  onToggle: (key: string) => void,
  getPreviewText: (html: string) => string,
  onSelect: (id: string) => void
}) {
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
          sectionKey === 'recent' ? 'text-blue-600 dark:text-blue-400' : 
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
          {items.map(note => (
            <NoteCard 
              key={note.id} 
              note={note} 
              getPreviewText={getPreviewText}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NoteCard({ 
  note, 
  getPreviewText,
  onSelect
}: { 
  note: any, 
  getPreviewText: (html: string) => string,
  onSelect: (id: string) => void
}) {
  return (
    <div
      onClick={() => onSelect(note.id)}
      className="group relative flex h-48 cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-blue-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-700"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="line-clamp-1 font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {note.title}
        </h3>
        <button 
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          title="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-hidden">
         <p className="line-clamp-4 text-sm text-gray-500 dark:text-gray-400 break-words">
           {note.content ? getPreviewText(note.content) : <span className="italic text-gray-300">Sin contenido</span>}
         </p>
      </div>
      
      <div className="mt-2 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
        <span>Actualizado: {formatDate(note.updated)}</span>
      </div>
    </div>
  );
}
