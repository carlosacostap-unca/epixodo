"use client";

import { useEffect, useState, useRef } from "react";
import { pb } from "@/lib/pocketbase";
import { Trash2, Loader2, X, Archive, ArchiveRestore, Clock, Calendar } from "lucide-react";
import { RichTextEditor } from "@/components/ui/editor/rich-text-editor";
import { Modal } from "@/components/ui/modal";
import { formatDate, formatDateTime } from "@/lib/date-utils";

interface NoteDetailModalProps {
  noteId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function NoteDetailModal({ noteId, onClose, onUpdate }: NoteDetailModalProps) {
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  
  // Debounce ref for content
  const contentTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNote = async () => {
    try {
      const record = await pb.collection("notes").getOne(noteId, {
        requestKey: null
      });
      setNote(record);
      setTitle(record.title);
      setContent(record.content || "");
    } catch (error: any) {
      if (error.status !== 0) {
        console.error("Error fetching note:", error);
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (noteId) {
      fetchNote();
    }
  }, [noteId]);

  const updateField = async (field: string, value: any) => {
    try {
      const updatedNote = await pb.collection("notes").update(noteId, {
        [field]: value
      }, {
        requestKey: null
      });
      setNote(updatedNote);
      onUpdate();
    } catch (error: any) {
      if (!error.isAbort) {
        console.error(`Error updating ${field}:`, error);
      }
    }
  };

  const handleTitleBlur = () => {
    if (title !== note?.title) {
      updateField("title", title);
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    
    // Debounce update
    if (contentTimeoutRef.current) {
      clearTimeout(contentTimeoutRef.current);
    }
    
    contentTimeoutRef.current = setTimeout(() => {
      if (newContent !== note?.content) {
        updateField("content", newContent);
      }
    }, 1000);
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta nota?")) return;
    
    try {
      await pb.collection("notes").delete(noteId);
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : note ? (
        <div className="flex flex-col h-[80vh] max-h-[800px] w-full max-w-4xl bg-white dark:bg-zinc-900 overflow-hidden rounded-xl">
          {/* Header */}
          <div className="flex items-start justify-between border-b p-6 dark:border-zinc-800">
            <div className="flex-1 mr-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="w-full bg-transparent text-2xl font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white"
                placeholder="Título de la nota"
              />
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Creado: {formatDate(note.created)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Actualizado: {formatDateTime(note.updated)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <RichTextEditor
                content={content}
                onChange={handleContentChange}
                placeholder="Escribe el contenido de tu nota..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-4 dark:bg-zinc-900/50 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
              {note.is_archived ? (
                <button
                  onClick={() => {
                    updateField("is_archived", false);
                    onClose();
                  }}
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800 transition-colors"
                >
                  <ArchiveRestore className="h-4 w-4" />
                  Desarchivar
                </button>
              ) : (
                <button
                  onClick={() => {
                    updateField("is_archived", true);
                    onClose();
                  }}
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Archive className="h-4 w-4" />
                  Archivar
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700 dark:hover:bg-zinc-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
