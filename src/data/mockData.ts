import type {
  Subject,
  Topic,
  Note,
  Question,
  StudySession,
  Settings,
  QuestionHistoryEntry,
} from '@/types';
import { generateId } from '@/utils/helpers';

export function generateMockData() {
  const now = new Date();
  
  // Subjects
  const subjects: Subject[] = [
    {
      id: 'sub-1',
      name: 'Matemática',
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'sub-2',
      name: 'Física',
      createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'sub-3',
      name: 'Química',
      createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // Topics
  const topics: Topic[] = [
    {
      id: 'top-1',
      subjectId: 'sub-1',
      name: 'Funções Quadráticas',
      description: 'Estudo completo de funções do segundo grau',
      createdAt: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'top-2',
      subjectId: 'sub-1',
      name: 'Trigonometria',
      description: 'Relações trigonométricas e círculo trigonométrico',
      createdAt: new Date(now.getTime() - 27 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 27 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'top-3',
      subjectId: 'sub-2',
      name: 'Cinemática',
      description: 'Movimento uniforme e uniformemente variado',
      createdAt: new Date(now.getTime() - 23 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 23 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'top-4',
      subjectId: 'sub-2',
      name: 'Dinâmica',
      description: 'Leis de Newton e aplicações',
      createdAt: new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'top-5',
      subjectId: 'sub-3',
      name: 'Estequiometria',
      description: 'Cálculos químicos e balanceamento',
      createdAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // Notes
  const notes: Note[] = [
    {
      id: 'note-1',
      topicId: 'top-1',
      title: 'Fórmula de Bhaskara',
      content: `# Fórmula de Bhaskara

A fórmula de Bhaskara é usada para encontrar as raízes de uma equação do segundo grau:

**ax² + bx + c = 0**

Onde:
- a ≠ 0
- Δ = b² - 4ac

**Fórmula:**
x = (-b ± √Δ) / 2a

**Casos:**
- Δ > 0: duas raízes reais distintas
- Δ = 0: uma raiz real (raiz dupla)
- Δ < 0: nenhuma raiz real`,
      createdAt: new Date(now.getTime() - 27 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 27 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'note-2',
      topicId: 'top-3',
      title: 'Equações do MRU',
      content: `# Movimento Retilíneo Uniforme (MRU)

**Características:**
- Velocidade constante
- Aceleração nula
- Trajetória retilínea

**Função horária:**
S = S₀ + vt

Onde:
- S: posição final
- S₀: posição inicial
- v: velocidade
- t: tempo`,
      createdAt: new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // Questions
  const questions: Question[] = [
    {
      id: 'q-1',
      topicId: 'top-1',
      type: 'mcq',
      prompt: 'Qual é o valor de Δ (delta) na equação x² - 5x + 6 = 0?',
      choices: ['1', '5', '11', '25'],
      answerIndex: 0,
      explanation: 'Δ = b² - 4ac = (-5)² - 4(1)(6) = 25 - 24 = 1',
      createdAt: new Date(now.getTime() - 26 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 26 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'q-2',
      topicId: 'top-1',
      type: 'mcq',
      prompt: 'Quantas raízes reais possui a equação x² + 2x + 5 = 0?',
      choices: ['0', '1', '2', 'Infinitas'],
      answerIndex: 0,
      explanation: 'Δ = 4 - 20 = -16 (negativo), logo não há raízes reais',
      createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'q-3',
      topicId: 'top-3',
      type: 'open',
      prompt: 'Um carro percorre 100 km em 2 horas. Qual sua velocidade média em km/h?',
      sampleAnswer: 'Velocidade média = distância / tempo = 100 km / 2 h = 50 km/h',
      createdAt: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // Study Sessions (last 7 days)
  const studySessions: StudySession[] = [];
  for (let i = 6; i >= 0; i--) {
    const sessionDate = new Date(now);
    sessionDate.setDate(sessionDate.getDate() - i);
    sessionDate.setHours(14, 0, 0, 0);

    // 1-2 sessions per day
    const sessionsCount = Math.random() > 0.3 ? 2 : 1;
    
    for (let j = 0; j < sessionsCount; j++) {
      const startDate = new Date(sessionDate);
      startDate.setHours(startDate.getHours() + j * 2);
      
      const durationSec = Math.floor(Math.random() * 1800) + 1200; // 20-50 min
      const endDate = new Date(startDate.getTime() + durationSec * 1000);

      studySessions.push({
        id: `session-${i}-${j}`,
        topicId: topics[Math.floor(Math.random() * topics.length)].id,
        activityType: 'lesson',
        startedAt: startDate.toISOString(),
        endedAt: endDate.toISOString(),
        durationSec,
        mode: 'pomodoro',
        difficulty: (Math.floor(Math.random() * 5) + 1) as 1 | 2 | 3 | 4 | 5,
      });
    }
  }

  return {
    subjects,
    topics,
    notes,
    questions,
    studySessions,
    questionHistory: [] as QuestionHistoryEntry[],
  };
}
