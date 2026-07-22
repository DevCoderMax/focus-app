import type { ReviewSchedule, StudySession } from '@/types';
import { createResource, updateResource } from '@/services/apiService';
import { generateId } from '@/utils/helpers';

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function isOverdue(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Returns the review plan based on accuracy.
 * >90%: no review (optional 1 at 7 days)
 * 70-90%: 1 review at 3 days
 * 50-70%: 2 reviews at 1, 7 days
 * <50%: 3 reviews at 1, 3, 7 days
 */
export function getAutoReviewPlan(accuracy: number): { count: number; intervals: number[] } {
  if (accuracy > 90) {
    return { count: 0, intervals: [] };
  }
  if (accuracy >= 70) {
    return { count: 1, intervals: [3] };
  }
  if (accuracy >= 50) {
    return { count: 2, intervals: [1, 7] };
  }
  return { count: 3, intervals: [1, 3, 7] };
}

/**
 * Creates review schedules after a study session with questions.
 */
export async function createReviewsFromSession(
  session: StudySession,
  accuracy: number,
  mode: 'auto' | 'manual',
  manualIntervals?: number[]
): Promise<void> {
  const baseDate = new Date(session.endedAt);
  let intervals: number[];

  if (mode === 'manual' && manualIntervals && manualIntervals.length > 0) {
    intervals = manualIntervals;
  } else {
    const plan = getAutoReviewPlan(accuracy);
    intervals = plan.intervals;
  }

  if (intervals.length === 0) return;

  for (let i = 0; i < intervals.length; i++) {
    const review: ReviewSchedule = {
      id: generateId(),
      topicId: session.topicId,
      subtopicId: session.subtopicId,
      originSessionId: session.id,
      dueAt: addDays(baseDate, intervals[i]).toISOString(),
      status: 'pending',
      reviewOrder: i + 1,
      totalReviews: intervals.length,
      reviewMode: mode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await createResource('review-schedules', review);
  }
}

/**
 * After a review attempt, recalculate remaining pending reviews.
 * - If improved tier: remove unnecessary remaining reviews
 * - If worsened tier: add more reviews or shorten intervals
 */
export async function recalculateAfterReview(
  completedSchedule: ReviewSchedule,
  newAccuracy: number,
  allSchedules: ReviewSchedule[]
): Promise<void> {
  const pendingSchedules = allSchedules
    .filter(
      (s) =>
        s.originSessionId === completedSchedule.originSessionId &&
        s.status === 'pending' &&
        s.id !== completedSchedule.id
    )
    .sort((a, b) => a.reviewOrder - b.reviewOrder);

  if (pendingSchedules.length === 0) return;

  const newPlan = getAutoReviewPlan(newAccuracy);
  const remainingNeeded = Math.max(0, newPlan.count - 1); // -1 because current review just completed

  // If we need fewer reviews than currently scheduled, remove extras
  if (remainingNeeded < pendingSchedules.length) {
    const toRemove = pendingSchedules.slice(remainingNeeded);
    for (const schedule of toRemove) {
      await updateResource('review-schedules', { ...schedule, status: 'completed' as const });
    }
  }

  // If we need more reviews than currently scheduled, add extras
  if (remainingNeeded > pendingSchedules.length && newPlan.intervals.length > 0) {
    const lastDue = new Date(completedSchedule.dueAt);
    const existingCount = pendingSchedules.length;
    const extraIntervals = newPlan.intervals.slice(existingCount + 1);

    for (let i = 0; i < extraIntervals.length; i++) {
      const review: ReviewSchedule = {
        id: generateId(),
        topicId: completedSchedule.topicId,
        subtopicId: completedSchedule.subtopicId,
        originSessionId: completedSchedule.originSessionId,
        dueAt: addDays(lastDue, extraIntervals[i]).toISOString(),
        status: 'pending',
        reviewOrder: existingCount + i + 2,
        totalReviews: newPlan.count,
        reviewMode: 'auto',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await createResource('review-schedules', review);
    }
  }
}
