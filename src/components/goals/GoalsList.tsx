import { useState } from 'react';
import { Plus } from 'lucide-react';
import { GoalCard } from './GoalCard';
import { GoalForm } from './GoalForm';
import type { Goal } from '@/types';

interface GoalsListProps {
  goals: Goal[];
  onAdd: (goal: Goal) => void;
  onUpdate: (goal: Goal) => void;
  onDelete: (id: string) => void;
  animated?: boolean;
}

export function GoalsList({ goals, onAdd, onUpdate, onDelete, animated = true }: GoalsListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const handleSubmit = (goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingGoal) {
      onUpdate({ ...editingGoal, ...goalData } as Goal);
    } else {
      const now = new Date().toISOString();
      onAdd({
        ...goalData,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      } as Goal);
    }
    setIsFormOpen(false);
    setEditingGoal(null);
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingGoal(null);
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium">Minhas Metas</h3>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Meta
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-8 bg-[#111] border border-[#222] rounded-xl">
          <p className="text-gray-400">Nenhuma meta criada ainda.</p>
          <p className="text-gray-500 text-sm mt-1">Crie sua primeira meta para começar a acompanhar seu progresso.</p>
        </div>
      ) : (
        <>
          {activeGoals.length > 0 && (
            <div className="space-y-3 mb-6">
              {activeGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={handleEdit}
                  onDelete={onDelete}
                  animated={animated}
                />
              ))}
            </div>
          )}

          {completedGoals.length > 0 && (
            <div>
              <h4 className="text-sm text-gray-500 mb-3">Concluídas</h4>
              <div className="space-y-3">
                {completedGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={handleEdit}
                    onDelete={onDelete}
                    animated={animated}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {isFormOpen && (
        <GoalForm
          goal={editingGoal}
          onSubmit={handleSubmit}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
