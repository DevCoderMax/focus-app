import { TrendingUp, TrendingDown, Minus, Target, Clock, MessageSquare } from 'lucide-react';
import type { WeeklyReport as WeeklyReportType } from '@/types';

interface WeeklyReportProps {
  data: WeeklyReportType;
}

export function WeeklyReport({ data }: WeeklyReportProps) {
  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getChangeText = (change: number, unit: string) => {
    if (change === 0) return 'Sem mudança';
    const prefix = change > 0 ? '+' : '';
    return `${prefix}${change}${unit}`;
  };

  return (
    <div className="bg-[#111] border border-[#222] rounded-xl p-5">
      <h3 className="text-white font-medium mb-4">Relatório da Semana</h3>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Minutos</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.totalMinutes}</p>
          <div className="flex items-center justify-center gap-1 mt-1">
            {getChangeIcon(data.comparedToLastWeek.minutesChange)}
            <span className="text-xs text-gray-500">
              {getChangeText(data.comparedToLastWeek.minutesChange, '')}
            </span>
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs">Sessões</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.totalSessions}</p>
          <div className="flex items-center justify-center gap-1 mt-1">
            {getChangeIcon(data.comparedToLastWeek.sessionsChange)}
            <span className="text-xs text-gray-500">
              {getChangeText(data.comparedToLastWeek.sessionsChange, '')}
            </span>
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
            <Target className="w-4 h-4" />
            <span className="text-xs">Metas</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {data.goalsMet}/{data.goalsTotal}
          </p>
        </div>
      </div>
      
      <div className="pt-3 border-t border-[#222] space-y-2">
        {data.topAchievement && (
          <div className="flex items-start gap-2">
            <span className="text-green-500 text-sm">✓</span>
            <p className="text-sm text-gray-300">{data.topAchievement}</p>
          </div>
        )}
        {data.improvementArea && (
          <div className="flex items-start gap-2">
            <span className="text-yellow-500 text-sm">→</span>
            <p className="text-sm text-gray-300">{data.improvementArea}</p>
          </div>
        )}
      </div>
    </div>
  );
}
