import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDateDDMMYYYY,
  addDays,
  diffDays,
  isOverdue,
  getBangkokToday,
  formatMinutesThai
} from './dateUtils';
import {
  calculatePlannedMinutesForDate,
  calculateActualMinutesForDate,
  calculateTaskCompletionRate,
  calculateSubjectTopicProgress,
  detectTimeConflicts
} from './analytics';
import { generateSmartSchedule, calculateTaskUrgencyScore } from './scheduler';
import { Task, StudySession, Subject, UserSettings, Exam } from '../types';

test('dateUtils - format DD/MM/YYYY and manipulations', () => {
  assert.equal(formatDateDDMMYYYY('2026-10-26'), '26/10/2026');
  assert.equal(addDays('2026-10-25', 2), '2026-10-27');
  assert.equal(diffDays('2026-10-27', '2026-10-25'), 2);
  assert.equal(isOverdue('2026-10-20', '2026-10-25'), true);
  assert.equal(isOverdue('2026-10-28', '2026-10-25'), false);
  assert.equal(formatMinutesThai(90), '1 ชม. 30 นาที');
  assert.equal(formatMinutesThai(45), '45 นาที');
});

test('analytics - planned vs actual minutes calculation', () => {
  const dummyTasks: Task[] = [
    {
      id: '1',
      title: 'Math homework',
      description: '',
      subjectId: 'sub-1',
      type: 'homework',
      dueDate: '2026-10-28',
      plannedDate: '2026-10-26',
      plannedDurationMinutes: 60,
      priority: 'high',
      status: 'todo',
      subtasks: [],
      notes: '',
      resourceLinks: [],
      createdAt: '2026-10-25'
    },
    {
      id: '2',
      title: 'Cancelled task',
      description: '',
      subjectId: 'sub-1',
      type: 'reading',
      dueDate: '2026-10-28',
      plannedDate: '2026-10-26',
      plannedDurationMinutes: 45,
      priority: 'low',
      status: 'cancelled',
      subtasks: [],
      notes: '',
      resourceLinks: [],
      createdAt: '2026-10-25'
    }
  ];

  // Cancelled tasks should NOT be counted in planned minutes
  const plannedMins = calculatePlannedMinutesForDate(dummyTasks, '2026-10-26');
  assert.equal(plannedMins, 60);

  const dummySessions: StudySession[] = [
    {
      id: 's1',
      subjectId: 'sub-1',
      title: 'Physics review',
      date: '2026-10-26',
      startTime: '10:00',
      durationMinutes: 50,
      type: 'pomodoro',
      notes: '',
      completedAt: '2026-10-26T10:50:00'
    },
    {
      id: 's2',
      subjectId: 'sub-1',
      title: 'Physics review session 2',
      date: '2026-10-26',
      startTime: '11:00',
      durationMinutes: 25,
      type: 'pomodoro',
      notes: '',
      completedAt: '2026-10-26T11:25:00'
    }
  ];

  const actualMins = calculateActualMinutesForDate(dummySessions, '2026-10-26');
  assert.equal(actualMins, 75);
});

test('analytics - task completion rate strictly ignores cancelled tasks', () => {
  const tasks: Task[] = [
    { id: '1', title: 'T1', description: '', subjectId: 's1', type: 'reading', dueDate: '2026-10-26', plannedDate: '2026-10-26', plannedDurationMinutes: 30, priority: 'medium', status: 'completed', subtasks: [], notes: '', resourceLinks: [], createdAt: '' },
    { id: '2', title: 'T2', description: '', subjectId: 's1', type: 'reading', dueDate: '2026-10-26', plannedDate: '2026-10-26', plannedDurationMinutes: 30, priority: 'medium', status: 'todo', subtasks: [], notes: '', resourceLinks: [], createdAt: '' },
    { id: '3', title: 'T3', description: '', subjectId: 's1', type: 'reading', dueDate: '2026-10-26', plannedDate: '2026-10-26', plannedDurationMinutes: 30, priority: 'medium', status: 'cancelled', subtasks: [], notes: '', resourceLinks: [], createdAt: '' }
  ];

  const stats = calculateTaskCompletionRate(tasks);
  // Total active tasks = 2 (T1 completed, T2 todo). Cancelled is ignored.
  assert.equal(stats.total, 2);
  assert.equal(stats.completed, 1);
  assert.equal(stats.ratePercentage, 50);
});

test('analytics - subject progress based strictly on topics', () => {
  const subject: Subject = {
    id: 's1',
    name: 'Calculus',
    code: 'MATH101',
    color: '#6366F1',
    goal: 'Master limits and derivatives',
    targetHoursPerWeek: 6,
    resources: [],
    createdAt: '',
    topics: [
      { id: 't1', title: 'Limits', status: 'completed', estimatedHours: 2 },
      { id: 't2', title: 'Derivatives', status: 'learning', estimatedHours: 3 },
      { id: 't3', title: 'Integrals', status: 'not_started', estimatedHours: 4 },
      { id: 't4', title: 'Series', status: 'not_started', estimatedHours: 3 }
    ]
  };

  const progress = calculateSubjectTopicProgress(subject);
  assert.equal(progress.totalTopics, 4);
  assert.equal(progress.completedTopics, 1);
  assert.equal(progress.progressPercentage, 25);
  assert.equal(progress.remainingTopics, 3);
});

test('analytics - detect time conflicts for timed tasks', () => {
  const tasks: Task[] = [
    { id: '1', title: 'T1', description: '', subjectId: 's1', type: 'reading', dueDate: '2026-10-26', plannedDate: '2026-10-26', plannedStartTime: '14:00', plannedDurationMinutes: 60, priority: 'medium', status: 'todo', subtasks: [], notes: '', resourceLinks: [], createdAt: '' },
    { id: '2', title: 'T2', description: '', subjectId: 's1', type: 'reading', dueDate: '2026-10-26', plannedDate: '2026-10-26', plannedStartTime: '14:30', plannedDurationMinutes: 45, priority: 'high', status: 'todo', subtasks: [], notes: '', resourceLinks: [], createdAt: '' }
  ];

  const conflicts = detectTimeConflicts(tasks, '2026-10-26');
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].overlapMinutes, 30);
});

test('scheduler - smart schedule respects maximum daily ceiling', () => {
  const settings: UserSettings = {
    dailyTargetHours: 3,
    weeklyTargetHours: 18,
    maxDailyStudyHours: 2, // 120 minutes max per day
    restDays: [0], // Sunday rest day
    pomodoroWorkMinutes: 25,
    pomodoroBreakMinutes: 5,
    spacedIntervals: [1, 3, 7, 14, 30],
    darkMode: false
  };

  const existingTasks: Task[] = [
    { id: 'e1', title: 'Existing Task', description: '', subjectId: 's1', type: 'reading', dueDate: '2026-10-26', plannedDate: '2026-10-26', plannedDurationMinutes: 90, priority: 'medium', status: 'todo', subtasks: [], notes: '', resourceLinks: [], createdAt: '' }
  ];

  const inboxTasks: Task[] = [
    { id: 'n1', title: 'New Big Task', description: '', subjectId: 's1', type: 'homework', dueDate: '2026-10-28', plannedDate: '', plannedDurationMinutes: 60, priority: 'high', status: 'todo', subtasks: [], notes: '', resourceLinks: [], createdAt: '' }
  ];

  const result = generateSmartSchedule(inboxTasks, existingTasks, settings, '2026-10-26', []);
  // Day 2026-10-26 already has 90 min, ceiling is 120 min. Adding 60 min would exceed 120 min, so it must schedule for next available day (2026-10-27)
  assert.equal(result.recommendations.length, 1);
  assert.equal(result.recommendations[0].suggestedDate, '2026-10-27');
});
