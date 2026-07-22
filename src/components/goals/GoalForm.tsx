import React, { useState, useEffect } from 'react';
import { Clock, Hash } from 'lucide-react';
import type { Goal } from '@/types';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';

interface GoalFormProps {
  goal?: Goal | null;
  onSubmit: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

const goalTypes = [
  { value: 'study_time', label: 'Tempo de estudo', icon: Clock, unit: 'min/dia' },
  { value: 'volume', label: 'Volume de questões', icon: Hash, unit: 'questões' },
];

const periods = [
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
];

export function GoalForm({ goal, onSubmit, onClose }: GoalFormProps) {
  const [title, setTitle] = useState(goal?.title || '');
  const [description, setDescription] = useState(goal?.description || '');
  const [goalType, setGoalType] = useState<Goal['goalType']>(goal?.goalType || 'study_time');
  const [targetValue, setTargetValue] = useState(goal?.targetValue?.toString() || '');
  const [unit, setUnit] = useState(goal?.unit || 'min');
  const [period, setPeriod] = useState<Goal['period']>(goal?.period || 'weekly');
  const [endDate, setEndDate] = useState(goal?.endDate?.split('T')[0] || '');

  useEffect(() => {
    if (!goal) {
      if (goalType === 'study_time') {
        setUnit('min');
      } else {
        setUnit('count');
      }
    }
  }, [goalType, goal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetValue) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      goalType,
      targetValue: parseFloat(targetValue),
      currentValue: goal?.currentValue || 0,
      unit: unit || undefined,
      period,
      startDate: goal?.startDate || new Date().toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      status: goal?.status || 'active',
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={goal ? 'Editar Meta' : 'Nova Meta'}
      size="md"
      footer={
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" form="goal-form" className="flex-1">
            {goal ? 'Salvar' : 'Criar Meta'}
          </Button>
        </div>
      }
    >
        <form id="goal-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/30"
              placeholder="Ex: Estudar 30 minutos por dia"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/30 resize-none"
              rows={2}
              placeholder="Opcional"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Tipo de meta *</label>
            <div className="grid grid-cols-2 gap-2">
              {goalTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setGoalType(type.value as Goal['goalType'])}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition-colors ${
                    goalType === type.value
                      ? 'border-white/30 bg-white/10 text-white'
                      : 'border-[#333] text-gray-400 hover:border-[#444]'
                  }`}
                >
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className={`grid gap-4 ${goalType === 'study_time' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Meta *</label>
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/30"
                placeholder="0"
                min="0"
                step="any"
                required
              />
            </div>

            {goalType === 'study_time' && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Unidade</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/30"
                >
                  <option value="min">Minutos</option>
                  <option value="h">Horas</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Período</label>
            <div className="flex gap-2">
              {periods.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPeriod(p.value as Goal['period'])}
                  className={`flex-1 py-2 rounded-lg border text-sm transition-colors ${
                    period === p.value
                      ? 'border-white/30 bg-white/10 text-white'
                      : 'border-[#333] text-gray-400 hover:border-[#444]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Data limite (opcional)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/30"
            />
          </div>
        </form>
    </Modal>
  );
}
