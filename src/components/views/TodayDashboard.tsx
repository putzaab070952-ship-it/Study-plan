import React from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  AlertTriangle,
  Play,
  RotateCw,
  Award,
  ChevronRight,
  Plus,
  BookOpen,
  CalendarDays,
  Sparkles
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import {
  getBangkokToday,
  formatDateThai,
  diffDays,
  formatMinutesThai
} from '../../utils/dateUtils';
import {
  calculatePlannedMinutesForDate,
  calculateActualMinutesForDate,
  detectTimeConflicts
} from '../../utils/analytics';
import { TASK_TYPES, TASK_PRIORITIES } from '../../utils/constants';
import { Task } from '../../types';
import { MainNavView } from '../layout/Sidebar';

interface TodayDashboardProps {
  onNavigate: (view: MainNavView) => void;
  onOpenAddTask: () => void;
  onEditTask: (task: Task) => void;
  onRescheduleTask: (task: Task) => void;
}

export const TodayDashboard: React.FC<TodayDashboardProps> = ({
  onNavigate,
  onOpenAddTask,
  onEditTask,
  onRescheduleTask
}) => {
  const {
    tasks,
    subjects,
    studySessions,
    reviewItems,
    exams,
    settings,
    toggleTaskComplete,
    startTimer
  } = useStudy();

  const todayStr = getBangkokToday();

  // Tasks for today
  const todayTasks = tasks.filter(t => t.plannedDate === todayStr && t.status !== 'cancelled');
  const completedToday = todayTasks.filter(t => t.status === 'completed');
  const pendingToday = todayTasks.filter(t => t.status !== 'completed');

  // Overdue tasks across the whole system
  const overdueTasks = tasks.filter(
    t => t.status !== 'completed' && t.status !== 'cancelled' && t.dueDate && t.dueDate < todayStr
  );

  // Time calculations
  const plannedMinutes = calculatePlannedMinutesForDate(tasks, todayStr);
  const actualMinutes = calculateActualMinutesForDate(studySessions, todayStr);

  const plannedHours = (plannedMinutes / 60).toFixed(1);
  const actualHours = (actualMinutes / 60).toFixed(1);

  // Time conflicts for today
  const conflicts = detectTimeConflicts(tasks, todayStr);

  // Daily study ceiling warning
  const maxDailyMinutes = (settings.maxDailyStudyHours || 6) * 60;
  const isOverPlannedCeiling = plannedMinutes > maxDailyMinutes;

  // Completion percentage
  const completionPercentage =
    todayTasks.length > 0
      ? Math.round((completedToday.length / todayTasks.length) * 100)
      : 0;

  // Top 3 Important Tasks (Priority High first, then medium, then due date)
  const topImportantTasks = [...pendingToday]
    .sort((a, b) => {
      const pScore = (p: string) => (p === 'high' ? 3 : p === 'medium' ? 2 : 1);
      if (pScore(a.priority) !== pScore(b.priority)) {
        return pScore(b.priority) - pScore(a.priority);
      }
      return (a.dueDate || '').localeCompare(b.dueDate || '');
    })
    .slice(0, 3);

  // Spaced Repetition Due Today
  const dueReviews = reviewItems.filter(r => r.nextReviewDate <= todayStr);

  // Nearest upcoming exams (within next 30 days)
  const upcomingExams = [...exams]
    .filter(e => e.examDate >= todayStr)
    .sort((a, b) => a.examDate.localeCompare(b.examDate))
    .slice(0, 2);

  // Start study session for a task
  const handleStartSession = (task: Task) => {
    const sub = subjects.find(s => s.id === task.subjectId);
    startTimer({
      subjectId: task.subjectId,
      topicId: task.topicId,
      taskId: task.id,
      title: `${task.title} (${sub?.name || 'การเรียน'})`,
      durationMinutes: task.plannedDurationMinutes || 45,
      mode: 'work'
    });
    onNavigate('timer');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-700 p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-medium text-white/90">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{formatDateThai(todayStr, true)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              สวัสดี! วันนี้พร้อมลุยเป้าหมายหรือยัง ✨
            </h1>
            <p className="text-sm text-indigo-100/90 leading-relaxed">
              ก้าวทีละนิดอย่างสม่ำเสมอ วันนี้มีงานที่วางแผนไว้ {todayTasks.length} รายการ
              {completedToday.length > 0 && ` ทำเสร็จไปแล้ว ${completedToday.length} งานยอดเยี่ยมมาก!`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenAddTask}
              className="px-4 py-2.5 rounded-2xl bg-white text-indigo-600 font-bold text-xs sm:text-sm hover:bg-indigo-50 active:scale-95 transition-all shadow-md shadow-black/10 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มงานวันนี้</span>
            </button>
            <button
              onClick={() => onNavigate('timer')}
              className="px-4 py-2.5 rounded-2xl bg-indigo-500/40 hover:bg-indigo-500/60 backdrop-blur-md text-white font-semibold text-xs sm:text-sm transition-all flex items-center gap-1.5 border border-white/20"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>เริ่มอ่านหนังสือ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Warnings & Alerts */}
      {conflicts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 flex items-start gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">แจ้งเตือนเวลาทับซ้อนในวันนี้: </span>
            <span>
              งาน &ldquo;{conflicts[0].task1.title}&rdquo; และ &ldquo;{conflicts[0].task2.title}&rdquo; มีช่วงเวลาซ้อนกัน {conflicts[0].overlapMinutes} นาที
            </span>
          </div>
        </div>
      )}

      {isOverPlannedCeiling && (
        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 flex items-center gap-3 text-sm">
          <Clock className="w-5 h-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
          <div>
            <span className="font-bold">ชั่วโมงเรียนวันนี้ค่อนข้างแน่น: </span>
            <span>
              คุณวางแผนไว้ {plannedHours} ชม. ซึ่งเกินเพดานแนะนำ {settings.maxDailyStudyHours} ชม. อย่าลืมเผื่อเวลาพักผ่อนเพื่อสุขภาพสมองนะ
            </span>
          </div>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Today */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            งานทั้งหมดวันนี้
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100">
              {todayTasks.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">รายการ</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Card 2: Completed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            ทำสำเร็จแล้ว
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {completedToday.length}
            </span>
            <span className="text-xs text-emerald-600/70 font-medium">
              {completionPercentage}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {completedToday.length > 0 ? 'รักษาจังหวะการเรียนได้ดีมาก' : 'เริ่มลงมือทำงานแรกได้เลย'}
          </p>
        </div>

        {/* Card 3: Pending */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            งานที่ยังเหลือ
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {pendingToday.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">รายการ</span>
          </div>
          <p className="text-[11px] text-slate-400">จัดลำดับความสำคัญตามเป้าหมาย</p>
        </div>

        {/* Card 4: Overdue */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
            เกินกำหนด (Overdue)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              {overdueTasks.length}
            </span>
            <span className="text-xs text-rose-600/70 font-medium">งาน</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {overdueTasks.length > 0 ? 'เลื่อนวันหรือรีบจัดการก่อน' : 'ไม่มีงานค้างเลย ยอดเยี่ยม!'}
          </p>
        </div>
      </div>

      {/* Planned vs Actual Study Hours Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              ชั่วโมงอ่านหนังสือวันนี้: วางแผนไว้ vs เวลาอ่านจริง
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              คำนวณจากงานที่ลงตารางไว้เทียบกับเซสชันจับเวลาอ่านหนังสือจริง
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-slate-300 dark:bg-slate-700" />
              <span className="text-slate-600 dark:text-slate-400">
                วางแผน: {formatMinutesThai(plannedMinutes)} ({plannedHours} ชม.)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500" />
              <span className="text-emerald-700 dark:text-emerald-400">
                อ่านจริง: {formatMinutesThai(actualMinutes)} ({actualHours} ชม.)
              </span>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-2">
          <div className="relative w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            {/* Planned background bar indicator */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-indigo-200 dark:bg-indigo-950/80 rounded-full"
              style={{
                width: `${Math.min(100, (plannedMinutes / Math.max(1, (settings.dailyTargetHours || 4) * 60)) * 100)}%`
              }}
            />
            {/* Actual progress bar */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-linear-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 shadow-xs"
              style={{
                width: `${Math.min(100, (actualMinutes / Math.max(1, (settings.dailyTargetHours || 4) * 60)) * 100)}%`
              }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>0 ชม.</span>
            <span>เป้าหมายวันนี้: {settings.dailyTargetHours || 4} ชม.</span>
            <span>เพดานสูงสุด: {settings.maxDailyStudyHours || 6} ชม.</span>
          </div>
        </div>
      </div>

      {/* Grid: Left (Top 3 + Chronological Tasks) & Right (Reviews & Exams) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols wide on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top 3 Important Tasks */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    งานสำคัญที่สุด 3 อันดับแรก
                  </h2>
                  <p className="text-xs text-slate-400">โฟกัสงานเหล่านี้ก่อนเพื่อให้การเรียนก้าวหน้าที่สุด</p>
                </div>
              </div>
            </div>

            {topImportantTasks.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  ไม่มีงานด่วนค้างอยู่เลย!
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  คุณทำงานสำคัญของวันนี้เรียบร้อยแล้ว หรือสามารถเพิ่มงานใหม่ได้
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {topImportantTasks.map((task, idx) => {
                  const sub = subjects.find(s => s.id === task.subjectId);
                  const typeConfig = TASK_TYPES[task.type];
                  return (
                    <div
                      key={task.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <span className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {sub && (
                              <span
                                className="px-2 py-0.5 rounded-md text-[11px] font-semibold"
                                style={{
                                  backgroundColor: `${sub.color}15`,
                                  color: sub.color
                                }}
                              >
                                {sub.code || sub.name}
                              </span>
                            )}
                            <span className={`text-[11px] px-2 py-0.5 rounded-md border font-medium ${typeConfig.bgColor}`}>
                              {typeConfig.label}
                            </span>
                            {task.plannedStartTime && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3" />
                                {task.plannedStartTime}
                              </span>
                            )}
                          </div>
                          <h4
                            onClick={() => onEditTask(task)}
                            className="text-sm font-bold text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                          >
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => handleStartSession(task)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>เริ่มอ่าน</span>
                        </button>
                        <button
                          onClick={() => toggleTaskComplete(task.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                          title="ทำเครื่องหมายว่าเสร็จแล้ว"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Today's Chronological Schedule */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-500" />
                ตารางงานวันนี้เรียงตามเวลา ({todayTasks.length} รายการ)
              </h2>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                ดูงานทั้งหมด <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {todayTasks.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <p className="text-sm">ยังไม่มีงานที่วางแผนไว้สำหรับวันนี้</p>
                <button
                  onClick={onOpenAddTask}
                  className="mt-3 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100"
                >
                  + เพิ่มงานสำหรับวันนี้
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {[...todayTasks]
                  .sort((a, b) => (a.plannedStartTime || '99:99').localeCompare(b.plannedStartTime || '99:99'))
                  .map(task => {
                    const sub = subjects.find(s => s.id === task.subjectId);
                    const isDone = task.status === 'completed';
                    const typeConfig = TASK_TYPES[task.type];

                    return (
                      <div
                        key={task.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isDone
                            ? 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 opacity-60'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate flex-1">
                          <button
                            onClick={() => toggleTaskComplete(task.id)}
                            className={`p-1 rounded-lg transition-colors ${
                              isDone ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-500'
                            }`}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </button>

                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              {task.plannedStartTime ? (
                                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                                  {task.plannedStartTime}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400">ไม่ระบุเวลา</span>
                              )}
                              {sub && (
                                <span
                                  className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold"
                                  style={{
                                    backgroundColor: `${sub.color}15`,
                                    color: sub.color
                                  }}
                                >
                                  {sub.code || sub.name}
                                </span>
                              )}
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium ${typeConfig.bgColor}`}>
                                {typeConfig.label}
                              </span>
                            </div>
                            <h4
                              onClick={() => onEditTask(task)}
                              className={`text-sm font-semibold truncate cursor-pointer ${
                                isDone
                                  ? 'line-through text-slate-400'
                                  : 'text-slate-800 dark:text-slate-100 hover:text-indigo-600'
                              }`}
                            >
                              {task.title}
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate-400 font-medium">
                            {task.plannedDurationMinutes} นาที
                          </span>
                          {!isDone && (
                            <button
                              onClick={() => handleStartSession(task)}
                              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white text-slate-600 dark:text-slate-300 transition-colors"
                              title="เริ่มอ่านเซสชันนี้"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Spaced Repetition Due & Exams Countdown */}
        <div className="space-y-6">
          {/* Spaced Repetition Due Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                  <RotateCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    ทบทวนที่ถึงกำหนด (Spaced Repetition)
                  </h3>
                  <p className="text-xs text-slate-400">{dueReviews.length} รายการที่ต้องทบทวนวันนี้</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('reviews')}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline shrink-0 whitespace-nowrap"
              >
                ดูทั้งหมด
              </button>
            </div>

            {dueReviews.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                ไม่มีหัวข้อที่ต้องทบทวนในวันนี้ ทบทวนครบแล้ว!
              </p>
            ) : (
              <div className="space-y-2">
                {dueReviews.map(rev => {
                  const sub = subjects.find(s => s.id === rev.subjectId);
                  return (
                    <div
                      key={rev.id}
                      className="p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-purple-800 dark:text-purple-300 truncate">
                          {sub?.code || sub?.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-bold">
                          รอบที่ {rev.level + 1}
                        </span>
                      </div>
                      <p className="font-medium text-slate-800 dark:text-slate-100 truncate">
                        {rev.title}
                      </p>
                      <button
                        onClick={() => onNavigate('reviews')}
                        className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline pt-1 inline-block"
                      >
                        ประเมินความจำ &rarr;
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Exams Countdown Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    การสอบที่ใกล้เข้ามา
                  </h3>
                  <p className="text-xs text-slate-400">นับถอยหลังวันสอบและเป้าหมาย</p>
                </div>
              </div>
            </div>

            {upcomingExams.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                ยังไม่มีการสอบที่บันทึกไว้ในเร็วๆ นี้
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingExams.map(exam => {
                  const daysLeft = diffDays(exam.examDate, todayStr);
                  const sub = subjects.find(s => s.id === exam.subjectId);
                  return (
                    <div
                      key={exam.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3"
                    >
                      <div className="truncate space-y-0.5">
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                          style={{
                            backgroundColor: `${sub?.color || '#6366F1'}15`,
                            color: sub?.color || '#6366F1'
                          }}
                        >
                          {sub?.code || sub?.name}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          {exam.title}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          {formatDateThai(exam.examDate)}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-lg font-black ${
                            daysLeft <= 3
                              ? 'text-rose-600 animate-pulse'
                              : daysLeft <= 7
                              ? 'text-amber-500'
                              : 'text-indigo-600 dark:text-indigo-400'
                          }`}
                        >
                          {daysLeft < 0 ? (
                            'ผ่านมาแล้ว'
                          ) : daysLeft === 0 ? (
                            'วันนี้!'
                          ) : (
                            <>
                              <span className="font-mono">{daysLeft}</span> วัน
                            </>
                          )}
                        </span>
                        <p className="text-[10px] text-slate-400">เหลือเวลา</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
