import { useEffect } from 'react';
import { useStore } from '@/store';

export function NotesPage() {
  const { loadAllData } = useStore();
  
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-2">Anotações</h1>
      <p className="text-gray-400">Funcionalidade em desenvolvimento</p>
    </div>
  );
}

export function QuestionsPage() {
  const { loadAllData } = useStore();
  
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-2">Banco de Questões</h1>
      <p className="text-gray-400">Funcionalidade em desenvolvimento</p>
    </div>
  );
}

export function ReviewsPage() {
  const { loadAllData } = useStore();
  
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-2">Revisões</h1>
      <p className="text-gray-400">Funcionalidade em desenvolvimento</p>
    </div>
  );
}

export function StudySessionPage() {
  const { loadAllData } = useStore();
  
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-2">Sessão de Estudo</h1>
      <p className="text-gray-400">Funcionalidade em desenvolvimento</p>
    </div>
  );
}
