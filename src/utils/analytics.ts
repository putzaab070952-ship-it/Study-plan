import { Task, StudySession, Subject, Topic } from '../types';

/**
 * Calculates planned study minutes for a specific date from tasks
 */
export function calculatePlannedMinutesForDate(tasks: Task[], date: string): number {
  return tasks
    .filter(t => t.plannedDate === date && t.status !== 'cancelled')
    .reduce((sum, t) => sum + (t.plannedDurationMinutes || 0), 0);
}

/**
 * Calculates actual focused study minutes for a specific date from completed study sessions
 * Excludes duplicates or cancelled entries
 */
export function calculateActualMinutesForDate(sessions: StudySession[], date: string): number {
  return sessions
    .filter(s => s.date === date)
    .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
}

/**
 * Calculates task completion rate in percentage for a given date or range
 * Formula: (completed / total planned) * 100, excluding cancelled tasks
 */
export function calculateTaskCompletionRate(tasks: Task[]): {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  ratePercentage: number;
} {
  const activeTasks = tasks.filter(t => t.status !== 'cancelled');
  if (activeTasks.length === 0) {
    return { total: 0, completed: 0, pending: 0, overdue: 0, ratePercentage: 0 };
  }

  const completed = activeTasks.filter(t => t.status === 'completed').length;
  const pending = activeTasks.filter(t => t.status === 'todo' || t.status === 'in_progress').length;
  const overdue = activeTasks.filter(t => t.status !== 'completed' && t.dueDate && t.dueDate < (new Date().toISOString().split('T')[0])).length;

  const ratePercentage = Math.round((completed / activeTasks.length) * 100);

  return {
    total: activeTasks.length,
    completed,
    pending,
    overdue,
    ratePercentage
  };
}

/**
 * Calculates Subject syllabus progress strictly based on completed topics / total topics
 * Rule: NEVER mix topic completion with study hours!
 */
export function calculateSubjectTopicProgress(subject: Subject): {
  totalTopics: number;
  completedTopics: number;
  progressPercentage: number;
  remainingTopics: number;
} {
  const topics = subject.topics || [];
  if (topics.length === 0) {
    return {
      totalTopics: 0,
      completedTopics: 0,
      progressPercentage: 0,
      remainingTopics: 0
    };
  }

  const completed = topics.filter(t => t.status === 'completed').length;
  const progressPercentage = Math.round((completed / topics.length) * 100);

  return {
    totalTopics: topics.length,
    completedTopics: completed,
    progressPercentage,
    remainingTopics: topics.length - completed
  };
}

/**
 * Detects time overlaps between planned timed tasks on a specific date
 */
export interface TimeConflict {
  task1: Task;
  task2: Task;
  overlapMinutes: number;
}

export function detectTimeConflicts(tasks: Task[], date: string): TimeConflict[] {
  const timedTasks = tasks.filter(
    t => t.plannedDate === date && t.plannedStartTime && t.status !== 'cancelled' && t.status !== 'completed'
  );

  const conflicts: TimeConflict[] = [];

  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  for (let i = 0; i < timedTasks.length; i++) {
    const t1 = timedTasks[i];
    const start1 = timeToMinutes(t1.plannedStartTime!);
    const end1 = start1 + t1.plannedDurationMinutes;

    for (let j = i + 1; j < timedTasks.length; j++) {
      const t2 = timedTasks[j];
      const start2 = timeToMinutes(t2.plannedStartTime!);
      const end2 = start2 + t2.plannedDurationMinutes;

      // Check overlap
      if (Math.max(start1, start2) < Math.min(end1, end2)) {
        const overlapMinutes = Math.min(end1, end2) - Math.max(start1, start2);
        conflicts.push({ task1: t1, task2: t2, overlapMinutes });
      }
    }
  }

  return conflicts;
}
