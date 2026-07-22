import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { TopicSelector } from '@/components/TopicSelector';
import { Modal } from '@/components/Modal';
import { formatDate } from '@/utils/helpers';
import { generateId } from '@/utils/helpers';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react';

export function NotesPage() {
  const {
    loadAllData,
    notes,
    subjects,
    topics,
    subtopics,
    addNote,
    updateNote,
    deleteNote,
  } = useStore();
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [subtopicId, setSubtopicId] = useState('');
  const [title, setTitle] = useState('');
  const editorWrapperRef = useRef<HTMLDivElement | null>(null);
  const [highlightMenu, setHighlightMenu] = useState({
    visible: false,
    top: 0,
    left: 0,
  });

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const highlightOptions = [
    { label: 'Vermelho', color: '#F87171' },
    { label: 'Verde', color: '#4ADE80' },
    { label: 'Azul', color: '#60A5FA' },
    { label: 'Amarelo', color: '#FACC15' },
    { label: 'Roxo', color: '#C084FC' },
  ];

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: '<p></p>',
  });

  const applyHighlight = (color: string) => {
    if (!editor) return;
    const { to } = editor.state.selection;
    editor
      .chain()
      .focus()
      .setHighlight({ color })
      .setTextSelection(to)
      .unsetHighlight()
      .run();
  };

  useEffect(() => {
    if (!editor) return;

    const updateHighlightMenu = () => {
      if (!editor.view.hasFocus() || editor.state.selection.empty) {
        setHighlightMenu((prev) => ({ ...prev, visible: false }));
        return;
      }

      const { from, to } = editor.state.selection;
      const start = editor.view.coordsAtPos(from);
      const end = editor.view.coordsAtPos(to);
      const wrapperRect = editorWrapperRef.current?.getBoundingClientRect();

      if (!wrapperRect) return;

      const top = Math.min(start.top, end.top) - wrapperRect.top - 48;
      const left = (start.left + end.right) / 2 - wrapperRect.left;

      setHighlightMenu({ visible: true, top, left });
    };

    const hideMenu = () => setHighlightMenu((prev) => ({ ...prev, visible: false }));

    editor.on('selectionUpdate', updateHighlightMenu);
    editor.on('transaction', updateHighlightMenu);
    editor.on('blur', hideMenu);
    window.addEventListener('resize', updateHighlightMenu);

    return () => {
      editor.off('selectionUpdate', updateHighlightMenu);
      editor.off('transaction', updateHighlightMenu);
      editor.off('blur', hideMenu);
      window.removeEventListener('resize', updateHighlightMenu);
    };
  }, [editor]);



  const filteredNotes = useMemo(() => {
    const term = search.toLowerCase();
    return notes
      .filter((note) => note.title.toLowerCase().includes(term))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [notes, search]);

  const resetForm = () => {
    setIsEditing(false);
    setEditingNoteId(null);
    setSubjectId('');
    setTopicId('');
    setSubtopicId('');
    setTitle('');
    editor?.commands.setContent('<p></p>');
  };

  const handleSave = async () => {
    if (!title.trim() || !topicId || !editor) return;
    const content = editor.getHTML();
    const now = new Date().toISOString();

    if (editingNoteId) {
      await updateNote({
        id: editingNoteId,
        topicId,
        subtopicId: subtopicId || undefined,
        title: title.trim(),
        content,
        createdAt: notes.find((n) => n.id === editingNoteId)?.createdAt || now,
        updatedAt: now,
      });
    } else {
      await addNote({
        id: generateId(),
        topicId,
        subtopicId: subtopicId || undefined,
        title: title.trim(),
        content,
        createdAt: now,
        updatedAt: now,
      });
    }

    resetForm();
  };

  const handleEdit = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    const topic = topics.find((t) => t.id === note.topicId);
    setIsEditing(true);
    setEditingNoteId(note.id);
    setSubjectId(topic?.subjectId || '');
    setTopicId(note.topicId);
    setSubtopicId(note.subtopicId || '');
    setTitle(note.title);
    editor?.commands.setContent(note.content || '<p></p>');
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Anotações</h1>
          <p className="text-gray-400">Crie e organize suas notas por tópico</p>
        </div>
        <Button onClick={() => setIsEditing(true)}>Nova anotação</Button>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
        <Input
          label="Buscar por título"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Digite para filtrar"
        />
      </div>

      {filteredNotes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Nenhuma anotação criada.</div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map((note) => {
            const topic = topics.find((t) => t.id === note.topicId);
            const subject = subjects.find((s) => s.id === topic?.subjectId);
            const subtopic = note.subtopicId ? subtopics.find((st) => st.id === note.subtopicId) : null;
            return (
              <div
                key={note.id}
                className="bg-gray-900 rounded-lg border border-gray-800 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <h3 className="text-lg font-bold">{note.title}</h3>
                  <p className="text-sm text-gray-400">
                    {subject?.name || 'Matéria'} · {topic?.name || 'Tópico'} {subtopic ? `· ${subtopic.name}` : ''}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Atualizado em {formatDate(note.updatedAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(note.id)}>
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Excluir esta anotação?')) {
                        deleteNote(note.id);
                      }
                    }}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={isEditing}
        onClose={resetForm}
        title={editingNoteId ? 'Editar anotação' : 'Nova anotação'}
        size="4xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={resetForm}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!title.trim() || !topicId}>
              Salvar
            </Button>
          </div>
        }
      >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Título"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Título da anotação"
              />
              <TopicSelector
                mode="form"
                layout="stack"
                subjectId={subjectId}
                topicId={topicId}
                subtopicId={subtopicId}
                onChange={({ subjectId, topicId, subtopicId }) => {
                  setSubjectId(subjectId);
                  setTopicId(topicId);
                  setSubtopicId(subtopicId);
                }}
              />
            </div>

            <div className="mt-6">
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  aria-label="Negrito"
                  className={`p-2 rounded-md border transition-colors ${editor?.isActive('bold')
                    ? 'border-true-white text-true-white'
                    : 'border-gray-800 text-gray-400 hover:text-true-white hover:border-gray-600'
                    }`}
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                >
                  <Bold size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Itálico"
                  className={`p-2 rounded-md border transition-colors ${editor?.isActive('italic')
                    ? 'border-true-white text-true-white'
                    : 'border-gray-800 text-gray-400 hover:text-true-white hover:border-gray-600'
                    }`}
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                >
                  <Italic size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Sublinhado"
                  className={`p-2 rounded-md border transition-colors ${editor?.isActive('underline')
                    ? 'border-true-white text-true-white'
                    : 'border-gray-800 text-gray-400 hover:text-true-white hover:border-gray-600'
                    }`}
                  onClick={() => editor?.chain().focus().toggleUnderline().run()}
                >
                  <UnderlineIcon size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Lista"
                  className={`p-2 rounded-md border transition-colors ${editor?.isActive('bulletList')
                    ? 'border-true-white text-true-white'
                    : 'border-gray-800 text-gray-400 hover:text-true-white hover:border-gray-600'
                    }`}
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                >
                  <List size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Lista numerada"
                  className={`p-2 rounded-md border transition-colors ${editor?.isActive('orderedList')
                    ? 'border-true-white text-true-white'
                    : 'border-gray-800 text-gray-400 hover:text-true-white hover:border-gray-600'
                    }`}
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                >
                  <ListOrdered size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Alinhar à esquerda"
                  className={`p-2 rounded-md border transition-colors ${editor?.isActive({ textAlign: 'left' })
                    ? 'border-true-white text-true-white'
                    : 'border-gray-800 text-gray-400 hover:text-true-white hover:border-gray-600'
                    }`}
                  onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                >
                  <AlignLeft size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Centralizar"
                  className={`p-2 rounded-md border transition-colors ${editor?.isActive({ textAlign: 'center' })
                    ? 'border-true-white text-true-white'
                    : 'border-gray-800 text-gray-400 hover:text-true-white hover:border-gray-600'
                    }`}
                  onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                >
                  <AlignCenter size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Alinhar à direita"
                  className={`p-2 rounded-md border transition-colors ${editor?.isActive({ textAlign: 'right' })
                    ? 'border-true-white text-true-white'
                    : 'border-gray-800 text-gray-400 hover:text-true-white hover:border-gray-600'
                    }`}
                  onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                >
                  <AlignRight size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Justificar"
                  className={`p-2 rounded-md border transition-colors ${editor?.isActive({ textAlign: 'justify' })
                    ? 'border-true-white text-true-white'
                    : 'border-gray-800 text-gray-400 hover:text-true-white hover:border-gray-600'
                    }`}
                  onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
                >
                  <AlignJustify size={16} />
                </button>
              </div>
              <div
                ref={editorWrapperRef}
                className="relative w-full text-left border border-gray-800 rounded-lg bg-gray-950 p-4 min-h-[240px]"
                onClick={() => editor?.chain().focus().run()}
              >
                {editor && highlightMenu.visible && (
                  <div
                    className="absolute z-10 flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-950/95 px-2 py-2 shadow-xl -translate-x-1/2"
                    style={{ top: highlightMenu.top, left: highlightMenu.left }}
                    onMouseDown={(event) => event.preventDefault()}
                  >
                    {highlightOptions.map((option) => (
                      <button
                        key={option.color}
                        type="button"
                        aria-label={`Marca-texto ${option.label}`}
                        className={`p-1.5 rounded-md border transition-colors ${editor?.isActive('highlight', { color: option.color })
                          ? 'border-true-white text-true-white'
                          : 'border-gray-800 text-gray-400 hover:text-true-white hover:border-gray-600'
                          }`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => applyHighlight(option.color)}
                      >
                        <span
                          className="inline-block w-4 h-4 rounded-sm"
                          style={{ backgroundColor: option.color }}
                        />
                      </button>
                    ))}
                  </div>
                )}
                <EditorContent
                  editor={editor}
                  className="prose prose-invert max-w-none focus:outline-none min-h-[220px] [&_.ProseMirror]:outline-none [&_.ProseMirror-focused]:outline-none [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6"
                />
              </div>
            </div>
      </Modal>
    </div>
  );
}
