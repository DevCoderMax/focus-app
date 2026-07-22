// Data Models
export interface Subject {
  id: string;
  name: string;
  order?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Profile {
  id: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  order?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Subtopic {
  id: string;
  topicId: string;
  name: string;
  order?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Note {
  id: string;
  topicId: string;
  subtopicId?: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export type QuestionType = 'mcq' | 'open';

export interface MCQQuestion {
  id: string;
  topicId: string;
  subtopicId?: string;
  type: 'mcq';
  prompt: string;
  choices: string[];
  answerIndex: number;
  explanation?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface OpenQuestion {
  id: string;
  topicId: string;
  subtopicId?: string;
  type: 'open';
  prompt: string;
  sampleAnswer?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export type Question = MCQQuestion | OpenQuestion;

export type StudyMode = 'pomodoro' | 'free' | 'countdown';

export type ActivityType = 'lesson' | 'questions' | 'lesson_questions';

export type ActivityPlanMaterialType = ActivityType | 'pdf';
export type ActivityPlanStatus = 'pending' | 'completed';

export interface ActivityPlanItem {
  id: string;
  topicId: string;
  subtopicId?: string;
  title: string;
  teacherName?: string;
  materialType: ActivityPlanMaterialType;
  targetCount: number;
  completedCount: number;
  status: ActivityPlanStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface StudySession {
  id: string;
  topicId: string;
  subtopicId?: string;
  activityType: ActivityType;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  mode: StudyMode;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export type ReviewStatus = 'pending' | 'completed' | 'overdue';

export interface ReviewSchedule {
  id: string;
  topicId: string;
  subtopicId?: string;
  originSessionId?: string;
  dueAt: string;
  status: ReviewStatus;
  reviewOrder: number;
  totalReviews: number;
  reviewMode: 'auto' | 'manual';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface ReviewAttempt {
  id: string;
  scheduleId: string;
  correctCount: number;
  questionCount: number;
  accuracy: number;
  durationSec: number;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface QuestionHistoryEntry {
  id: string;
  topicId: string;
  subtopicId?: string;
  sessionId?: string;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Settings {
  id: string;
  pomodoroMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  dailyGoalMinutes: number;
  enableSounds: boolean;
  theme: 'dark' | 'light';
  disableProgressAnimations: boolean;
  enableAutoReviews: boolean;
  updatedAt: string;
  deletedAt?: string;
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
    subtopics: Subtopic[];
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
  // Drill-down per subtopic (only populated for topics with question history)
  subtopics: SubtopicMetrics[];
}

// Per-subtopic breakdown shown when a topic row is expanded.
// The synthetic "Geral" bucket (subtopicId === null) holds questions
// logged directly on the topic without a subtopic.
export interface SubtopicMetrics {
  subtopicId: string | null;
  subtopicName: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  accuracyPercent: number;
  confidenceIndex: number;
  strength: TopicStrength;
}


// Goals & Analytics
export interface Goal {
  id: string;
  title: string;
  description?: string;
  goalType: 'study_time' | 'streak' | 'accuracy' | 'volume' | 'completion' | 'custom';
  targetValue: number;
  currentValue: number;
  unit?: string;
  subjectId?: string;
  topicId?: string;
  period: 'daily' | 'weekly' | 'monthly' | 'total';
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'expired' | 'abandoned';
  createdAt: string;
  updatedAt: string;
}

export interface CoachingMessage {
  text: string;
  subtext?: string;
  tone: 'gentle' | 'direct' | 'urgent' | 'celebration' | 'empathy' | 'warning';
  icon: string;
  accentColor: string;
}

export interface ConsistencyData {
  currentStreak: number;
  longestStreak: number;
  averageMinutesPerDay: number;
  daysStudiedLast30: number;
  consistencyScore: number;
  weeklyPattern: number[];
  monthlyTrend: 'improving' | 'declining' | 'stable';
  daysSinceLastSession: number;
}

export interface MotivationData {
  overallScore: number;
  factors: {
    frequency: number;
    duration: number;
    difficulty: number;
    improvement: number;
  };
  trend: 'rising' | 'falling' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
  lastActivityDays: number;
}

export interface MentalStateData {
  overallLabel: string;
  overallScore: number;
  indicators: {
    blankAnswerRate: number;
    difficultyTrend: 'easy' | 'hard' | 'mixed';
    sessionLengthConsistency: number;
    reviewAvoidance: number;
    timeOfDay: string;
    energyPattern: 'morning' | 'afternoon' | 'night' | 'distributed';
  };
  burnoutRisk: 'none' | 'low' | 'moderate' | 'high';
}

export interface HabitsData {
  preferredTime: string;
  averageSessionMinutes: number;
  favoriteMode: string;
  mostStudiedSubject: string;
  leastStudiedSubject: string;
  studyDaysPercentage: number;
  weekendVsWeekday: { weekend: number; weekday: number };
}

export interface WeeklyReport {
  totalMinutes: number;
  totalSessions: number;
  goalsMet: number;
  goalsTotal: number;
  topAchievement: string;
  improvementArea: string;
  comparedToLastWeek: {
    minutesChange: number;
    sessionsChange: number;
    accuracyChange: number;
  };
}

export interface GoalsAnalytics {
  coachingMessage: CoachingMessage;
  goals: Goal[];
  consistency: ConsistencyData;
  motivation: MotivationData;
  mentalState: MentalStateData;
  habits: HabitsData;
  weeklyReport: WeeklyReport;
}
