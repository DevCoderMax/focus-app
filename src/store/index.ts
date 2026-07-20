import { create } from 'zustand';
import type {
  ActivityPlanItem,
  Note,
  Profile,
  Question,
  QuestionHistoryEntry,
  ReviewAttempt,
  ReviewSchedule,
  Settings,
  StudySession,
  Subject,
  Subtopic,
  Topic,
} from '@/types';
import * as api from '@/services/apiService';

interface AppState {
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
  settings: Settings | null;
  profiles: Profile[];
  activeProfileId: string | null;
  profilesLoaded: boolean;
  completedTopics: string[];
  completedSubtopics: string[];
  timerSeconds: number;
  timerIsRunning: boolean;
  timerStartedAt: string | null;
  isLoading: boolean;
  error: string | null;

  loadAllData: () => Promise<void>;
  refreshData: () => Promise<void>;

  addSubject: (subject: Subject) => Promise<void>;
  updateSubject: (subject: Subject) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  reorderSubjects: (subjects: Subject[]) => Promise<void>;

  addTopic: (topic: Topic) => Promise<void>;
  updateTopic: (topic: Topic) => Promise<void>;
  deleteTopic: (id: string) => Promise<void>;
  toggleTopicCompletion: (topicId: string) => Promise<void>;
  reorderTopics: (topics: Topic[]) => Promise<void>;

  addSubtopic: (subtopic: Subtopic) => Promise<void>;
  updateSubtopic: (subtopic: Subtopic) => Promise<void>;
  deleteSubtopic: (id: string) => Promise<void>;
  toggleSubtopicCompletion: (subtopicId: string) => Promise<void>;
  reorderSubtopics: (subtopics: Subtopic[]) => Promise<void>;

  getSubjectProgress: (subjectId: string) => { completed: number; total: number; percentage: number };
  getAllSubjectsProgress: () => { completed: number; total: number; percentage: number };

  addNote: (note: Note) => Promise<void>;
  updateNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  addQuestion: (question: Question) => Promise<void>;
  updateQuestion: (question: Question) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;

  addStudySession: (session: StudySession) => Promise<void>;
  deleteStudySession: (id: string) => Promise<void>;

  addReviewSchedule: (schedule: ReviewSchedule) => Promise<void>;
  updateReviewSchedule: (schedule: ReviewSchedule) => Promise<void>;
  addReviewAttempt: (attempt: ReviewAttempt) => Promise<void>;

  addQuestionHistory: (entry: QuestionHistoryEntry) => Promise<void>;
  deleteQuestionHistory: (id: string) => Promise<void>;

  addActivityPlanItem: (item: ActivityPlanItem) => Promise<void>;
  updateActivityPlanItem: (item: ActivityPlanItem) => Promise<void>;
  deleteActivityPlanItem: (id: string) => Promise<void>;
  incrementActivityPlanProgress: (id: string) => Promise<void>;
  decrementActivityPlanProgress: (id: string) => Promise<void>;
  markActivityPlanCompleted: (id: string) => Promise<void>;
  getActivityPlanProgress: () => { completed: number; total: number; percentage: number };

  updateSettings: (settings: Partial<Settings>) => Promise<void>;

  loadProfiles: () => Promise<void>;
  setActiveProfile: (profileId: string) => Promise<void>;
  createProfile: (name: string, avatar?: string) => Promise<void>;
  updateProfile: (profile: Profile) => Promise<void>;
  deleteProfile: (profileId: string) => Promise<void>;

  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;
}

const sortByOrder = <T extends { order?: number; createdAt?: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.createdAt || '').localeCompare(String(b.createdAt || '')));

const replaceById = <T extends { id: string }>(items: T[], item: T): T[] =>
  items.map((current) => (current.id === item.id ? item : current));

function removeCascade(state: AppState, type: 'subject' | 'topic' | 'subtopic', id: string) {
  if (type === 'subject') {
    const topicIds = new Set(state.topics.filter((topic) => topic.subjectId === id).map((topic) => topic.id));
    const subtopicIds = new Set(state.subtopics.filter((subtopic) => topicIds.has(subtopic.topicId)).map((subtopic) => subtopic.id));
    return {
      subjects: state.subjects.filter((subject) => subject.id !== id),
      topics: state.topics.filter((topic) => topic.subjectId !== id),
      subtopics: state.subtopics.filter((subtopic) => !topicIds.has(subtopic.topicId)),
      notes: state.notes.filter((note) => !topicIds.has(note.topicId)),
      questions: state.questions.filter((question) => !topicIds.has(question.topicId)),
      activityPlanItems: state.activityPlanItems.filter((item) => !topicIds.has(item.topicId)),
      completedTopics: state.completedTopics.filter((topicId) => !topicIds.has(topicId)),
      completedSubtopics: state.completedSubtopics.filter((subtopicId) => !subtopicIds.has(subtopicId)),
    };
  }
  if (type === 'topic') {
    const subtopicIds = new Set(state.subtopics.filter((subtopic) => subtopic.topicId === id).map((subtopic) => subtopic.id));
    return {
      topics: state.topics.filter((topic) => topic.id !== id),
      subtopics: state.subtopics.filter((subtopic) => subtopic.topicId !== id),
      notes: state.notes.filter((note) => note.topicId !== id),
      questions: state.questions.filter((question) => question.topicId !== id),
      activityPlanItems: state.activityPlanItems.filter((item) => item.topicId !== id),
      completedTopics: state.completedTopics.filter((topicId) => topicId !== id),
      completedSubtopics: state.completedSubtopics.filter((subtopicId) => !subtopicIds.has(subtopicId)),
    };
  }
  return {
    subtopics: state.subtopics.filter((subtopic) => subtopic.id !== id),
    notes: state.notes.filter((note) => note.subtopicId !== id),
    questions: state.questions.filter((question) => question.subtopicId !== id),
    activityPlanItems: state.activityPlanItems.filter((item) => item.subtopicId !== id),
    completedSubtopics: state.completedSubtopics.filter((subtopicId) => subtopicId !== id),
  };
}

export const useStore = create<AppState>((set, get) => ({
  subjects: [],
  topics: [],
  subtopics: [],
  notes: [],
  questions: [],
  studySessions: [],
  reviewSchedules: [],
  reviewAttempts: [],
  questionHistory: [],
  activityPlanItems: [],
  settings: null,
  profiles: [],
  activeProfileId: api.getActiveProfileId(),
  profilesLoaded: false,
  completedTopics: [],
  completedSubtopics: [],
  timerSeconds: 0,
  timerIsRunning: false,
  timerStartedAt: null,
  isLoading: false,
  error: null,

  loadAllData: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getAppState();
      api.setActiveProfileId(data.activeProfileId);
      set({
        subjects: sortByOrder(data.subjects),
        topics: sortByOrder(data.topics),
        subtopics: sortByOrder(data.subtopics),
        notes: data.notes,
        questions: data.questions,
        studySessions: data.studySessions,
        reviewSchedules: data.reviewSchedules,
        reviewAttempts: data.reviewAttempts,
        questionHistory: data.questionHistory,
        activityPlanItems: data.activityPlanItems,
        settings: data.settings,
        profiles: data.profiles,
        activeProfileId: data.activeProfileId,
        completedTopics: data.completedTopics,
        completedSubtopics: data.completedSubtopics,
        isLoading: false,
      });
    } catch (error) {
      set({ error: 'Failed to load data', isLoading: false });
      console.error('Error loading data:', error);
    }
  },

  refreshData: async () => {
    await get().loadAllData();
  },

  addSubject: async (subject) => {
    const maxOrder = get().subjects.reduce((max, item) => Math.max(max, item.order ?? 0), -1);
    const created = await api.createResource<Subject>('subjects', { ...subject, order: maxOrder + 1 });
    set({ subjects: sortByOrder([...get().subjects, created]) });
  },
  updateSubject: async (subject) => {
    const updated = await api.updateResource<Subject>('subjects', subject);
    set({ subjects: sortByOrder(replaceById(get().subjects, updated)) });
  },
  deleteSubject: async (id) => {
    await api.deleteResource('subjects', id);
    set((state) => removeCascade(state, 'subject', id));
  },
  reorderSubjects: async (subjects) => {
    const ordered = await api.reorderResource<Subject>('subjects', subjects.map((subject) => subject.id));
    set({ subjects: sortByOrder(ordered) });
  },

  addTopic: async (topic) => {
    const maxOrder = get().topics
      .filter((item) => item.subjectId === topic.subjectId)
      .reduce((max, item) => Math.max(max, item.order ?? 0), -1);
    const created = await api.createResource<Topic>('topics', { ...topic, order: maxOrder + 1 });
    set({ topics: sortByOrder([...get().topics, created]) });
  },
  updateTopic: async (topic) => {
    const updated = await api.updateResource<Topic>('topics', topic);
    set({ topics: sortByOrder(replaceById(get().topics, updated)) });
  },
  deleteTopic: async (id) => {
    await api.deleteResource('topics', id);
    set((state) => removeCascade(state, 'topic', id));
  },
  reorderTopics: async (topics) => {
    const ordered = await api.reorderResource<Topic>('topics', topics.map((topic) => topic.id));
    const orderedIds = new Set(ordered.map((topic) => topic.id));
    set({ topics: sortByOrder([...get().topics.filter((topic) => !orderedIds.has(topic.id)), ...ordered]) });
  },
  toggleTopicCompletion: async (topicId) => {
    const isCompleted = get().completedTopics.includes(topicId);
    const nextCompleted = !isCompleted;
    const topicSubtopics = get().subtopics.filter((subtopic) => subtopic.topicId === topicId);
    const result = await api.setCompletedItem('topic', topicId, nextCompleted);
    if (!nextCompleted) {
      await Promise.all(topicSubtopics.map((subtopic) => api.setCompletedItem('subtopic', subtopic.id, false)));
      set({
        completedTopics: result.completedTopics,
        completedSubtopics: get().completedSubtopics.filter((id) => !topicSubtopics.some((subtopic) => subtopic.id === id)),
      });
      return;
    }
    set(result);
  },

  addSubtopic: async (subtopic) => {
    const maxOrder = get().subtopics
      .filter((item) => item.topicId === subtopic.topicId)
      .reduce((max, item) => Math.max(max, item.order ?? 0), -1);
    const created = await api.createResource<Subtopic>('subtopics', { ...subtopic, order: maxOrder + 1 });
    set({ subtopics: sortByOrder([...get().subtopics, created]) });
  },
  updateSubtopic: async (subtopic) => {
    const updated = await api.updateResource<Subtopic>('subtopics', subtopic);
    set({ subtopics: sortByOrder(replaceById(get().subtopics, updated)) });
  },
  deleteSubtopic: async (id) => {
    await api.deleteResource('subtopics', id);
    set((state) => removeCascade(state, 'subtopic', id));
  },
  reorderSubtopics: async (subtopics) => {
    const ordered = await api.reorderResource<Subtopic>('subtopics', subtopics.map((subtopic) => subtopic.id));
    const orderedIds = new Set(ordered.map((subtopic) => subtopic.id));
    set({ subtopics: sortByOrder([...get().subtopics.filter((subtopic) => !orderedIds.has(subtopic.id)), ...ordered]) });
  },
  toggleSubtopicCompletion: async (subtopicId) => {
    const subtopic = get().subtopics.find((item) => item.id === subtopicId);
    const isCompleted = get().completedSubtopics.includes(subtopicId);
    let result = await api.setCompletedItem('subtopic', subtopicId, !isCompleted);
    if (subtopic) {
      const topicSubtopics = get().subtopics.filter((item) => item.topicId === subtopic.topicId);
      const completedSubtopics = new Set(result.completedSubtopics);
      const shouldCompleteTopic = topicSubtopics.length > 0 && topicSubtopics.every((item) => completedSubtopics.has(item.id));
      result = await api.setCompletedItem('topic', subtopic.topicId, shouldCompleteTopic);
    }
    set(result);
  },

  getSubjectProgress: (subjectId) => {
    const { topics, subtopics, completedTopics, completedSubtopics } = get();
    const subjectTopics = topics.filter((topic) => topic.subjectId === subjectId);
    const subjectTopicIds = new Set(subjectTopics.map((topic) => topic.id));
    const subjectSubtopics = subtopics.filter((subtopic) => subjectTopicIds.has(subtopic.topicId));
    const total = subjectTopics.length + subjectSubtopics.length;
    const completed =
      subjectTopics.filter((topic) => completedTopics.includes(topic.id)).length +
      subjectSubtopics.filter((subtopic) => completedSubtopics.includes(subtopic.id)).length;
    return { completed, total, percentage: total === 0 ? 0 : Math.round((completed / total) * 100) };
  },
  getAllSubjectsProgress: () => {
    const totals = get().subjects.reduce(
      (acc, subject) => {
        const progress = get().getSubjectProgress(subject.id);
        return { completed: acc.completed + progress.completed, total: acc.total + progress.total };
      },
      { completed: 0, total: 0 }
    );
    return { ...totals, percentage: totals.total === 0 ? 0 : Math.round((totals.completed / totals.total) * 100) };
  },

  addNote: async (note) => {
    const created = await api.createResource<Note>('notes', note);
    set({ notes: [created, ...get().notes] });
  },
  updateNote: async (note) => {
    const updated = await api.updateResource<Note>('notes', note);
    set({ notes: replaceById(get().notes, updated) });
  },
  deleteNote: async (id) => {
    await api.deleteResource('notes', id);
    set({ notes: get().notes.filter((note) => note.id !== id) });
  },

  addQuestion: async (question) => {
    const created = await api.createResource<Question>('questions', question);
    set({ questions: [...get().questions, created] });
  },
  updateQuestion: async (question) => {
    const updated = await api.updateResource<Question>('questions', question);
    set({ questions: replaceById(get().questions, updated) });
  },
  deleteQuestion: async (id) => {
    await api.deleteResource('questions', id);
    set({ questions: get().questions.filter((question) => question.id !== id) });
  },

  addStudySession: async (session) => {
    const created = await api.createResource<StudySession>('study-sessions', session);
    set({ studySessions: [created, ...get().studySessions] });
  },
  deleteStudySession: async (id) => {
    await api.deleteResource('study-sessions', id);
    set({ studySessions: get().studySessions.filter((session) => session.id !== id) });
  },
  addReviewSchedule: async (schedule) => {
    const created = await api.createResource<ReviewSchedule>('review-schedules', schedule);
    set({ reviewSchedules: [...get().reviewSchedules, created] });
  },
  updateReviewSchedule: async (schedule) => {
    const updated = await api.updateResource<ReviewSchedule>('review-schedules', schedule);
    set({ reviewSchedules: replaceById(get().reviewSchedules, updated) });
  },
  addReviewAttempt: async (attempt) => {
    const created = await api.createResource<ReviewAttempt>('review-attempts', attempt);
    set({ reviewAttempts: [created, ...get().reviewAttempts] });
  },
  addQuestionHistory: async (entry) => {
    const created = await api.createResource<QuestionHistoryEntry>('question-history', entry);
    set({ questionHistory: [created, ...get().questionHistory] });
  },
  deleteQuestionHistory: async (id) => {
    await api.deleteResource('question-history', id);
    set({ questionHistory: get().questionHistory.filter((entry) => entry.id !== id) });
  },

  addActivityPlanItem: async (item) => {
    const targetCount = Math.max(1, item.targetCount || 1);
    const completedCount = Math.max(0, Math.min(item.completedCount || 0, targetCount));
    const created = await api.createResource<ActivityPlanItem>('activity-plan-items', {
      ...item,
      targetCount,
      completedCount,
      status: completedCount >= targetCount ? 'completed' : 'pending',
    });
    set({ activityPlanItems: [...get().activityPlanItems, created] });
  },
  updateActivityPlanItem: async (item) => {
    const targetCount = Math.max(1, item.targetCount || 1);
    const completedCount = Math.max(0, Math.min(item.completedCount || 0, targetCount));
    const updated = await api.updateResource<ActivityPlanItem>('activity-plan-items', {
      ...item,
      targetCount,
      completedCount,
      status: completedCount >= targetCount ? 'completed' : 'pending',
    });
    set({ activityPlanItems: replaceById(get().activityPlanItems, updated) });
  },
  deleteActivityPlanItem: async (id) => {
    await api.deleteResource('activity-plan-items', id);
    set({ activityPlanItems: get().activityPlanItems.filter((item) => item.id !== id) });
  },
  incrementActivityPlanProgress: async (id) => {
    const item = get().activityPlanItems.find((planItem) => planItem.id === id);
    if (item) await get().updateActivityPlanItem({ ...item, completedCount: item.completedCount + 1 });
  },
  decrementActivityPlanProgress: async (id) => {
    const item = get().activityPlanItems.find((planItem) => planItem.id === id);
    if (item) await get().updateActivityPlanItem({ ...item, completedCount: item.completedCount - 1 });
  },
  markActivityPlanCompleted: async (id) => {
    const item = get().activityPlanItems.find((planItem) => planItem.id === id);
    if (item) await get().updateActivityPlanItem({ ...item, completedCount: item.targetCount, status: 'completed' });
  },
  getActivityPlanProgress: () => get().getAllSubjectsProgress(),

  updateSettings: async (newSettings) => {
    const settings = await api.updateSettings(newSettings);
    set({ settings });
  },

  loadProfiles: async () => {
    const profiles = await api.listProfiles();
    if (profiles.length === 0) {
      // No profiles: clear any stale activeProfileId from localStorage
      window.localStorage.removeItem('focus.activeProfile');
      set({ profiles: [], activeProfileId: null, profilesLoaded: true });
      return;
    }
    const storedId = api.getActiveProfileId();
    // Only use stored ID if it matches an existing profile
    const validStoredId = profiles.find((p) => p.id === storedId)?.id || null;
    const activeProfileId = validStoredId || profiles[0]?.id || null;
    if (activeProfileId) api.setActiveProfileId(activeProfileId);
    set({ profiles, activeProfileId, profilesLoaded: true });
  },

  setActiveProfile: async (profileId) => {
    api.setActiveProfileId(profileId);
    set({ activeProfileId: profileId });
    await get().refreshData();
  },
  createProfile: async (name, avatar) => {
    const profile = await api.createProfile({ name, avatar });
    api.setActiveProfileId(profile.id);
    set({ profiles: [...get().profiles, profile], activeProfileId: profile.id });
    await get().refreshData();
  },
  updateProfile: async (profile) => {
    const updated = await api.updateProfile(profile);
    set({ profiles: replaceById(get().profiles, updated) });
  },
  deleteProfile: async (profileId) => {
    await api.deleteProfile(profileId);
    const profiles = get().profiles.filter((profile) => profile.id !== profileId);
    const nextProfileId = get().activeProfileId === profileId ? profiles[0]?.id || null : get().activeProfileId;
    if (nextProfileId) {
      api.setActiveProfileId(nextProfileId);
      set({ profiles, activeProfileId: nextProfileId });
      await get().refreshData();
    } else {
      // No profiles left: clear stored ID and reset all data
      window.localStorage.removeItem('focus.activeProfile');
      set({
        profiles: [],
        activeProfileId: null,
        profilesLoaded: true,
        subjects: [],
        topics: [],
        subtopics: [],
        notes: [],
        questions: [],
        studySessions: [],
        reviewSchedules: [],
        reviewAttempts: [],
        questionHistory: [],
        activityPlanItems: [],
        settings: null,
        completedTopics: [],
        completedSubtopics: [],
      });
    }
  },

  startTimer: () => {
    set((state) => ({ timerIsRunning: true, timerStartedAt: state.timerStartedAt || new Date().toISOString() }));
  },
  pauseTimer: () => set({ timerIsRunning: false }),
  resetTimer: () => set({ timerIsRunning: false, timerSeconds: 0, timerStartedAt: null }),
  tickTimer: () => {
    set((state) => ({ timerSeconds: state.timerIsRunning ? state.timerSeconds + 1 : state.timerSeconds }));
  },
}));
