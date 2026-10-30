import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Copy,
  AlertCircle
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { Task, TaskType, TaskPriority, TaskStatus, Subtask, Subject } from '../../types';
import { TASK_TYPES, TASK_PRIORITIES, STANDARD_SUBJECT_PRESETS } from '../../utils/constants';
import { getBangkokToday } from '../../utils/dateUtils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  defaultDate?: string;
  defaultTime?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  defaultDate,
  defaultTime
}) => {
  const { subjects, addTask, updateTask, deleteTask, duplicateTask, addSubject } = useStudy();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [showCustomSubjectInput, setShowCustomSubjectInput] = useState(false);
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [type, setType] = useState<TaskType>('practice');
  const [dueDate, setDueDate] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [plannedStartTime, setPlannedStartTime] = useState('');
  const [plannedDurationMinutes, setPlannedDurationMinutes] = useState(45);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [resourceLinkInput, setResourceLinkInput] = useState('');
  const [resourceLinks, setResourceLinks] = useState<string[]>([]);
  const [recurrenceType, setRecurrenceType] = useState<'none' | 'daily' | 'weekly' | 'custom_days'>('none');
  const [recurrenceChoice, setRecurrenceChoice] = useState<'this_only' | 'all'>('this_only');

  const [formError, setFormError] = useState('');

  // Populate state on open or taskToEdit change
  useEffect(() => {
    if (!isOpen) return;

    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setSubjectId(taskToEdit.subjectId || (subjects[0]?.id ?? ''));
      setTopicId(taskToEdit.topicId || '');
      setType(taskToEdit.type);
      setDueDate(taskToEdit.dueDate || getBangkokToday());
      setPlannedDate(taskToEdit.plannedDate || '');
      setPlannedStartTime(taskToEdit.plannedStartTime || '');
      setPlannedDurationMinutes(taskToEdit.plannedDurationMinutes || 45);
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status);
      setSubtasks(taskToEdit.subtasks || []);
      setNotes(taskToEdit.notes || '');
      setResourceLinks(taskToEdit.resourceLinks || []);
      setRecurrenceType(taskToEdit.recurrence?.type || 'none');
    } else {
      const today = getBangkokToday();
      setTitle('');
      setDescription('');
      setSubjectId(subjects[0]?.id || '');
      setTopicId('');
      setType('reading');
      setDueDate(defaultDate || today);
      setPlannedDate(defaultDate !== undefined ? defaultDate : today);
      setPlannedStartTime(defaultTime || '');
      setPlannedDurationMinutes(45);
      setPriority('medium');
      setStatus('todo');
      setSubtasks([]);
      setNotes('');
      setResourceLinks([]);
      setRecurrenceType('none');
    }
    setFormError('');
  }, [isOpen, taskToEdit, defaultDate, defaultTime, subjects]);

  if (!isOpen) return null;

  const currentSubject = subjects.find(s => s.id === subjectId);
  const availableTopics = currentSubject?.topics || [];

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks(prev => [
      ...prev,
      { id: `sub-${Date.now()}`, title: newSubtaskTitle.trim(), completed: false }
    ]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(prev =>
      prev.map(st => (st.id === id ? { ...st, completed: !st.completed } : st))
    );
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(st => st.id !== id));
  };

  const handleAddLink = () => {
    if (!resourceLinkInput.trim()) return;
    setResourceLinks(prev => [...prev, resourceLinkInput.trim()]);
    setResourceLinkInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('กรุณาระบุชื่องาน');
      return;
    }
    if (!subjectId) {
      setFormError('กรุณาเลือกรายวิชา');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      subjectId,
      topicId: topicId || undefined,
      type,
      dueDate: dueDate || getBangkokToday(),
      plannedDate: plannedDate || '',
      plannedStartTime: plannedStartTime || undefined,
      plannedDurationMinutes: Number(plannedDurationMinutes) || 45,
      priority,
      status,
      subtasks,
      notes: notes.trim(),
      resourceLinks,
      recurrence:
        recurrenceType !== 'none'
          ? {
              type: recurrenceType,
              groupId: taskToEdit?.recurrence?.groupId || `rec-${Date.now()}`
            }
          : undefined
    };

    if (taskToEdit) {
      updateTask(
        {
          ...taskToEdit,
          ...payload
        },
        recurrenceChoice
      );
    } else {
      addTask(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl my-8 overflow-hidden transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {taskToEdit ? 'แก้ไขงาน' : 'เพิ่มงานใหม่'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {taskToEdit ? 'อัปเดตข้อมูลและตารางเวลา' : 'กำหนดรายละเอียดและเป้าหมายการอ่านหนังสือ'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              ชื่องาน / กิจกรรมการอ่าน <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="เช่น ทบทวนสูตรแคลคูลัสบทที่ 2, ทำโจทย์ฟิสิกส์ 20 ข้อ"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              required
            />
          </div>

          {/* Quick Standard Subject Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                เลือกวิชาด่วน:
              </label>
              <button
                type="button"
                onClick={() => setShowCustomSubjectInput(!showCustomSubjectInput)}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                {showCustomSubjectInput ? 'ซ่อน' : '+ ระบุวิชาอื่น'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {STANDARD_SUBJECT_PRESETS.map(preset => {
                const existing = subjects.find(s => s.name === preset.name || s.code === preset.code);
                const isSelected = existing ? subjectId === existing.id : false;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      if (existing) {
                        setSubjectId(existing.id);
                        setTopicId('');
                      } else {
                        const newSub = addSubject({
                          name: preset.name,
                          code: preset.code,
                          color: preset.color,
                          goal: preset.goal,
                          targetHoursPerWeek: 4,
                          resources: [],
                          topics: preset.defaultTopics.map((dt, idx) => ({
                            id: `top-${preset.id}-${idx}`,
                            title: dt.title,
                            chapter: dt.chapter,
                            status: 'not_started',
                            estimatedHours: 3
                          }))
                        });
                        setSubjectId(newSub.id);
                        setTopicId('');
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: preset.color }} />
                    <span>{preset.name}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setShowCustomSubjectInput(!showCustomSubjectInput)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border border-dashed ${
                  showCustomSubjectInput
                    ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50'
                    : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                }`}
              >
                + อื่นๆ
              </button>
            </div>

            {showCustomSubjectInput && (
              <div className="flex gap-2 mb-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <input
                  type="text"
                  value={customSubjectName}
                  onChange={e => setCustomSubjectName(e.target.value)}
                  placeholder="พิมพ์ชื่อวิชาใหม่ เช่น ดนตรี, เศรษฐศาสตร์, ภาษาญี่ปุ่น..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!customSubjectName.trim()) return;
                    const newSub = addSubject({
                      name: customSubjectName.trim(),
                      code: customSubjectName.trim().substring(0, 4).toUpperCase(),
                      color: '#6366F1',
                      goal: 'เข้าใจเนื้อหาและทำโจทย์อย่างสม่ำเสมอ',
                      targetHoursPerWeek: 4,
                      resources: [],
                      topics: []
                    });
                    setSubjectId(newSub.id);
                    setTopicId('');
                    setCustomSubjectName('');
                    setShowCustomSubjectInput(false);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700"
                >
                  สร้างวิชา
                </button>
              </div>
            )}
          </div>

          {/* Subject & Topic Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                รายวิชา <span className="text-rose-500">*</span>
              </label>
              <select
                value={subjectId}
                onChange={e => {
                  setSubjectId(e.target.value);
                  setTopicId('');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code ? `${s.code} - ` : ''}
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                หัวข้อย่อยในวิชา (ถ้ามี)
              </label>
              <select
                value={topicId}
                onChange={e => setTopicId(e.target.value)}
                disabled={availableTopics.length === 0}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50"
              >
                <option value="">-- ไม่ระบุหัวข้อย่อย --</option>
                {availableTopics.map(tp => (
                  <option key={tp.id} value={tp.id}>
                    {tp.chapter ? `[${tp.chapter}] ` : ''}
                    {tp.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Task Type & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                ประเภทกิจกรรม
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as TaskType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {Object.entries(TASK_TYPES).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                ความสำคัญ
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['high', 'medium', 'low'] as TaskPriority[]).map(p => {
                  const pConfig = TASK_PRIORITIES[p];
                  const isSelected = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                        isSelected
                          ? `${pConfig.bg} ring-2 ring-indigo-500/30`
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${pConfig.dotColor}`} />
                      {pConfig.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dates & Time (Strict requirement: Due Date separated from Planned Date) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-500" />
                  กำหนดส่ง (Due Date) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">วันสุดท้ายที่ต้องส่งงานหรือสอบ</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  วันที่วางแผนทำ (Planned Date)
                </label>
                <input
                  type="date"
                  value={plannedDate}
                  onChange={e => setPlannedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  เว้นว่างไว้หากต้องการใส่ในกล่อง Inbox
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  เวลาเริ่มทำ (ไม่บังคับ)
                </label>
                <input
                  type="time"
                  value={plannedStartTime}
                  onChange={e => setPlannedStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="text-[11px] text-slate-400 mt-1">เว้นว่างสำหรับงานไม่ระบุช่วงเวลา</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  เวลาที่ประมาณการ (นาที)
                </label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={plannedDurationMinutes}
                  onChange={e => setPlannedDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
                <div className="flex gap-1.5 mt-1.5">
                  {[25, 45, 60, 90].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setPlannedDurationMinutes(mins)}
                      className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-[11px] text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                    >
                      {mins} นาที
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Recurrence Setting */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                การทำซ้ำ (Recurrence)
              </label>
              <select
                value={recurrenceType}
                onChange={e => setRecurrenceType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm"
              >
                <option value="none">ไม่ทำซ้ำ (ครั้งเดียว)</option>
                <option value="daily">ทุกวัน (Daily)</option>
                <option value="weekly">ทุกสัปดาห์ (Weekly)</option>
              </select>

              {taskToEdit?.recurrence && (
                <div className="mt-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs space-y-1.5">
                  <p className="font-semibold text-amber-800 dark:text-amber-300">
                    งานนี้อยู่ในชุดการทำซ้ำ ต้องการอัปเดตแบบใด?
                  </p>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="rec_choice"
                        checked={recurrenceChoice === 'this_only'}
                        onChange={() => setRecurrenceChoice('this_only')}
                      />
                      <span>เปลี่ยนเฉพาะครั้งนี้</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="rec_choice"
                        checked={recurrenceChoice === 'all'}
                        onChange={() => setRecurrenceChoice('all')}
                      />
                      <span>เปลี่ยนทั้งหมดในชุด</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              งานย่อย (Subtasks) ({subtasks.filter(s => s.completed).length}/{subtasks.length})
            </label>
            <div className="space-y-2 mb-2">
              {subtasks.map(st => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-sm"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleSubtask(st.id)}
                    className="flex items-center gap-2 text-left truncate flex-1"
                  >
                    {st.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span
                      className={`truncate ${
                        st.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {st.title}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(st.id)}
                    className="p-1 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="เพิ่มหัวข้อย่อย..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> เพิ่ม
              </button>
            </div>
          </div>

          {/* Description & Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              รายละเอียด / หมายเหตุ
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="ระบุข้อความสรุป หัวข้อที่ต้องระวัง..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Links */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              ลิงก์เอกสาร หรือ แหล่งเรียนรู้
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="url"
                value={resourceLinkInput}
                onChange={e => setResourceLinkInput(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              />
              <button
                type="button"
                onClick={handleAddLink}
                className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-semibold"
              >
                เพิ่มลิงก์
              </button>
            </div>
            {resourceLinks.map((url, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mb-1"
              >
                <span className="truncate flex-1">{url}</span>
                <button
                  type="button"
                  onClick={() => setResourceLinks(prev => prev.filter((_, idx) => idx !== i))}
                  className="text-rose-500 hover:text-rose-700 ml-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Status (if editing) */}
          {taskToEdit && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                สถานะของงาน
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm"
              >
                <option value="todo">ยังไม่เริ่ม</option>
                <option value="in_progress">กำลังทำ</option>
                <option value="completed">เสร็จสิ้นแล้ว</option>
                <option value="postponed">เลื่อนเวลา</option>
                <option value="cancelled">ยกเลิก</option>
              </select>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            {taskToEdit ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    deleteTask(taskToEdit.id);
                    onClose();
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> ลบงาน
                </button>
                <button
                  type="button"
                  onClick={() => {
                    duplicateTask(taskToEdit.id);
                    onClose();
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                >
                  <Copy className="w-4 h-4" /> ทำสำเนา
                </button>
              </div>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white transition-all shadow-md shadow-indigo-500/20"
              >
                {taskToEdit ? 'บันทึกการแก้ไข' : 'สร้างงาน'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
