import { Task, UserSettings, Exam } from '../types';
import { addDays, diffDays } from './dateUtils';
import { calculatePlannedMinutesForDate } from './analytics';

export interface ScheduleRecommendation {
  task: Task;
  suggestedDate: string;
  suggestedStartTime?: string;
  reason: string;
  priorityScore: number;
}

export interface SmartScheduleResult {
  recommendations: ScheduleRecommendation[];
  unassignedTasks: Array<{ task: Task; reason: string }>;
  dailyWorkloads: Record<string, { plannedMinutes: number; newMinutes: number; maxMinutes: number }>;
}

/**
 * Calculates a priority score for ordering tasks
 * Higher score = higher urgency & importance
 */
export function calculateTaskUrgencyScore(task: Task, todayDate: string, exams: Exam[]): number {
  let score = 0;

  // Base priority
  if (task.priority === 'high') score += 100;
  if (task.priority === 'medium') score += 50;
  if (task.priority === 'low') score += 20;

  // Due date proximity
  if (task.dueDate) {
    const daysUntilDue = diffDays(task.dueDate, todayDate);
    if (daysUntilDue < 0) {
      score += 200; // Overdue is top priority
    } else if (daysUntilDue === 0) {
      score += 150; // Due today
    } else if (daysUntilDue <= 3) {
      score += 80;
    } else if (daysUntilDue <= 7) {
      score += 40;
    }
  }

  // Related to an upcoming exam
  const relatedExam = exams.find(e => e.subjectId === task.subjectId);
  if (relatedExam) {
    const daysToExam = diffDays(relatedExam.examDate, todayDate);
    if (daysToExam >= 0 && daysToExam <= 14) {
      score += Math.max(10, (14 - daysToExam) * 5);
    }
  }

  // Task type urgency
  if (task.type === 'exam') score += 50;
  if (task.type === 'homework') score += 30;
  if (task.type === 'practice') score += 20;

  return score;
}

/**
 * Generates smart schedule suggestions for unscheduled (Inbox) or pending tasks over the next N days
 * Respects rest days and max daily study ceiling
 */
export function generateSmartSchedule(
  tasksToSchedule: Task[],
  existingTasks: Task[],
  settings: UserSettings,
  todayDate: string,
  exams: Exam[],
  planDays: number = 7
): SmartScheduleResult {
  const maxDailyMinutes = (settings.maxDailyStudyHours || 5) * 60;
  const restDays = settings.restDays || [];

  // Track existing booked workload per day
  const dailyPlannedMinutes: Record<string, number> = {};
  const dailyNewMinutes: Record<string, number> = {};

  for (let i = 0; i < planDays; i++) {
    const date = addDays(todayDate, i);
    dailyPlannedMinutes[date] = calculatePlannedMinutesForDate(existingTasks, date);
    dailyNewMinutes[date] = 0;
  }

  // Sort candidate tasks by urgency score descending
  const scoredTasks = tasksToSchedule
    .filter(t => t.status !== 'completed' && t.status !== 'cancelled')
    .map(task => ({
      task,
      score: calculateTaskUrgencyScore(task, todayDate, exams)
    }))
    .sort((a, b) => b.score - a.score);

  const recommendations: ScheduleRecommendation[] = [];
  const unassignedTasks: Array<{ task: Task; reason: string }> = [];

  for (const { task, score } of scoredTasks) {
    const duration = task.plannedDurationMinutes || 45;
    let scheduled = false;

    // Search for the earliest suitable day before or on due date
    for (let i = 0; i < planDays; i++) {
      const date = addDays(todayDate, i);
      const [y, m, d] = date.split('-').map(Number);
      const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay();

      // Skip rest days
      if (restDays.includes(dayOfWeek)) continue;

      // Check if after due date (prefer not to schedule after due date unless no choice)
      if (task.dueDate && date > task.dueDate) {
        // Can't schedule after due date comfortably
        break;
      }

      const currentTotal = (dailyPlannedMinutes[date] || 0) + (dailyNewMinutes[date] || 0);
      if (currentTotal + duration <= maxDailyMinutes) {
        // Found a slot!
        dailyNewMinutes[date] = (dailyNewMinutes[date] || 0) + duration;

        let reason = 'จัดให้อยู่ในวันที่มีเวลาว่างเพียงพอ';
        if (task.priority === 'high') {
          reason = 'ความสำคัญสูง จึงจัดสรรลงในวันแรกสุดที่มีเวลาว่าง';
        } else if (task.dueDate && diffDays(task.dueDate, date) <= 2) {
          reason = `ใกล้ครบกำหนดส่งในวันที่ ${task.dueDate} จึงเร่งจัดก่อน`;
        }

        recommendations.push({
          task,
          suggestedDate: date,
          reason,
          priorityScore: score
        });
        scheduled = true;
        break;
      }
    }

    if (!scheduled) {
      unassignedTasks.push({
        task,
        reason: 'เวลาว่างในสัปดาห์นี้เต็มตามเพดานที่ตั้งไว้แล้ว แนะนำให้ลดงานอื่นหรือขยายเวลาอ่าน'
      });
    }
  }

  const dailyWorkloads: Record<string, { plannedMinutes: number; newMinutes: number; maxMinutes: number }> = {};
  for (let i = 0; i < planDays; i++) {
    const date = addDays(todayDate, i);
    dailyWorkloads[date] = {
      plannedMinutes: dailyPlannedMinutes[date] || 0,
      newMinutes: dailyNewMinutes[date] || 0,
      maxMinutes: maxDailyMinutes
    };
  }

  return {
    recommendations,
    unassignedTasks,
    dailyWorkloads
  };
}
