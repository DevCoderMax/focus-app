import { Brain, AlertTriangle, Heart, Moon } from 'lucide-react';
import { ScoreGauge } from './ScoreGauge';
import type { MentalStateData } from '@/types';

interface MentalStateCardProps {
  data: MentalStateData;
}

export function MentalStateCard({ data }: MentalStateCardProps) {
  const getBurnoutBadge = () => {
    switch (data.burnoutRisk) {
      case 'high':
        return (
          <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-full flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Alto
          </span>
        );
      case 'moderate':
        return (
          <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
            Moderado
          </span>
        );
      case 'low':
        return (
          <span className="px-2 py-1 text-xs bg-orange-500/20 text-orange-400 rounded-full">
            Baixo
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full flex items-center gap-1">
            <Heart className="w-3 h-3" />
            Nenhum
          </span>
        );
    }
  };

  const getLabelColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-[#111] border border-[#222] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium">Estado Mental</h3>
        {getBurnoutBadge()}
      </div>

      <div className="flex items-center gap-6">
        <ScoreGauge score={data.overallScore} size={100} />
        
        <div className="flex-1">
          <p className={`text-xl font-semibold ${getLabelColor(data.overallScore)}`}>
            {data.overallLabel}
          </p>
          
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-gray-500" />
              <span className="text-gray-400">Respostas em branco:</span>
              <span className="text-white">{data.indicators.blankAnswerRate}%</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-gray-500" />
              <span className="text-gray-400">Padrão de energia:</span>
              <span className="text-white capitalize">{data.indicators.energyPattern}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
