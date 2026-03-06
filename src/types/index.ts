// Data Models
export interface Subject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  topicId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export type QuestionType = 'mcq' | 'open';

export interface MCQQuestion {
  id: string;
  topicId: string;
  type: 'mcq';
  prompt: string;
  choices: string[];
  answerIndex: number;
  explanation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpenQuestion {
  id: string;
  topicId: string;
  type: 'open';
  prompt: string;
  sampleAnswer?: string;
  createdAt: string;
  updatedAt: string;
}

export type Question = MCQQuestion | OpenQuestion;

export type StudyMode = 'pomodoro' | 'free' | 'countdown';

export type ActivityType = 'lesson' | 'questions' | 'lesson_questions';

export type ActivityPlanMaterialType = ActivityType | 'pdf';
export type ActivityPlanStatus = 'pending' | 'completed';

export interface ActivityPlanItem {
  id: string;
  topicId: string;
  title: string;
  teacherName?: string;
  materialType: ActivityPlanMaterialType;
  targetCount: number;
  completedCount: number;
  status: ActivityPlanStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  id: string;
  topicId: string;
  activityType: ActivityType;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  mode: StudyMode;
  difficulty?: 1 | 2 | 3 | 4 | 5;
}

export type ReviewStatus = 'pending' | 'completed' | 'overdue';

export interface ReviewSchedule {
  id: string;
  topicId: string;
  originSessionId: string;
  dueAt: string;
  status: ReviewStatus;
  createdAt: string;
}

export interface ReviewAttempt {
  id: string;
  scheduleId: string;
  correctCount: number;
  questionCount: number;
  accuracy: number;
  durationSec: number;
  completedAt: string;
}

export interface QuestionHistoryEntry {
  id: string;
  topicId: string;
  sessionId?: string;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  notes?: string;
  createdAt: string;
}

export interface Settings {
  pomodoroMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  dailyGoalMinutes: number;
  enableSounds: boolean;
  theme: 'dark' | 'light';
}

// Export/Import
export interface ExportData {
  meta: {
    app: string;
    version: string;
    exportedAt: string;
  };
  data: {
    subjects: Subject[];
    topics: Topic[];
    notes: Note[];
    questions: Question[];
    studySessions: StudySession[];
    reviewSchedules: ReviewSchedule[];
    reviewAttempts: ReviewAttempt[];
    questionHistory: QuestionHistoryEntry[];
    activityPlanItems: ActivityPlanItem[];
    settings: Settings;
  };
}

// Stats
export interface DailyStats {
  date: string;
  totalMinutes: number;
  sessionCount: number;
}

export interface TopicPerformance {
  topicId: string;
  topicName: string;
  subjectName: string;
  accuracy: number;
  totalReviews: number;
}

// Topic Metrics for Dashboard
type TopicStrength = 'strong' | 'intermediate' | 'weak' | 'little_trained';
type TrendDirection = 'rising' | 'falling' | 'stable';

export interface TopicMetrics {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  // Basic metrics
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  accuracyPercent: number;
  // Advanced metrics
  confidenceIndex: number; // weighted by volume
  isWeakness: boolean; // consolidated weakness (total >= 20 AND accuracy < 70%)
  isLittleTrained: boolean; // total < 10
  strength: TopicStrength;
  // Trend analysis
  recentAccuracy: number; // last 20 questions
  previousAccuracy: number; // before last 20
  trend: TrendDirection;
  // Strategic
  improvementPotential: boolean; // 60-75% zone - best ROI
}
