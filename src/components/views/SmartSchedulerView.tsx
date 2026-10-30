import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
  ShieldAlert
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { generateSmartSchedule } from '../../utils/scheduler';
import { getBangkokToday, formatDateThai, addDays, formatMinutesThai } from '../../utils/dateUtils';
import { TASK_TYPES, TASK_PRIORITIES } from '../../utils/constants';

export const SmartSchedulerView: React.FC = () => {
  const { tasks, subjects, settings, exams, updateTask } = useStudy();

  const todayStr = getBangkokToday();
  const [planDays, setPlanDays] = useState(7);
  const [appliedNotice, setAppliedNotice] = useState('');

  // Find candidate tasks: unscheduled (Inbox) or pending tasks
  const candidateTasks = tasks.filter(
    t => (!t.plannedDate || t.plannedDate < todayStr) && t.status !== 'completed' && t.status !== 'cancelled'
  );

  // Generate smart schedule proposal
  const scheduleResult = generateSmartSchedule(
    candidateTasks,
    tasks,
    settings,
    todayStr,
    exams,
    planDays
  );

  const [selectedRecommendations, setSelectedRecommendations] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    scheduleResult.recommendations.forEach(r => {
      initial[r.task.id] = true;
    });
    return initial;
  });

  const handleToggleSelect = (taskId: string) => {
    setSelectedRecommendations(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handleApplySchedule = () => {
    let appliedCount = 0;
    scheduleResult.recommendations.forEach(rec => {
      if (selectedRecommendations[rec.task.id]) {
        updateTask({
          ...rec.task,
          plannedDate: rec.suggestedDate,
          plannedStartTime: rec.suggestedStartTime || rec.task.plannedStartTime
        });
        appliedCount++;
      }
    });

    setAppliedNotice(`บันทึกตารางเรียบร้อยแล้ว ${appliedCount} งานลงในปฏิทิน!`);
    setTimeout(() => setAppliedNotice(''), 5000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-linear-to-r from-purple-600 to-indigo-600 text-white shadow-xl shadow-indigo-500/10">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ระบบจัดตารางอัจฉริยะ (Smart Scheduling)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            วิเคราะห์และเสนอแผนการอ่านที่เหมาะสมที่สุด
          </h2>
          <p className="text-xs sm:text-sm text-purple-100 max-w-xl">
            จัดเรียงตามลำดับความสำคัญ กำหนดส่ง วันสอบ และจำกัดไม่เกินเพดาน {settings.maxDailyStudyHours} ชม./วัน
            โดยไม่เปลี่ยนตารางเดิมหากคุณไม่กดยืนยัน
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={planDays}
            onChange={e => setPlanDays(Number(e.target.value))}
            className="px-3.5 py-2 rounded-xl bg-white/20 backdrop-blur-md text-white text-xs font-semibold border border-white/20"
          >
            <option value={3} className="text-slate-800">วางแผน 3 วันข้างหน้า</option>
            <option value={7} className="text-slate-800">วางแผน 7 วัน (1 สัปดาห์)</option>
            <option value={14} className="text-slate-800">วางแผน 14 วัน (2 สัปดาห์)</option>
          </select>
        </div>
      </div>

      {appliedNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-200 flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span className="font-bold">{appliedNotice}</span>
        </div>
      )}

      {/* Constraints Summary Notice */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-500" />
          <span>
            เพดานชั่วโมงสูงสุด: <strong className="text-slate-900 dark:text-white">{settings.maxDailyStudyHours} ชม./วัน</strong>
          </span>
        </div>
        <div>
          วันพักผ่อน: <strong className="text-slate-900 dark:text-white">{settings.restDays.length > 0 ? 'วันอาทิตย์' : 'ไม่มี'}</strong>
        </div>
        <div>
          งานที่รอจัดสรร (Inbox/ค้าง): <strong className="text-slate-900 dark:text-white">{candidateTasks.length} งาน</strong>
        </div>
      </div>

      {/* Workload Preview by Day */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" />
          ภาระงานรายวันหลังการจัดสรร (Daily Workload Preview)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {Object.entries(scheduleResult.dailyWorkloads).map(([date, w]) => {
            const totalMins = w.plannedMinutes + w.newMinutes;
            const percent = Math.min(100, Math.round((totalMins / w.maxMinutes) * 100));
            const isFull = percent >= 95;

            return (
              <div
                key={date}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 text-xs space-y-1.5"
              >
                <div className="font-bold text-slate-800 dark:text-slate-100 truncate">
                  {formatDateThai(date)}
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>{formatMinutesThai(totalMins)}</span>
                  <span>{percent}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isFull ? 'bg-rose-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                {w.newMinutes > 0 && (
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold block">
                    +{formatMinutesThai(w.newMinutes)} จากแผนเสนอ
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations List */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              ข้อเสนอการจัดตาราง ({scheduleResult.recommendations.length} รายการ)
            </h3>
            <p className="text-xs text-slate-400">
              คุณสามารถเลือกเฉพาะงานที่ต้องการนำไปลงปฏิทินจริงได้
            </p>
          </div>

          {scheduleResult.recommendations.length > 0 && (
            <button
              onClick={handleApplySchedule}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-indigo-500/20"
            >
              <span>ยืนยันและนำไปลงปฏิทิน</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {scheduleResult.recommendations.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold">ไม่มีงานใน Inbox หรือ งานค้างที่ต้องจัดสรร</p>
            <p className="text-xs text-slate-400 mt-1">ตารางอ่านหนังสือของคุณอยู่ในสถานะเรียบร้อยแล้ว</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scheduleResult.recommendations.map(rec => {
              const sub = subjects.find(s => s.id === rec.task.subjectId);
              const isChecked = !!selectedRecommendations[rec.task.id];
              const pConfig = TASK_PRIORITIES[rec.task.priority];

              return (
                <div
                  key={rec.task.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isChecked
                      ? 'bg-purple-50/30 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800'
                      : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleSelect(rec.task.id)}
                      className="mt-1 w-4 h-4 rounded text-indigo-600"
                    />

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {sub && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                            style={{
                              backgroundColor: `${sub.color}15`,
                              color: sub.color
                            }}
                          >
                            {sub.code || sub.name}
                          </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${pConfig.bg} ${pConfig.color}`}>
                          สำคัญ{pConfig.label}
                        </span>
                        <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          เสนอวัน: {formatDateThai(rec.suggestedDate)}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {rec.task.title}
                      </h4>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        <strong className="text-slate-700 dark:text-slate-300">เหตุผลประกอบ: </strong>
                        {rec.reason}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 text-xs text-slate-400 font-mono">
                    {rec.task.plannedDurationMinutes} นาที
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Unassigned Tasks (When free time ceiling is exceeded) */}
      {scheduleResult.unassignedTasks.length > 0 && (
        <div className="p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 space-y-3">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span>งานที่ไม่สามารถจัดสรรได้เนื่องจากเวลาว่างเต็มเพดาน ({scheduleResult.unassignedTasks.length})</span>
          </div>
          <div className="space-y-2">
            {scheduleResult.unassignedTasks.map(({ task, reason }) => (
              <div
                key={task.id}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900 text-xs flex items-center justify-between"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {task.title}
                </span>
                <span className="text-rose-600 dark:text-rose-400 shrink-0 ml-2">
                  {reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
