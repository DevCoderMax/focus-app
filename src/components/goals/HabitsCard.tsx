import { Clock, BookOpen, Timer, Calendar } from 'lucide-react';
import type { HabitsData } from '@/types';

interface HabitsCardProps {
  data: HabitsData;
}

export function HabitsCard({ data }: HabitsCardProps) {
  return (
    <div className="bg-[#111] border border-[#222] rounded-xl p-5">
      <h3 className="text-white font-medium mb-4">Hábitos</h3>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/5 rounded-lg">
            <Clock className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Horário preferido</p>
            <p className="text-white text-sm">{data.preferredTime}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/5 rounded-lg">
            <Timer className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Sessão média</p>
            <p className="text-white text-sm">{data.averageSessionMinutes} minutos</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/5 rounded-lg">
            <BookOpen className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Matéria mais estudada</p>
            <p className="text-white text-sm">{data.mostStudiedSubject}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/5 rounded-lg">
            <Calendar className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Dias de estudo (30d)</p>
            <p className="text-white text-sm">{data.studyDaysPercentage}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
