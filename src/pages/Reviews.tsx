import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store';
import { Trash2, Calendar as CalendarIcon, Plus } from 'lucide-react';
import type { ReviewSchedule } from '@/types';
import { recalculateAfterReview } from '@/services/schedulerService';
import { TopicSelector } from '@/components/TopicSelector';
import { Modal } from '@/components/Modal';

export function ReviewsPage() {
  const {
    reviewSchedules,
    reviewAttempts,
    topics,
    subjects,
    subtopics,
    loadAllData,
    updateReviewSchedule,
    deleteReviewSchedule,
    addReviewSchedule,
    addReviewAttempt,
  } = useStore();

  const [showAttemptModal, setShowAttemptModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ReviewSchedule | null>(null);
  const [attemptCorrect, setAttemptCorrect] = useState('');
  const [attemptTotal, setAttemptTotal] = useState('');
  const [attemptDuration, setAttemptDuration] = useState('');

  // Manual review creation
  const [showManualReview, setShowManualReview] = useState(false);
  const [manualSubjectId, setManualSubjectId] = useState('');
  const [manualTopicId, setManualTopicId] = useState('');
  const [manualSubtopicId, setManualSubtopicId] = useState('');
  const [manualDate, setManualDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [manualIntervals, setManualIntervals] = useState<number[]>([1]);

  // Confirm delete modal
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteMessage, setPendingDeleteMessage] = useState('');

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const topicsById = useMemo(() => new Map(topics.map(t => [t.id, t])), [topics]);
  const subjectsById = useMemo(() => new Map(subjects.map(s => [s.id, s])), [subjects]);

  const pendingReviews = useMemo(() =>
    reviewSchedules
      .filter(r => r.status === 'pending')
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()),
    [reviewSchedules]
  );

  const completedReviews = useMemo(() =>
    reviewSchedules
      .filter(r => r.status === 'completed')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [reviewSchedules]
  );

  const overdueReviews = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return pendingReviews.filter(r => new Date(r.dueAt) < now);
  }, [pendingReviews]);

  const upcomingReviews = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return pendingReviews.filter(r => new Date(r.dueAt) >= now);
  }, [pendingReviews]);

  const avgAccuracy = useMemo(() => {
    if (reviewAttempts.length === 0) return 0;
    const sum = reviewAttempts.reduce((acc, a) => acc + a.accuracy, 0);
    return Math.round(sum / reviewAttempts.length);
  }, [reviewAttempts]);

  const reviewsThisWeek = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return reviewAttempts.filter(a => new Date(a.completedAt) >= weekStart).length;
  }, [reviewAttempts]);

  const handleCreateManualReview = async () => {
    if (!manualTopicId || manualIntervals.length === 0) return;
    const baseDate = new Date(`${manualDate}T09:00:00`);
    const now = new Date().toISOString();

    for (let i = 0; i < manualIntervals.length; i++) {
      const dueAt = new Date(baseDate);
      dueAt.setDate(dueAt.getDate() + manualIntervals[i]);
      await addReviewSchedule({
        id: crypto.randomUUID(),
        topicId: manualTopicId,
        subtopicId: manualSubtopicId || undefined,
        dueAt: dueAt.toISOString(),
        status: 'pending',
        reviewOrder: i + 1,
        totalReviews: manualIntervals.length,
        reviewMode: 'manual',
        createdAt: now,
        updatedAt: now,
      });
    }

    setShowManualReview(false);
    setManualSubjectId('');
    setManualTopicId('');
    setManualSubtopicId('');
    setManualIntervals([1]);
  };

  const handleStartAttempt = (schedule: ReviewSchedule) => {
    setSelectedSchedule(schedule);
    setAttemptCorrect('');
    setAttemptTotal('');
    setAttemptDuration('');
    setShowAttemptModal(true);
  };

  const handleSubmitAttempt = async () => {
    if (!selectedSchedule) return;
    const correct = Number(attemptCorrect) || 0;
    const total = Number(attemptTotal) || 0;
    const duration = Number(attemptDuration) || 0;
    if (total === 0) return;

    const accuracy = (correct / total) * 100;
    const now = new Date().toISOString();

    await addReviewAttempt({
      id: crypto.randomUUID(),
      scheduleId: selectedSchedule.id,
      correctCount: correct,
      questionCount: total,
      accuracy,
      durationSec: duration * 60,
      completedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await updateReviewSchedule({ ...selectedSchedule, status: 'completed', updatedAt: now });

    // Recalculate remaining reviews adaptively
    await recalculateAfterReview(selectedSchedule, accuracy, reviewSchedules);

    setShowAttemptModal(false);
    setSelectedSchedule(null);
    await loadAllData();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  };

  const getTopicInfo = (topicId: string, subtopicId?: string) => {
    const topic = topicsById.get(topicId);
    const subject = topic ? subjectsById.get(topic.subjectId) : null;
    const subtopic = subtopicId ? subtopics.find(st => st.id === subtopicId) : null;
    return {
      topicName: topic?.name || 'Tópico',
      subjectName: subject?.name || '',
      subtopicName: subtopic?.name || '',
    };
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Revisões</h1>
          <p className="text-gray-400">Acompanhe suas revisões espaçadas</p>
        </div>
        <button
          onClick={() => setShowManualReview(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          <CalendarIcon size={18} />
          Nova Revisão
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Pendentes</p>
          <p className="text-2xl font-bold">{pendingReviews.length}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Atrasadas</p>
          <p className="text-2xl font-bold text-red-400">{overdueReviews.length}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Accuracy média</p>
          <p className="text-2xl font-bold">{avgAccuracy}%</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Esta semana</p>
          <p className="text-2xl font-bold">{reviewsThisWeek}</p>
        </div>
      </div>

      {/* Pending Reviews */}
      {overdueReviews.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4 text-red-400">Revisões Atrasadas</h2>
          <div className="space-y-3">
            {overdueReviews.map(review => {
              const info = getTopicInfo(review.topicId, review.subtopicId);
              return (
                <div key={review.id} className="bg-gray-900 rounded-lg p-4 border border-red-900/50 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{info.topicName}</p>
                    <p className="text-sm text-gray-400">{info.subjectName} {info.subtopicName ? `· ${info.subtopicName}` : ''}</p>
                    <p className="text-xs text-red-400 mt-1">
                      Atrasada desde {formatDate(review.dueAt)} · {review.reviewOrder}/{review.totalReviews}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartAttempt(review)}
                      className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200"
                    >
                      Iniciar
                    </button>
                    <button
                      onClick={() => {
                        setPendingDeleteId(review.id);
                        setPendingDeleteMessage('Excluir esta revisão?');
                        setShowConfirmDelete(true);
                      }}
                      className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {upcomingReviews.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Próximas Revisões</h2>
          <div className="space-y-3">
            {upcomingReviews.map(review => {
              const info = getTopicInfo(review.topicId, review.subtopicId);
              const isToday = formatDate(review.dueAt) === formatDate(new Date().toISOString());
              return (
                <div key={review.id} className="bg-gray-900 rounded-lg p-4 border border-gray-800 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{info.topicName}</p>
                    <p className="text-sm text-gray-400">{info.subjectName} {info.subtopicName ? `· ${info.subtopicName}` : ''}</p>
                    <p className={`text-xs mt-1 ${isToday ? 'text-amber-400' : 'text-gray-500'}`}>
                      {isToday ? 'Hoje' : formatDate(review.dueAt)} · {review.reviewOrder}/{review.totalReviews}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartAttempt(review)}
                      className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200"
                    >
                      Iniciar
                    </button>
                    <button
                      onClick={() => {
                        setPendingDeleteId(review.id);
                        setPendingDeleteMessage('Excluir esta revisão?');
                        setShowConfirmDelete(true);
                      }}
                      className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pendingReviews.length === 0 && (
        <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800 mb-8">
          <CalendarIcon size={48} className="mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">Nenhuma revisão pendente</p>
          <p className="text-gray-500 text-sm mt-1">Revisões são criadas automaticamente ao finalizar sessões com questões.</p>
        </div>
      )}

      {/* History */}
      {completedReviews.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4">Histórico</h2>
          <div className="space-y-3">
            {completedReviews.map(review => {
              const info = getTopicInfo(review.topicId, review.subtopicId);
              const attempt = reviewAttempts.find(a => a.scheduleId === review.id);
              return (
                <div key={review.id} className="bg-gray-900 rounded-lg p-4 border border-gray-800 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{info.topicName}</p>
                    {info.subtopicName && <p className="text-sm text-gray-400">{info.subtopicName}</p>}
                    <p className="text-sm text-gray-400">{info.subjectName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Concluída {formatDateTime(review.updatedAt)}
                    </p>
                  </div>
                  {attempt && (
                    <div className="text-right">
                      <p className={`text-lg font-bold ${attempt.accuracy >= 70 ? 'text-green-400' : 'text-red-400'}`}>
                        {Math.round(attempt.accuracy)}%
                      </p>
                      <p className="text-xs text-gray-500">{attempt.correctCount}/{attempt.questionCount}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Attempt Modal */}
      {selectedSchedule && (
        <Modal
          open={showAttemptModal}
          onClose={() => setShowAttemptModal(false)}
          title="Registrar Revisão"
          size="sm"
          footer={
            <div className="flex gap-3">
              <button
                onClick={() => setShowAttemptModal(false)}
                className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitAttempt}
                disabled={!attemptTotal || Number(attemptTotal) === 0}
                className="flex-1 py-2 rounded-lg bg-white text-black font-medium hover:bg-gray-200 disabled:opacity-40"
              >
                Salvar
              </button>
            </div>
          }
        >
          <p className="text-sm text-gray-400 mb-4">
            {getTopicInfo(selectedSchedule.topicId).topicName}
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Acertou</label>
              <input
                type="number"
                value={attemptCorrect}
                onChange={e => setAttemptCorrect(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                min="0"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Total de questões</label>
              <input
                type="number"
                value={attemptTotal}
                onChange={e => setAttemptTotal(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                min="0"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Duração (minutos)</label>
              <input
                type="number"
                value={attemptDuration}
                onChange={e => setAttemptDuration(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                min="0"
                placeholder="0"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Manual Review Modal */}
      <Modal
        open={showManualReview}
        onClose={() => setShowManualReview(false)}
        title="Nova Revisão Manual"
        size="sm"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowManualReview(false)}
              className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateManualReview}
              disabled={!manualTopicId}
              className="flex-1 py-2 rounded-lg bg-white text-black font-medium hover:bg-gray-200 disabled:opacity-40"
            >
              Criar
            </button>
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
          <div>
            <label className="block text-sm text-gray-300 mb-1">Data base</label>
            <input
              type="date"
              value={manualDate}
              onChange={e => setManualDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Intervalos (dias)</label>
            <div className="space-y-2">
              {manualIntervals.map((interval, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-16">{idx + 1}ª revisão</span>
                  <input
                    type="number"
                    value={interval}
                    onChange={e => {
                      const newIntervals = [...manualIntervals];
                      newIntervals[idx] = Math.max(1, Number(e.target.value) || 1);
                      setManualIntervals(newIntervals);
                    }}
                    className="flex-1 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    min={1}
                  />
                  <span className="text-xs text-gray-500">dias</span>
                  {manualIntervals.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setManualIntervals(manualIntervals.filter((_, i) => i !== idx))}
                      className="text-gray-500 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {manualIntervals.length < 5 && (
                <button
                  type="button"
                  onClick={() => setManualIntervals([...manualIntervals, manualIntervals[manualIntervals.length - 1] + 3])}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white mt-1"
                >
                  <Plus size={12} /> Adicionar revisão
                </button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        open={showConfirmDelete}
        onClose={() => {
          setShowConfirmDelete(false);
          setPendingDeleteId(null);
        }}
        title="Confirmar exclusão"
        size="sm"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowConfirmDelete(false);
                setPendingDeleteId(null);
              }}
              className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (pendingDeleteId) deleteReviewSchedule(pendingDeleteId);
                setShowConfirmDelete(false);
                setPendingDeleteId(null);
              }}
              className="flex-1 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-500 transition-colors"
            >
              Excluir
            </button>
          </div>
        }
      >
        <p className="text-gray-400 text-sm">{pendingDeleteMessage}</p>
      </Modal>
    </div>
  );
}
