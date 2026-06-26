import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
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
  Trash2,
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


  const topicsForSubject = useMemo(() => {
    if (!subjectId) return [];
    return topics.filter((topic) => topic.subjectId === subjectId);
  }, [topics, subjectId]);

  const subtopicsForTopic = useMemo(() => {
    if (!topicId) return [];
    return subtopics.filter((st) => st.topicId === topicId);
  }, [subtopics, topicId]);

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

      {isEditing && (
        <div className="fixed inset-0 bg-true-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[85vh] overflow-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingNoteId ? 'Editar anotação' : 'Nova anotação'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Título"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Título da anotação"
              />
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Matéria</label>
                <select
                  value={subjectId}
                  onChange={(event) => {
                    setSubjectId(event.target.value);
                    setTopicId('');
                  }}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-true-white"
                >
                  <option value="">Selecione</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tópico</label>
                <select
                  value={topicId}
                  onChange={(event) => {
                    setTopicId(event.target.value);
                    setSubtopicId('');
                  }}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-true-white"
                  disabled={!subjectId}
                >
                  <option value="">Selecione</option>
                  {topicsForSubject.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Subtópico (Opcional)</label>
                <select
                  value={subtopicId}
                  onChange={(event) => setSubtopicId(event.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-true-white"
                  disabled={!topicId}
                >
                  <option value="">Nenhum</option>
                  {subtopicsForTopic.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>
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

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={resetForm}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!title.trim() || !topicId}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function QuestionsPage() {
  const {
    loadAllData,
    questionHistory,
    subjects,
    topics,
    subtopics,
    addQuestionHistory,
    deleteQuestionHistory,
  } = useStore();
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [subtopicId, setSubtopicId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [manualSubjectId, setManualSubjectId] = useState('');
  const [manualTopicId, setManualTopicId] = useState('');
  const [manualSubtopicId, setManualSubtopicId] = useState('');
  const [manualCorrect, setManualCorrect] = useState('');
  const [manualWrong, setManualWrong] = useState('');
  const [manualBlank, setManualBlank] = useState('');
  const [manualNotes, setManualNotes] = useState('');

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const topicsById = useMemo(() => new Map(topics.map((t) => [t.id, t])), [topics]);
  const subjectsById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const subtopicsById = useMemo(() => new Map(subtopics.map((s) => [s.id, s])), [subtopics]);

  const topicsForFilter = useMemo(() => {
    if (!subjectId) return topics;
    return topics.filter((topic) => topic.subjectId === subjectId);
  }, [topics, subjectId]);

  const subtopicsForFilter = useMemo(() => {
    if (!topicId) return subtopics;
    return subtopics.filter((st) => st.topicId === topicId);
  }, [subtopics, topicId]);

  const manualTopicsForSubject = useMemo(() => {
    if (!manualSubjectId) return topics;
    return topics.filter((topic) => topic.subjectId === manualSubjectId);
  }, [topics, manualSubjectId]);

  const manualSubtopicsForTopic = useMemo(() => {
    if (!manualTopicId) return subtopics;
    return subtopics.filter((st) => st.topicId === manualTopicId);
  }, [subtopics, manualTopicId]);

  const filteredHistory = useMemo(() => {
    const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const toDate = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

    return questionHistory
      .filter((entry) => {
        const createdAt = new Date(entry.createdAt);
        if (fromDate && createdAt < fromDate) return false;
        if (toDate && createdAt > toDate) return false;

        if (subjectId) {
          const topic = topicsById.get(entry.topicId);
          if (!topic || topic.subjectId !== subjectId) return false;
        }

        if (topicId && entry.topicId !== topicId) return false;
        if (subtopicId && entry.subtopicId !== subtopicId) return false;

        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [questionHistory, dateFrom, dateTo, subjectId, topicId, subtopicId, topicsById]);

  const aggregated = useMemo(() => {
    const map = new Map<string, { topicId: string; subtopicId: string | undefined; correct: number; wrong: number; blank: number }>();

    filteredHistory.forEach((entry) => {
      const key = `${entry.topicId}-${entry.subtopicId || 'none'}`;
      const current = map.get(key) || {
        topicId: entry.topicId,
        subtopicId: entry.subtopicId,
        correct: 0,
        wrong: 0,
        blank: 0,
      };
      map.set(key, {
        topicId: entry.topicId,
        subtopicId: entry.subtopicId,
        correct: current.correct + entry.correctCount,
        wrong: current.wrong + entry.wrongCount,
        blank: current.blank + entry.blankCount,
      });
    });

    return Array.from(map.values()).map((item) => {
      const total = item.correct + item.wrong + item.blank;
      const rendimento = total === 0 ? 0 : Math.round((item.correct / total) * 100);
      const topic = topicsById.get(item.topicId);
      const subject = topic ? subjectsById.get(topic.subjectId) : null;
      const subtopic = item.subtopicId ? subtopicsById.get(item.subtopicId) : null;
      return {
        ...item,
        total,
        rendimento,
        topicName: topic?.name || 'Tópico não encontrado',
        subjectName: subject?.name || 'Matéria não encontrada',
        subtopicName: subtopic?.name,
      };
    });
  }, [filteredHistory, topicsById, subjectsById, subtopicsById]);

  const handleManualAdd = async () => {
    if (!manualTopicId) return;
    const correctCount = Number(manualCorrect) || 0;
    const wrongCount = Number(manualWrong) || 0;
    const blankCount = Number(manualBlank) || 0;
    const now = new Date().toISOString();

    await addQuestionHistory({
      id: generateId(),
      topicId: manualTopicId,
      subtopicId: manualSubtopicId || undefined,
      correctCount,
      wrongCount,
      blankCount,
      notes: manualNotes || undefined,
      createdAt: now,
      updatedAt: now,
    });

    setManualCorrect('');
    setManualWrong('');
    setManualBlank('');
    setManualNotes('');
    setManualTopicId('');
    setManualSubtopicId('');
  };

  const handleDeleteEntry = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      await deleteQuestionHistory(id);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Histórico de Questões</h1>
        <p className="text-gray-400">Acompanhe acertos, erros e rendimento por tópico</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
        <h2 className="text-lg font-bold mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Data inicial</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-true-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Data final</label>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-true-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Matéria</label>
            <select
              value={subjectId}
              onChange={(event) => {
                setSubjectId(event.target.value);
                setTopicId('');
              }}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-true-white"
            >
              <option value="">Todas</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tópico</label>
            <select
              value={topicId}
              onChange={(event) => {
                setTopicId(event.target.value);
                setSubtopicId('');
              }}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-true-white"
            >
              <option value="">Todos</option>
              {topicsForFilter.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Subtópico</label>
            <select
              value={subtopicId}
              onChange={(event) => setSubtopicId(event.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-true-white"
            >
              <option value="">Todos</option>
              {subtopicsForFilter.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
        <h2 className="text-lg font-bold mb-4">Adicionar registro manual</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Matéria</label>
            <select
              value={manualSubjectId}
              onChange={(event) => {
                setManualSubjectId(event.target.value);
                setManualTopicId('');
              }}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-true-white"
            >
              <option value="">Selecione</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tópico</label>
            <select
              value={manualTopicId}
              onChange={(event) => {
                setManualTopicId(event.target.value);
                setManualSubtopicId('');
              }}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-true-white"
              disabled={!manualSubjectId}
            >
              <option value="">Selecione</option>
              {manualTopicsForSubject.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Subtópico (Opcional)</label>
            <select
              value={manualSubtopicId}
              onChange={(event) => setManualSubtopicId(event.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-true-white"
              disabled={!manualTopicId}
            >
              <option value="">Nenhum</option>
              {manualSubtopicsForTopic.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Certas</label>
            <input
              type="number"
              min={0}
              value={manualCorrect}
              onChange={(event) => setManualCorrect(event.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-true-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Erradas</label>
            <input
              type="number"
              min={0}
              value={manualWrong}
              onChange={(event) => setManualWrong(event.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-true-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Em branco</label>
            <input
              type="number"
              min={0}
              value={manualBlank}
              onChange={(event) => setManualBlank(event.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-true-white"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Observações</label>
          <textarea
            value={manualNotes}
            onChange={(event) => setManualNotes(event.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-true-white min-h-[96px]"
          />
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={handleManualAdd} disabled={!manualTopicId}>
            Salvar registro
          </Button>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-lg font-bold mb-4">Resumo por tópico</h2>
        {aggregated.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum registro encontrado.</p>
        ) : (
          <div className="space-y-3">
            {aggregated.map((item) => (
              <div
                key={item.topicId}
                className="flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-gray-800 rounded-lg"
              >
                <div>
                  <p className="font-medium">{item.topicName} {item.subtopicName ? `· ${item.subtopicName}` : ''}</p>
                  <p className="text-sm text-gray-400">{item.subjectName}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Total: {item.total} · Certas: {item.correct} · Erradas: {item.wrong} · Brancas: {item.blank}
                  </p>
                </div>
                <div className="mt-3 md:mt-0 text-right">
                  <p className="text-2xl font-bold">{item.rendimento}%</p>
                  <p className="text-xs text-gray-400">Rendimento</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {filteredHistory.length > 0 && (
        <div className="mt-6 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-bold mb-4">Entradas recentes</h2>
          <div className="space-y-3">
            {filteredHistory.slice(0, 6).map((entry) => {
              const topic = topicsById.get(entry.topicId);
              const subject = topic ? subjectsById.get(topic.subjectId) : null;
              const subtopic = entry.subtopicId ? subtopicsById.get(entry.subtopicId) : null;
              const total = entry.correctCount + entry.wrongCount + entry.blankCount;
              const rendimento = total === 0 ? 0 : Math.round((entry.correctCount / total) * 100);
              return (
                <div
                  key={entry.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-gray-800 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{topic?.name || 'Tópico não encontrado'} {subtopic ? `· ${subtopic.name}` : ''}</p>
                    <p className="text-sm text-gray-400">{subject?.name || 'Matéria não encontrada'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(entry.createdAt)} · Certas {entry.correctCount} · Erradas {entry.wrongCount} · Brancas {entry.blankCount}
                    </p>
                    {entry.notes && (
                      <p className="text-xs text-gray-400 mt-2">{entry.notes}</p>
                    )}
                  </div>
                  <div className="mt-3 md:mt-0 flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold">{rendimento}%</p>
                      <p className="text-xs text-gray-400">Rendimento</p>
                    </div>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Excluir registro"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function ReviewsPage() {
  const { loadAllData } = useStore();

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-2">Revisões</h1>
      <p className="text-gray-400">Funcionalidade em desenvolvimento</p>
    </div>
  );
}

export function StudySessionPage() {
  const { loadAllData } = useStore();

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-2">Sessão de Estudo</h1>
      <p className="text-gray-400">Funcionalidade em desenvolvimento</p>
    </div>
  );
}
