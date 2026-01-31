import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store';
import { formatDuration, formatDate } from '@/utils/helpers';
import { Clock, Target, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

export function DashboardPage() {
  const { studySessions, topics, subjects, reviewAttempts, loadAllData } = useStore();
  const [chartRangeDays, setChartRangeDays] = useState(7);

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
    let checkDate = new Date(today);
    const sessionDates = new Set(
      studySessions.map((s) => new Date(s.startedAt).toDateString())
    );
    
    while (sessionDates.has(checkDate.toDateString())) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

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
      weekSessions: weekSessions.length,
      avgAccuracy,
    };
  }, [studySessions, reviewAttempts]);

  // Chart data - last N days
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

  // Top 3 worst performing topics
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

  return (
    <div className="p-8">
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

      {/* Chart */}
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
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis
                dataKey="name"
                stroke="#737373"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#737373"
                style={{ fontSize: '12px' }}
                label={{ value: 'Minutos', angle: -90, position: 'insideLeft', style: { fill: '#737373' } }}
              />
              <Bar dataKey="minutes" fill="#FFFFFF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Worst performing topics */}
      {worstTopics.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-4">Temas que precisam de atenção</h2>
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
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}

function StatCard({ icon, label, value, description }: StatCardProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-gray-400">{icon}</div>
        <span className="text-sm font-medium text-gray-400">{label}</span>
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}
