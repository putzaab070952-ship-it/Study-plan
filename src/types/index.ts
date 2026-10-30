export type TaskType = 'reading' | 'lecture' | 'practice' | 'review' | 'homework' | 'exam';

export type TaskPriority = 'high' | 'medium' | 'low';

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'postponed' | 'cancelled';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskRecurrence {
  type: 'daily' | 'weekly' | 'custom_days';
  daysOfWeek?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  groupId?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  topicId?: string;
  type: TaskType;
  dueDate: string; // YYYY-MM-DD
  plannedDate: string; // YYYY-MM-DD or empty if Inbox
  plannedStartTime?: string; // HH:MM or empty for untimed
  plannedDurationMinutes: number; // Duration in minutes
  priority: TaskPriority;
  status: TaskStatus;
  subtasks: Subtask[];
  notes: string;
  resourceLinks: string[];
  recurrence?: TaskRecurrence;
  completedAt?: string;
  createdAt: string;
  postponedFrom?: string;
}

export type TopicStatus = 'not_started' | 'learning' | 'completed' | 'needs_review';

export interface Topic {
  id: string;
  title: string;
  chapter?: string;
  status: TopicStatus;
  estimatedHours: number;
  notes?: string;
  completedAt?: string;
}

export interface SubjectResource {
  id: string;
  title: string;
  url: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
  icon?: string;
  goal: string;
  examDate?: string; // YYYY-MM-DD
  targetHoursPerWeek: number;
  resources: SubjectResource[];
  topics: Topic[];
  createdAt: string;
}

export interface StudySession {
  id: string;
  taskId?: string;
  subjectId: string;
  topicId?: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  durationMinutes: number; // Focused minutes
  type: 'pomodoro' | 'custom';
  notes: string;
  completedAt: string;
}

export interface ReviewLog {
  date: string; // YYYY-MM-DD
  rating: number; // 1-5
  notes?: string;
}

export interface ReviewItem {
  id: string;
  subjectId: string;
  topicId?: string;
  title: string;
  level: number; // interval index (0, 1, 2, 3...)
  lastReviewedDate?: string; // YYYY-MM-DD
  nextReviewDate: string; // YYYY-MM-DD
  history: ReviewLog[];
  createdAt: string;
}

export interface Exam {
  id: string;
  title: string;
  subjectId: string;
  examDate: string; // YYYY-MM-DD
  startTime?: string; // HH:MM
  location?: string;
  weightPercentage?: number;
  targetScore?: string;
  notes?: string;
}

export interface UserSettings {
  dailyTargetHours: number;
  weeklyTargetHours: number;
  maxDailyStudyHours: number;
  restDays: number[]; // 0=Sun, 6=Sat
  pomodoroWorkMinutes: number;
  pomodoroBreakMinutes: number;
  spacedIntervals: number[]; // e.g. [1, 3, 7, 14, 30]
  darkMode: boolean;
}

export type CalendarViewType = 'month' | 'week' | 'day' | 'agenda';
export type TaskFilterView = 'inbox' | 'today' | 'upcoming' | 'overdue' | 'completed' | 'all';
