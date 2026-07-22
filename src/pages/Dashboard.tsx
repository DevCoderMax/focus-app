import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store';
import { Clock, Target, TrendingUp, Calendar, TrendingDown, Minus, AlertTriangle, Zap, Brain, Flame, Award, ChevronRight, ChevronDown } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
} from 'recharts';
import type { TopicMetrics, SubtopicMetrics } from '@/types';
import { Modal } from '@/components/Modal';

// Calculate confidence index: weighted by volume
// forca = percentual_acerto * (total_questoes / 10)
function calculateConfidenceIndex(accuracyPercent: number, totalQuestions: number): number {
  if (totalQuestions === 0) return 0;
  return Math.round(accuracyPercent * (totalQuestions / 10));
}

// Determine topic strength classification
function getTopicStrength(accuracyPercent: number, totalQuestions: number): TopicMetrics['strength'] {
  if (totalQuestions < 10) return 'little_trained';
  if (accuracyPercent > 80 && totalQuestions > 30) return 'strong';
  if (accuracyPercent >= 60 && accuracyPercent <= 80) return 'intermediate';
  return 'weak';
}

// Determine if it's a consolidated weakness
function isConsolidatedWeakness(totalQuestions: number, accuracyPercent: number): boolean {
  return totalQuestions >= 20 && accuracyPercent < 70;
}

// Determine if topic is little trained
function isLittleTrained(totalQuestions: number): boolean {
  return totalQuestions < 10;
}

// Check if has improvement potential (60-75% zone)
function hasImprovementPotential(accuracyPercent: number): boolean {
  return accuracyPercent >= 60 && accuracyPercent <= 75;
}

// Determine trend direction
function getTrendDirection(recentAccuracy: number, previousAccuracy: number): TopicMetrics['trend'] {
  const diff = recentAccuracy - previousAccuracy;
  if (diff > 5) return 'rising';
  if (diff < -5) return 'falling';
  return 'stable';
}

export function DashboardPage() {
  const {
    studySessions,
    topics,
    subtopics,
    subjects,
    reviewAttempts,
    questionHistory,
    goals,
    loadAllData,
  } = useStore();
  const [chartRangeDays, setChartRangeDays] = useState(7);
  const [showDetailedMetrics, setShowDetailedMetrics] = useState(false);
  const [showStreakDetails, setShowStreakDetails] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  const toggleTopicExpansion = (topicId: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Total study time today
    const todaySessions = studySessions.filter(
      (s) => new Date(s.startedAt) >= today
    );
    const todayMinutes = Math.floor(
      todaySessions.reduce((sum, s) => sum + s.durationSec, 0) / 60
    );

    // Calculate streak
    let streak = 0;
    const sessionDates = new Set(
      studySessions.map((s) => new Date(s.startedAt).toDateString())
    );

    let checkDate = new Date(today);
    // Se ainda não estudou hoje, não quebra a sequência — começa por ontem
    if (!sessionDates.has(checkDate.toDateString())) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (sessionDates.has(checkDate.toDateString())) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Longest streak (maior sequência histórica de dias consecutivos)
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const dayIndexes = Array.from(
      new Set(
        studySessions.map((s) => {
          const d = new Date(s.startedAt);
          return Math.floor(
            new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / MS_PER_DAY
          );
        })
      )
    ).sort((a, b) => a - b);

    let longestStreak = 0;
    let run = 0;
    let prevDay: number | null = null;
    for (const day of dayIndexes) {
      run = prevDay !== null && day === prevDay + 1 ? run + 1 : 1;
      if (run > longestStreak) longestStreak = run;
      prevDay = day;
    }

    // Total de dias estudados (histórico)
    const totalStudyDays = dayIndexes.length;

    // Total sessions this week
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekSessions = studySessions.filter(
      (s) => new Date(s.startedAt) >= weekAgo
    );

    // Average accuracy
    const avgAccuracy =
      reviewAttempts.length > 0
        ? Math.round(
          reviewAttempts.reduce((sum, a) => sum + a.accuracy, 0) /
          reviewAttempts.length
        )
        : 0;

    return {
      todayMinutes,
      streak,
      longestStreak,
      totalStudyDays,
      weekSessions: weekSessions.length,
      avgAccuracy,
    };
  }, [studySessions, reviewAttempts]);

  // Calculate daily goals progress
  const dailyGoalsProgress = useMemo(() => {
    const dailyGoals = goals.filter(
      (g) => g.period === 'daily' && g.status === 'active'
    );

    return dailyGoals.map((goal) => {
      const progress = goal.targetValue > 0
        ? Math.min(100, (goal.currentValue / goal.targetValue) * 100)
        : 0;

      const getUnitLabel = () => {
        if (goal.unit === 'h') return 'h';
        if (goal.unit === 'min') return 'min';
        return goal.unit || '';
      };

      return {
        id: goal.id,
        title: goal.title,
        currentValue: goal.currentValue,
        targetValue: goal.targetValue,
        unit: getUnitLabel(),
        progress: Math.round(progress),
        isCompleted: progress >= 100,
      };
    });
  }, [goals]);

  // Calculate comprehensive topic metrics
  const topicMetrics = useMemo((): TopicMetrics[] => {
    const metricsMap = new Map<string, TopicMetrics>();

    // Initialize metrics for each topic
    topics.forEach((topic) => {
      const subject = subjects.find((s) => s.id === topic.subjectId);
      metricsMap.set(topic.id, {
        topicId: topic.id,
        topicName: topic.name,
        subjectId: topic.subjectId,
        subjectName: subject?.name || 'Unknown',
        totalQuestions: 0,
        correctCount: 0,
        wrongCount: 0,
        blankCount: 0,
        accuracyPercent: 0,
        confidenceIndex: 0,
        isWeakness: false,
        isLittleTrained: true,
        strength: 'little_trained',
        recentAccuracy: 0,
        previousAccuracy: 0,
        trend: 'stable',
        improvementPotential: false,
        subtopics: [],
      });
    });

    // Aggregate question history by topic
    questionHistory.forEach((entry) => {
      const metrics = metricsMap.get(entry.topicId);
      if (!metrics) return;

      metrics.totalQuestions += entry.correctCount + entry.wrongCount + entry.blankCount;
      metrics.correctCount += entry.correctCount;
      metrics.wrongCount += entry.wrongCount;
      metrics.blankCount += entry.blankCount;
    });

    // Calculate derived metrics
    metricsMap.forEach((metrics) => {
      // Accuracy percentage
      const answered = metrics.correctCount + metrics.wrongCount;
      metrics.accuracyPercent = answered > 0
        ? Math.round((metrics.correctCount / answered) * 100)
        : 0;

      // Confidence index
      metrics.confidenceIndex = calculateConfidenceIndex(metrics.accuracyPercent, metrics.totalQuestions);

      // Weakness detection
      metrics.isWeakness = isConsolidatedWeakness(metrics.totalQuestions, metrics.accuracyPercent);
      metrics.isLittleTrained = isLittleTrained(metrics.totalQuestions);

      // Strength classification
      metrics.strength = getTopicStrength(metrics.accuracyPercent, metrics.totalQuestions);

      // Improvement potential
      metrics.improvementPotential = hasImprovementPotential(metrics.accuracyPercent);
    });

    // Calculate trend (needs chronological order)
    const sortedHistory = [...questionHistory].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const topicHistoryMap = new Map<string, { correct: number; total: number }[]>();
    sortedHistory.forEach((entry) => {
      const topicHistory = topicHistoryMap.get(entry.topicId) || [];
      const answered = entry.correctCount + entry.wrongCount;
      topicHistory.push({ correct: entry.correctCount, total: answered });
      topicHistoryMap.set(entry.topicId, topicHistory);
    });

    topicHistoryMap.forEach((history, topicId) => {
      const metrics = metricsMap.get(topicId);
      if (!metrics || history.length === 0) return;

      const recent20 = history.slice(-20);
      const previous = history.slice(0, -20);

      const recentCorrect = recent20.reduce((sum, h) => sum + h.correct, 0);
      const recentTotal = recent20.reduce((sum, h) => sum + h.total, 0);
      metrics.recentAccuracy = recentTotal > 0 ? Math.round((recentCorrect / recentTotal) * 100) : 0;

      const previousCorrect = previous.reduce((sum, h) => sum + h.correct, 0);
      const previousTotal = previous.reduce((sum, h) => sum + h.total, 0);
      metrics.previousAccuracy = previousTotal > 0 ? Math.round((previousCorrect / previousTotal) * 100) : 0;

      metrics.trend = getTrendDirection(metrics.recentAccuracy, metrics.previousAccuracy);
    });

    // Per-subtopic breakdown for each topic.
    // Questions without a subtopicId are grouped into a synthetic "Geral" bucket
    // so the subtopic rows always sum back to the topic total.
    const GERAL_KEY = '__geral__';
    const subtopicAgg = new Map<string, Map<string, SubtopicMetrics>>();

    questionHistory.forEach((entry) => {
      if (!metricsMap.has(entry.topicId)) return;

      const key = entry.subtopicId ?? GERAL_KEY;
      const byTopic = subtopicAgg.get(entry.topicId) ?? new Map<string, SubtopicMetrics>();

      const existing = byTopic.get(key) ?? {
        subtopicId: entry.subtopicId ?? null,
        subtopicName: entry.subtopicId
          ? subtopics.find((s) => s.id === entry.subtopicId)?.name ?? 'Subtópico removido'
          : 'Geral (sem subtópico)',
        totalQuestions: 0,
        correctCount: 0,
        wrongCount: 0,
        blankCount: 0,
        accuracyPercent: 0,
        confidenceIndex: 0,
        strength: 'little_trained' as TopicMetrics['strength'],
      };

      existing.totalQuestions += entry.correctCount + entry.wrongCount + entry.blankCount;
      existing.correctCount += entry.correctCount;
      existing.wrongCount += entry.wrongCount;
      existing.blankCount += entry.blankCount;

      byTopic.set(key, existing);
      subtopicAgg.set(entry.topicId, byTopic);
    });

    subtopicAgg.forEach((byTopic, topicId) => {
      const metrics = metricsMap.get(topicId);
      if (!metrics) return;

      const list = Array.from(byTopic.values());
      list.forEach((sub) => {
        const answered = sub.correctCount + sub.wrongCount;
        sub.accuracyPercent = answered > 0 ? Math.round((sub.correctCount / answered) * 100) : 0;
        sub.confidenceIndex = calculateConfidenceIndex(sub.accuracyPercent, sub.totalQuestions);
        sub.strength = getTopicStrength(sub.accuracyPercent, sub.totalQuestions);
      });

      // Highest-volume subtopics first; keep the "Geral" bucket last.
      metrics.subtopics = list.sort((a, b) => {
        if (a.subtopicId === null) return 1;
        if (b.subtopicId === null) return -1;
        return b.totalQuestions - a.totalQuestions;
      });
    });

    return Array.from(metricsMap.values()).filter(m => m.totalQuestions > 0);
  }, [topics, subtopics, subjects, questionHistory]);

  // Sorted topics by different criteria
  const weakTopics = useMemo(() =>
    topicMetrics.filter(m => m.strength === 'weak' || m.isWeakness).sort((a, b) => a.accuracyPercent - b.accuracyPercent),
    [topicMetrics]
  );

  const strongTopics = useMemo(() =>
    topicMetrics.filter(m => m.strength === 'strong').sort((a, b) => b.confidenceIndex - a.confidenceIndex),
    [topicMetrics]
  );

  const improvementTopics = useMemo(() =>
    topicMetrics.filter(m => m.improvementPotential).sort((a, b) => b.confidenceIndex - a.confidenceIndex),
    [topicMetrics]
  );

  const risingTopics = useMemo(() =>
    topicMetrics.filter(m => m.trend === 'rising').sort((a, b) => b.recentAccuracy - a.recentAccuracy),
    [topicMetrics]
  );

  // Chart data - last N days (study sessions)
  const chartData = useMemo(() => {
    const days = [];
    const today = new Date();

    for (let i = chartRangeDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const daySessions = studySessions.filter((s) => {
        const sessionDate = new Date(s.startedAt);
        return sessionDate >= date && sessionDate < nextDay;
      });

      const minutes = Math.floor(
        daySessions.reduce((sum, s) => sum + s.durationSec, 0) / 60
      );

      days.push({
        name:
          chartRangeDays <= 7
            ? date.toLocaleDateString('pt-BR', { weekday: 'short' })
            : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        minutes,
      });
    }

    return days;
  }, [studySessions, chartRangeDays]);

  // Question performance chart data
  const questionChartData = useMemo(() => {
    const days = [];
    const today = new Date();

    for (let i = chartRangeDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const entries = questionHistory.filter((entry) => {
        const entryDate = new Date(entry.createdAt);
        return entryDate >= date && entryDate < nextDay;
      });

      const correct = entries.reduce((sum, e) => sum + e.correctCount, 0);
      const wrong = entries.reduce((sum, e) => sum + e.wrongCount, 0);
      const blank = entries.reduce((sum, e) => sum + e.blankCount, 0);
      const total = correct + wrong + blank;
      const rendimento = total === 0 ? 0 : Math.round((correct / total) * 100);

      days.push({
        name:
          chartRangeDays <= 7
            ? date.toLocaleDateString('pt-BR', { weekday: 'short' })
            : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        total,
        rendimento,
      });
    }

    return days;
  }, [questionHistory, chartRangeDays]);

  // Top 3 worst performing topics (legacy)
  const worstTopics = useMemo(() => {
    const topicAccuracy = new Map<string, { total: number; count: number }>();

    reviewAttempts.forEach((attempt) => {
      const schedule = useStore
        .getState()
        .reviewSchedules.find((s) => s.id === attempt.scheduleId);
      if (schedule) {
        const current = topicAccuracy.get(schedule.topicId) || {
          total: 0,
          count: 0,
        };
        topicAccuracy.set(schedule.topicId, {
          total: current.total + attempt.accuracy,
          count: current.count + 1,
        });
      }
    });

    return Array.from(topicAccuracy.entries())
      .map(([topicId, data]) => {
        const topic = topics.find((t) => t.id === topicId);
        const subject = subjects.find((s) => s.id === topic?.subjectId);
        return {
          topicId,
          topicName: topic?.name || 'Unknown',
          subjectName: subject?.name || 'Unknown',
          accuracy: Math.round(data.total / data.count),
        };
      })
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);
  }, [reviewAttempts, topics, subjects]);

  // Get strength badge color
  const getStrengthBadge = (strength: TopicMetrics['strength']) => {
    switch (strength) {
      case 'strong':
        return { bg: 'bg-green-900/30', text: 'text-green-400', icon: <Zap className="w-3 h-3" /> };
      case 'intermediate':
        return { bg: 'bg-yellow-900/30', text: 'text-yellow-400', icon: <Brain className="w-3 h-3" /> };
      case 'weak':
        return { bg: 'bg-red-900/30', text: 'text-red-400', icon: <AlertTriangle className="w-3 h-3" /> };
      case 'little_trained':
        return { bg: 'bg-gray-700/30', text: 'text-gray-400', icon: <Minus className="w-3 h-3" /> };
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: TopicMetrics['trend']) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'falling':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  // Get accuracy color (shared by topic and subtopic rows)
  const getAccuracyColor = (accuracyPercent: number) =>
    accuracyPercent >= 80 ? 'text-green-400' :
      accuracyPercent >= 60 ? 'text-yellow-400' :
        accuracyPercent > 0 ? 'text-red-400' : 'text-gray-400';

  // Compact row shown for each subtopic when a topic is expanded
  const SubtopicRow = ({ metrics }: { metrics: SubtopicMetrics }) => {
    const badge = getStrengthBadge(metrics.strength);

    return (
      <div className="flex items-center justify-between py-2.5 pl-6 pr-4 bg-gray-850 rounded-lg border-l-2 border-gray-700">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm truncate ${metrics.subtopicId === null ? 'italic text-gray-400' : 'text-gray-200'}`}>
              {metrics.subtopicName}
            </p>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${badge.bg} ${badge.text}`}>
              {badge.icon}
              {metrics.strength === 'strong' && 'Forte'}
              {metrics.strength === 'intermediate' && 'Intermediário'}
              {metrics.strength === 'weak' && 'Fraco'}
              {metrics.strength === 'little_trained' && 'Pouco treinado'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 ml-4">
          <div className="text-center hidden md:block min-w-[48px]">
            <p className="text-sm font-bold">{metrics.totalQuestions}</p>
            <p className="text-[10px] text-gray-500">Questões</p>
          </div>
          <div className="text-center hidden md:block min-w-[48px]">
            <p className="text-sm font-bold text-green-400">{metrics.correctCount}</p>
            <p className="text-[10px] text-gray-500">Acertos</p>
          </div>
          <div className="text-center hidden md:block min-w-[48px]">
            <p className="text-sm font-bold text-red-400">{metrics.wrongCount}</p>
            <p className="text-[10px] text-gray-500">Erros</p>
          </div>
          <div className="text-center min-w-[60px]">
            <p className={`text-lg font-bold ${getAccuracyColor(metrics.accuracyPercent)}`}>
              {metrics.accuracyPercent}%
            </p>
            <p className="text-[10px] text-gray-500">Precisão</p>
          </div>
          <div className="text-center min-w-[60px] hidden lg:block">
            <p className="text-sm font-bold">{metrics.confidenceIndex}</p>
            <p className="text-[10px] text-gray-500">Índice confiança</p>
          </div>
        </div>
      </div>
    );
  };

  // Single topic row component.
  // When `expandable` is set, a chevron toggles a nested per-subtopic breakdown.
  const TopicRow = ({ metrics, expandable = false }: { metrics: TopicMetrics; expandable?: boolean }) => {
    const badge = getStrengthBadge(metrics.strength);
    const canExpand = expandable && metrics.subtopics.length > 0;
    const isExpanded = canExpand && expandedTopics.has(metrics.topicId);

    return (
      <div>
        <div
          className={`flex items-center justify-between p-4 bg-gray-800 rounded-lg transition-colors ${
            canExpand ? 'cursor-pointer hover:bg-gray-750' : 'hover:bg-gray-750'
          } ${isExpanded ? 'rounded-b-none' : ''}`}
          onClick={canExpand ? () => toggleTopicExpansion(metrics.topicId) : undefined}
          role={canExpand ? 'button' : undefined}
          tabIndex={canExpand ? 0 : undefined}
          aria-expanded={canExpand ? isExpanded : undefined}
          onKeyDown={
            canExpand
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleTopicExpansion(metrics.topicId);
                  }
                }
              : undefined
          }
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {canExpand && (
              <span className="text-gray-500 shrink-0">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium truncate">{metrics.topicName}</p>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${badge.bg} ${badge.text}`}>
                  {badge.icon}
                  {metrics.strength === 'strong' && 'Forte'}
                  {metrics.strength === 'intermediate' && 'Intermediário'}
                  {metrics.strength === 'weak' && 'Fraco'}
                  {metrics.strength === 'little_trained' && 'Pouco treinado'}
                </span>
                {metrics.isWeakness && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-red-900/30 text-red-400">
                    <AlertTriangle className="w-3 h-3" />
                    Fraqueza
                  </span>
                )}
                {metrics.improvementPotential && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-900/30 text-blue-400">
                    <Zap className="w-3 h-3" />
                    Alto potencial
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 truncate">{metrics.subjectName}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 ml-4">
            {/* Basic stats */}
            <div className="text-center hidden md:block">
              <p className="text-lg font-bold">{metrics.totalQuestions}</p>
              <p className="text-xs text-gray-500">Questões</p>
            </div>

            <div className="text-center hidden md:block">
              <p className="text-lg font-bold text-green-400">{metrics.correctCount}</p>
              <p className="text-xs text-gray-500">Acertos</p>
            </div>

            <div className="text-center hidden md:block">
              <p className="text-lg font-bold text-red-400">{metrics.wrongCount}</p>
              <p className="text-xs text-gray-500">Erros</p>
            </div>

            {/* Main accuracy */}
            <div className="text-center min-w-[60px]">
              <div className="flex items-center justify-center gap-1">
                <p className={`text-2xl font-bold ${getAccuracyColor(metrics.accuracyPercent)}`}>
                  {metrics.accuracyPercent}%
                </p>
                {getTrendIcon(metrics.trend)}
              </div>
              <p className="text-xs text-gray-500">Precisão</p>
            </div>

            {/* Confidence Index */}
            <div className="text-center min-w-[60px] hidden lg:block">
              <p className="text-lg font-bold">{metrics.confidenceIndex}</p>
              <p className="text-xs text-gray-500">Índice confiança</p>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-1 p-2 bg-gray-800/40 rounded-b-lg border-t border-gray-700">
            {metrics.subtopics.map((sub) => (
              <SubtopicRow key={sub.subtopicId ?? '__geral__'} metrics={sub} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-8">
      {/* Streak details popup */}
      <Modal
        open={showStreakDetails}
        onClose={() => setShowStreakDetails(false)}
        title={
          <span className="flex items-center gap-2">
            <Flame className="text-orange-500" size={22} />
            Sequência de estudos
          </span>
        }
        size="md"
      >
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-gray-800/60 px-4 py-3">
                <span className="flex items-center gap-2 text-gray-300">
                  <Target size={18} className="text-blue-400" />
                  Sequência atual
                </span>
                <span className="text-lg font-bold">{stats.streak} dias</span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-gray-800/60 px-4 py-3">
                <span className="flex items-center gap-2 text-gray-300">
                  <Award size={18} className="text-yellow-400" />
                  Maior sequência
                </span>
                <span className="text-lg font-bold">{stats.longestStreak} dias</span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-gray-800/60 px-4 py-3">
                <span className="flex items-center gap-2 text-gray-300">
                  <Calendar size={18} className="text-green-400" />
                  Total de dias estudados
                </span>
                <span className="text-lg font-bold">{stats.totalStudyDays} dias</span>
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              A sequência conta dias consecutivos com pelo menos uma sessão de estudo. Estudar hoje mantém a sequência viva.
            </p>
      </Modal>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-400">Visão geral do seu progresso</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Clock />}
          label="Hoje"
          value={`${stats.todayMinutes} min`}
          description="Tempo de estudo"
        />
        <StatCard
          icon={<Target />}
          label="Sequência"
          value={`${stats.streak} dias`}
          description="Dias consecutivos"
          onClick={() => setShowStreakDetails(true)}
        />
        <StatCard
          icon={<Calendar />}
          label="Esta semana"
          value={`${stats.weekSessions}`}
          description="Sessões realizadas"
        />
        <StatCard
          icon={<TrendingUp />}
          label="Precisão média"
          value={`${stats.avgAccuracy}%`}
          description="Nas revisões"
        />
      </div>

      {/* Daily Goals Progress */}
      {dailyGoalsProgress.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-gray-800">
          <h2 className="text-xl font-bold mb-4">Progresso Diário</h2>
          <div className="space-y-4">
            {dailyGoalsProgress.map((goal) => (
              <div key={goal.id}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">{goal.title}</span>
                  <span className={`text-sm font-bold ${goal.isCompleted ? 'text-green-400' : 'text-white'}`}>
                    {goal.progress}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        goal.isCompleted ? 'bg-green-500' : 'bg-white/30'
                      }`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 min-w-[80px] text-right">
                    {goal.currentValue} / {goal.targetValue} {goal.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold">Histórico</h2>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-400">Período</label>
            <select
              value={chartRangeDays}
              onChange={(event) => setChartRangeDays(Number(event.target.value))}
              className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-true-white"
            >
              {[7, 30, 90, 120].map((days) => (
                <option key={days} value={days}>
                  Últimos {days} dias
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-6">
          <div className="h-64">
            <h3 className="text-sm text-gray-400 mb-2">Tempo de estudo (min)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#737373" style={{ fontSize: '12px' }} />
                <YAxis
                  stroke="#737373"
                  style={{ fontSize: '12px' }}
                  label={{
                    value: 'Minutos',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: '#737373' },
                  }}
                />
                <Bar dataKey="minutes" fill="#FFFFFF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-64">
            <h3 className="text-sm text-gray-400 mb-2">Questões: volume e rendimento</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={questionChartData}>
                <XAxis dataKey="name" stroke="#737373" style={{ fontSize: '12px' }} />
                <YAxis
                  yAxisId="left"
                  stroke="#737373"
                  style={{ fontSize: '12px' }}
                  label={{
                    value: 'Total',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: '#737373' },
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#737373"
                  style={{ fontSize: '12px' }}
                  domain={[0, 100]}
                  label={{
                    value: '%',
                    angle: -90,
                    position: 'insideRight',
                    style: { fill: '#737373' },
                  }}
                />
                <Tooltip
                  contentStyle={{ background: '#0b0b0b', border: '1px solid #222' }}
                  formatter={(value: number, name: string) =>
                    name === 'rendimento'
                      ? [`${value}%`, 'Rendimento']
                      : [value, 'Total']
                  }
                />
                <Bar yAxisId="left" dataKey="total" fill="#FFFFFF" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="rendimento" stroke="#10B981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Worst performing topics */}
      {worstTopics.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-4">Tópicos que precisam de atenção</h2>
          <div className="space-y-3">
            {worstTopics.map((topic) => (
              <div
                key={topic.topicId}
                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
              >
                <div>
                  <p className="font-medium">{topic.topicName}</p>
                  <p className="text-sm text-gray-400">{topic.subjectName}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{topic.accuracy}%</p>
                  <p className="text-xs text-gray-400">Precisão</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Topic Metrics */}
      {topicMetrics.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold">Análise por Tópico</h2>
            <button
              onClick={() => setShowDetailedMetrics(!showDetailedMetrics)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              {showDetailedMetrics ? 'Ver menos' : 'Ver detalhes'}
            </button>
          </div>

          {showDetailedMetrics && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-400">{strongTopics.length}</p>
                  <p className="text-sm text-gray-400">Tópicos fortes</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-400">{topicMetrics.filter(m => m.strength === 'intermediate').length}</p>
                  <p className="text-sm text-gray-400">Intermediários</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-400">{weakTopics.length}</p>
                  <p className="text-sm text-gray-400">Fracos</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-400">{improvementTopics.length}</p>
                  <p className="text-sm text-gray-400">Alto potencial</p>
                </div>
              </div>

              {/* Topics with improvement potential (best ROI) */}
              {improvementTopics.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-400" />
                    Melhor retorno (60-75% de acerto)
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Nestes tópicos você tem o maior ganho de pontos com menos esforço
                  </p>
                  <div className="space-y-2">
                    {improvementTopics.map((m) => (
                      <TopicRow key={m.topicId} metrics={m} />
                    ))}
                  </div>
                </div>
              )}

              {/* Rising trends */}
              {risingTopics.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Em evolução
                  </h3>
                  <div className="space-y-2">
                    {risingTopics.map((m) => (
                      <TopicRow key={m.topicId} metrics={m} />
                    ))}
                  </div>
                </div>
              )}

              {/* Weaknesses */}
              {weakTopics.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Fraquezas consolidadas
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Estes tópicos têm pelo menos 20 questões feitas e menos de 70% de acerto
                  </p>
                  <div className="space-y-2">
                    {weakTopics.map((m) => (
                      <TopicRow key={m.topicId} metrics={m} />
                    ))}
                  </div>
                </div>
              )}

              {/* All topics */}
              <div>
                <h3 className="text-lg font-semibold mb-1">Todos os tópicos</h3>
                <p className="text-sm text-gray-400 mb-3">
                  Clique em um tópico para ver o desempenho por subtópico
                </p>
                <div className="space-y-2">
                  {topicMetrics
                    .sort((a, b) => {
                      // Sort by weakness first, then by confidence index
                      if (a.isWeakness && !b.isWeakness) return -1;
                      if (!a.isWeakness && b.isWeakness) return 1;
                      return b.confidenceIndex - a.confidenceIndex;
                    })
                    .map((m) => (
                      <TopicRow key={m.topicId} metrics={m} expandable />
                    ))}
                </div>
              </div>
            </>
          )}

          {!showDetailedMetrics && (
            <div className="space-y-2">
              {topicMetrics
                .sort((a, b) => a.accuracyPercent - b.accuracyPercent)
                .slice(0, 5)
                .map((m) => (
                  <TopicRow key={m.topicId} metrics={m} />
                ))}
              {topicMetrics.length > 5 && (
                <p className="text-center text-gray-400 text-sm py-2">
                  + {topicMetrics.length - 5} outros tópicos
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  onClick?: () => void;
}

function StatCard({ icon, label, value, description, onClick }: StatCardProps) {
  const clickable = typeof onClick === 'function';
  return (
    <div
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick!();
              }
            }
          : undefined
      }
      className={`bg-gray-900 rounded-lg p-6 border border-gray-800 transition-colors ${
        clickable ? 'cursor-pointer hover:border-blue-600' : 'hover:border-gray-700'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="text-gray-400">{icon}</div>
        <span className="text-sm font-medium text-gray-400">{label}</span>
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}
