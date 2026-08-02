// frontend/src/components/notes/NoteEditor.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Note } from "@/types/notes";
import { X, Save, Trash2 } from "lucide-react";

interface NoteEditorProps {
  note?: Note | null;
  onSave: (data: {
    title: string;
    content?: string;
    color?: string;
  }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  isLoading?: boolean;
}

/**
 * NoteEditor - Form for creating and editing notes
 *
 * Features:
 * - Title input
 * - Content textarea
 * - Color picker
 * - Save and delete actions
 */
export const NoteEditor = ({
  note,
  onSave,
  onDelete,
  isLoading = false,
}: NoteEditorProps) => {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("#ffffff");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Predefined colors for quick selection
  const colorOptions = [
    "#ffffff",
    "#f8f9fa",
    "#fff3cd",
    "#f8d7da",
    "#d1ecf1",
    "#d4edda",
    "#e2e3e5",
    "#cce5ff",
  ];

  // Load note data when editing
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content || "");
      setColor(note.color || "#ffffff");
    }
  }, [note]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        content: content.trim() || undefined,
        color: color !== "#ffffff" ? color : undefined,
      });
      router.push("/dashboard/notes");
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!note || !onDelete) return;
    if (!confirm("Are you sure you want to delete this note?")) return;

    setIsDeleting(true);
    try {
      await onDelete(note.id);
      router.push("/dashboard/notes");
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {note ? "Edit Note" : "Create New Note"}
        </h2>
        <div className="flex items-center gap-2">
          {note && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isLoading}
              className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 
                       rounded-lg transition-colors disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : <Trash2 className="h-5 w-5" />}
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push("/dashboard/notes")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Title Input */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Title *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter note title..."
          className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   transition-colors"
          required
          disabled={isSubmitting || isLoading}
        />
      </div>

      {/* Content Textarea */}
      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Content
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note content here..."
          rows={10}
          className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   transition-colors resize-y"
          disabled={isSubmitting || isLoading}
        />
      </div>

      {/* Color Picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Note Color
        </label>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`
                w-8 h-8 rounded-full border-2 transition-all
                ${color === c ? "border-blue-500 scale-110" : "border-gray-300 dark:border-gray-600"}
                hover:scale-110
              `}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded-full cursor-pointer border-2 border-gray-300 dark:border-gray-600"
            disabled={isSubmitting || isLoading}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/dashboard/notes")}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800
                   rounded-lg transition-colors"
          disabled={isSubmitting || isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim() || isSubmitting || isLoading}
          className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg
                   hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          {isSubmitting ? "Saving..." : note ? "Update Note" : "Create Note"}
        </button>
      </div>
    </form>
  );
};

export default NoteEditor;
