import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store';
import { formatDuration, formatDate } from '@/utils/helpers';
import { Clock, Trash2, Plus, X } from 'lucide-react';
import type { StudySession, ActivityType, QuestionHistoryEntry } from '@/types';
import { createReviewsFromSession } from '@/services/schedulerService';

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
  const { studySessions, subjects, topics, subtopics, settings, loadAllData, deleteStudySession, addStudySession, addQuestionHistory } = useStore();
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [subtopicId, setSubtopicId] = useState('');
  const [dateFrom, setDateFrom] = useState(() => {
    const now = new Date();
    now.setDate(now.getDate() - 6);
    return toInputDate(now);
  });
  const [dateTo, setDateTo] = useState(() => toInputDate(new Date()));

  // Manual session form
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualSubjectId, setManualSubjectId] = useState('');
  const [manualTopicId, setManualTopicId] = useState('');
  const [manualSubtopicId, setManualSubtopicId] = useState('');
  const [manualActivityType, setManualActivityType] = useState<ActivityType>('lesson');
  const [manualDate, setManualDate] = useState(() => toInputDate(new Date()));
  const [manualStartTime, setManualStartTime] = useState('09:00');
  const [manualEndTime, setManualEndTime] = useState('10:00');
  const [manualDifficulty, setManualDifficulty] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [manualCorrect, setManualCorrect] = useState('');
  const [manualWrong, setManualWrong] = useState('');
  const [manualBlank, setManualBlank] = useState('');
  const [manualReviewMode, setManualReviewMode] = useState<'auto' | 'manual'>('auto');
  const [manualReviewIntervals, setManualReviewIntervals] = useState<number[]>([1]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const topicsById = useMemo(() => {
    return new Map(topics.map((topic) => [topic.id, topic]));
  }, [topics]);

  const subjectsById = useMemo(() => {
    return new Map(subjects.map((subject) => [subject.id, subject]));
  }, [subjects]);

  const subtopicsById = useMemo(() => {
    return new Map(subtopics.map((st) => [st.id, st]));
  }, [subtopics]);

  const topicsForFilter = useMemo(() => {
    if (!subjectId) return topics;
    return topics.filter((topic) => topic.subjectId === subjectId);
  }, [topics, subjectId]);

  const subtopicsForFilter = useMemo(() => {
    if (!topicId) return subtopics;
    return subtopics.filter((st) => st.topicId === topicId);
  }, [subtopics, topicId]);

  const topicsForManual = useMemo(() => {
    if (!manualSubjectId) return [];
    return topics.filter((topic) => topic.subjectId === manualSubjectId);
  }, [topics, manualSubjectId]);

  const subtopicsForManual = useMemo(() => {
    if (!manualTopicId) return [];
    return subtopics.filter((st) => st.topicId === manualTopicId);
  }, [subtopics, manualTopicId]);

  const handleManualSubmit = async () => {
    if (!manualTopicId || !manualDate || !manualStartTime || !manualEndTime) return;

    const startedAt = new Date(`${manualDate}T${manualStartTime}:00`);
    const endedAt = new Date(`${manualDate}T${manualEndTime}:00`);
    const durationSec = Math.max(0, Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000));

    if (durationSec === 0) return;

    const now = new Date().toISOString();
    const session: StudySession = {
      id: crypto.randomUUID(),
      topicId: manualTopicId,
      subtopicId: manualSubtopicId || undefined,
      activityType: manualActivityType,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      durationSec,
      mode: 'free',
      difficulty: manualDifficulty,
      createdAt: now,
      updatedAt: now,
    };

    await addStudySession(session);

    // Create question history if activity type involves questions
    if (manualActivityType !== 'lesson') {
      const correctCount = Number(manualCorrect) || 0;
      const wrongCount = Number(manualWrong) || 0;
      const blankCount = Number(manualBlank) || 0;
      const totalQuestions = correctCount + wrongCount + blankCount;
      const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

      if (correctCount > 0 || wrongCount > 0 || blankCount > 0) {
        const qhEntry: QuestionHistoryEntry = {
          id: crypto.randomUUID(),
          topicId: manualTopicId,
          subtopicId: manualSubtopicId || undefined,
          sessionId: session.id,
          correctCount,
          wrongCount,
          blankCount,
          createdAt: now,
          updatedAt: now,
        };
        await addQuestionHistory(qhEntry);

        // Create review schedules if enabled
        if (settings?.enableAutoReviews !== false) {
          await createReviewsFromSession(session, accuracy, manualReviewMode, manualReviewIntervals);
        }
      }
    }

    setShowManualForm(false);
    setManualSubjectId('');
    setManualTopicId('');
    setManualSubtopicId('');
    setManualActivityType('lesson');
    setManualDate(toInputDate(new Date()));
    setManualStartTime('09:00');
    setManualEndTime('10:00');
    setManualDifficulty(3);
    setManualCorrect('');
    setManualWrong('');
    setManualBlank('');
    setManualReviewMode('auto');
    setManualReviewIntervals([1]);
  };

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
        if (subtopicId && session.subtopicId !== subtopicId) return false;

        return true;
      })
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }, [studySessions, dateFrom, dateTo, subjectId, topicId, topicsById]);

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Sessões</h1>
          <p className="text-gray-400">Histórico de estudo com filtros por período e assunto</p>
        </div>
        <button
          onClick={() => setShowManualForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          <Plus size={18} />
          Nova sessão
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
            const subtopic = session.subtopicId ? subtopicsById.get(session.subtopicId) : null;

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
                    {topic?.name || 'Tópico não encontrado'} {subtopic ? `· ${subtopic.name}` : ''}
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

      {/* Manual Session Modal */}
      {showManualForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Nova sessão manual</h2>
              <button onClick={() => setShowManualForm(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Matéria</label>
                <select
                  value={manualSubjectId}
                  onChange={(e) => {
                    setManualSubjectId(e.target.value);
                    setManualTopicId('');
                    setManualSubtopicId('');
                  }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                >
                  <option value="">Selecione...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tópico</label>
                <select
                  value={manualTopicId}
                  onChange={(e) => {
                    setManualTopicId(e.target.value);
                    setManualSubtopicId('');
                  }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                  disabled={!manualSubjectId}
                >
                  <option value="">Selecione...</option>
                  {topicsForManual.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Subtópico (opcional)</label>
                <select
                  value={manualSubtopicId}
                  onChange={(e) => setManualSubtopicId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                  disabled={!manualTopicId}
                >
                  <option value="">Nenhum</option>
                  {subtopicsForManual.map((st) => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de atividade</label>
                <select
                  value={manualActivityType}
                  onChange={(e) => setManualActivityType(e.target.value as ActivityType)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                >
                  <option value="lesson">Aula</option>
                  <option value="questions">Questões</option>
                  <option value="lesson_questions">Aula + Questões</option>
                </select>
              </div>

              {manualActivityType !== 'lesson' && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-300">Resultado das questões</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-green-400 mb-1">Certas</label>
                      <input
                        type="number"
                        value={manualCorrect}
                        onChange={(e) => setManualCorrect(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-red-400 mb-1">Erradas</label>
                      <input
                        type="number"
                        value={manualWrong}
                        onChange={(e) => setManualWrong(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Brancas</label>
                      <input
                        type="number"
                        value={manualBlank}
                        onChange={(e) => setManualBlank(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                        min="0"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {manualActivityType !== 'lesson' && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-300">Revisão espaçada</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setManualReviewMode('auto')}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        manualReviewMode === 'auto'
                          ? 'bg-white text-black'
                          : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                      }`}
                    >
                      Automático
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualReviewMode('manual')}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        manualReviewMode === 'manual'
                          ? 'bg-white text-black'
                          : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                      }`}
                    >
                      Manual
                    </button>
                  </div>
                  {manualReviewMode === 'auto' ? (
                    <p className="text-xs text-gray-500">
                      O sistema cria revisões baseado na sua taxa de acertos.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {manualReviewIntervals.map((interval, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 w-16">{idx + 1}ª revisão</span>
                          <input
                            type="number"
                            value={interval}
                            onChange={(e) => {
                              const newIntervals = [...manualReviewIntervals];
                              newIntervals[idx] = Math.max(1, Number(e.target.value) || 1);
                              setManualReviewIntervals(newIntervals);
                            }}
                            className="flex-1 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                            min={1}
                          />
                          <span className="text-xs text-gray-500">dias</span>
                          {manualReviewIntervals.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setManualReviewIntervals(manualReviewIntervals.filter((_, i) => i !== idx))}
                              className="text-gray-500 hover:text-red-400"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                      {manualReviewIntervals.length < 5 && (
                        <button
                          type="button"
                          onClick={() => setManualReviewIntervals([...manualReviewIntervals, manualReviewIntervals[manualReviewIntervals.length - 1] + 3])}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white mt-1"
                        >
                          <Plus size={12} /> Adicionar revisão
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Data</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Início</label>
                  <input
                    type="time"
                    value={manualStartTime}
                    onChange={(e) => setManualStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Fim</label>
                  <input
                    type="time"
                    value={manualEndTime}
                    onChange={(e) => setManualEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Dificuldade</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setManualDifficulty(d as 1 | 2 | 3 | 4 | 5)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        manualDifficulty === d
                          ? 'bg-white text-black'
                          : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowManualForm(false)}
                className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={!manualTopicId}
                className="flex-1 py-2 rounded-lg bg-white text-black font-medium hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
