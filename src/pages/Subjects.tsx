import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Plus, BookOpen, Trash2, Edit2, ChevronDown, ChevronRight } from 'lucide-react';
import { generateId } from '@/utils/helpers';
import type { Subject, Topic } from '@/types';

export function SubjectsPage() {
  const { subjects, topics, addSubject, updateSubject, deleteSubject, addTopic, deleteTopic, loadAllData } = useStore();
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [isAddingTopic, setIsAddingTopic] = useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [collapsedSubjects, setCollapsedSubjects] = useState<Record<string, boolean>>(() => {
    try {
      const stored = window.localStorage.getItem('focus.subjects.collapsed');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    const stored = window.localStorage.getItem('focus.subjects.collapsed');
    if (stored) {
      try {
        setCollapsedSubjects(JSON.parse(stored));
      } catch {
        setCollapsedSubjects({});
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('focus.subjects.collapsed', JSON.stringify(collapsedSubjects));
  }, [collapsedSubjects]);

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;

    const subject: Subject = {
      id: generateId(),
      name: newSubjectName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addSubject(subject);
    setNewSubjectName('');
    setIsAddingSubject(false);
  };

  const handleAddTopic = async (subjectId: string) => {
    if (!newTopicName.trim()) return;

    const topic: Topic = {
      id: generateId(),
      subjectId,
      name: newTopicName,
      description: newTopicDesc || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addTopic(topic);
    setNewTopicName('');
    setNewTopicDesc('');
    setIsAddingTopic(null);
  };

  const getTopicsForSubject = (subjectId: string) => {
    return topics.filter((t) => t.subjectId === subjectId);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Matérias & Temas</h1>
          <p className="text-gray-400">Organize seus estudos por assunto</p>
        </div>
        <Button onClick={() => setIsAddingSubject(true)}>
          <Plus size={20} className="mr-2" />
          Nova Matéria
        </Button>
      </div>

      {/* Add Subject Form */}
      {isAddingSubject && (
        <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
          <h3 className="text-lg font-bold mb-4">Nova Matéria</h3>
          <div className="space-y-4">
            <Input
              label="Nome da matéria"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              placeholder="Ex: Matemática, História..."
              autoFocus
            />
            <div className="flex gap-3">
              <Button onClick={handleAddSubject}>Criar</Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsAddingSubject(false);
                  setNewSubjectName('');
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Subjects List */}
      {subjects.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={48} className="mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 text-lg mb-4">Nenhuma matéria cadastrada</p>
          <Button onClick={() => setIsAddingSubject(true)}>
            Criar primeira matéria
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {subjects.map((subject) => {
            const subjectTopics = getTopicsForSubject(subject.id);
            
            return (
              <div
                key={subject.id}
                className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden"
              >
                {/* Subject Header */}
                <button
                  type="button"
                  className="w-full p-6 flex items-center justify-between border-b border-gray-800 text-left hover:bg-gray-850 transition-colors"
                  onClick={() =>
                    setCollapsedSubjects((prev) => ({
                      ...prev,
                      [subject.id]: !prev[subject.id],
                    }))
                  }
                >
                  <div className="flex items-center gap-3">
                    <BookOpen size={24} />
                    <button
                      type="button"
                      aria-label={
                        collapsedSubjects[subject.id]
                          ? 'Expandir temas'
                          : 'Recolher temas'
                      }
                      className="p-1 rounded-md text-gray-500 hover:text-true-white hover:bg-gray-800 transition-colors"
                      onClick={(event) => {
                        event.stopPropagation();
                        setCollapsedSubjects((prev) => ({
                          ...prev,
                          [subject.id]: !prev[subject.id],
                        }));
                      }}
                    >
                      {collapsedSubjects[subject.id] ? (
                        <ChevronRight size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </button>
                    <div>
                      <h2 className="text-xl font-bold">{subject.name}</h2>
                      <p className="text-sm text-gray-400">
                        {subjectTopics.length} tema(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        setIsAddingTopic(subject.id);
                      }}
                    >
                      <Plus size={16} className="mr-1" />
                      Tema
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (confirm('Deletar esta matéria e todos os seus temas?')) {
                          deleteSubject(subject.id);
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </button>

                {/* Add Topic Form */}
                {isAddingTopic === subject.id && (
                  <div className="p-6 bg-gray-800 border-b border-gray-700">
                    <h4 className="font-bold mb-4">Novo Tema</h4>
                    <div className="space-y-3">
                      <Input
                        label="Nome do tema"
                        value={newTopicName}
                        onChange={(e) => setNewTopicName(e.target.value)}
                        placeholder="Ex: Equações do 2º grau"
                        autoFocus
                      />
                      <Input
                        label="Descrição (opcional)"
                        value={newTopicDesc}
                        onChange={(e) => setNewTopicDesc(e.target.value)}
                        placeholder="Breve descrição do tema"
                      />
                      <div className="flex gap-3">
                        <Button size="sm" onClick={() => handleAddTopic(subject.id)}>
                          Criar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsAddingTopic(null);
                            setNewTopicName('');
                            setNewTopicDesc('');
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Topics List */}
                {subjectTopics.length > 0 && !collapsedSubjects[subject.id] && (
                  <div className="p-6">
                    <div className="space-y-2">
                      {subjectTopics.map((topic) => (
                        <div
                          key={topic.id}
                          className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                        >
                          <div>
                            <p className="font-medium">{topic.name}</p>
                            {topic.description && (
                              <p className="text-sm text-gray-400 mt-1">
                                {topic.description}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('Deletar este tema?')) {
                                deleteTopic(topic.id);
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
