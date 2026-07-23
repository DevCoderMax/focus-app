import { Check, Clock, Target, BookOpen, HelpCircle, Hash } from 'lucide-react';
import type { Goal } from '@/types';
import { ProgressBar } from '@/components/ProgressBar';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  animated?: boolean;
}

export function GoalCard({ goal, onEdit, onDelete, animated = true }: GoalCardProps) {
  const progress = goal.targetValue > 0 
    ? Math.min(100, (goal.currentValue / goal.targetValue) * 100) 
    : 0;
  
  const isCompleted = goal.status === 'completed';
  
  const getTypeIcon = () => {
    switch (goal.goalType) {
      case 'study_time':
        return <Clock className="w-4 h-4" />;
      case 'streak':
        return <Target className="w-4 h-4" />;
      case 'accuracy':
        return <HelpCircle className="w-4 h-4" />;
      case 'volume':
        return <Hash className="w-4 h-4" />;
      case 'completion':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getUnitLabel = () => {
    const periodSuffix =
      goal.period === 'daily' ? '/dia'
      : goal.period === 'weekly' ? '/semana'
      : goal.period === 'monthly' ? '/mês'
      : '';
    switch (goal.unit) {
      case 'min':
        return `min${periodSuffix}`;
      case 'h':
        return `h${periodSuffix}`;
      case 'count':
        return 'questões';
      default:
        return goal.unit || '';
    }
  };

  return (
    <div 
      className={`bg-[#111] border rounded-xl p-4 ${animated ? 'transition-all' : ''} ${
        isCompleted ? 'border-green-500/30 bg-green-500/5' : 'border-[#222] hover:border-[#333]'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-500/20' : 'bg-white/5'}`}>
            {isCompleted ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              getTypeIcon()
            )}
          </div>
          <div>
            <h4 className={`font-medium ${isCompleted ? 'text-green-400' : 'text-white'}`}>
              {goal.title}
            </h4>
            {goal.description && (
              <p className="text-xs text-gray-500 mt-1">{goal.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(goal)}
            className="p-1 text-gray-500 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="p-1 text-gray-500 hover:text-red-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            {goal.unit === 'h' 
              ? `${goal.currentValue.toFixed(1)} / ${goal.targetValue}`
              : `${goal.currentValue} / ${goal.targetValue}`
            } {getUnitLabel()}
          </span>
          <span className={`font-medium ${isCompleted ? 'text-green-400' : 'text-white'}`}>
            {Math.round(progress)}%
          </span>
        </div>
        
        <ProgressBar
          value={progress}
          animated={animated}
          trackClassName="bg-[#222]"
          fillClassName={isCompleted ? 'bg-green-500' : 'bg-white/30'}
        />
      </div>
      
      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
        <span className="capitalize">{goal.period}</span>
        {goal.endDate ? (
          <span>Até {new Date(goal.endDate).toLocaleDateString('pt-BR')}</span>
        ) : (
          <span>Sem prazo</span>
        )}
      </div>
    </div>
  );
}
