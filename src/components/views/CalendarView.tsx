import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Calendar as CalendarIcon,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Circle,
  RotateCw,
  MoveRight
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import {
  CalendarViewType,
  Task,
  TaskType,
  TaskStatus
} from '../../types';
import {
  getBangkokToday,
  formatDateThai,
  formatDateDDMMYYYY,
  addDays,
  getMonthMatrix,
  getWeekDays,
  THAI_DAYS_FULL,
  THAI_DAYS_SHORT,
  THAI_MONTHS_FULL
} from '../../utils/dateUtils';
import {
  calculatePlannedMinutesForDate,
  detectTimeConflicts
} from '../../utils/analytics';
import { TASK_TYPES, TASK_STATUSES } from '../../utils/constants';

interface CalendarViewProps {
  onOpenAddTaskWithDate: (date: string, time?: string) => void;
  onEditTask: (task: Task) => void;
  onRescheduleTask: (task: Task) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onOpenAddTaskWithDate,
  onEditTask,
  onRescheduleTask
}) => {
  const { tasks, subjects, settings, toggleTaskComplete } = useStudy();

  const todayStr = getBangkokToday();
  const [currentDateStr, setCurrentDateStr] = useState(todayStr);
  const [viewType, setViewType] = useState<CalendarViewType>('month');

  // Filters
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Parse current date
  const [curYear, curMonth, curDay] = currentDateStr.split('-').map(Number);

  // Navigation handlers
  const handlePrev = () => {
    if (viewType === 'month') {
      let m = curMonth - 1;
      let y = curYear;
      if (m < 1) {
        m = 12;
        y -= 1;
      }
      setCurrentDateStr(`${y}-${m.toString().padStart(2, '0')}-01`);
    } else if (viewType === 'week') {
      setCurrentDateStr(addDays(currentDateStr, -7));
    } else {
      setCurrentDateStr(addDays(currentDateStr, -1));
    }
  };

  const handleNext = () => {
    if (viewType === 'month') {
      let m = curMonth + 1;
      let y = curYear;
      if (m > 12) {
        m = 1;
        y += 1;
      }
      setCurrentDateStr(`${y}-${m.toString().padStart(2, '0')}-01`);
    } else if (viewType === 'week') {
      setCurrentDateStr(addDays(currentDateStr, 7));
    } else {
      setCurrentDateStr(addDays(currentDateStr, 1));
    }
  };

  const handleToday = () => {
    setCurrentDateStr(todayStr);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (filterSubjectId !== 'all' && t.subjectId !== filterSubjectId) return false;
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  // Header Title
  const getHeaderTitle = () => {
    if (viewType === 'month') {
      return `${THAI_MONTHS_FULL[curMonth - 1]} ${curYear}`;
    }
    if (viewType === 'week') {
      const week = getWeekDays(currentDateStr);
      return `สัปดาห์ที่ ${formatDateDDMMYYYY(week[0])} - ${formatDateDDMMYYYY(week[6])}`;
    }
    return formatDateThai(currentDateStr, true);
  };

  // Month matrix
  const monthMatrix = getMonthMatrix(curYear, curMonth);

  // Week days
  const weekDays = getWeekDays(currentDateStr);

  // Hourly slots for Day and Week views (08:00 to 22:00)
  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8 to 22

  return (
    <div className="space-y-4 pb-12">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Left: Nav Buttons & Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="ก่อนหน้า"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 rounded-xl text-xs font-bold hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              วันนี้
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="ถัดไป"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
            {getHeaderTitle()}
          </h2>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl self-start md:self-auto">
          {(['month', 'week', 'day', 'agenda'] as CalendarViewType[]).map(vt => (
            <button
              key={vt}
              onClick={() => setViewType(vt)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                viewType === vt
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {vt === 'month' && 'เดือน'}
              {vt === 'week' && 'สัปดาห์'}
              {vt === 'day' && 'วัน'}
              {vt === 'agenda' && 'กำหนดการ (Agenda)'}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>ตัวกรอง:</span>
        </div>

        {/* Filter by Subject */}
        <select
          value={filterSubjectId}
          onChange={e => setFilterSubjectId(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-medium"
        >
          <option value="all">ทุกวิชา</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>
              {s.code || s.name}
            </option>
          ))}
        </select>

        {/* Filter by Type */}
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-medium"
        >
          <option value="all">ทุกประเภทกิจกรรม</option>
          {Object.entries(TASK_TYPES).map(([k, val]) => (
            <option key={k} value={k}>
              {val.label}
            </option>
          ))}
        </select>

        {/* Filter by Status */}
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-medium"
        >
          <option value="all">ทุกสถานะ</option>
          <option value="todo">ยังไม่เสร็จ</option>
          <option value="completed">เสร็จแล้ว</option>
          <option value="postponed">เลื่อนเวลา</option>
        </select>

        {(filterSubjectId !== 'all' || filterType !== 'all' || filterStatus !== 'all') && (
          <button
            onClick={() => {
              setFilterSubjectId('all');
              setFilterType('all');
              setFilterStatus('all');
            }}
            className="text-xs text-indigo-600 hover:underline px-2 py-1"
          >
            ล้างตัวกรอง
          </button>
        )}
      </div>

      {/* MONTH VIEW */}
      {viewType === 'month' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          {/* Day Headers (Mon - Sun) */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center py-2.5">
            {['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'].map((day, i) => (
              <span
                key={day}
                className={`text-xs font-bold ${
                  i >= 5 ? 'text-rose-500' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {day}
              </span>
            ))}
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800">
            {monthMatrix.flat().map(({ date, isCurrentMonth, dayOfMonth }) => {
              const isToday = date === todayStr;
              const dateTasks = filteredTasks.filter(t => t.plannedDate === date && t.status !== 'cancelled');
              const plannedMins = calculatePlannedMinutesForDate(tasks, date);
              const maxCeilingMins = (settings.maxDailyStudyHours || 6) * 60;
              const isCeilingExceeded = plannedMins > maxCeilingMins;
              const conflicts = detectTimeConflicts(tasks, date);

              return (
                <div
                  key={date}
                  onClick={() => onOpenAddTaskWithDate(date)}
                  className={`min-h-[110px] p-1.5 sm:p-2 group flex flex-col justify-between transition-colors cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                    !isCurrentMonth ? 'bg-slate-50/40 dark:bg-slate-900/40 opacity-40' : ''
                  } ${isToday ? 'bg-indigo-50/20 dark:bg-indigo-950/20' : ''}`}
                >
                  {/* Date Number & Badges */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                        isToday
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {dayOfMonth}
                    </span>

                    <div className="flex items-center gap-1">
                      {conflicts.length > 0 && (
                        <span title="มีกิจกรรมเวลาทับซ้อน">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        </span>
                      )}
                      {isCeilingExceeded && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-rose-500"
                          title={`เวลาวางแผนเกินเพดาน (${Math.round(plannedMins / 60)} ชม.)`}
                        />
                      )}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onOpenAddTaskWithDate(date);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-indigo-600 transition-opacity"
                        title="เพิ่มงานในวันนี้"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Tasks List within day cell */}
                  <div className="space-y-1 flex-1 overflow-y-auto max-h-24">
                    {dateTasks.slice(0, 3).map(task => {
                      const sub = subjects.find(s => s.id === task.subjectId);
                      const isCompleted = task.status === 'completed';

                      return (
                        <div
                          key={task.id}
                          onClick={e => {
                            e.stopPropagation();
                            onEditTask(task);
                          }}
                          className={`px-1.5 py-1 rounded-lg text-[10px] font-medium truncate flex items-center justify-between gap-1 shadow-2xs border transition-transform hover:scale-[1.02] cursor-pointer ${
                            isCompleted
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 line-through'
                              : 'text-slate-800 dark:text-slate-100 border-transparent'
                          }`}
                          style={{
                            backgroundColor: !isCompleted && sub ? `${sub.color}20` : undefined,
                            borderLeftWidth: '3px',
                            borderLeftColor: sub?.color || '#6366F1'
                          }}
                        >
                          <span className="truncate">
                            {task.plannedStartTime && `${task.plannedStartTime} `}
                            {task.title}
                          </span>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              onRescheduleTask(task);
                            }}
                            className="text-slate-400 hover:text-indigo-600 shrink-0"
                            title="เลื่อนวัน"
                          >
                            <MoveRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      );
                    })}

                    {dateTasks.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-semibold px-1">
                        +{dateTasks.length - 3} งานเพิ่มเติม
                      </span>
                    )}
                  </div>

                  {/* Day total time footer */}
                  {plannedMins > 0 && (
                    <div className="text-[9px] text-slate-400 font-mono text-right mt-1">
                      {Math.floor(plannedMins / 60)}h {plannedMins % 60}m
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewType === 'week' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          {/* Week column headers */}
          <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center py-3">
            <div className="text-xs font-bold text-slate-400">เวลา</div>
            {weekDays.map(dayStr => {
              const isToday = dayStr === todayStr;
              const dateObj = new Date(dayStr);
              const dayName = THAI_DAYS_SHORT[dateObj.getDay()];
              const dayNum = dateObj.getDate();
              return (
                <div key={dayStr} className="space-y-0.5">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">
                    {dayName}
                  </span>
                  <span
                    className={`inline-flex w-7 h-7 rounded-full text-xs font-bold items-center justify-center ${
                      isToday
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {dayNum}
                  </span>
                </div>
              );
            })}
          </div>

          {/* All-Day / Untimed Row */}
          <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs min-h-[44px]">
            <div className="p-2 text-[11px] font-semibold text-slate-400 text-center border-r border-slate-100 dark:border-slate-800">
              ทั้งวัน
            </div>
            {weekDays.map(dayStr => {
              const untimed = filteredTasks.filter(
                t => t.plannedDate === dayStr && !t.plannedStartTime && t.status !== 'cancelled'
              );
              return (
                <div
                  key={`untimed-${dayStr}`}
                  onClick={() => onOpenAddTaskWithDate(dayStr)}
                  className="p-1 border-r border-slate-100 dark:border-slate-800 space-y-1 hover:bg-slate-50 cursor-pointer"
                >
                  {untimed.map(t => {
                    const sub = subjects.find(s => s.id === t.subjectId);
                    return (
                      <div
                        key={t.id}
                        onClick={e => {
                          e.stopPropagation();
                          onEditTask(t);
                        }}
                        className="px-1.5 py-0.5 rounded text-[10px] truncate border"
                        style={{
                          backgroundColor: `${sub?.color || '#6366F1'}15`,
                          borderColor: sub?.color || '#6366F1'
                        }}
                      >
                        {t.title}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Hourly Grid */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
            {hours.map(hour => {
              const timeSlotStr = `${hour.toString().padStart(2, '0')}:00`;

              return (
                <div key={hour} className="grid grid-cols-8 min-h-[56px]">
                  {/* Time column */}
                  <div className="p-2 text-[11px] font-mono text-slate-400 text-center border-r border-slate-100 dark:border-slate-800">
                    {timeSlotStr}
                  </div>

                  {/* 7 Day Columns */}
                  {weekDays.map(dayStr => {
                    const slotTasks = filteredTasks.filter(t => {
                      if (t.plannedDate !== dayStr || !t.plannedStartTime) return false;
                      const taskHour = parseInt(t.plannedStartTime.split(':')[0], 10);
                      return taskHour === hour;
                    });

                    return (
                      <div
                        key={`${dayStr}-${hour}`}
                        onClick={() => onOpenAddTaskWithDate(dayStr, timeSlotStr)}
                        className="p-1 border-r border-slate-100 dark:border-slate-800 relative hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 cursor-pointer transition-colors"
                      >
                        {slotTasks.map(t => {
                          const sub = subjects.find(s => s.id === t.subjectId);
                          return (
                            <div
                              key={t.id}
                              onClick={e => {
                                e.stopPropagation();
                                onEditTask(t);
                              }}
                              className="p-1 rounded-lg text-[10px] font-semibold text-slate-800 dark:text-slate-100 shadow-2xs border transition-transform hover:scale-105"
                              style={{
                                backgroundColor: `${sub?.color || '#6366F1'}20`,
                                borderLeftWidth: '3px',
                                borderLeftColor: sub?.color || '#6366F1'
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[9px] text-slate-500">
                                  {t.plannedStartTime}
                                </span>
                                <span className="text-[9px] text-slate-400">
                                  {t.plannedDurationMinutes}m
                                </span>
                              </div>
                              <p className="truncate">{t.title}</p>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAY VIEW */}
      {viewType === 'day' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {formatDateThai(currentDateStr, true)}
              </h3>
              <p className="text-xs text-slate-400">
                วางแผนเวลาอ่าน: {Math.round(calculatePlannedMinutesForDate(tasks, currentDateStr) / 60)} ชม.
              </p>
            </div>
            <button
              onClick={() => onOpenAddTaskWithDate(currentDateStr)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> เพิ่มงานในวันนี้
            </button>
          </div>

          {/* Time Slots */}
          <div className="space-y-3">
            {hours.map(h => {
              const timeStr = `${h.toString().padStart(2, '0')}:00`;
              const tasksInHour = filteredTasks.filter(t => {
                if (t.plannedDate !== currentDateStr || !t.plannedStartTime) return false;
                const taskHour = parseInt(t.plannedStartTime.split(':')[0], 10);
                return taskHour === h;
              });

              return (
                <div
                  key={h}
                  onClick={() => onOpenAddTaskWithDate(currentDateStr, timeStr)}
                  className="flex items-start gap-4 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50/50 cursor-pointer transition-all"
                >
                  <span className="font-mono text-xs font-bold text-slate-400 w-14 shrink-0 pt-1">
                    {timeStr}
                  </span>

                  <div className="flex-1 space-y-2">
                    {tasksInHour.map(task => {
                      const sub = subjects.find(s => s.id === task.subjectId);
                      const isDone = task.status === 'completed';
                      return (
                        <div
                          key={task.id}
                          onClick={e => {
                            e.stopPropagation();
                            onEditTask(task);
                          }}
                          className="p-3 rounded-xl border flex items-center justify-between gap-3 shadow-xs"
                          style={{
                            backgroundColor: `${sub?.color || '#6366F1'}15`,
                            borderColor: `${sub?.color || '#6366F1'}40`
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                toggleTaskComplete(task.id);
                              }}
                              className={`p-1 rounded-lg ${
                                isDone ? 'text-emerald-500' : 'text-slate-400'
                              }`}
                            >
                              {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                            </button>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold font-mono">
                                  {task.plannedStartTime} ({task.plannedDurationMinutes} นาที)
                                </span>
                                {sub && (
                                  <span className="text-xs px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200">
                                    {sub.name}
                                  </span>
                                )}
                              </div>
                              <h4 className={`text-sm font-bold ${isDone ? 'line-through text-slate-400' : ''}`}>
                                {task.title}
                              </h4>
                            </div>
                          </div>

                          <button
                            onClick={e => {
                              e.stopPropagation();
                              onRescheduleTask(task);
                            }}
                            className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                          >
                            เลื่อนเวลา &rarr;
                          </button>
                        </div>
                      );
                    })}

                    {tasksInHour.length === 0 && (
                      <span className="text-xs text-slate-300 dark:text-slate-600 italic">
                        คลิกเพื่อวางแผนกิจกรรมในเวลานี้
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AGENDA / LIST VIEW */}
      {viewType === 'agenda' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              กำหนดการและตารางอ่านทั้งหมดเรียงตามวัน
            </h3>
            <span className="text-xs text-slate-400">
              {filteredTasks.filter(t => t.plannedDate).length} รายการ
            </span>
          </div>

          <div className="space-y-4">
            {filteredTasks
              .filter(t => t.plannedDate)
              .sort((a, b) => (a.plannedDate + (a.plannedStartTime || '')).localeCompare(b.plannedDate + (b.plannedStartTime || '')))
              .map(task => {
                const sub = subjects.find(s => s.id === task.subjectId);
                const isDone = task.status === 'completed';
                const typeConfig = TASK_TYPES[task.type];

                return (
                  <div
                    key={task.id}
                    onClick={() => onEditTask(task)}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50/50 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          toggleTaskComplete(task.id);
                        }}
                        className={`p-1 mt-0.5 rounded-lg ${
                          isDone ? 'text-emerald-500' : 'text-slate-400'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                      </button>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                            {formatDateThai(task.plannedDate)}
                          </span>
                          {task.plannedStartTime && (
                            <span className="text-xs text-slate-500 font-mono">
                              {task.plannedStartTime}
                            </span>
                          )}
                          {sub && (
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-md font-semibold"
                              style={{
                                backgroundColor: `${sub.color}15`,
                                color: sub.color
                              }}
                            >
                              {sub.code || sub.name}
                            </span>
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${typeConfig.bgColor}`}>
                            {typeConfig.label}
                          </span>
                        </div>
                        <h4 className={`text-sm font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                          {task.title}
                        </h4>
                        {task.dueDate && task.dueDate !== task.plannedDate && (
                          <p className="text-[11px] text-rose-500 font-medium">
                            กำหนดส่ง: {formatDateThai(task.dueDate)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-xs text-slate-400 font-medium">
                        {task.plannedDurationMinutes} นาที
                      </span>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onRescheduleTask(task);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                      >
                        เลื่อนวัน
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
