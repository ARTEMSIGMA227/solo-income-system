'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Note {
  id: string;
  content: string;
  created_at: string;
}

interface Props {
  goalId: string | null;
  userId: string;
  locale: string;
  open: boolean;
  onClose: () => void;
  // Also used for skill notes
  type?: 'goal' | 'skill';
  skillId?: string | null;
}

export default function NotesModal({ goalId, userId, locale, open, onClose, type = 'goal', skillId }: Props) {
  const ru = locale === 'ru';
  const supabase = createClient();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);

  const entityId = type === 'goal' ? goalId : skillId;
  const table = type === 'goal' ? 'goal_notes' : 'skill_notes';
  const fk = type === 'goal' ? 'goal_id' : 'skill_id';

  useEffect(() => {
    if (open && entityId) loadNotes();
  }, [open, entityId]);

  async function loadNotes() {
    const { data } = await supabase
      .from(table)
      .select('id, content, created_at')
      .eq(fk, entityId!)
      .order('created_at', { ascending: false });
    setNotes(data || []);
  }

  async function addNote() {
    if (!newNote.trim() || !entityId) return;
    setLoading(true);
    await supabase.from(table).insert({
      [fk]: entityId,
      user_id: userId,
      content: newNote.trim(),
    });
    setNewNote('');
    await loadNotes();
    setLoading(false);
    toast.success(ru ? 'Заметка добавлена' : 'Note added');
  }

  async function deleteNote(id: string) {
    await supabase.from(table).delete().eq('id', id);
    await loadNotes();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold">{ru ? 'Заметки' : 'Notes'}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notes.length === 0 && (
            <p className="text-center text-gray-500 py-8">{ru ? 'Нет заметок' : 'No notes yet'}</p>
          )}
          {notes.map(note => (
            <div key={note.id} className="bg-gray-800 rounded-lg p-3 group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">
                    {new Date(note.created_at).toLocaleString(ru ? 'ru-RU' : 'en-US', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                  <p className="text-sm text-gray-200 whitespace-pre-wrap">{note.content}</p>
                </div>
                <button onClick={() => deleteNote(note.id)}
                  className="p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add note */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex gap-2">
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder={ru ? 'Новая заметка...' : 'New note...'}
              rows={2}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none resize-none"
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) addNote(); }}
            />
            <button onClick={addNote} disabled={loading || !newNote.trim()}
              className="px-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50 shrink-0">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
