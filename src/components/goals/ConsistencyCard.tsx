import { Flame, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ScoreGauge } from './ScoreGauge';
import type { ConsistencyData } from '@/types';

interface ConsistencyCardProps {
  data: ConsistencyData;
}

export function ConsistencyCard({ data }: ConsistencyCardProps) {
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const maxMinutes = Math.max(...data.weeklyPattern, 1);

  const getTrendIcon = () => {
    switch (data.monthlyTrend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="bg-[#111] border border-[#222] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium">Consistência</h3>
        {getTrendIcon()}
      </div>

      <div className="flex items-center gap-6">
        <ScoreGauge score={data.consistencyScore} size={100} />
        
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-gray-400 text-sm">Streak atual:</span>
            <span className="text-white font-medium">{data.currentStreak} dias</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Média diária:</span>
            <span className="text-white font-medium">{data.averageMinutesPerDay} min</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Dias ativos (30d):</span>
            <span className="text-white font-medium">{data.daysStudiedLast30}/30</span>
          </div>
        </div>
      </div>

      {/* Weekly pattern chart */}
      <div className="mt-5 pt-4 border-t border-[#222]">
        <p className="text-xs text-gray-500 mb-3">Padrão semanal (minutos)</p>
        <div className="flex items-end justify-between gap-1 h-16">
          {data.weeklyPattern.map((minutes, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-white/20 rounded-t"
                style={{
                  height: `${(minutes / maxMinutes) * 100}%`,
                  minHeight: minutes > 0 ? '4px' : '0',
                }}
              />
              <span className="text-[10px] text-gray-500">{dayNames[index]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
