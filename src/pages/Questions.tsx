import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store';
import { formatDate, generateId } from '@/utils/helpers';
import { Trash2, Plus } from 'lucide-react';
import { TopicSelector } from '@/components/TopicSelector';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';

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
  const [showManualModal, setShowManualModal] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const topicsById = useMemo(() => new Map(topics.map((t) => [t.id, t])), [topics]);
  const subjectsById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const subtopicsById = useMemo(() => new Map(subtopics.map((s) => [s.id, s])), [subtopics]);

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
    setShowManualModal(false);
  };

  const handleDeleteEntry = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      await deleteQuestionHistory(id);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Histórico de Questões</h1>
          <p className="text-gray-400">Acompanhe acertos, erros e rendimento por tópico</p>
        </div>
        <button
          onClick={() => setShowManualModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          <Plus size={18} />
          Novo Registro
        </button>
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
          <TopicSelector
            mode="filter"
            layout="bare"
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

      {/* Manual Entry Modal */}
      <Modal
        open={showManualModal}
        onClose={() => setShowManualModal(false)}
        title="Novo Registro"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowManualModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleManualAdd} disabled={!manualTopicId}>
              Salvar registro
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <TopicSelector
            mode="form"
            layout="stack"
            size="sm"
            subjectId={manualSubjectId}
            topicId={manualTopicId}
            subtopicId={manualSubtopicId}
            onChange={({ subjectId, topicId, subtopicId }) => {
              setManualSubjectId(subjectId);
              setManualTopicId(topicId);
              setManualSubtopicId(subtopicId);
            }}
          />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Certas</label>
              <input
                type="number"
                min={0}
                value={manualCorrect}
                onChange={(event) => setManualCorrect(event.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Erradas</label>
              <input
                type="number"
                min={0}
                value={manualWrong}
                onChange={(event) => setManualWrong(event.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Em branco</label>
              <input
                type="number"
                min={0}
                value={manualBlank}
                onChange={(event) => setManualBlank(event.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Observações</label>
            <textarea
              value={manualNotes}
              onChange={(event) => setManualNotes(event.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm min-h-[80px]"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
