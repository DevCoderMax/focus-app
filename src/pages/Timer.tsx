import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/Button';
import { formatTime, generateId } from '@/utils/helpers';
import type { ActivityType, StudyMode } from '@/types';
import { Pause, Play, X, Plus, Trash2 } from 'lucide-react';
import { createReviewsFromSession } from '@/services/schedulerService';

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
    updateSettings,
    addStudySession,
    loadAllData,
    timerSeconds,
    timerIsRunning,
    timerStartedAt,
    startTimer,
    pauseTimer,
    resetTimer,
    addQuestionHistory,
    incrementActivityPlanProgress,
    markActivityPlanCompleted,
    musicStudyStyle,
    musicBreakStyle,
    musicAutoPlay,
    setMusicStudyStyle,
    setMusicBreakStyle,
    setMusicAutoPlay,
    setMusicPlaylist,
    playMusic,
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
  
  // Pomodoro phases
  type PomodoroPhase = 'pomodoro' | 'shortBreak' | 'longBreak' | 'idle';
  const [phase, setPhase] = useState<PomodoroPhase>('idle');
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(0);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [focusedSeconds, setFocusedSeconds] = useState(0); // Only pomodoro time
  const [showPhaseConfirm, setShowPhaseConfirm] = useState(false);
  const [pendingPhase, setPendingPhase] = useState<PomodoroPhase | null>(null);
  const [overtimeSeconds, setOvertimeSeconds] = useState(0);
  const [selectedStudyMusic, setSelectedStudyMusic] = useState(musicStudyStyle || '');
  const [selectedBreakMusic, setSelectedBreakMusic] = useState(musicBreakStyle || '');
  const [questionCorrect, setQuestionCorrect] = useState('');
  const [questionWrong, setQuestionWrong] = useState('');
  const [questionBlank, setQuestionBlank] = useState('');
  const [questionNotes, setQuestionNotes] = useState('');
  const [pendingSessionIds, setPendingSessionIds] = useState<string[]>([]);
  const [reviewMode, setReviewMode] = useState<'auto' | 'manual'>('auto');
  const [manualIntervals, setManualIntervals] = useState<number[]>([1]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Beep sound
  const playBeep = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
      // Audio not available
    }
  };

  // Phase timer countdown
  useEffect(() => {
    if (phase === 'idle' || !isRunning) return;
    
    const interval = setInterval(() => {
      // Track focused time (only during pomodoro phase)
      if (phase === 'pomodoro') {
        setFocusedSeconds((prev) => prev + 1);
      }
      
      setPhaseTimeLeft((prev) => {
        if (prev <= 0) {
          // Phase finished - beep 3 times (only once, not repeatedly)
          if (!showPhaseConfirm) {
            playBeep();
            setTimeout(() => playBeep(), 300);
            setTimeout(() => playBeep(), 600);
            
            if (phase === 'pomodoro') {
              // Pomodoro done - show options but KEEP RUNNING
              const nextPhase = (pomodoroCount + 1) % 4 === 0 ? 'longBreak' : 'shortBreak';
              setPendingPhase(nextPhase);
              setShowPhaseConfirm(true);
            } else {
              // Break done - show popup to continue
              playBeep();
              setTimeout(() => playBeep(), 300);
              setTimeout(() => playBeep(), 600);
              setPendingPhase('pomodoro');
              setShowPhaseConfirm(true);
              return 0;
            }
          }
          // Keep timer at 0, overtime is tracked separately
          return 0; 
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [phase, isRunning, pomodoroCount, settings, showPhaseConfirm]);

  // Overtime counter (only when popup is shown during pomodoro)
  useEffect(() => {
    if (!showPhaseConfirm || phase !== 'pomodoro') return;
    
    const interval = setInterval(() => {
      setOvertimeSeconds((prev) => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [showPhaseConfirm, phase]);


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
  const canFinish = isRunning || timerSeconds > 0 || focusedSeconds > 0;

  const handleStartBreak = () => {
    // User accepts the break - stop focused counting
    setShowPhaseConfirm(false);
    const nextPhase = pendingPhase || 'shortBreak';
    setPendingPhase(null);
    setOvertimeSeconds(0);
    const newCount = pomodoroCount + 1;
    setPomodoroCount(newCount);
    setPhase(nextPhase);
    setPhaseTimeLeft(nextPhase === 'longBreak' 
      ? (settings?.longBreakMinutes ?? 15) * 60 
      : (settings?.shortBreakMinutes ?? 5) * 60);
    
    // Switch to break music
    if (musicAutoPlay && selectedBreakMusic) {
      setMusicBreakStyle(selectedBreakMusic);
      setMusicPlaylist(selectedBreakMusic);
      setTimeout(() => playMusic(), 500);
    }
  };

  const handleContinueSession = () => {
    // User confirmed to continue after break
    setShowPhaseConfirm(false);
    setPendingPhase(null);
    setPhase('pomodoro');
    setPhaseTimeLeft((settings?.pomodoroMinutes ?? 25) * 60);
    
    // Switch back to study music
    if (musicAutoPlay && selectedStudyMusic) {
      setMusicPlaylist(selectedStudyMusic);
      setTimeout(() => playMusic(), 500);
    }
  };

  const handleStart = () => {
    if (!canStart) return;
    if (!timerStartedAt) {
      setStartedAt(new Date().toISOString());
    }
    setIsRunning(true);
    startTimer();
    
    // Start pomodoro phase if idle
    if (phase === 'idle') {
      setPhase('pomodoro');
      setPhaseTimeLeft((settings?.pomodoroMinutes ?? 25) * 60);
      
      // Auto-play study music
      if (musicAutoPlay && selectedStudyMusic) {
        setMusicStudyStyle(selectedStudyMusic);
        setMusicPlaylist(selectedStudyMusic);
        setTimeout(() => playMusic(), 500);
      }
    }
    
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
    setPhase('idle');
    setPhaseTimeLeft(0);
    setPomodoroCount(0);
    setFocusedSeconds(0);
    setShowPhaseConfirm(false);
    setPendingPhase(null);
    setOvertimeSeconds(0);
    resetTimer();
  };

  const handleFinish = async () => {
    if (!canStart || !startedAt) return;
    const endedAt = new Date().toISOString();
    const sessionIds: string[] = [];
    const studyTimeSec = phase !== 'idle' ? focusedSeconds : timerSeconds;

    // Se temos subtópicos selecionados, criamos sessões para eles
    // Se não, criamos sessões para os tópicos selecionados
    if (selectedSubtopicIds.length > 0) {
      for (const subId of selectedSubtopicIds) {
        const subtopic = subtopics.find(s => s.id === subId);
        if (!subtopic) continue;
        
        const id = generateId();
        const now = new Date().toISOString();
        sessionIds.push(id);
        await addStudySession({
          id,
          topicId: subtopic.topicId,
          subtopicId: subId,
          activityType,
          startedAt,
          endedAt,
          durationSec: studyTimeSec,
          mode,
          difficulty: difficulty ? (difficulty as 1 | 2 | 3 | 4 | 5) : undefined,
          createdAt: now,
          updatedAt: now,
        });
      }
    } else {
      for (const tId of selectedTopicIds) {
        const id = generateId();
        const now = new Date().toISOString();
        sessionIds.push(id);
        await addStudySession({
          id,
          topicId: tId,
          activityType,
          startedAt,
          endedAt,
          durationSec: studyTimeSec,
          mode,
          difficulty: difficulty ? (difficulty as 1 | 2 | 3 | 4 | 5) : undefined,
          createdAt: now,
          updatedAt: now,
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
    const totalQuestions = correctCount + wrongCount + blankCount;
    const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    for (let i = 0; i < pendingSessionIds.length; i++) {
      const sessionId = pendingSessionIds[i];
      const session = useStore.getState().studySessions.find(s => s.id === sessionId);
      if (!session) continue;
      const now = new Date().toISOString();

      await addQuestionHistory({
        id: generateId(),
        topicId: session.topicId,
        subtopicId: session.subtopicId,
        sessionId,
        correctCount,
        wrongCount,
        blankCount,
        notes: questionNotes || undefined,
        createdAt: now,
        updatedAt: now,
      });

      // Create review schedules
      await createReviewsFromSession(session, accuracy, reviewMode, manualIntervals);
    }

    setQuestionCorrect('');
    setQuestionWrong('');
    setQuestionBlank('');
    setQuestionNotes('');
    setPendingSessionIds([]);
    setShowQuestionModal(false);
    setReviewMode('auto');
    setManualIntervals([1]);
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

        {/* Music Settings */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Música</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={musicAutoPlay}
                onChange={(e) => setMusicAutoPlay(e.target.checked)}
                className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-purple-500"
              />
              <span className="text-sm text-gray-400">Iniciar com a sessão</span>
            </label>
          </div>
          
          {musicAutoPlay && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">🎵 Estilo ao estudar</label>
                <select
                  value={selectedStudyMusic}
                  onChange={(e) => setSelectedStudyMusic(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0d0d0d] border border-gray-800 rounded-lg text-white text-sm"
                >
                  <option value="">Selecione...</option>
                  <option value="concentracao">🎯 Concentração</option>
                  <option value="foco">🧠 Foco</option>
                  <option value="lofi">🌙 Lo-Fi</option>
                  <option value="lofi-live">📺 Lo-Fi Live</option>
                  <option value="deep">🌊 Deep</option>
                  <option value="classica">🎻 Clássica</option>
                  <option value="natureza">🌿 Natureza</option>
                  <option value="inspiracao">✨ Inspiração</option>
                  <option value="relax">😌 Relax</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">☕ Estilo na pausa</label>
                <select
                  value={selectedBreakMusic}
                  onChange={(e) => setSelectedBreakMusic(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0d0d0d] border border-gray-800 rounded-lg text-white text-sm"
                >
                  <option value="">Selecione...</option>
                  <option value="concentracao">🎯 Concentração</option>
                  <option value="foco">🧠 Foco</option>
                  <option value="lofi">🌙 Lo-Fi</option>
                  <option value="lofi-live">📺 Lo-Fi Live</option>
                  <option value="deep">🌊 Deep</option>
                  <option value="classica">🎻 Clássica</option>
                  <option value="natureza">🌿 Natureza</option>
                  <option value="inspiracao">✨ Inspiração</option>
                  <option value="relax">😌 Relax</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Timer Settings */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
          <h2 className="text-lg font-bold mb-4">Configurações do Pomodoro</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Pomodoro (min)</label>
              <input
                type="number"
                value={settings?.pomodoroMinutes ?? 25}
                onChange={(e) => updateSettings({ pomodoroMinutes: parseInt(e.target.value) || 25 })}
                min={1}
                max={60}
                className="w-full px-3 py-2 bg-[#0d0d0d] border border-gray-800 rounded-lg text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Pausa curta (min)</label>
              <input
                type="number"
                value={settings?.shortBreakMinutes ?? 5}
                onChange={(e) => updateSettings({ shortBreakMinutes: parseInt(e.target.value) || 5 })}
                min={1}
                max={30}
                className="w-full px-3 py-2 bg-[#0d0d0d] border border-gray-800 rounded-lg text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Pausa longa (min)</label>
              <input
                type="number"
                value={settings?.longBreakMinutes ?? 15}
                onChange={(e) => updateSettings({ longBreakMinutes: parseInt(e.target.value) || 15 })}
                min={1}
                max={60}
                className="w-full px-3 py-2 bg-[#0d0d0d] border border-gray-800 rounded-lg text-white text-sm"
              />
            </div>

          </div>
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
              <p className="text-xl font-bold">
                {phase === 'idle' && 'Pomodoro'}
                {phase === 'pomodoro' && '🎯 Focando'}
                {phase === 'shortBreak' && '☕ Descanse'}
                {phase === 'longBreak' && '🌴 Pausa longa'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {phase === 'idle' && `Ciclo: ${settings?.pomodoroMinutes ?? 25}min / ${settings?.shortBreakMinutes ?? 5}min`}
                {phase === 'pomodoro' && `Faltam ${Math.floor(phaseTimeLeft / 60)}:${String(phaseTimeLeft % 60).padStart(2, '0')}`}
                {phase === 'shortBreak' && `Próximo pomodoro em ${Math.floor(phaseTimeLeft / 60)}:${String(phaseTimeLeft % 60).padStart(2, '0')}`}
                {phase === 'longBreak' && `Voltando em ${Math.floor(phaseTimeLeft / 60)}:${String(phaseTimeLeft % 60).padStart(2, '0')}`}
              </p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold tracking-tight">
                {phase !== 'idle' 
                  ? `${Math.floor(phaseTimeLeft / 60)}:${String(phaseTimeLeft % 60).padStart(2, '0')}`
                  : formatTime(timerSeconds)
                }
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {phase !== 'idle' ? 'Tempo restante' : 'Tempo decorrido'}
              </p>
              {focusedSeconds > 0 && (
                <p className="text-xs text-green-500 mt-1">
                  {Math.floor(focusedSeconds / 60)}min focados
                </p>
              )}
              {pomodoroCount > 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  {pomodoroCount} pomodoro{pomodoroCount > 1 ? 's' : ''} hoje
                </p>
              )}
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
          <p className="text-sm text-gray-500 mb-4">
            {phase === 'pomodoro' ? '🎯 Focando' : phase === 'shortBreak' ? '☕ Descanse' : phase === 'longBreak' ? '🌴 Pausa longa' : 'Modo Focus'}
          </p>
          <p className="text-6xl md:text-7xl font-bold tracking-tight">
            {phase !== 'idle' 
              ? `${Math.floor(phaseTimeLeft / 60)}:${String(phaseTimeLeft % 60).padStart(2, '0')}`
              : formatTime(timerSeconds)
            }
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
      {showPhaseConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-sm text-center">
            {pendingPhase === 'pomodoro' ? (
              <>
                <div className="text-4xl mb-4">🎯</div>
                <h2 className="text-xl font-bold mb-2">Hora de focar!</h2>
                <p className="text-gray-400 mb-4">
                  Sua pausa acabou. Bora voltar ao estudo?
                </p>
                <div>
                  <button
                    onClick={handleContinueSession}
                    className="w-full py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Continuar sessão
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl mb-4">
                  {pendingPhase === 'longBreak' ? '🌴' : '☕'}
                </div>
                <h2 className="text-xl font-bold mb-2">Hora de descansar!</h2>
                <p className="text-gray-400 mb-4">
                  Você completou um pomodoro. Que tal uma pausa?
                </p>
                {overtimeSeconds > 0 && (
                  <div className="mb-4 py-2 px-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-500">Tempo extra</p>
                    <p className="text-lg font-mono text-white">
                      +{Math.floor(overtimeSeconds / 60)}:{String(overtimeSeconds % 60).padStart(2, '0')}
                    </p>
                  </div>
                )}
                <div>
                  <button
                    onClick={handleStartBreak}
                    className="w-full py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    {pendingPhase === 'longBreak' ? 'Pausa longa (15min)' : 'Pausa curta (5min)'}
                  </button>
                  <p className="text-xs text-gray-600 mt-3 text-center">
                    Continue estudando para ignorar a pausa
                  </p>
                </div>
              </>
            )}
          </div>
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

            {/* Review Mode */}
            <div className="mt-4 bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-300 mb-3">Revisão espaçada</p>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setReviewMode('auto')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    reviewMode === 'auto'
                      ? 'bg-white text-black'
                      : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                  }`}
                >
                  Automático
                </button>
                <button
                  type="button"
                  onClick={() => setReviewMode('manual')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    reviewMode === 'manual'
                      ? 'bg-white text-black'
                      : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                  }`}
                >
                  Manual
                </button>
              </div>
              {reviewMode === 'auto' ? (
                <p className="text-xs text-gray-500">
                  O sistema cria revisões baseado na sua taxa de acertos.
                </p>
              ) : (
                <div className="space-y-2">
                  {manualIntervals.map((interval, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-16">{idx + 1}ª revisão</span>
                      <input
                        type="number"
                        value={interval}
                        onChange={(e) => {
                          const newIntervals = [...manualIntervals];
                          newIntervals[idx] = Math.max(1, Number(e.target.value) || 1);
                          setManualIntervals(newIntervals);
                        }}
                        className="flex-1 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
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
              )}
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
