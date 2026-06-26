import type { ReviewSchedule, StudySession } from '@/types';
import { createResource } from '@/services/apiService';
import { generateId } from '@/utils/helpers';

/**
 * Creates review schedules after a study session
 * - First review: 7 days after session
 * - Second review: 15 days after session
 */
export async function createReviewSchedules(session: StudySession): Promise<void> {
  const now = new Date(session.endedAt);
  
  // Create 7-day review
  const review7: ReviewSchedule = {
    id: generateId(),
    topicId: session.topicId,
    originSessionId: session.id,
    dueAt: addDays(now, 7).toISOString(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Create 15-day review
  const review15: ReviewSchedule = {
    id: generateId(),
    topicId: session.topicId,
    originSessionId: session.id,
    dueAt: addDays(now, 15).toISOString(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await createResource('review-schedules', review7);
  await createResource('review-schedules', review15);
}

/**
 * Creates reinforcement reviews based on accuracy
 * - ≥80%: No additional reviews
 * - 50-79%: +7 days
 * - <50%: +3 and +7 days
 */
export async function createReinforcementReviews(
  scheduleId: string,
  topicId: string,
  accuracy: number
): Promise<void> {
  const now = new Date();

  if (accuracy >= 80) {
    return; // Good performance, no reinforcement needed
  }

  if (accuracy >= 50) {
    // Medium performance: one review in 7 days
    const review: ReviewSchedule = {
      id: generateId(),
      topicId,
      originSessionId: scheduleId,
      dueAt: addDays(now, 7).toISOString(),
      status: 'pending',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    await createResource('review-schedules', review);
  } else {
    // Poor performance: reviews in 3 and 7 days
    const review3: ReviewSchedule = {
      id: generateId(),
      topicId,
      originSessionId: scheduleId,
      dueAt: addDays(now, 3).toISOString(),
      status: 'pending',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const review7: ReviewSchedule = {
      id: generateId(),
      topicId,
      originSessionId: scheduleId,
      dueAt: addDays(now, 7).toISOString(),
      status: 'pending',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await createResource('review-schedules', review3);
    await createResource('review-schedules', review7);
  }
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Helper to check if a date is today
export function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

// Helper to check if a date is overdue
export function isOverdue(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}
