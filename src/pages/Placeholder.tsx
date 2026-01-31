import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/Button';
import { formatDate } from '@/utils/helpers';
import { generateId } from '@/utils/helpers';

export function NotesPage() {
  const { loadAllData } = useStore();
  
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-2">Anotações</h1>
      <p className="text-gray-400">Funcionalidade em desenvolvimento</p>
    </div>
  );
}

export function QuestionsPage() {
  const {
    loadAllData,
    questionHistory,
    subjects,
    topics,
    addQuestionHistory,
  } = useStore();
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [manualSubjectId, setManualSubjectId] = useState('');
  const [manualTopicId, setManualTopicId] = useState('');
  const [manualCorrect, setManualCorrect] = useState('');
  const [manualWrong, setManualWrong] = useState('');
  const [manualBlank, setManualBlank] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const topicsById = useMemo(() => new Map(topics.map((t) => [t.id, t])), [topics]);
  const subjectsById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);

  const topicsForFilter = useMemo(() => {
    if (!subjectId) return topics;
    return topics.filter((topic) => topic.subjectId === subjectId);
  }, [topics, subjectId]);

  const manualTopicsForSubject = useMemo(() => {
    if (!manualSubjectId) return topics;
    return topics.filter((topic) => topic.subjectId === manualSubjectId);
  }, [topics, manualSubjectId]);

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

        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [questionHistory, dateFrom, dateTo, subjectId, topicId, topicsById]);

  const aggregated = useMemo(() => {
    const map = new Map<string, { topicId: string; correct: number; wrong: number; blank: number }>();

    filteredHistory.forEach((entry) => {
      const current = map.get(entry.topicId) || {
        topicId: entry.topicId,
        correct: 0,
        wrong: 0,
        blank: 0,
      };
      map.set(entry.topicId, {
        topicId: entry.topicId,
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
      return {
        ...item,
        total,
        rendimento,
        topicName: topic?.name || 'Tema não encontrado',
        subjectName: subject?.name || 'Matéria não encontrada',
      };
    });
  }, [filteredHistory, topicsById, subjectsById]);

  const handleManualAdd = async () => {
    if (!manualTopicId) return;
    const correctCount = Number(manualCorrect) || 0;
    const wrongCount = Number(manualWrong) || 0;
    const blankCount = Number(manualBlank) || 0;

    await addQuestionHistory({
      id: generateId(),
      topicId: manualTopicId,
      correctCount,
      wrongCount,
      blankCount,
      notes: manualNotes || undefined,
      createdAt: new Date().toISOString(),
    });

    setManualCorrect('');
    setManualWrong('');
    setManualBlank('');
    setManualNotes('');
    setManualTopicId('');
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Histórico de Questões</h1>
        <p className="text-gray-400">Acompanhe acertos, erros e rendimento por tema</p>
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Tema</label>
            <select
              value={topicId}
              onChange={(event) => setTopicId(event.target.value)}
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Tema</label>
            <select
              value={manualTopicId}
              onChange={(event) => setManualTopicId(event.target.value)}
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
        <h2 className="text-lg font-bold mb-4">Resumo por tema</h2>
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
                  <p className="font-medium">{item.topicName}</p>
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
              const total = entry.correctCount + entry.wrongCount + entry.blankCount;
              const rendimento = total === 0 ? 0 : Math.round((entry.correctCount / total) * 100);
              return (
                <div
                  key={entry.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{topic?.name || 'Tema não encontrado'}</p>
                    <p className="text-sm text-gray-400">{subject?.name || 'Matéria não encontrada'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(entry.createdAt)} · Certas {entry.correctCount} · Erradas {entry.wrongCount} · Brancas {entry.blankCount}
                    </p>
                    {entry.notes && (
                      <p className="text-xs text-gray-400 mt-2">{entry.notes}</p>
                    )}
                  </div>
                  <div className="mt-3 md:mt-0 text-right">
                    <p className="text-2xl font-bold">{rendimento}%</p>
                    <p className="text-xs text-gray-400">Rendimento</p>
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
