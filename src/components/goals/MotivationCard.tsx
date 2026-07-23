import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { ScoreGauge } from './ScoreGauge';
import type { MotivationData } from '@/types';
import { ProgressBar } from '@/components/ProgressBar';

interface MotivationCardProps {
  data: MotivationData;
  animated?: boolean;
}

export function MotivationCard({ data, animated = true }: MotivationCardProps) {
  const getTrendIcon = () => {
    switch (data.trend) {
      case 'rising':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'falling':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRiskBadge = () => {
    switch (data.riskLevel) {
      case 'high':
        return (
          <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-full flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Alto risco
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
            Risco médio
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">
            Baixo risco
          </span>
        );
    }
  };

  const factors = [
    { label: 'Frequência', value: data.factors.frequency },
    { label: 'Duração', value: data.factors.duration },
    { label: 'Dificuldade', value: data.factors.difficulty },
    { label: 'Melhoria', value: data.factors.improvement },
  ];

  return (
    <div className="bg-[#111] border border-[#222] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium">Motivação</h3>
        <div className="flex items-center gap-2">
          {getRiskBadge()}
          {getTrendIcon()}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <ScoreGauge score={data.overallScore} size={100} />
        
        <div className="flex-1 space-y-2">
          {factors.map((factor) => (
            <div key={factor.label} className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-20">{factor.label}</span>
              <ProgressBar
                value={factor.value}
                animated={animated}
                trackClassName="bg-[#222]"
                fillClassName="bg-white/30"
                className="flex-1"
              />
              <span className="text-gray-500 text-xs w-8 text-right">
                {Math.round(factor.value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {data.lastActivityDays > 0 && data.lastActivityDays < 999 && (
        <div className="mt-4 pt-3 border-t border-[#222]">
          <p className="text-xs text-gray-500">
            Última atividade: <span className="text-gray-400">{data.lastActivityDays} dia(s) atrás</span>
          </p>
        </div>
      )}
      {data.lastActivityDays >= 999 && (
        <div className="mt-4 pt-3 border-t border-[#222]">
          <p className="text-xs text-gray-500">
            <span className="text-purple-400">Novo usuário</span> — comece sua primeira sessão!
          </p>
        </div>
      )}
    </div>
  );
}
