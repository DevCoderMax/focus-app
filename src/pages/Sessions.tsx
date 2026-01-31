import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store';
import { formatDuration, formatDate } from '@/utils/helpers';
import { Clock, Trash2 } from 'lucide-react';

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toTimeLabel(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatActivityLabel(activityType?: string) {
  switch (activityType) {
    case 'lesson':
      return 'Aula';
    case 'questions':
      return 'Questões';
    case 'lesson_questions':
      return 'Aula + Questões';
    default:
      return 'Atividade';
  }
}

export function SessionsPage() {
  const { studySessions, subjects, topics, loadAllData, deleteStudySession } = useStore();
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [dateFrom, setDateFrom] = useState(() => {
    const now = new Date();
    now.setDate(now.getDate() - 6);
    return toInputDate(now);
  });
  const [dateTo, setDateTo] = useState(() => toInputDate(new Date()));

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const topicsById = useMemo(() => {
    return new Map(topics.map((topic) => [topic.id, topic]));
  }, [topics]);

  const subjectsById = useMemo(() => {
    return new Map(subjects.map((subject) => [subject.id, subject]));
  }, [subjects]);

  const topicsForFilter = useMemo(() => {
    if (!subjectId) return topics;
    return topics.filter((topic) => topic.subjectId === subjectId);
  }, [topics, subjectId]);

  const filteredSessions = useMemo(() => {
    const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const toDate = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

    return studySessions
      .filter((session) => {
        const startDate = new Date(session.startedAt);
        if (fromDate && startDate < fromDate) return false;
        if (toDate && startDate > toDate) return false;

        if (subjectId) {
          const topic = topicsById.get(session.topicId);
          if (!topic || topic.subjectId !== subjectId) return false;
        }

        if (topicId && session.topicId !== topicId) return false;

        return true;
      })
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }, [studySessions, dateFrom, dateTo, subjectId, topicId, topicsById]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Sessões</h1>
        <p className="text-gray-400">Histórico de estudo com filtros por período e assunto</p>
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

      {filteredSessions.length === 0 ? (
        <div className="text-center py-16">
          <Clock size={48} className="mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 text-lg">Nenhuma sessão encontrada</p>
          <p className="text-gray-500 mt-2">Ajuste os filtros ou registre novas sessões.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => {
            const topic = topicsById.get(session.topicId);
            const subject = topic ? subjectsById.get(topic.subjectId) : null;

            return (
              <div
                key={session.id}
                className="bg-gray-900 rounded-lg p-5 border border-gray-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <p className="text-lg font-bold">
                    {subject?.name || 'Matéria não encontrada'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {topic?.name || 'Tema não encontrado'}
                  </p>
                <div className="text-sm text-gray-500 mt-2">
                  {formatDate(session.startedAt)} · {toTimeLabel(session.startedAt)} — {toTimeLabel(session.endedAt)}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {formatActivityLabel(session.activityType)}
                </div>
              </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold">{formatDuration(session.durationSec)}</p>
                    <p className="text-sm text-gray-400">Duração</p>
                  </div>
                  <button
                    type="button"
                    aria-label="Excluir sessão"
                    className="p-2 rounded-lg border border-transparent text-gray-400 hover:text-true-white hover:border-gray-700 hover:bg-gray-800 transition-colors"
                    onClick={() => {
                      if (confirm('Deseja excluir esta sessão?')) {
                        deleteStudySession(session.id);
                      }
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
