import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { formatDate, generateId } from '@/utils/helpers';
import type { ActivityPlanItem, ActivityPlanMaterialType } from '@/types';

const MATERIAL_OPTIONS: { value: ActivityPlanMaterialType; label: string }[] = [
  { value: 'lesson', label: 'Aula' },
  { value: 'questions', label: 'Questões' },
  { value: 'lesson_questions', label: 'Aula + Questões' },
  { value: 'pdf', label: 'PDF' },
];

export function AulasPage() {
  const {
    subjects,
    topics,
    activityPlanItems,
    loadAllData,
    addActivityPlanItem,
    deleteActivityPlanItem,
    incrementActivityPlanProgress,
    decrementActivityPlanProgress,
    markActivityPlanCompleted,
  } = useStore();

  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [title, setTitle] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [materialType, setMaterialType] = useState<ActivityPlanMaterialType>('lesson');
  const [targetCount, setTargetCount] = useState('1');

  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [filterTopicId, setFilterTopicId] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const topicsForSubject = useMemo(() => {
    if (!subjectId) return [];
    return topics.filter((topic) => topic.subjectId === subjectId);
  }, [topics, subjectId]);

  const topicsForFilterSubject = useMemo(() => {
    if (!filterSubjectId) return topics;
    return topics.filter((topic) => topic.subjectId === filterSubjectId);
  }, [topics, filterSubjectId]);

  const topicsById = useMemo(() => new Map(topics.map((topic) => [topic.id, topic])), [topics]);
  const subjectsById = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject])),
    [subjects]
  );

  const filteredItems = useMemo(() => {
    const term = search.toLowerCase().trim();

    return activityPlanItems
      .filter((item) => {
        const topic = topicsById.get(item.topicId);
        const itemSubjectId = topic?.subjectId;

        if (filterSubjectId && itemSubjectId !== filterSubjectId) return false;
        if (filterTopicId && item.topicId !== filterTopicId) return false;
        if (filterStatus !== 'all' && item.status !== filterStatus) return false;

        if (!term) return true;
        const searchText = [
          item.title,
          item.teacherName || '',
          topic?.name || '',
          itemSubjectId ? subjectsById.get(itemSubjectId)?.name || '' : '',
        ]
          .join(' ')
          .toLowerCase();

        return searchText.includes(term);
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [
    activityPlanItems,
    filterStatus,
    filterSubjectId,
    filterTopicId,
    search,
    subjectsById,
    topicsById,
  ]);

  const resetForm = () => {
    setSubjectId('');
    setTopicId('');
    setTitle('');
    setTeacherName('');
    setMaterialType('lesson');
    setTargetCount('1');
  };

  const handleAddItem = async () => {
    if (!topicId || !title.trim()) return;
    const now = new Date().toISOString();
    const parsedTarget = Math.max(1, Number(targetCount) || 1);

    const item: ActivityPlanItem = {
      id: generateId(),
      topicId,
      title: title.trim(),
      teacherName: teacherName.trim() || undefined,
      materialType,
      targetCount: parsedTarget,
      completedCount: 0,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    await addActivityPlanItem(item);
    resetForm();
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Aulas & Conteúdos</h1>
        <p className="text-gray-400">
          Cadastre aulas, PDFs e blocos de questões com quantidade-alvo e avance no progresso.
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
        <h2 className="text-lg font-bold mb-4">Novo conteúdo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Tema</label>
            <select
              value={topicId}
              onChange={(event) => setTopicId(event.target.value)}
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

          <Input
            label="Título"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ex: Aula 01 - Funções"
          />

          <Input
            label="Professor (opcional)"
            value={teacherName}
            onChange={(event) => setTeacherName(event.target.value)}
            placeholder="Ex: Prof. João"
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de material</label>
            <select
              value={materialType}
              onChange={(event) => setMaterialType(event.target.value as ActivityPlanMaterialType)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-true-white"
            >
              {MATERIAL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            type="number"
            min={1}
            label="Quantidade-alvo"
            value={targetCount}
            onChange={(event) => setTargetCount(event.target.value)}
            placeholder="1"
          />
        </div>

        <div className="flex justify-end mt-4">
          <Button onClick={handleAddItem} disabled={!topicId || !title.trim()}>
            Adicionar conteúdo
          </Button>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
        <h2 className="text-lg font-bold mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Matéria</label>
            <select
              value={filterSubjectId}
              onChange={(event) => {
                setFilterSubjectId(event.target.value);
                setFilterTopicId('');
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Tema</label>
            <select
              value={filterTopicId}
              onChange={(event) => setFilterTopicId(event.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-true-white"
            >
              <option value="">Todos</option>
              {topicsForFilterSubject.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(event) =>
                setFilterStatus(event.target.value as 'all' | 'pending' | 'completed')
              }
              className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-true-white"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendentes</option>
              <option value="completed">Concluídos</option>
            </select>
          </div>

          <Input
            label="Buscar"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Título, professor, matéria..."
          />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-lg font-bold mb-4">Conteúdos cadastrados</h2>

        {filteredItems.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum conteúdo encontrado com os filtros atuais.</p>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const topic = topicsById.get(item.topicId);
              const subject = topic ? subjectsById.get(topic.subjectId) : null;
              const done = Math.min(item.completedCount, item.targetCount);
              const progress = item.targetCount <= 0 ? 0 : Math.round((done / item.targetCount) * 100);

              return (
                <div
                  key={item.id}
                  className="p-4 bg-gray-800 rounded-lg border border-gray-700 flex flex-col gap-3"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-lg">{item.title}</p>
                      <p className="text-sm text-gray-400">
                        {subject?.name || 'Matéria'} · {topic?.name || 'Tema'} ·{' '}
                        {MATERIAL_OPTIONS.find((option) => option.value === item.materialType)?.label}
                        {item.teacherName ? ` · ${item.teacherName}` : ''}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Atualizado em {formatDate(item.updatedAt)}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold">{done}/{item.targetCount}</p>
                      <p className="text-xs text-gray-400">{progress}% concluído</p>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-true-white transition-all duration-300"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => decrementActivityPlanProgress(item.id)}
                      disabled={done <= 0}
                    >
                      -1
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => incrementActivityPlanProgress(item.id)}
                      disabled={done >= item.targetCount}
                    >
                      +1 concluído
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => markActivityPlanCompleted(item.id)}
                      disabled={done >= item.targetCount}
                    >
                      Marcar concluído
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Excluir este conteúdo?')) {
                          deleteActivityPlanItem(item.id);
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
      </div>
    </div>
  );
}
