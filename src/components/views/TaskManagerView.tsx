import React, { useState } from 'react';
import {
  Inbox,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Copy,
  Trash2,
  CalendarDays,
  ArrowRight,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { Task, TaskFilterView, TaskPriority, TaskType, TaskStatus } from '../../types';
import {
  getBangkokToday,
  formatDateThai,
  diffDays,
  isOverdue,
  formatMinutesThai
} from '../../utils/dateUtils';
import { TASK_TYPES, TASK_PRIORITIES, TASK_STATUSES } from '../../utils/constants';

interface TaskManagerViewProps {
  onOpenAddTask: () => void;
  onEditTask: (task: Task) => void;
  onRescheduleTask: (task: Task) => void;
}

export const TaskManagerView: React.FC<TaskManagerViewProps> = ({
  onOpenAddTask,
  onEditTask,
  onRescheduleTask
}) => {
  const { tasks, subjects, toggleTaskComplete, deleteTask, duplicateTask } = useStudy();

  const todayStr = getBangkokToday();
  const [activeTab, setActiveTab] = useState<TaskFilterView>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Tab counts
  const inboxCount = tasks.filter(t => !t.plannedDate && t.status !== 'cancelled').length;
  const todayCount = tasks.filter(t => t.plannedDate === todayStr && t.status !== 'cancelled').length;
  const upcomingCount = tasks.filter(t => t.plannedDate && t.plannedDate > todayStr && t.status !== 'cancelled').length;
  const overdueCount = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled' && t.dueDate && t.dueDate < todayStr).length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const allCount = tasks.filter(t => t.status !== 'cancelled').length;

  // Filter logic
  const filteredTasks = tasks.filter(task => {
    // Tab filter
    if (activeTab === 'inbox') {
      if (task.plannedDate || task.status === 'cancelled') return false;
    } else if (activeTab === 'today') {
      if (task.plannedDate !== todayStr || task.status === 'cancelled') return false;
    } else if (activeTab === 'upcoming') {
      if (!task.plannedDate || task.plannedDate <= todayStr || task.status === 'cancelled') return false;
    } else if (activeTab === 'overdue') {
      if (task.status === 'completed' || task.status === 'cancelled' || !task.dueDate || task.dueDate >= todayStr) return false;
    } else if (activeTab === 'completed') {
      if (task.status !== 'completed') return false;
    } else if (activeTab === 'all') {
      if (task.status === 'cancelled') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    // Dropdown filters
    if (filterSubjectId !== 'all' && task.subjectId !== filterSubjectId) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    if (filterType !== 'all' && task.type !== filterType) return false;

    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            รายการงาน & To-do List
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            จัดการงานทั้งหมด กำหนดการส่ง และวางแผนลำดับความสำคัญในการอ่าน
          </p>
        </div>
        <button
          onClick={onOpenAddTask}
          className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มงานใหม่</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'today', label: 'วันนี้ (Today)', count: todayCount, icon: Calendar },
          { id: 'inbox', label: 'Inbox (ยังไม่ลงตาราง)', count: inboxCount, icon: Inbox },
          { id: 'upcoming', label: 'เร็วๆ นี้ (Upcoming)', count: upcomingCount, icon: CalendarDays },
          { id: 'overdue', label: 'เกินกำหนด (Overdue)', count: overdueCount, icon: AlertCircle, alert: overdueCount > 0 },
          { id: 'completed', label: 'เสร็จแล้ว (Completed)', count: completedCount, icon: CheckCircle2 },
          { id: 'all', label: 'งานทั้งหมด (All)', count: allCount, icon: Clock }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TaskFilterView)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : tab.alert
                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ค้นหาตามชื่องานหรือรายละเอียด..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Subject Filter */}
        <select
          value={filterSubjectId}
          onChange={e => setFilterSubjectId(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200"
        >
          <option value="all">ทุกวิชา</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>
              {s.code || s.name}
            </option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200"
        >
          <option value="all">ทุกความสำคัญ</option>
          <option value="high">สูง (High)</option>
          <option value="medium">กลาง (Medium)</option>
          <option value="low">ต่ำ (Low)</option>
        </select>

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200"
        >
          <option value="all">ทุกประเภท</option>
          {Object.entries(TASK_TYPES).map(([k, val]) => (
            <option key={k} value={k}>
              {val.label}
            </option>
          ))}
        </select>
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              ไม่พบงานในมุมมองนี้
            </h4>
            <p className="text-xs text-slate-400">
              กดปุ่ม &ldquo;เพิ่มงานใหม่&rdquo; เพื่อเริ่มวางแผน
            </p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const sub = subjects.find(s => s.id === task.subjectId);
            const topic = sub?.topics.find(t => t.id === task.topicId);
            const isDone = task.status === 'completed';
            const typeConfig = TASK_TYPES[task.type];
            const pConfig = TASK_PRIORITIES[task.priority];
            const hasSubtasks = task.subtasks && task.subtasks.length > 0;
            const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
            const subtaskPercent = hasSubtasks
              ? Math.round((completedSubtasks / task.subtasks.length) * 100)
              : 0;

            const overdue = isOverdue(task.dueDate, todayStr) && !isDone;

            return (
              <div
                key={task.id}
                className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                  isDone
                    ? 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 opacity-60'
                    : overdue
                    ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/50 hover:shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Checkbox & Info */}
                  <div className="flex items-start gap-3.5 flex-1">
                    <button
                      onClick={() => toggleTaskComplete(task.id)}
                      className={`p-1 mt-0.5 rounded-lg transition-colors ${
                        isDone ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-500'
                      }`}
                      title={isDone ? 'ทำเครื่องหมายว่ายังไม่เสร็จ' : 'ทำเครื่องหมายว่าเสร็จแล้ว'}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="space-y-1.5 flex-1">
                      {/* Badges row */}
                      <div className="flex flex-wrap items-center gap-2">
                        {sub && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-md font-semibold"
                            style={{
                              backgroundColor: `${sub.color}15`,
                              color: sub.color
                            }}
                          >
                            {sub.code || sub.name}
                          </span>
                        )}
                        {topic && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {topic.chapter ? `${topic.chapter}: ` : ''}
                            {topic.title}
                          </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${typeConfig.bgColor}`}>
                          {typeConfig.label}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${pConfig.bg} ${pConfig.color}`}>
                          สำคัญ{pConfig.label}
                        </span>
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => onEditTask(task)}
                        className={`text-base font-bold cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 ${
                          isDone ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        {task.title}
                      </h3>

                      {/* Description */}
                      {task.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Dates and Time Info */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          <span>วางแผน: </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {task.plannedDate ? formatDateThai(task.plannedDate) : 'ยังไม่ระบุ (Inbox)'}
                          </span>
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-rose-500" />
                          <span>กำหนดส่ง (Due): </span>
                          <span
                            className={`font-semibold ${
                              overdue ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {formatDateThai(task.dueDate)}
                            {overdue && ' (เกินกำหนด!)'}
                          </span>
                        </span>

                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{task.plannedDurationMinutes} นาที</span>
                          {task.plannedStartTime && ` @ ${task.plannedStartTime}`}
                        </span>

                        {task.postponedFrom && (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-md">
                            เลื่อนมาจาก {formatDateThai(task.postponedFrom)}
                          </span>
                        )}
                      </div>

                      {/* Subtasks Progress */}
                      {hasSubtasks && (
                        <div className="pt-2 max-w-sm space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>งานย่อย ({completedSubtasks}/{task.subtasks.length})</span>
                            <span>{subtaskPercent}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${subtaskPercent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onRescheduleTask(task)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-600 dark:text-slate-300 hover:text-indigo-600 text-xs font-semibold transition-colors"
                      title="ย้ายวันวางแผน"
                    >
                      เลื่อนวัน
                    </button>
                    <button
                      onClick={() => duplicateTask(task.id)}
                      className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                      title="ทำสำเนา"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors"
                      title="ลบงาน"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
