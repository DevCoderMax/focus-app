import { useEffect } from 'react';
import { useStore } from '@/store';
import type { Goal } from '@/types';
import { CoachingBanner } from '@/components/goals/CoachingBanner';
import { ConsistencyCard } from '@/components/goals/ConsistencyCard';
import { MotivationCard } from '@/components/goals/MotivationCard';
import { MentalStateCard } from '@/components/goals/MentalStateCard';
import { HabitsCard } from '@/components/goals/HabitsCard';
import { WeeklyReport } from '@/components/goals/WeeklyReport';
import { GoalsList } from '@/components/goals/GoalsList';
import { Loader2 } from 'lucide-react';

export function GoalsPage() {
  const {
    goalsAnalytics,
    settings,
    loadAllData,
    loadGoalsAnalytics,
    addGoal,
    updateGoal,
    deleteGoal,
  } = useStore();

  useEffect(() => {
    loadAllData();
    loadGoalsAnalytics();
  }, [loadAllData, loadGoalsAnalytics]);

  const animated = settings ? !settings.disableProgressAnimations : true;

  if (!goalsAnalytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Coaching Banner - The most important component */}
      <CoachingBanner message={goalsAnalytics.coachingMessage} />

      {/* Weekly Report */}
      <WeeklyReport data={goalsAnalytics.weeklyReport} />

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ConsistencyCard data={goalsAnalytics.consistency} />
        <MotivationCard data={goalsAnalytics.motivation} />
        <MentalStateCard data={goalsAnalytics.mentalState} />
        <HabitsCard data={goalsAnalytics.habits} />
      </div>

      {/* Goals List */}
      <GoalsList animated={animated}
        goals={goalsAnalytics.goals || []}
        onAdd={async (goal) => {
          await addGoal(goal);
          await loadGoalsAnalytics();
        }}
        onUpdate={updateGoal as (goal: Goal) => Promise<void>}
        onDelete={async (id) => {
          await deleteGoal(id);
          await loadGoalsAnalytics();
        }}
      />
    </div>
  );
}
