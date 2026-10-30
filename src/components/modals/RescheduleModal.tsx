import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, ArrowRight } from 'lucide-react';
import { Task } from '../../types';
import { useStudy } from '../../context/StudyContext';
import { formatDateThai, getBangkokToday, addDays } from '../../utils/dateUtils';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  task
}) => {
  const { updateTask, postponeTask } = useStudy();

  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [recurrenceChoice, setRecurrenceChoice] = useState<'this_only' | 'all'>('this_only');

  useEffect(() => {
    if (task) {
      setNewDate(task.plannedDate || getBangkokToday());
      setNewTime(task.plannedStartTime || '');
      setRecurrenceChoice('this_only');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const today = getBangkokToday();
  const tomorrow = addDays(today, 1);
  const nextMonday = addDays(today, 7);

  const handleSave = () => {
    if (!newDate) return;

    if (task.recurrence && recurrenceChoice === 'all') {
      updateTask(
        {
          ...task,
          plannedDate: newDate,
          plannedStartTime: newTime || undefined,
          postponedFrom: task.plannedDate || task.postponedFrom
        },
        'all'
      );
    } else {
      postponeTask(task.id, newDate);
      if (newTime !== (task.plannedStartTime || '')) {
        updateTask({
          ...task,
          plannedDate: newDate,
          plannedStartTime: newTime || undefined
        });
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              เลื่อนเวลา / ย้ายวันวางแผน
            </h3>
            <p className="text-xs text-slate-500 truncate max-w-xs">{task.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 mb-1">
              <span>วันที่วางแผนเดิม:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {task.plannedDate ? formatDateThai(task.plannedDate) : 'ยังไม่มีกำหนด (Inbox)'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>กำหนดส่งเดิม (Due Date):</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                {formatDateThai(task.dueDate)} (ไม่เปลี่ยนแปลง)
              </span>
            </div>
          </div>

          {/* Quick Date Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
              เลือกวันอย่างรวดเร็ว
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setNewDate(today)}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                  newDate === today
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                วันนี้
              </button>
              <button
                type="button"
                onClick={() => setNewDate(tomorrow)}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                  newDate === tomorrow
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                พรุ่งนี้
              </button>
              <button
                type="button"
                onClick={() => setNewDate(nextMonday)}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                  newDate === nextMonday
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                +7 วัน
              </button>
            </div>
          </div>

          {/* Custom Date Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" />
              ระบุวันที่ใหม่
            </label>
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              required
            />
          </div>

          {/* Time Slot Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              เวลาเริ่มต้น (ไม่ระบุก็ได้)
            </label>
            <input
              type="time"
              value={newTime}
              onChange={e => setNewTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
            />
          </div>

          {/* Recurrence choice if recurring */}
          {task.recurrence && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs space-y-1.5">
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                งานนี้มีการทำซ้ำ ต้องการเลื่อนอย่างไร?
              </p>
              <div className="flex gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="modal_rec_choice"
                    checked={recurrenceChoice === 'this_only'}
                    onChange={() => setRecurrenceChoice('this_only')}
                  />
                  <span>เลื่อนเฉพาะครั้งนี้</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="modal_rec_choice"
                    checked={recurrenceChoice === 'all'}
                    onChange={() => setRecurrenceChoice('all')}
                  />
                  <span>เลื่อนทั้งหมดในชุด</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
          >
            <span>ยืนยันการย้าย</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
