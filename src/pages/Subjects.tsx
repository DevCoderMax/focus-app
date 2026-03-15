import { useEffect, useMemo, useState, useRef } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Plus, BookOpen, Trash2, ChevronDown, ChevronRight, Check, Upload, FileJson, X } from 'lucide-react';
import { generateId } from '@/utils/helpers';
import type { Subject, Topic, Subtopic } from '@/types';
import { getAllFromProfile } from '@/data/storage';

export function SubjectsPage() {
  const {
    subjects,
    topics,
    subtopics,
    addSubject,
    deleteSubject,
    addTopic,
    deleteTopic,
    addSubtopic,
    deleteSubtopic,
    loadAllData,
    completedTopics,
    completedSubtopics,
    toggleTopicCompletion,
    toggleSubtopicCompletion,
    getSubjectProgress,
  } = useStore();
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [isAddingTopic, setIsAddingTopic] = useState<string | null>(null);
  const [isAddingSubtopic, setIsAddingSubtopic] = useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [newSubtopicName, setNewSubtopicName] = useState('');
  const [newSubtopicDesc, setNewSubtopicDesc] = useState('');
  const [topicSearch, setTopicSearch] = useState<Record<string, string>>({});
  const [collapsedTopics, setCollapsedTopics] = useState<Record<string, boolean>>({});
  const [collapsedSubjects, setCollapsedSubjects] = useState<Record<string, boolean>>(() => {
    try {
      const stored = window.localStorage.getItem('focus.subjects.collapsed');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [importProfiles, setImportProfiles] = useState<
    { id: string; name: string; subjects: Subject[]; topics: Topic[] }[]
  >([]);
  const [selectedImports, setSelectedImports] = useState<Record<string, boolean>>({});
  const [importSearch, setImportSearch] = useState('');
  const [packageJson, setPackageJson] = useState('');
  const [packageError, setPackageError] = useState('');
  const [packageSuccess, setPackageSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    const loadProfilesForImport = async () => {
      const profileList = useStore.getState().profiles;
      const activeProfileId = useStore.getState().activeProfileId;
      const otherProfiles = profileList.filter((p) => p.id !== activeProfileId);

      const profilesWithData = await Promise.all(
        otherProfiles.map(async (profile) => {
          const [subjects, topics] = await Promise.all([
            getAllFromProfile(profile.id, 'subjects'),
            getAllFromProfile(profile.id, 'topics'),
          ]);
          return { id: profile.id, name: profile.name, subjects, topics };
        })
      );

      setImportProfiles(profilesWithData);
    };

    loadProfilesForImport();
  }, []);

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

  const handleAddSubtopic = async (topicId: string) => {
    if (!newSubtopicName.trim()) return;

    const subtopic: Subtopic = {
      id: generateId(),
      topicId,
      name: newSubtopicName,
      description: newSubtopicDesc || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addSubtopic(subtopic);
    setNewSubtopicName('');
    setNewSubtopicDesc('');
    setIsAddingSubtopic(null);
  };

  const getTopicsForSubject = (subjectId: string) => {
    return topics.filter((t) => t.subjectId === subjectId);
  };

  const getSubtopicsForTopic = (topicId: string) => {
    return subtopics.filter((st) => st.topicId === topicId);
  };

  const getFilteredTopics = (subjectId: string) => {
    const search = (topicSearch[subjectId] || '').toLowerCase();
    if (!search) return getTopicsForSubject(subjectId);
    return getTopicsForSubject(subjectId).filter((topic) =>
      topic.name.toLowerCase().includes(search)
    );
  };

  const importCandidates = useMemo(() => {
    const search = importSearch.toLowerCase();
    return importProfiles.flatMap((profile) =>
      profile.subjects.map((subject) => ({
        profileId: profile.id,
        profileName: profile.name,
        subject,
        topics: profile.topics.filter((topic) => {
          if (topic.subjectId !== subject.id) return false;
          if (!search) return true;
          return (
            topic.name.toLowerCase().includes(search) ||
            subject.name.toLowerCase().includes(search)
          );
        }),
      }))
    );
  }, [importProfiles, importSearch]);

  const handleImportSelections = async () => {
    const selectedBySubject = new Map<
      string,
      { profileId: string; subject: Subject; topics: Topic[] }
    >();

    importCandidates.forEach((item) => {
      const selectedTopics = item.topics.filter((topic) =>
        selectedImports[`${item.profileId}:${item.subject.id}:${topic.id}`]
      );
      if (selectedTopics.length === 0) return;
      selectedBySubject.set(`${item.profileId}:${item.subject.id}`, {
        profileId: item.profileId,
        subject: item.subject,
        topics: selectedTopics,
      });
    });

    for (const entry of selectedBySubject.values()) {
      const subjectId = generateId();
      const newSubject: Subject = {
        id: subjectId,
        name: entry.subject.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await addSubject(newSubject);

      for (const topic of entry.topics) {
        const newTopic: Topic = {
          id: generateId(),
          subjectId,
          name: topic.name,
          description: topic.description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await addTopic(newTopic);
      }
    }

    setSelectedImports({});
    setShowImportModal(false);
  };

  const handleImportPackage = async () => {
    setPackageError('');
    setPackageSuccess('');

    if (!packageJson.trim()) {
      setPackageError('Por favor, insira um JSON válido ou selecione um arquivo.');
      return;
    }

    try {
      const data = JSON.parse(packageJson);

      if (!data.subjects || !Array.isArray(data.subjects)) {
        setPackageError('JSON inválido. O formato esperado é: { "subjects": [...] }');
        return;
      }

      let importedCount = 0;

      for (const subjectData of data.subjects) {
        if (!subjectData.name) continue;

        const subjectId = generateId();
        const newSubject: Subject = {
          id: subjectId,
          name: subjectData.name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await addSubject(newSubject);
        importedCount++;

        if (subjectData.topics && Array.isArray(subjectData.topics)) {
          for (const topicData of subjectData.topics) {
            if (!topicData.name) continue;

            const topicId = generateId();
            const newTopic: Topic = {
              id: topicId,
              subjectId,
              name: topicData.name,
              description: topicData.description || undefined,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await addTopic(newTopic);
            importedCount++;

            if (topicData.subtopics && Array.isArray(topicData.subtopics)) {
              for (const subtopicData of topicData.subtopics) {
                if (!subtopicData.name) continue;

                const newSubtopic: Subtopic = {
                  id: generateId(),
                  topicId,
                  name: subtopicData.name,
                  description: subtopicData.description || undefined,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                await addSubtopic(newSubtopic);
                importedCount++;
              }
            }
          }
        }
      }

      setPackageSuccess(`Importados ${importedCount} itens com sucesso!`);
      setPackageJson('');
      
      setTimeout(() => {
        setShowPackageModal(false);
        setPackageSuccess('');
      }, 2000);
    } catch (error) {
      setPackageError('Erro ao processar JSON. Verifique o formato e tente novamente.');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setPackageJson(content);
      setPackageError('');
      setPackageSuccess('');
    };
    reader.onerror = () => {
      setPackageError('Erro ao ler o arquivo.');
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Matérias & Tópicos</h1>
          <p className="text-gray-400">Organize seus estudos por assunto</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setShowPackageModal(true)}>
            <Upload size={20} className="mr-2" />
            Importar Pacote
          </Button>
          <Button variant="secondary" onClick={() => setShowImportModal(true)}>
            Importar de perfil
          </Button>
          <Button onClick={() => setIsAddingSubject(true)}>
            <Plus size={20} className="mr-2" />
            Nova Matéria
          </Button>
        </div>
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
                    <div className="flex items-center gap-3 flex-1">
                      <BookOpen size={24} />
                      <button
                        type="button"
                        aria-label={
                          collapsedSubjects[subject.id]
                            ? 'Expandir tópicos'
                            : 'Recolher tópicos'
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
                      <div className="flex-1">
                        <h2 className="text-xl font-bold">{subject.name}</h2>
                        <p className="text-sm text-gray-400">
                          {subjectTopics.length} tópico(s)
                        </p>
                        {/* Subject Progress Bar */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-400">Progresso</span>
                            <span className="font-semibold text-true-white">
                              {getSubjectProgress(subject.id).percentage}%
                            </span>
                          </div>
                          <div className="relative h-2 rounded-sm bg-[#0d0d0d] border border-gray-800 overflow-hidden">
                            <div
                              className="h-full rounded-sm bg-[linear-gradient(180deg,#ffffff_0%,#d0d0d0_20%,#909090_50%,#505050_75%,#181818_100%)] transition-all duration-300"
                              style={{ width: `${getSubjectProgress(subject.id).percentage}%` }}
                            />
                          </div>
                          <div className="mt-1 text-[11px] text-gray-400">
                            {getSubjectProgress(subject.id).completed}/{getSubjectProgress(subject.id).total} concluídos
                          </div>
                        </div>
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
                      Tópico
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (confirm('Deletar esta matéria e todos os seus tópicos?')) {
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
                    <h4 className="font-bold mb-4">Novo Tópico</h4>
                    <div className="space-y-3">
                      <Input
                        label="Nome do tópico"
                        value={newTopicName}
                        onChange={(e) => setNewTopicName(e.target.value)}
                        placeholder="Ex: Equações do 2º grau"
                        autoFocus
                      />
                      <Input
                        label="Descrição (opcional)"
                        value={newTopicDesc}
                        onChange={(e) => setNewTopicDesc(e.target.value)}
                        placeholder="Breve descrição do tópico"
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
                    <div className="mb-4">
                      <Input
                        label="Buscar tópico"
                        value={topicSearch[subject.id] || ''}
                        onChange={(event) =>
                          setTopicSearch((prev) => ({
                            ...prev,
                            [subject.id]: event.target.value,
                          }))
                        }
                        placeholder="Digite para filtrar tópicos"
                      />
                    </div>
                    <div className="space-y-4">
                      {getFilteredTopics(subject.id).map((topic) => {
                        const topicSubtopics = getSubtopicsForTopic(topic.id);
                        const isTopicCompleted = completedTopics.includes(topic.id);
                        return (
                          <div
                            key={topic.id}
                            className="bg-gray-800 rounded-lg overflow-hidden border border-gray-750"
                          >
                            <div
                              className="flex items-center justify-between p-4 hover:bg-gray-750 transition-colors cursor-pointer"
                              onClick={() => setCollapsedTopics(prev => ({ ...prev, [topic.id]: !prev[topic.id] }))}
                            >
                              <div className="flex items-center gap-3">
                                {/* Topic Checkbox */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTopicCompletion(topic.id);
                                  }}
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                    isTopicCompleted
                                      ? 'bg-green-500 border-green-500 text-white'
                                      : 'border-gray-500 hover:border-gray-400'
                                  }`}
                                >
                                  {isTopicCompleted && <Check size={14} />}
                                </button>
                                <button
                                  type="button"
                                  className="p-1 rounded-md text-gray-500 hover:text-true-white hover:bg-gray-700 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCollapsedTopics(prev => ({ ...prev, [topic.id]: !prev[topic.id] }));
                                  }}
                                >
                                  {collapsedTopics[topic.id] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                </button>
                                <div>
                                  <p className={`font-medium ${isTopicCompleted ? 'line-through text-gray-500' : ''}`}>
                                    {topic.name}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {topicSubtopics.length} subtópico(s) {topic.description ? `· ${topic.description}` : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsAddingSubtopic(topic.id);
                                    if (collapsedTopics[topic.id]) {
                                      setCollapsedTopics(prev => ({ ...prev, [topic.id]: false }));
                                    }
                                  }}
                                >
                                  <Plus size={14} className="mr-1" />
                                  Subtópico
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Deletar este tópico e todos os seus subtópicos?')) {
                                      deleteTopic(topic.id);
                                    }
                                  }}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </div>

                            {/* Add Subtopic Form */}
                            {isAddingSubtopic === topic.id && (
                              <div className="p-4 bg-gray-750 border-t border-gray-700">
                                <h5 className="font-semibold mb-3 text-sm">Novo Subtópico</h5>
                                <div className="space-y-3">
                                  <Input
                                    label="Nome do subtópico"
                                    value={newSubtopicName}
                                    onChange={(e) => setNewSubtopicName(e.target.value)}
                                    placeholder="Ex: Teoria de algo"
                                    autoFocus
                                  />
                                  <Input
                                    label="Descrição (opcional)"
                                    value={newSubtopicDesc}
                                    onChange={(e) => setNewSubtopicDesc(e.target.value)}
                                    placeholder="Breve descrição"
                                  />
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleAddSubtopic(topic.id)}>
                                      Criar
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setIsAddingSubtopic(null);
                                        setNewSubtopicName('');
                                        setNewSubtopicDesc('');
                                      }}
                                    >
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Subtopics List */}
                            {!collapsedTopics[topic.id] && topicSubtopics.length > 0 && (
                              <div className="p-4 border-t border-gray-750 bg-gray-900/50 space-y-2">
                                {topicSubtopics.map((subtopic) => {
                                  const isSubtopicCompleted = completedSubtopics.includes(subtopic.id);
                                  return (
                                    <div
                                      key={subtopic.id}
                                      className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-750"
                                    >
                                      <div className="flex items-center gap-3">
                                        {/* Subtopic Checkbox */}
                                        <button
                                          type="button"
                                          onClick={() => toggleSubtopicCompletion(subtopic.id)}
                                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                            isSubtopicCompleted
                                              ? 'bg-green-500 border-green-500 text-white'
                                              : 'border-gray-500 hover:border-gray-400'
                                          }`}
                                        >
                                          {isSubtopicCompleted && <Check size={12} />}
                                        </button>
                                        <div>
                                          <p className={`font-medium text-sm ${isSubtopicCompleted ? 'line-through text-gray-500' : ''}`}>
                                            {subtopic.name}
                                          </p>
                                          {subtopic.description && (
                                            <p className="text-xs text-gray-500 mt-1">
                                              {subtopic.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          if (confirm('Deletar este subtópico?')) {
                                            deleteSubtopic(subtopic.id);
                                          }
                                        }}
                                      >
                                        <Trash2 size={14} />
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-true-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-3xl max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Importar matérias e tópicos</h2>
              <Button variant="ghost" onClick={() => setShowImportModal(false)}>
                Fechar
              </Button>
            </div>
            <div className="mb-4">
              <Input
                label="Buscar matéria ou tópico"
                value={importSearch}
                onChange={(event) => setImportSearch(event.target.value)}
                placeholder="Digite para filtrar"
              />
            </div>
            {importCandidates.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum outro perfil disponível para importar.</p>
            ) : (
              <div className="space-y-4">
                {importCandidates.map((item) => {
                  return (
                    <div
                      key={`${item.profileId}:${item.subject.id}`}
                      className="border border-gray-800 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="pt-1 text-xs text-gray-500">Tópicos</div>
                        <div>
                          <p className="font-semibold">
                            {item.subject.name}
                            <span className="text-xs text-gray-500 ml-2">({item.profileName})</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Selecione os tópicos para importar
                          </p>
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                            {item.topics.map((topic) => {
                              const key = `${item.profileId}:${item.subject.id}:${topic.id}`;
                              return (
                                <label key={key} className="flex items-center gap-2 text-sm text-gray-300">
                                  <input
                                    type="checkbox"
                                    checked={!!selectedImports[key]}
                                    onChange={(event) =>
                                      setSelectedImports((prev) => ({
                                        ...prev,
                                        [key]: event.target.checked,
                                      }))
                                    }
                                  />
                                  {topic.name}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setShowImportModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleImportSelections}
                disabled={Object.values(selectedImports).every((v) => !v)}
              >
                Importar selecionados
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import Package Modal */}
      {showPackageModal && (
        <div className="fixed inset-0 bg-true-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileJson size={24} />
                Importar Pacote
              </h2>
              <Button variant="ghost" size="sm" onClick={() => {
                setShowPackageModal(false);
                setPackageJson('');
                setPackageError('');
                setPackageSuccess('');
              }}>
                <X size={20} />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload de arquivo JSON
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload size={16} className="mr-2" />
                  Selecionar arquivo .json
                </Button>
              </div>

              <div className="text-center text-gray-500 text-sm">ou</div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cole o JSON abaixo
                </label>
                <textarea
                  value={packageJson}
                  onChange={(e) => {
                    setPackageJson(e.target.value);
                    setPackageError('');
                    setPackageSuccess('');
                  }}
                  placeholder={`{
  "subjects": [
    {
      "name": "Matemática",
      "topics": [
        {
          "name": "Álgebra",
          "description": "Estudo de equações",
          "subtopics": [
            { "name": "Equações do 2º grau" }
          ]
        }
      ]
    }
  ]
}`}
                  className="w-full h-48 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-true-white font-mono text-sm resize-none"
                />
              </div>

              {packageError && (
                <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
                  {packageError}
                </div>
              )}

              {packageSuccess && (
                <div className="p-3 bg-green-900/30 border border-green-800 rounded-lg text-green-400 text-sm">
                  {packageSuccess}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button onClick={handleImportPackage} className="flex-1">
                  <Upload size={16} className="mr-2" />
                  Importar
                </Button>
                <Button variant="ghost" onClick={() => {
                  setShowPackageModal(false);
                  setPackageJson('');
                  setPackageError('');
                  setPackageSuccess('');
                }}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
