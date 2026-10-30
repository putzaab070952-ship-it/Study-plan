import React, { useState } from 'react';
import {
  BarChart2,
  Calendar,
  Clock,
  CheckCircle2,
  TrendingUp,
  PieChart,
  BookOpen,
  RotateCw,
  AlertCircle
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import {
  getBangkokToday,
  addDays,
  diffDays,
  formatMinutesThai,
  formatDateThai
} from '../../utils/dateUtils';
import {
  calculatePlannedMinutesForDate,
  calculateActualMinutesForDate,
  calculateTaskCompletionRate,
  calculateSubjectTopicProgress
} from '../../utils/analytics';
import { TASK_TYPES } from '../../utils/constants';

type TimeRange = 'today' | 'week' | 'month';

export const AnalyticsView: React.FC = () => {
  const { tasks, subjects, studySessions, reviewItems, settings } = useStudy();

  const [range, setRange] = useState<TimeRange>('week');
  const todayStr = getBangkokToday();

  // Determine dates in range
  const daysCount = range === 'today' ? 1 : range === 'week' ? 7 : 30;
  const dateList: string[] = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    dateList.push(addDays(todayStr, -i));
  }

  // Filter tasks in range (by plannedDate or dueDate)
  const rangeTasks = tasks.filter(t => {
    if (t.status === 'cancelled') return false;
    const taskDate = t.plannedDate || t.dueDate;
    return taskDate && dateList.includes(taskDate);
  });

  // Filter study sessions in range
  const rangeSessions = studySessions.filter(s => dateList.includes(s.date));

  // Actual total minutes
  const totalActualMinutes = rangeSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  const totalPlannedMinutes = dateList.reduce(
    (sum, d) => sum + calculatePlannedMinutesForDate(tasks, d),
    0
  );

  // Completion metrics
  const taskStats = calculateTaskCompletionRate(rangeTasks);

  // Postponed tasks
  const postponedCount = tasks.filter(t => t.postponedFrom).length;

  // Breakdown by Activity Type (from range sessions and tasks)
  const activityBreakdown: Record<string, number> = {};
  rangeSessions.forEach(s => {
    const task = tasks.find(t => t.id === s.taskId);
    const type = task?.type || 'reading';
    activityBreakdown[type] = (activityBreakdown[type] || 0) + s.durationMinutes;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-500" />
            รายงานความคืบหน้า & สถิติจริง (Progress & Analytics)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            วิเคราะห์ชั่วโมงอ่านหนังสือ อัตราความสำเร็จ และการกระจายตัวของวิชาตามข้อมูลจริง
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          {[
            { id: 'today', label: 'วันนี้' },
            { id: 'week', label: '7 วันที่ผ่านมา' },
            { id: 'month', label: '30 วันที่ผ่านมา' }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setRange(btn.id as TimeRange)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                range === btn.id
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Actual Study Time */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> เวลาอ่านหนังสือจริง
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {formatMinutesThai(totalActualMinutes)}
          </div>
          <p className="text-[11px] text-slate-400">
            จาก {rangeSessions.length} เซสชันโฟกัส
          </p>
        </div>

        {/* Stat 2: Planned Time */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> ชั่วโมงที่วางแผนไว้
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {formatMinutesThai(totalPlannedMinutes)}
          </div>
          <p className="text-[11px] text-slate-400">
            เป้าหมายรายสัปดาห์ {settings.weeklyTargetHours} ชม.
          </p>
        </div>

        {/* Stat 3: Completion Rate */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> อัตราทำงานสำเร็จ
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400">
            {taskStats.ratePercentage}%
          </div>
          <p className="text-[11px] text-slate-400">
            เสร็จแล้ว {taskStats.completed} จาก {taskStats.total} งาน
          </p>
        </div>

        {/* Stat 4: Postponed Tasks */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <RotateCw className="w-3.5 h-3.5" /> งานที่ถูกเลื่อนเวลา
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
            {postponedCount}
          </div>
          <p className="text-[11px] text-slate-400">
            ยังคงอยู่ในระบบเพื่อวางแผนใหม่
          </p>
        </div>
      </div>

      {/* Chart: Daily Planned vs Actual */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              เปรียบเทียบเวลาอ่านจริง vs เวลาวางแผนรายวัน
            </h3>
            <p className="text-xs text-slate-400">หน่วยเป็นชั่วโมง (ชั่วโมงอ่านจริงคำนวณจาก Study Session เท่านั้น)</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-indigo-300 dark:bg-indigo-700" />
              <span>เวลาวางแผน</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500" />
              <span>อ่านจริง</span>
            </div>
          </div>
        </div>

        {/* SVG Bar Chart */}
        <div className="h-64 flex items-end gap-2 sm:gap-4 pt-8 pb-4 border-b border-slate-100 dark:border-slate-800">
          {dateList.map(dateStr => {
            const plannedMins = calculatePlannedMinutesForDate(tasks, dateStr);
            const actualMins = calculateActualMinutesForDate(studySessions, dateStr);
            const maxMins = Math.max(360, plannedMins, actualMins); // at least 6 hrs for scaling
            const plannedHeight = (plannedMins / maxMins) * 100;
            const actualHeight = (actualMins / maxMins) * 100;

            const [y, m, d] = dateStr.split('-');
            const isToday = dateStr === todayStr;

            return (
              <div key={dateStr} className="flex-1 flex flex-col items-center h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-1 h-full">
                  {/* Planned bar */}
                  <div
                    className="w-3 sm:w-5 bg-indigo-200 dark:bg-indigo-950/70 rounded-t-md transition-all group-hover:opacity-80"
                    style={{ height: `${Math.max(4, plannedHeight)}%` }}
                    title={`วางแผน: ${formatMinutesThai(plannedMins)}`}
                  />
                  {/* Actual bar */}
                  <div
                    className="w-3 sm:w-5 bg-emerald-500 rounded-t-md transition-all group-hover:brightness-110"
                    style={{ height: `${Math.max(4, actualHeight)}%` }}
                    title={`อ่านจริง: ${formatMinutesThai(actualMins)}`}
                  />
                </div>
                <span
                  className={`text-[10px] mt-2 font-mono ${
                    isToday ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                  }`}
                >
                  {d}/{m}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Subject Syllabus Progress & Activity Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Progress */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            ความคืบหน้าเนื้อหาตามรายวิชา (% หัวข้อเรียนจบ)
          </h3>
          <p className="text-xs text-slate-400">
            คำนวณจากหัวข้อที่เรียนจบเทียบกับจำนวนหัวข้อทั้งหมดในวิชา
          </p>

          <div className="space-y-4 pt-2">
            {subjects.map(sub => {
              const prog = calculateSubjectTopicProgress(sub);
              return (
                <div key={sub.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">
                      {sub.code ? `${sub.code} - ` : ''}
                      {sub.name}
                    </span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">
                      {prog.completedTopics}/{prog.totalTopics} หัวข้อ ({prog.progressPercentage}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${prog.progressPercentage}%`,
                        backgroundColor: sub.color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Breakdown */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-500" />
            การกระจายตัวของประเภทกิจกรรมการเรียน
          </h3>
          <p className="text-xs text-slate-400">
            เวลาอ่านที่ใช้จริงแยกตามประเภทกิจกรรม (นาที)
          </p>

          <div className="space-y-3 pt-2">
            {Object.entries(TASK_TYPES).map(([typeKey, typeConfig]) => {
              const minutes = activityBreakdown[typeKey] || 0;
              const percent = totalActualMinutes > 0
                ? Math.round((minutes / totalActualMinutes) * 100)
                : 0;

              return (
                <div key={typeKey} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 w-32">
                    <span className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold ${typeConfig.bgColor}`}>
                      {typeConfig.label}
                    </span>
                  </div>
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="font-mono text-slate-500 w-24 text-right">
                    {formatMinutesThai(minutes)} ({percent}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
