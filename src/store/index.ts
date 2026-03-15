import { create } from 'zustand';
import type {
  Subject,
  Topic,
  Subtopic,
  Note,
  Question,
  StudySession,
  ReviewSchedule,
  ReviewAttempt,
  QuestionHistoryEntry,
  Settings,
  Profile,
  ActivityPlanItem,
} from '@/types';
import * as storage from '@/data/storage';
import * as profileService from '@/services/profileService';

interface AppState {
  // Data
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

  // Completion tracking
  completedTopics: string[];
  completedSubtopics: string[];

  // Timer
  timerSeconds: number;
  timerIsRunning: boolean;
  timerStartedAt: string | null;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  loadAllData: () => Promise<void>;

  // Subjects
  addSubject: (subject: Subject) => Promise<void>;
  updateSubject: (subject: Subject) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  reorderSubjects: (subjects: Subject[]) => Promise<void>;

  // Topics
  addTopic: (topic: Topic) => Promise<void>;
  updateTopic: (topic: Topic) => Promise<void>;
  deleteTopic: (id: string) => Promise<void>;
  toggleTopicCompletion: (topicId: string) => void;
  reorderTopics: (topics: Topic[]) => Promise<void>;

  // Subtopics
  addSubtopic: (subtopic: Subtopic) => Promise<void>;
  updateSubtopic: (subtopic: Subtopic) => Promise<void>;
  deleteSubtopic: (id: string) => Promise<void>;
  toggleSubtopicCompletion: (subtopicId: string) => void;
  reorderSubtopics: (subtopics: Subtopic[]) => Promise<void>;

  // Progress calculations
  getSubjectProgress: (subjectId: string) => { completed: number; total: number; percentage: number };
  getAllSubjectsProgress: () => { completed: number; total: number; percentage: number };

  // Notes
  addNote: (note: Note) => Promise<void>;
  updateNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  // Questions
  addQuestion: (question: Question) => Promise<void>;
  updateQuestion: (question: Question) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;

  // Study Sessions
  addStudySession: (session: StudySession) => Promise<void>;
  deleteStudySession: (id: string) => Promise<void>;

  // Review Schedules
  addReviewSchedule: (schedule: ReviewSchedule) => Promise<void>;
  updateReviewSchedule: (schedule: ReviewSchedule) => Promise<void>;

  // Review Attempts
  addReviewAttempt: (attempt: ReviewAttempt) => Promise<void>;

  // Question History
  addQuestionHistory: (entry: QuestionHistoryEntry) => Promise<void>;
  deleteQuestionHistory: (id: string) => Promise<void>;

  // Activity Plan Items (Aulas/Conteúdos)
  addActivityPlanItem: (item: ActivityPlanItem) => Promise<void>;
  updateActivityPlanItem: (item: ActivityPlanItem) => Promise<void>;
  deleteActivityPlanItem: (id: string) => Promise<void>;
  incrementActivityPlanProgress: (id: string) => Promise<void>;
  decrementActivityPlanProgress: (id: string) => Promise<void>;
  markActivityPlanCompleted: (id: string) => Promise<void>;
  getActivityPlanProgress: () => {
    completed: number;
    total: number;
    percentage: number;
  };

  // Settings
  updateSettings: (settings: Partial<Settings>) => Promise<void>;

  // Profiles
  loadProfiles: () => void;
  setActiveProfile: (profileId: string) => void;
  createProfile: (name: string) => void;
  updateProfile: (profile: Profile) => void;
  deleteProfile: (profileId: string) => void;

  // Timer actions
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;

  // Refresh data
  refreshData: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
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
  activeProfileId: null,
  completedTopics: [],
  completedSubtopics: [],
  timerSeconds: 0,
  timerIsRunning: false,
  timerStartedAt: null,
  isLoading: false,
  error: null,

  // Load all data from IndexedDB
  loadAllData: async () => {
    set({ isLoading: true, error: null });
    try {
      await storage.initDB();
      await storage.initSettings();

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

      // Load completion tracking from localStorage
      let completedTopics: string[] = [];
      let completedSubtopics: string[] = [];
      try {
        const storedTopics = localStorage.getItem('focus.completedTopics');
        const storedSubtopics = localStorage.getItem('focus.completedSubtopics');
        if (storedTopics) completedTopics = JSON.parse(storedTopics);
        if (storedSubtopics) completedSubtopics = JSON.parse(storedSubtopics);
      } catch {
        // Ignore localStorage errors
      }

      set({
        subjects: subjects.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        topics: topics.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        subtopics: subtopics.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        notes,
        questions,
        studySessions,
        reviewSchedules,
        reviewAttempts,
        questionHistory,
        activityPlanItems,
        settings,
        completedTopics,
        completedSubtopics,
        isLoading: false,
      });
    } catch (error) {
      set({ error: 'Failed to load data', isLoading: false });
      console.error('Error loading data:', error);
    }
  },

  // Subjects
  addSubject: async (subject) => {
    const currentSubjects = get().subjects;
    const maxOrder = currentSubjects.reduce((max, s) => Math.max(max, s.order ?? 0), -1);
    const newSubject = { ...subject, order: maxOrder + 1 };
    await storage.add('subjects', newSubject);
    set({ subjects: [...currentSubjects, newSubject] });
  },

  updateSubject: async (subject) => {
    await storage.put('subjects', subject);
    set({
      subjects: get().subjects.map((s) => (s.id === subject.id ? subject : s))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    });
  },

  deleteSubject: async (id) => {
    await storage.remove('subjects', id);
    // Also delete related topics
    const topicsToDelete = get().topics.filter((t) => t.subjectId === id);
    for (const topic of topicsToDelete) {
      await get().deleteTopic(topic.id);
    }
    set({ subjects: get().subjects.filter((s) => s.id !== id) });
  },

  reorderSubjects: async (newSubjects) => {
    const subjectsWithOrder = newSubjects.map((s, index) => ({ ...s, order: index }));
    await Promise.all(subjectsWithOrder.map(s => storage.put('subjects', s)));
    set({ subjects: subjectsWithOrder });
  },

  // Topics
  addTopic: async (topic) => {
    const currentTopics = get().topics.filter(t => t.subjectId === topic.subjectId);
    const maxOrder = currentTopics.reduce((max, t) => Math.max(max, t.order ?? 0), -1);
    const newTopic = { ...topic, order: maxOrder + 1 };
    await storage.add('topics', newTopic);
    set({ topics: [...get().topics, newTopic].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) });
  },

  updateTopic: async (topic) => {
    await storage.put('topics', topic);
    set({
      topics: get().topics.map((t) => (t.id === topic.id ? topic : t))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    });
  },

  deleteTopic: async (id) => {
    await storage.remove('topics', id);
    // Delete related items
    const subtopicsToDelete = get().subtopics.filter((st) => st.topicId === id);
    for (const subtopic of subtopicsToDelete) {
      await get().deleteSubtopic(subtopic.id);
    }

    const notesToDelete = get().notes.filter((n) => n.topicId === id);
    const questionsToDelete = get().questions.filter((q) => q.topicId === id);

    await Promise.all([
      ...notesToDelete.map((n) => storage.remove('notes', n.id)),
      ...questionsToDelete.map((q) => storage.remove('questions', q.id)),
    ]);

    set({
      topics: get().topics.filter((t) => t.id !== id),
      notes: get().notes.filter((n) => n.topicId !== id),
      questions: get().questions.filter((q) => q.topicId !== id),
    });
  },

  reorderTopics: async (newTopics) => {
    const topicsWithOrder = newTopics.map((t, index) => ({ ...t, order: index }));
    // Update only the topics that were passed (usually for a specific subject)
    await Promise.all(topicsWithOrder.map(t => storage.put('topics', t)));
    
    // Update state merging with topics from other subjects
    const allTopics = get().topics;
    const reorderedIds = new Set(newTopics.map(t => t.id));
    const mergedTopics = [
      ...allTopics.filter(t => !reorderedIds.has(t.id)),
      ...topicsWithOrder
    ].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    
    set({ topics: mergedTopics });
  },

  // Subtopics
  addSubtopic: async (subtopic) => {
    const currentSubtopics = get().subtopics.filter(st => st.topicId === subtopic.topicId);
    const maxOrder = currentSubtopics.reduce((max, st) => Math.max(max, st.order ?? 0), -1);
    const newSubtopic = { ...subtopic, order: maxOrder + 1 };
    await storage.add('subtopics', newSubtopic);
    set({ subtopics: [...get().subtopics, newSubtopic].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) });
  },

  updateSubtopic: async (subtopic) => {
    await storage.put('subtopics', subtopic);
    set({
      subtopics: get().subtopics.map((t) => (t.id === subtopic.id ? subtopic : t))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    });
  },

  deleteSubtopic: async (id) => {
    await storage.remove('subtopics', id);
    // Future cascades depending on requirements (notes, questions linked to the subtopic)
    const completedSubtopics = get().completedSubtopics.filter((sid) => sid !== id);
    localStorage.setItem('focus.completedSubtopics', JSON.stringify(completedSubtopics));
    set({
      subtopics: get().subtopics.filter((t) => t.id !== id),
      completedSubtopics,
    });
  },

  reorderSubtopics: async (newSubtopics) => {
    const subtopicsWithOrder = newSubtopics.map((st, index) => ({ ...st, order: index }));
    await Promise.all(subtopicsWithOrder.map(st => storage.put('subtopics', st)));
    
    const allSubtopics = get().subtopics;
    const reorderedIds = new Set(newSubtopics.map(st => st.id));
    const mergedSubtopics = [
      ...allSubtopics.filter(st => !reorderedIds.has(st.id)),
      ...subtopicsWithOrder
    ].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    
    set({ subtopics: mergedSubtopics });
  },

  toggleTopicCompletion: (topicId) => {
    const { completedTopics, completedSubtopics, subtopics } = get();
    const isCompleted = completedTopics.includes(topicId);
    const newCompletedTopics = isCompleted
      ? completedTopics.filter((id) => id !== topicId)
      : [...completedTopics, topicId];
    
    // If unchecking a topic, also uncheck all its subtopics
    let newCompletedSubtopics = [...completedSubtopics];
    if (isCompleted) {
      const topicSubtopics = subtopics.filter((st) => st.topicId === topicId);
      newCompletedSubtopics = newCompletedSubtopics.filter(
        (id) => !topicSubtopics.some((st) => st.id === id)
      );
    }
    
    localStorage.setItem('focus.completedTopics', JSON.stringify(newCompletedTopics));
    localStorage.setItem('focus.completedSubtopics', JSON.stringify(newCompletedSubtopics));
    set({ completedTopics: newCompletedTopics, completedSubtopics: newCompletedSubtopics });
  },

  toggleSubtopicCompletion: (subtopicId) => {
    const { completedSubtopics, completedTopics, subtopics } = get();
    const isCompleted = completedSubtopics.includes(subtopicId);
    const newCompletedSubtopics = isCompleted
      ? completedSubtopics.filter((id) => id !== subtopicId)
      : [...completedSubtopics, subtopicId];
    
    // Find the topic this subtopic belongs to
    const subtopic = subtopics.find((st) => st.id === subtopicId);
    let newCompletedTopics = [...completedTopics];
    
    if (subtopic) {
      const topicId = subtopic.topicId;
      const topicSubtopics = subtopics.filter((st) => st.topicId === topicId);
      const allSubtopicsCompleted = topicSubtopics.every((st) =>
        newCompletedSubtopics.includes(st.id)
      );
      
      if (allSubtopicsCompleted && topicSubtopics.length > 0) {
        // Auto-complete the topic if all subtopics are completed
        if (!newCompletedTopics.includes(topicId)) {
          newCompletedTopics.push(topicId);
        }
      } else {
        // Uncheck the topic if not all subtopics are completed
        newCompletedTopics = newCompletedTopics.filter((id) => id !== topicId);
      }
    }
    
    localStorage.setItem('focus.completedSubtopics', JSON.stringify(newCompletedSubtopics));
    localStorage.setItem('focus.completedTopics', JSON.stringify(newCompletedTopics));
    set({ completedSubtopics: newCompletedSubtopics, completedTopics: newCompletedTopics });
  },

  getSubjectProgress: (subjectId) => {
    const { topics, subtopics, completedTopics, completedSubtopics } = get();
    
    const subjectTopics = topics.filter((t) => t.subjectId === subjectId);
    const subjectTopicIds = subjectTopics.map((t) => t.id);
    const subjectSubtopics = subtopics.filter((st) => subjectTopicIds.includes(st.topicId));
    
    const total = subjectTopics.length + subjectSubtopics.length;
    const completedTopicCount = subjectTopics.filter((t) => completedTopics.includes(t.id)).length;
    const completedSubtopicCount = subjectSubtopics.filter((st) => completedSubtopics.includes(st.id)).length;
    const completed = completedTopicCount + completedSubtopicCount;
    
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    return { completed, total, percentage };
  },

  getAllSubjectsProgress: () => {
    const { subjects } = get();
    
    let totalCompleted = 0;
    let totalItems = 0;
    
    subjects.forEach((subject) => {
      const progress = get().getSubjectProgress(subject.id);
      totalCompleted += progress.completed;
      totalItems += progress.total;
    });
    
    const percentage = totalItems === 0 ? 0 : Math.round((totalCompleted / totalItems) * 100);
    
    return { completed: totalCompleted, total: totalItems, percentage };
  },

  // Notes
  addNote: async (note) => {
    await storage.add('notes', note);
    set({ notes: [...get().notes, note] });
  },

  updateNote: async (note) => {
    await storage.put('notes', note);
    set({
      notes: get().notes.map((n) => (n.id === note.id ? note : n)),
    });
  },

  deleteNote: async (id) => {
    await storage.remove('notes', id);
    set({ notes: get().notes.filter((n) => n.id !== id) });
  },

  // Questions
  addQuestion: async (question) => {
    await storage.add('questions', question);
    set({ questions: [...get().questions, question] });
  },

  updateQuestion: async (question) => {
    await storage.put('questions', question);
    set({
      questions: get().questions.map((q) => (q.id === question.id ? question : q)),
    });
  },

  deleteQuestion: async (id) => {
    await storage.remove('questions', id);
    set({ questions: get().questions.filter((q) => q.id !== id) });
  },

  // Study Sessions
  addStudySession: async (session) => {
    await storage.add('studySessions', session);
    set({ studySessions: [...get().studySessions, session] });
  },
  deleteStudySession: async (id) => {
    await storage.remove('studySessions', id);
    set({ studySessions: get().studySessions.filter((session) => session.id !== id) });
  },

  // Review Schedules
  addReviewSchedule: async (schedule) => {
    await storage.add('reviewSchedules', schedule);
    set({ reviewSchedules: [...get().reviewSchedules, schedule] });
  },

  updateReviewSchedule: async (schedule) => {
    await storage.put('reviewSchedules', schedule);
    set({
      reviewSchedules: get().reviewSchedules.map((s) =>
        s.id === schedule.id ? schedule : s
      ),
    });
  },

  // Review Attempts
  addReviewAttempt: async (attempt) => {
    await storage.add('reviewAttempts', attempt);
    set({ reviewAttempts: [...get().reviewAttempts, attempt] });
  },

  // Question History
  addQuestionHistory: async (entry) => {
    await storage.add('questionHistory', entry);
    set({ questionHistory: [...get().questionHistory, entry] });
  },
  deleteQuestionHistory: async (id) => {
    await storage.remove('questionHistory', id);
    set({ questionHistory: get().questionHistory.filter((item) => item.id !== id) });
  },

  // Activity Plan Items
  addActivityPlanItem: async (item) => {
    const normalizedTarget = Math.max(1, item.targetCount || 1);
    const normalizedCompleted = Math.max(0, Math.min(item.completedCount || 0, normalizedTarget));
    const normalized: ActivityPlanItem = {
      ...item,
      targetCount: normalizedTarget,
      completedCount: normalizedCompleted,
      status: normalizedCompleted >= normalizedTarget ? 'completed' : 'pending',
      updatedAt: new Date().toISOString(),
    };

    await storage.add('activityPlanItems', normalized);
    set({ activityPlanItems: [...get().activityPlanItems, normalized] });
  },

  updateActivityPlanItem: async (item) => {
    const normalizedTarget = Math.max(1, item.targetCount || 1);
    const normalizedCompleted = Math.max(0, Math.min(item.completedCount || 0, normalizedTarget));
    const normalized: ActivityPlanItem = {
      ...item,
      targetCount: normalizedTarget,
      completedCount: normalizedCompleted,
      status: normalizedCompleted >= normalizedTarget ? 'completed' : 'pending',
      updatedAt: new Date().toISOString(),
    };

    await storage.put('activityPlanItems', normalized);
    set({
      activityPlanItems: get().activityPlanItems.map((planItem) =>
        planItem.id === normalized.id ? normalized : planItem
      ),
    });
  },

  deleteActivityPlanItem: async (id) => {
    await storage.remove('activityPlanItems', id);
    set({ activityPlanItems: get().activityPlanItems.filter((item) => item.id !== id) });
  },

  incrementActivityPlanProgress: async (id) => {
    const item = get().activityPlanItems.find((planItem) => planItem.id === id);
    if (!item) return;
    const completedCount = Math.min(item.targetCount, item.completedCount + 1);
    await get().updateActivityPlanItem({
      ...item,
      completedCount,
      status: completedCount >= item.targetCount ? 'completed' : 'pending',
    });
  },

  decrementActivityPlanProgress: async (id) => {
    const item = get().activityPlanItems.find((planItem) => planItem.id === id);
    if (!item) return;
    const completedCount = Math.max(0, item.completedCount - 1);
    await get().updateActivityPlanItem({
      ...item,
      completedCount,
      status: completedCount >= item.targetCount ? 'completed' : 'pending',
    });
  },

  markActivityPlanCompleted: async (id) => {
    const item = get().activityPlanItems.find((planItem) => planItem.id === id);
    if (!item) return;
    await get().updateActivityPlanItem({
      ...item,
      completedCount: item.targetCount,
      status: 'completed',
    });
  },

  getActivityPlanProgress: () => {
    // Now returns progress based on topics and subtopics completion
    return get().getAllSubjectsProgress();
  },

  // Settings
  updateSettings: async (newSettings) => {
    await storage.updateSettings(newSettings);
    const settings = await storage.getSettings();
    set({ settings });
  },

  // Timer
  startTimer: () => {
    set((state) => ({
      timerIsRunning: true,
      timerStartedAt: state.timerStartedAt || new Date().toISOString(),
    }));
  },
  pauseTimer: () => {
    set({ timerIsRunning: false });
  },
  resetTimer: () => {
    set({ timerIsRunning: false, timerSeconds: 0, timerStartedAt: null });
  },
  tickTimer: () => {
    set((state) => ({
      timerSeconds: state.timerIsRunning ? state.timerSeconds + 1 : state.timerSeconds,
    }));
  },

  // Refresh all data
  refreshData: async () => {
    await get().loadAllData();
  },

  // Profiles
  loadProfiles: () => {
    const profiles = profileService.getProfiles();
    const activeProfileId = profileService.getActiveProfileId();
    set({ profiles, activeProfileId });
  },
  setActiveProfile: (profileId) => {
    profileService.setActiveProfileId(profileId);
    storage.setActiveProfile(profileId);
    set({ activeProfileId: profileId });
    get().refreshData();
  },
  createProfile: (name) => {
    const profiles = profileService.getProfiles();
    const newProfile = profileService.createProfile(name);
    const updated = [...profiles, newProfile];
    profileService.saveProfiles(updated);
    profileService.setActiveProfileId(newProfile.id);
    storage.setActiveProfile(newProfile.id);
    set({ profiles: updated, activeProfileId: newProfile.id });
    get().refreshData();
  },
  updateProfile: (profile) => {
    const profiles = profileService.getProfiles();
    const updatedProfile = profileService.updateProfile(profile);
    const updated = profiles.map((p) => (p.id === profile.id ? updatedProfile : p));
    profileService.saveProfiles(updated);
    set({ profiles: updated });
  },
  deleteProfile: (profileId) => {
    const profiles = profileService.getProfiles().filter((p) => p.id !== profileId);
    profileService.saveProfiles(profiles);
    const activeProfileId = profileService.getActiveProfileId();
    if (activeProfileId === profileId) {
      const nextProfile = profiles[0] || null;
      if (nextProfile) {
        profileService.setActiveProfileId(nextProfile.id);
        storage.setActiveProfile(nextProfile.id);
      } else {
        profileService.setActiveProfileId('');
      }
      set({ activeProfileId: nextProfile?.id || null });
      get().refreshData();
    }
    set({ profiles });
  },
}));
