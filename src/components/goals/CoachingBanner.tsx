import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  TrendingDown,
  Coffee,
  Sun,
  Heart,
  AlertCircle,
  Trophy,
  Flame,
  Zap,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import type { CoachingMessage } from '@/types';

interface CoachingBannerProps {
  message: CoachingMessage;
}

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  AlertTriangle,
  Clock,
  TrendingDown,
  Coffee,
  Sun,
  Heart,
  AlertCircle,
  Trophy,
  Flame,
  Zap,
  ArrowRight,
  Sparkles,
};

export function CoachingBanner({ message }: CoachingBannerProps) {
  const navigate = useNavigate();
  const Icon = iconMap[message.icon] || ArrowRight;

  const getBgColor = (tone: string) => {
    switch (tone) {
      case 'urgent':
        return 'border-red-500/30 bg-red-500/5';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/5';
      case 'celebration':
        return 'border-green-500/30 bg-green-500/5';
      case 'empathy':
        return 'border-purple-500/30 bg-purple-500/5';
      case 'direct':
        return 'border-yellow-500/30 bg-yellow-500/5';
      default:
        return 'border-gray-500/30 bg-gray-500/5';
    }
  };

  return (
    <div
      className={`rounded-xl border p-6 ${getBgColor(message.tone)}`}
      style={{ '--tw-border-opacity': 1 } as React.CSSProperties}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex-shrink-0 p-3 rounded-full"
          style={{ backgroundColor: `${message.accentColor}20` }}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg text-white font-medium leading-relaxed">
            {message.text}
          </p>
          {message.subtext && (
            <p className="mt-2 text-gray-400">{message.subtext}</p>
          )}
        </div>
      </div>
      <div className="mt-4">
        <button
          onClick={() => navigate('/timer')}
          className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Começar uma sessão agora
        </button>
      </div>
    </div>
  );
}
