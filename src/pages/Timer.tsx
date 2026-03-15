import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/Button';
import { formatTime, generateId } from '@/utils/helpers';
import type { ActivityType, StudyMode } from '@/types';
import { Pause, Play, X } from 'lucide-react';

const ACTIVITY_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: 'lesson', label: 'Aula' },
  { value: 'questions', label: 'Questões' },
  { value: 'lesson_questions', label: 'Aula + Questões' },
];

const DIFFICULTY_OPTIONS = [1, 2, 3, 4, 5] as const;

export function TimerPage() {
  const {
    subjects,
    topics,
    subtopics,
    activityPlanItems,
    settings,
    addStudySession,
    loadAllData,
    timerSeconds,
    timerIsRunning,
    timerStartedAt,
    startTimer,
    pauseTimer,
    resetTimer,
    tickTimer,
    addQuestionHistory,
    incrementActivityPlanProgress,
    markActivityPlanCompleted,
  } = useStore();
  const [subjectId, setSubjectId] = useState('');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [selectedSubtopicIds, setSelectedSubtopicIds] = useState<string[]>([]);
  const [activityType, setActivityType] = useState<ActivityType>('lesson');
  const [difficulty, setDifficulty] = useState<number | ''>('');
  const [mode] = useState<StudyMode>('pomodoro');
  const [isRunning, setIsRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [isFocusActive, setIsFocusActive] = useState(false);
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const [isFocusAnimating, setIsFocusAnimating] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questionCorrect, setQuestionCorrect] = useState('');
  const [questionWrong, setQuestionWrong] = useState('');
  const [questionBlank, setQuestionBlank] = useState('');
  const [questionNotes, setQuestionNotes] = useState('');
  const [pendingSessionIds, setPendingSessionIds] = useState<string[]>([]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);


  useEffect(() => {
    setIsRunning(timerIsRunning);
    setStartedAt(timerStartedAt);
  }, [timerIsRunning, timerStartedAt]);

  useEffect(() => {
    if (!isFocusActive) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFocusActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusActive]);

  useEffect(() => {
    if (isFocusActive) {
      setIsFocusVisible(true);
      setIsFocusAnimating(false);
      const animationFrame = window.requestAnimationFrame(() => {
        const nextFrame = window.requestAnimationFrame(() => {
          setIsFocusAnimating(true);
        });
        return () => window.cancelAnimationFrame(nextFrame);
      });
      return () => window.cancelAnimationFrame(animationFrame);
    }

    setIsFocusAnimating(false);
    const timeout = window.setTimeout(() => {
      setIsFocusVisible(false);
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [isFocusActive]);

  const topicsForSubject = useMemo(() => {
    if (!subjectId) return [];
    return topics.filter((topic) => topic.subjectId === subjectId);
  }, [topics, subjectId]);

  const subtopicsForSelectedTopics = useMemo(() => {
    if (selectedTopicIds.length === 0) return [];
    return subtopics.filter((st) => selectedTopicIds.includes(st.topicId));
  }, [subtopics, selectedTopicIds]);

  const pendingActivityItemsForSelected = useMemo(() => {
    if (selectedTopicIds.length === 0) return [];
    return activityPlanItems
      .filter((item) => {
        if (!selectedTopicIds.includes(item.topicId)) return false;
        if (selectedSubtopicIds.length > 0 && item.subtopicId && !selectedSubtopicIds.includes(item.subtopicId)) return false;
        return item.completedCount < item.targetCount;
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [activityPlanItems, selectedTopicIds, selectedSubtopicIds]);

  const canStart = !!subjectId && selectedTopicIds.length > 0 && !!activityType;
  const canFinish = isRunning || timerSeconds > 0;

  const handleStart = () => {
    if (!canStart) return;
    if (!timerStartedAt) {
      setStartedAt(new Date().toISOString());
    }
    setIsRunning(true);
    startTimer();
    if (focusMode) {
      setIsFocusActive(true);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
    pauseTimer();
  };

  const handleReset = () => {
    setIsRunning(false);
    setStartedAt(null);
    setIsFocusActive(false);
    setIsFocusVisible(false);
    setIsFocusAnimating(false);
    resetTimer();
  };

  const handleFinish = async () => {
    if (!canStart || !startedAt) return;
    const endedAt = new Date().toISOString();
    const sessionIds: string[] = [];

    // Se temos subtópicos selecionados, criamos sessões para eles
    // Se não, criamos sessões para os tópicos selecionados
    if (selectedSubtopicIds.length > 0) {
      for (const subId of selectedSubtopicIds) {
        const subtopic = subtopics.find(s => s.id === subId);
        if (!subtopic) continue;
        
        const id = generateId();
        sessionIds.push(id);
        await addStudySession({
          id,
          topicId: subtopic.topicId,
          subtopicId: subId,
          activityType,
          startedAt,
          endedAt,
          durationSec: timerSeconds,
          mode,
          difficulty: difficulty ? (difficulty as 1 | 2 | 3 | 4 | 5) : undefined,
        });
      }
    } else {
      for (const tId of selectedTopicIds) {
        const id = generateId();
        sessionIds.push(id);
        await addStudySession({
          id,
          topicId: tId,
          activityType,
          startedAt,
          endedAt,
          durationSec: timerSeconds,
          mode,
          difficulty: difficulty ? (difficulty as 1 | 2 | 3 | 4 | 5) : undefined,
        });
      }
    }

    if (activityType !== 'lesson') {
      setPendingSessionIds(sessionIds);
      setShowQuestionModal(true);
      return;
    }

    handleReset();
  };

  const handleSaveQuestionHistory = async () => {
    const correctCount = Number(questionCorrect) || 0;
    const wrongCount = Number(questionWrong) || 0;
    const blankCount = Number(questionBlank) || 0;

    // Se houver várias sessões, dividimos o resultado entre elas?
    // Ou repetimos o resultado para cada? Normalmente em estudos se repete o bloco.
    // O pedido do usuário sugere que ele quer concluir vários de uma vez.
    
    for (let i = 0; i < pendingSessionIds.length; i++) {
      const sessionId = pendingSessionIds[i];
      const session = useStore.getState().studySessions.find(s => s.id === sessionId);
      if (!session) continue;

      await addQuestionHistory({
        id: generateId(),
        topicId: session.topicId,
        subtopicId: session.subtopicId,
        sessionId,
        correctCount,
        wrongCount,
        blankCount,
        notes: questionNotes || undefined,
        createdAt: new Date().toISOString(),
      });
    }

    setQuestionCorrect('');
    setQuestionWrong('');
    setQuestionBlank('');
    setQuestionNotes('');
    setPendingSessionIds([]);
    setShowQuestionModal(false);
    handleReset();
  };

  const toggleTopic = (id: string) => {
    setSelectedTopicIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    // Ao remover um tópico, removemos seus subtópicos também
    if (selectedTopicIds.includes(id)) {
      const topicSubtopicIds = subtopics.filter(s => s.topicId === id).map(s => s.id);
      setSelectedSubtopicIds(prev => prev.filter(sid => !topicSubtopicIds.includes(sid)));
    }
  };

  const toggleSubtopic = (id: string) => {
    setSelectedSubtopicIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <>
      <div className="p-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Temporizador</h1>
          <p className="text-gray-400">
            Configure a sessão e acompanhe o tempo para registrar seus estudos.
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
          <h2 className="text-lg font-bold mb-4">Detalhes da sessão</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Matéria</label>
              <select
                value={subjectId}
                onChange={(event) => {
                  setSubjectId(event.target.value);
                  setSelectedTopicIds([]);
                  setSelectedSubtopicIds([]);
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de atividade</label>
              <select
                value={activityType}
                onChange={(event) => setActivityType(event.target.value as ActivityType)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-true-white"
              >
                {ACTIVITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Tópicos</label>
              <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-3 max-h-48 overflow-y-auto">
                {!subjectId ? (
                  <p className="text-gray-500 text-sm">Selecione uma matéria primeiro</p>
                ) : topicsForSubject.length === 0 ? (
                  <p className="text-gray-500 text-sm">Nenhum tópico cadastrado</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {topicsForSubject.map((topic) => (
                      <label key={topic.id} className="flex items-center gap-3 p-2 hover:bg-gray-850 rounded cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedTopicIds.includes(topic.id)}
                          onChange={() => toggleTopic(topic.id)}
                          className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-true-white"
                        />
                        <span className="text-sm text-gray-300">{topic.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Subtópicos (Opcional)</label>
              <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-3 max-h-48 overflow-y-auto">
                {selectedTopicIds.length === 0 ? (
                  <p className="text-gray-500 text-sm">Selecione pelo menos um tópico</p>
                ) : subtopicsForSelectedTopics.length === 0 ? (
                  <p className="text-gray-500 text-sm">Nenhum subtópico disponível para os tópicos selecionados</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {subtopicsForSelectedTopics.map((st) => (
                      <label key={st.id} className="flex items-center gap-3 p-2 hover:bg-gray-850 rounded cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedSubtopicIds.includes(st.id)}
                          onChange={() => toggleSubtopic(st.id)}
                          className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-true-white"
                        />
                        <span className="text-sm text-gray-300">{st.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Dificuldade (opcional)</label>
              <select
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(event.target.value ? Number(event.target.value) : '')
                }
                className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-true-white"
              >
                <option value="">Sem avaliação</option>
                {DIFFICULTY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-3 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={focusMode}
                onChange={(event) => setFocusMode(event.target.checked)}
                className="w-4 h-4"
              />
              Ativar modo Focus ao iniciar
            </label>
          </div>

          {selectedTopicIds.length > 0 && (
            <div className="mt-6 rounded-lg border border-gray-800 bg-gray-950 p-4">
              <h3 className="text-sm font-semibold text-gray-200 mb-3">Conteúdos pendentes selecionados</h3>
              {pendingActivityItemsForSelected.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Nenhum conteúdo pendente para os itens selecionados.
                </p>
              ) : (
                <div className="space-y-2">
                  {pendingActivityItemsForSelected.slice(0, 5).map((item) => {
                    const done = Math.min(item.completedCount, item.targetCount);
                    const remaining = Math.max(0, item.targetCount - done);
                    return (
                      <div
                        key={item.id}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-md border border-gray-800 bg-gray-900 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-gray-400">
                            {done}/{item.targetCount} concluídos · faltam {remaining}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => incrementActivityPlanProgress(item.id)}
                          >
                            +1
                          </Button>
                          <Button size="sm" onClick={() => markActivityPlanCompleted(item.id)}>
                            Concluir
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-sm text-gray-400">Modo</p>
              <p className="text-xl font-bold">Pomodoro</p>
              <p className="text-sm text-gray-500 mt-1">
                Ciclo padrão de {settings?.pomodoroMinutes ?? 25} minutos.
              </p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold tracking-tight">{formatTime(timerSeconds)}</p>
              <p className="text-sm text-gray-500 mt-2">Tempo decorrido</p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {isRunning ? (
                <Button variant="secondary" onClick={handlePause}>
                  Pausar
                </Button>
              ) : (
                <Button onClick={handleStart} disabled={!canStart}>
                  {timerSeconds === 0 ? 'Iniciar' : 'Retomar'}
                </Button>
              )}
              <Button variant="ghost" onClick={handleReset} disabled={timerSeconds === 0}>
                Reiniciar
              </Button>
              <Button variant="primary" onClick={handleFinish} disabled={!canFinish || !canStart}>
                Finalizar & Salvar
              </Button>
            </div>
          </div>
        </div>
      </div>
      {isFocusVisible && (
        <div
          className={`fixed inset-0 bg-true-black/95 text-true-white flex flex-col items-center justify-center z-50 transition-all duration-500 ease-out ${isFocusAnimating
            ? 'opacity-100 scale-100 blur-0'
            : 'opacity-0 scale-[1.02] blur-[2px] pointer-events-none'
            }`}
        >
          <button
            type="button"
            aria-label="Sair do modo focus"
            className="absolute top-6 right-6 text-gray-500 hover:text-gray-200 transition-colors"
            onClick={() => setIsFocusActive(false)}
          >
            <X size={20} />
          </button>
          <p className="text-sm text-gray-500 mb-4">Modo Focus</p>
          <p className="text-6xl md:text-7xl font-bold tracking-tight">
            {formatTime(timerSeconds)}
          </p>
          <div className="mt-10 flex items-center gap-6">
            <button
              type="button"
              onClick={() => (isRunning ? handlePause() : handleStart())}
              className="p-4 rounded-full border border-gray-700 text-gray-200 hover:text-true-white hover:border-gray-500 transition-colors"
            >
              {isRunning ? <Pause size={24} /> : <Play size={24} />}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-6">Pressione ESC para sair</p>
        </div>
      )}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-true-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-lg">
            <div className="mb-4">
              <h2 className="text-xl font-bold">Registrar questões</h2>
              <p className="text-sm text-gray-400">
                Informe o resultado da sessão de questões para acompanhar seu progresso.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Certas</label>
                <input
                  type="number"
                  min={0}
                  value={questionCorrect}
                  onChange={(event) => setQuestionCorrect(event.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-true-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Erradas</label>
                <input
                  type="number"
                  min={0}
                  value={questionWrong}
                  onChange={(event) => setQuestionWrong(event.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-true-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Em branco</label>
                <input
                  type="number"
                  min={0}
                  value={questionBlank}
                  onChange={(event) => setQuestionBlank(event.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-true-white"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Observações</label>
              <textarea
                value={questionNotes}
                onChange={(event) => setQuestionNotes(event.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-true-white min-h-[96px]"
                placeholder="Ex: dificuldade em interpretação de enunciados..."
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowQuestionModal(false);
                  setPendingSessionIds([]);
                  handleReset();
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveQuestionHistory}>Salvar</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
