"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Unlink } from 'lucide-react';
import { useCallback } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
}

export function RichTextEditor({ content, onChange, onBlur, placeholder = 'Escribe aquí...' }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'min-h-[150px] w-full rounded-md border-0 bg-gray-50 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700 dark:focus:ring-blue-500 prose prose-sm dark:prose-invert max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-blue-600 [&_a]:underline [&_a]:cursor-pointer dark:[&_a]:text-blue-400',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onBlur: () => {
      onBlur?.();
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL del enlace:', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // add protocol if missing
    let finalUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      finalUrl = `https://${url}`;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1 rounded-md border border-gray-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`rounded p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 ${editor.isActive('bold') ? 'bg-gray-100 text-blue-600 dark:bg-zinc-800 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
          title="Negrita"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`rounded p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 ${editor.isActive('italic') ? 'bg-gray-100 text-blue-600 dark:bg-zinc-800 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
          title="Cursiva"
        >
          <Italic className="h-4 w-4" />
        </button>
        <div className="mx-1 h-4 w-px bg-gray-200 dark:bg-zinc-700" />
        <button
          type="button"
          onClick={setLink}
          className={`rounded p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 ${editor.isActive('link') ? 'bg-gray-100 text-blue-600 dark:bg-zinc-800 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
          title="Insertar enlace"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive('link')}
          className={`rounded p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 ${!editor.isActive('link') ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}
          title="Quitar enlace"
        >
          <Unlink className="h-4 w-4" />
        </button>
        <div className="mx-1 h-4 w-px bg-gray-200 dark:bg-zinc-700" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 ${editor.isActive('bulletList') ? 'bg-gray-100 text-blue-600 dark:bg-zinc-800 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
          title="Lista con viñetas"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rounded p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 ${editor.isActive('orderedList') ? 'bg-gray-100 text-blue-600 dark:bg-zinc-800 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
          title="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}