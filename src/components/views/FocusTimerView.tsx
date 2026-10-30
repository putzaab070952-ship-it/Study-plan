import React, { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Coffee,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  History,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { formatMinutesThai, formatDateThai } from '../../utils/dateUtils';

export const FocusTimerView: React.FC = () => {
  const {
    subjects,
    tasks,
    settings,
    activeTimer,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopAndLogSession,
    cancelTimer,
    studySessions,
    deleteSession
  } = useStudy();

  // Local form state for starting a new timer
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    activeTimer.subjectId || subjects[0]?.id || ''
  );
  const [selectedTopicId, setSelectedTopicId] = useState(activeTimer.topicId || '');
  const [selectedTaskId, setSelectedTaskId] = useState(activeTimer.taskId || '');
  const [customTitle, setCustomTitle] = useState(activeTimer.title || '');
  const [selectedDuration, setSelectedDuration] = useState<number>(25);
  const [isBreakMode, setIsBreakMode] = useState(false);

  // Stop modal confirmation
  const [showStopModal, setShowStopModal] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');

  const currentSubject = subjects.find(s => s.id === selectedSubjectId);
  const availableTopics = currentSubject?.topics || [];
  const availableTasks = tasks.filter(
    t => t.subjectId === selectedSubjectId && t.status !== 'completed' && t.status !== 'cancelled'
  );

  const minutesLeft = Math.floor(activeTimer.secondsLeft / 60);
  const secondsLeft = activeTimer.secondsLeft % 60;
  const timeFormatted = `${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`;

  const progressPercent = activeTimer.totalSeconds > 0
    ? Math.round(((activeTimer.totalSeconds - activeTimer.secondsLeft) / activeTimer.totalSeconds) * 100)
    : 0;

  const handleStart = () => {
    const taskObj = tasks.find(t => t.id === selectedTaskId);
    const subObj = subjects.find(s => s.id === selectedSubjectId);
    const topicObj = subObj?.topics.find(t => t.id === selectedTopicId);

    const title =
      customTitle.trim() ||
      taskObj?.title ||
      (topicObj ? `${subObj?.name}: ${topicObj.title}` : `${subObj?.name || 'โฟกัสอ่านหนังสือ'}`);

    startTimer({
      subjectId: selectedSubjectId,
      topicId: selectedTopicId || undefined,
      taskId: selectedTaskId || undefined,
      title,
      durationMinutes: selectedDuration,
      mode: isBreakMode ? 'break' : 'work'
    });
  };

  const handleOpenStopConfirmation = () => {
    setShowStopModal(true);
  };

  const handleConfirmSave = () => {
    stopAndLogSession(sessionNotes);
    setShowStopModal(false);
    setSessionNotes('');
  };

  const handleDiscard = () => {
    cancelTimer();
    setShowStopModal(false);
    setSessionNotes('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            ตัวจับเวลาโฟกัส (Focus & Pomodoro Timer)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            แบ่งเวลาอ่านและพักอย่างเป็นระบบเพื่อประสิทธิภาพและความจำสูงสุด
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Timer Display (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center text-center relative overflow-hidden">
            {/* Background decorative aura */}
            <div
              className={`absolute -top-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors ${
                activeTimer.mode === 'break' ? 'bg-emerald-500' : 'bg-indigo-500'
              }`}
            />

            {/* Mode badge */}
            <div className="mb-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                  activeTimer.mode === 'break'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200'
                    : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200'
                }`}
              >
                {activeTimer.mode === 'break' ? (
                  <>
                    <Coffee className="w-3.5 h-3.5" /> ช่วงพักผ่อน (Break)
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> ช่วงโฟกัสอ่านหนังสือ (Focus)
                  </>
                )}
              </span>
            </div>

            {/* Active Task / Subject Title */}
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-slate-100 max-w-md truncate mb-6">
              {activeTimer.isActive
                ? activeTimer.title
                : customTitle || 'เลือกวิชาและงานก่อนเริ่ม'}
            </h3>

            {/* Big Clock Face */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
              {/* Outer circular SVG ring */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className={`transition-all duration-1000 ${
                    activeTimer.mode === 'break' ? 'stroke-emerald-500' : 'stroke-indigo-600'
                  }`}
                  strokeWidth="6"
                  strokeDasharray="276"
                  strokeDashoffset={276 - (276 * progressPercent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Time Numbers */}
              <div className="absolute flex flex-col items-center">
                <span className="font-mono text-5xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
                  {timeFormatted}
                </span>
                <span className="text-xs text-slate-400 font-semibold mt-1">
                  {activeTimer.isActive
                    ? activeTimer.isPaused
                      ? 'หยุดชั่วคราว'
                      : 'กำลังโฟกัส'
                    : `${selectedDuration} นาที`}
                </span>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-4 mt-8">
              {!activeTimer.isActive ? (
                <button
                  onClick={handleStart}
                  className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm sm:text-base flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>เริ่มโฟกัส</span>
                </button>
              ) : (
                <>
                  {activeTimer.isPaused ? (
                    <button
                      onClick={resumeTimer}
                      className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-md"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>ทำต่อ</span>
                    </button>
                  ) : (
                    <button
                      onClick={pauseTimer}
                      className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-md"
                    >
                      <Pause className="w-4 h-4" />
                      <span>หยุดชั่วคราว</span>
                    </button>
                  )}

                  <button
                    onClick={handleOpenStopConfirmation}
                    className="px-6 py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-bold text-sm flex items-center gap-2 border border-rose-200 dark:border-rose-800 transition-all"
                  >
                    <Square className="w-4 h-4" />
                    <span>สิ้นสุด / บันทึก</span>
                  </button>
                </>
              )}
            </div>

            {/* Presets */}
            {!activeTimer.isActive && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 w-full max-w-md">
                {[
                  { label: 'Pomodoro 25 นาที', work: 25, isBreak: false },
                  { label: 'Deep Work 50 นาที', work: 50, isBreak: false },
                  { label: 'ทบทวนสั้น 15 นาที', work: 15, isBreak: false },
                  { label: 'พักสั้น 5 นาที', work: 5, isBreak: true },
                  { label: 'พักยาว 15 นาที', work: 15, isBreak: true }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedDuration(preset.work);
                      setIsBreakMode(preset.isBreak);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      selectedDuration === preset.work && isBreakMode === preset.isBreak
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Setup & History (Right Column) */}
        <div className="space-y-6">
          {/* Setup Panel */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              กำหนดเป้าหมายเซสชัน
            </h3>

            {/* Select Subject */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                วิชาที่จะอ่าน
              </label>
              <select
                disabled={activeTimer.isActive}
                value={selectedSubjectId}
                onChange={e => {
                  setSelectedSubjectId(e.target.value);
                  setSelectedTopicId('');
                  setSelectedTaskId('');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code ? `${s.code} - ` : ''}
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Link to Task */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                เชื่อมโยงกับงานใน To-do (ถ้ามี)
              </label>
              <select
                disabled={activeTimer.isActive}
                value={selectedTaskId}
                onChange={e => setSelectedTaskId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              >
                <option value="">-- ไม่เชื่อมโยง (อ่านอิสระ) --</option>
                {availableTasks.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Link to Topic */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                หัวข้อที่กำลังอ่าน (ถ้ามี)
              </label>
              <select
                disabled={activeTimer.isActive}
                value={selectedTopicId}
                onChange={e => setSelectedTopicId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              >
                <option value="">-- ไม่ระบุหัวข้อ --</option>
                {availableTopics.map(tp => (
                  <option key={tp.id} value={tp.id}>
                    {tp.chapter ? `[${tp.chapter}] ` : ''}
                    {tp.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Note or Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                เป้าหมายเฉพาะของเซสชันนี้
              </label>
              <input
                disabled={activeTimer.isActive}
                type="text"
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                placeholder="เช่น อ่านสรุป 10 หน้า, ทำโจทย์ 5 ข้อ"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>
          </div>

          {/* Session History */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-500" />
                ประวัติการอ่านล่าสุด ({studySessions.length})
              </h3>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {studySessions.slice(0, 8).map(sess => {
                const sub = subjects.find(s => s.id === sess.subjectId);
                return (
                  <div
                    key={sess.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {sess.title}
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                        {formatMinutesThai(sess.durationMinutes)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{formatDateThai(sess.date)} @ {sess.startTime}</span>
                      <button
                        onClick={() => deleteSession(sess.id)}
                        className="text-slate-300 hover:text-rose-500"
                        title="ลบประวัติตัวนี้"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {studySessions.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">ยังไม่มีประวัติการอ่านที่บันทึก</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stop & Log Confirmation Modal */}
      {showStopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ยืนยันการสิ้นสุดเซสชัน
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              เวลาที่อ่านจริง: <span className="font-bold text-indigo-600 font-mono">{formatMinutesThai(Math.max(1, Math.round(activeTimer.accumulatedSeconds / 60)))}</span>
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                บันทึกหรือสิ่งที่ได้เรียนรู้ในเซสชันนี้
              </label>
              <textarea
                rows={3}
                value={sessionNotes}
                onChange={e => setSessionNotes(e.target.value)}
                placeholder="เช่น อ่านจบบทที่ 2 ทำความเข้าใจสูตรอินทิเกรตได้ดีขึ้น..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleDiscard}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50"
              >
                ยกเลิก (ไม่บันทึก)
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md"
              >
                บันทึกเวลาจริงลงระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
