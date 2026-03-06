import { z } from 'zod';
import type { ExportData } from '@/types';
import * as storage from '@/data/storage';

// Zod schemas for validation
const SubjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const TopicSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const SubtopicSchema = z.object({
  id: z.string(),
  topicId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const NoteSchema = z.object({
  id: z.string(),
  topicId: z.string(),
  subtopicId: z.string().optional(),
  title: z.string(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const MCQQuestionSchema = z.object({
  id: z.string(),
  topicId: z.string(),
  subtopicId: z.string().optional(),
  type: z.literal('mcq'),
  prompt: z.string(),
  choices: z.array(z.string()),
  answerIndex: z.number(),
  explanation: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const OpenQuestionSchema = z.object({
  id: z.string(),
  topicId: z.string(),
  subtopicId: z.string().optional(),
  type: z.literal('open'),
  prompt: z.string(),
  sampleAnswer: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const QuestionSchema = z.union([MCQQuestionSchema, OpenQuestionSchema]);

const StudySessionSchema = z.object({
  id: z.string(),
  topicId: z.string(),
  subtopicId: z.string().optional(),
  activityType: z.enum(['lesson', 'questions', 'lesson_questions']),
  startedAt: z.string(),
  endedAt: z.string(),
  durationSec: z.number(),
  mode: z.enum(['pomodoro', 'free', 'countdown']),
  difficulty: z
    .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])
    .optional(),
});

const ReviewScheduleSchema = z.object({
  id: z.string(),
  topicId: z.string(),
  subtopicId: z.string().optional(),
  originSessionId: z.string(),
  dueAt: z.string(),
  status: z.enum(['pending', 'completed', 'overdue']),
  createdAt: z.string(),
});

const ReviewAttemptSchema = z.object({
  id: z.string(),
  scheduleId: z.string(),
  correctCount: z.number(),
  questionCount: z.number(),
  accuracy: z.number(),
  durationSec: z.number(),
  completedAt: z.string(),
});

const QuestionHistorySchema = z.object({
  id: z.string(),
  topicId: z.string(),
  subtopicId: z.string().optional(),
  sessionId: z.string().optional(),
  correctCount: z.number(),
  wrongCount: z.number(),
  blankCount: z.number(),
  notes: z.string().optional(),
  createdAt: z.string(),
});

const ActivityPlanItemSchema = z.object({
  id: z.string(),
  topicId: z.string(),
  subtopicId: z.string().optional(),
  title: z.string(),
  teacherName: z.string().optional(),
  materialType: z.enum(['lesson', 'questions', 'lesson_questions', 'pdf']),
  targetCount: z.number(),
  completedCount: z.number(),
  status: z.enum(['pending', 'completed']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const SettingsSchema = z.object({
  pomodoroMinutes: z.number(),
  shortBreakMinutes: z.number(),
  longBreakMinutes: z.number(),
  dailyGoalMinutes: z.number(),
  enableSounds: z.boolean(),
  theme: z.enum(['dark', 'light']),
});

const ExportDataSchema = z.object({
  meta: z.object({
    app: z.string(),
    version: z.string(),
    exportedAt: z.string(),
  }),
  data: z.object({
    subjects: z.array(SubjectSchema),
    topics: z.array(TopicSchema),
    subtopics: z.array(SubtopicSchema),
    notes: z.array(NoteSchema),
    questions: z.array(QuestionSchema),
    studySessions: z.array(StudySessionSchema),
    reviewSchedules: z.array(ReviewScheduleSchema),
    reviewAttempts: z.array(ReviewAttemptSchema),
    questionHistory: z.array(QuestionHistorySchema),
    activityPlanItems: z.array(ActivityPlanItemSchema),
    settings: SettingsSchema,
  }),
});

/**
 * Export all data to JSON
 */
export async function exportData(): Promise<ExportData> {
  const [
    subjects,
    topics,
    subtopics,
    notes,
    questions,
    studySessions,
    reviewSchedules,
    reviewAttempts,
    questionHistory,
    activityPlanItems,
    settings,
  ] = await Promise.all([
    storage.getAll('subjects'),
    storage.getAll('topics'),
    storage.getAll('subtopics'),
    storage.getAll('notes'),
    storage.getAll('questions'),
    storage.getAll('studySessions'),
    storage.getAll('reviewSchedules'),
    storage.getAll('reviewAttempts'),
    storage.getAll('questionHistory'),
    storage.getAll('activityPlanItems'),
    storage.getSettings(),
  ]);

  return {
    meta: {
      app: 'FOCUS',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
    },
    data: {
      subjects,
      topics,
      subtopics,
      notes,
      questions,
      studySessions,
      reviewSchedules,
      reviewAttempts,
      questionHistory,
      activityPlanItems,
      settings,
    },
  };
}

/**
 * Download export as JSON file
 */
export function downloadExport(data: ExportData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `focus-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validate imported JSON
 */
export function validateImport(json: unknown): {
  valid: boolean;
  data?: ExportData;
  error?: string;
} {
  try {
    const data = ExportDataSchema.parse(json);
    return { valid: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`,
      };
    }
    return { valid: false, error: 'Invalid JSON format' };
  }
}

/**
 * Import data - REPLACE mode
 */
export async function importDataReplace(data: ExportData): Promise<void> {
  // Clear all existing data
  await storage.clearAll();

  // Import new data
  await Promise.all([
    ...data.data.subjects.map((item) => storage.add('subjects', item)),
    ...data.data.topics.map((item) => storage.add('topics', item)),
    ...data.data.subtopics.map((item) => storage.add('subtopics', item)),
    ...data.data.notes.map((item) => storage.add('notes', item)),
    ...data.data.questions.map((item) => storage.add('questions', item)),
    ...data.data.studySessions.map((item) => storage.add('studySessions', item)),
    ...data.data.reviewSchedules.map((item) => storage.add('reviewSchedules', item)),
    ...data.data.reviewAttempts.map((item) => storage.add('reviewAttempts', item)),
    ...data.data.questionHistory.map((item) => storage.add('questionHistory', item)),
    ...data.data.activityPlanItems.map((item) => storage.add('activityPlanItems', item)),
  ]);

  await storage.updateSettings(data.data.settings);
}

/**
 * Import data - MERGE mode
 */
export async function importDataMerge(data: ExportData): Promise<void> {
  // Get existing data
  const [
    existingSubjects,
    existingTopics,
    existingSubtopics,
    existingNotes,
    existingQuestions,
    existingSessions,
    existingSchedules,
    existingAttempts,
    existingHistory,
    existingActivityPlanItems,
  ] = await Promise.all([
    storage.getAll('subjects'),
    storage.getAll('topics'),
    storage.getAll('subtopics'),
    storage.getAll('notes'),
    storage.getAll('questions'),
    storage.getAll('studySessions'),
    storage.getAll('reviewSchedules'),
    storage.getAll('reviewAttempts'),
    storage.getAll('questionHistory'),
    storage.getAll('activityPlanItems'),
  ]);

  // Helper to merge items
  const mergeItems = async <T extends { id: string; updatedAt?: string }>(
    storeName: keyof storage.FocusDB,
    newItems: T[],
    existing: T[]
  ) => {
    for (const item of newItems) {
      const existingItem = existing.find((e) => e.id === item.id);

      if (!existingItem) {
        // New item, add it
        await storage.add(storeName, item as any);
      } else if (item.updatedAt && existingItem.updatedAt) {
        // Item exists, check if imported is newer
        if (new Date(item.updatedAt) > new Date(existingItem.updatedAt)) {
          await storage.put(storeName, item as any);
        }
      }
    }
  };

  // Merge all collections
  await Promise.all([
    mergeItems('subjects', data.data.subjects, existingSubjects),
    mergeItems('topics', data.data.topics, existingTopics),
    mergeItems('subtopics', data.data.subtopics, existingSubtopics),
    mergeItems('notes', data.data.notes, existingNotes),
    mergeItems('questions', data.data.questions, existingQuestions),
    mergeItems('studySessions', data.data.studySessions as any, existingSessions),
    mergeItems('reviewSchedules', data.data.reviewSchedules as any, existingSchedules),
    mergeItems('reviewAttempts', data.data.reviewAttempts as any, existingAttempts),
    mergeItems('questionHistory', data.data.questionHistory as any, existingHistory),
    mergeItems('activityPlanItems', data.data.activityPlanItems as any, existingActivityPlanItems),
  ]);

  // Merge settings (always use imported if they exist)
  if (data.data.settings) {
    await storage.updateSettings(data.data.settings);
  }
}

/**
 * Get import summary
 */
export function getImportSummary(data: ExportData): {
  subjects: number;
  topics: number;
  subtopics: number;
  notes: number;
  questions: number;
  studySessions: number;
  reviewSchedules: number;
  reviewAttempts: number;
  questionHistory: number;
  activityPlanItems: number;
} {
  return {
    subjects: data.data.subjects.length,
    topics: data.data.topics.length,
    subtopics: data.data.subtopics.length,
    notes: data.data.notes.length,
    questions: data.data.questions.length,
    studySessions: data.data.studySessions.length,
    reviewSchedules: data.data.reviewSchedules.length,
    reviewAttempts: data.data.reviewAttempts.length,
    questionHistory: data.data.questionHistory.length,
    activityPlanItems: data.data.activityPlanItems.length,
  };
}
