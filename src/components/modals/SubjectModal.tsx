import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { Subject, Topic, TopicStatus } from '../../types';
import { SUBJECT_PALETTE, TOPIC_STATUSES, STANDARD_SUBJECT_PRESETS, StandardSubjectPreset } from '../../utils/constants';
import { getBangkokToday } from '../../utils/dateUtils';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectToEdit?: Subject | null;
}

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  onClose,
  subjectToEdit
}) => {
  const { addSubject, updateSubject, deleteSubject } = useStudy();

  const [selectedPresetId, setSelectedPresetId] = useState<string>('other');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState(SUBJECT_PALETTE[0]);
  const [goal, setGoal] = useState('');
  const [examDate, setExamDate] = useState('');
  const [targetHoursPerWeek, setTargetHoursPerWeek] = useState(4);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicChapter, setNewTopicChapter] = useState('');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [resources, setResources] = useState<Array<{ id: string; title: string; url: string }>>([]);

  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (subjectToEdit) {
      setName(subjectToEdit.name);
      setCode(subjectToEdit.code);
      setColor(subjectToEdit.color);
      setGoal(subjectToEdit.goal || '');
      setExamDate(subjectToEdit.examDate || '');
      setTargetHoursPerWeek(subjectToEdit.targetHoursPerWeek || 4);
      setTopics(subjectToEdit.topics || []);
      setResources(subjectToEdit.resources || []);

      const matchedPreset = STANDARD_SUBJECT_PRESETS.find(
        p => p.name === subjectToEdit.name || p.code === subjectToEdit.code
      );
      setSelectedPresetId(matchedPreset ? matchedPreset.id : 'other');
    } else {
      setName('');
      setCode('');
      setColor(SUBJECT_PALETTE[0]);
      setGoal('');
      setExamDate('');
      setTargetHoursPerWeek(4);
      setTopics([]);
      setResources([]);
      setSelectedPresetId('other');
    }
    setError('');
  }, [isOpen, subjectToEdit]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: StandardSubjectPreset | 'other') => {
    if (preset === 'other') {
      setSelectedPresetId('other');
      setName('');
      setCode('');
      setGoal('');
      return;
    }

    setSelectedPresetId(preset.id);
    setName(preset.name);
    setCode(preset.code);
    setColor(preset.color);
    setGoal(preset.goal);

    // If topics are empty, prefill with standard topics for convenience
    if (topics.length === 0 && preset.defaultTopics) {
      const generatedTopics: Topic[] = preset.defaultTopics.map((dt, idx) => ({
        id: `top-${Date.now()}-${idx}`,
        title: dt.title,
        chapter: dt.chapter,
        status: 'not_started',
        estimatedHours: 3
      }));
      setTopics(generatedTopics);
    }
  };

  const handleAddTopic = () => {
    if (!newTopicTitle.trim()) return;
    const newTopic: Topic = {
      id: `top-${Date.now()}`,
      title: newTopicTitle.trim(),
      chapter: newTopicChapter.trim() || undefined,
      status: 'not_started',
      estimatedHours: 3
    };
    setTopics(prev => [...prev, newTopic]);
    setNewTopicTitle('');
    setNewTopicChapter('');
  };

  const handleTopicStatusChange = (topicId: string, status: TopicStatus) => {
    setTopics(prev =>
      prev.map(t =>
        t.id === topicId
          ? {
              ...t,
              status,
              completedAt: status === 'completed' ? getBangkokToday() : undefined
            }
          : t
      )
    );
  };

  const handleRemoveTopic = (topicId: string) => {
    setTopics(prev => prev.filter(t => t.id !== topicId));
  };

  const handleAddResource = () => {
    if (!resourceTitle.trim() || !resourceUrl.trim()) return;
    setResources(prev => [
      ...prev,
      { id: `res-${Date.now()}`, title: resourceTitle.trim(), url: resourceUrl.trim() }
    ]);
    setResourceTitle('');
    setResourceUrl('');
  };

  const handleRemoveResource = (id: string) => {
    setResources(prev => prev.filter(r => r.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('กรุณาระบุชื่อวิชา');
      return;
    }

    const payload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      color,
      goal: goal.trim(),
      examDate: examDate || undefined,
      targetHoursPerWeek: Number(targetHoursPerWeek) || 4,
      resources,
      topics
    };

    if (subjectToEdit) {
      updateSubject({
        ...subjectToEdit,
        ...payload
      });
    } else {
      addSubject(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: color }}
            />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {subjectToEdit ? 'แก้ไขวิชาและหลักสูตร' : 'เพิ่มรายวิชาใหม่'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Subject Presets */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-2.5">
            <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              เลือกจากวิชามาตรฐาน:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STANDARD_SUBJECT_PRESETS.map(preset => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: preset.color }}
                    />
                    <span>{preset.name}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => handleSelectPreset('other')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedPresetId === 'other'
                    ? 'bg-slate-700 text-white dark:bg-slate-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                + อื่นๆ (ระบุเอง)
              </button>
            </div>
          </div>

          {/* Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                ชื่อวิชา <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  setSelectedPresetId('other');
                }}
                placeholder="เช่น คณิตศาสตร์, ฟิสิกส์, TPAT1, TGAT หรือวิชาอื่นๆ"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                รหัสวิชา / ตัวย่อ (ถ้ามี)
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="MATH, PHYS, TGAT"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              สีประจำวิชา
            </label>
            <div className="flex flex-wrap gap-2.5">
              {SUBJECT_PALETTE.map(hex => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setColor(hex)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === hex ? 'scale-125 ring-2 ring-offset-2 ring-indigo-500' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          {/* Goal & Target Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                เป้าหมายการเรียน
              </label>
              <input
                type="text"
                value={goal}
                onChange={e => setGoal(e.target.value)}
                placeholder="เช่น เข้าใจสูตรและทำข้อสอบเก่าได้ 80%"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                เป้าหมายอ่าน (ชั่วโมง/สัปดาห์)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={targetHoursPerWeek}
                onChange={e => setTargetHoursPerWeek(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              />
            </div>
          </div>

          {/* Exam Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              วันสอบหรือวันเป้าหมายเรียนจบ (ถ้ามี)
            </label>
            <input
              type="date"
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
            />
          </div>

          {/* Syllabus Topics Management */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                บทเรียนและหัวข้อย่อย ({topics.filter(t => t.status === 'completed').length}/{topics.length} หัวข้อเสร็จแล้ว)
              </span>
            </div>

            {/* Topics List */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {topics.map(tp => (
                <div
                  key={tp.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs"
                >
                  <div className="flex-1 truncate">
                    <span className="font-semibold text-slate-500 mr-1.5">
                      {tp.chapter ? `[${tp.chapter}]` : ''}
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {tp.title}
                    </span>
                  </div>
                  <select
                    value={tp.status}
                    onChange={e => handleTopicStatusChange(tp.id, e.target.value as TopicStatus)}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[11px]"
                  >
                    {Object.entries(TOPIC_STATUSES).map(([k, val]) => (
                      <option key={k} value={k}>
                        {val.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveTopic(tp.id)}
                    className="p-1 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {topics.length === 0 && (
                <p className="text-xs text-slate-400 py-2 text-center">ยังไม่มีหัวข้อย่อย (สามารถเพิ่มได้เองด้านล่าง)</p>
              )}
            </div>

            {/* Add Topic Input */}
            <div className="flex gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <input
                type="text"
                value={newTopicChapter}
                onChange={e => setNewTopicChapter(e.target.value)}
                placeholder="บทที่ เช่น บทที่ 1"
                className="w-24 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
              <input
                type="text"
                value={newTopicTitle}
                onChange={e => setNewTopicTitle(e.target.value)}
                placeholder="ชื่อหัวข้อ เช่น เซตและตรรกศาสตร์..."
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
              <button
                type="button"
                onClick={handleAddTopic}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold text-xs flex items-center gap-1 hover:bg-indigo-100"
              >
                <Plus className="w-3.5 h-3.5" /> เพิ่มหัวข้อ
              </button>
            </div>
          </div>

          {/* Resources & Links */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              เอกสารประกอบหรือลิงก์คอร์ส
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={resourceTitle}
                onChange={e => setResourceTitle(e.target.value)}
                placeholder="ชื่อเอกสาร เช่น สไลด์ PDF"
                className="w-1/3 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
              <input
                type="url"
                value={resourceUrl}
                onChange={e => setResourceUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
              <button
                type="button"
                onClick={handleAddResource}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-semibold"
              >
                เพิ่ม
              </button>
            </div>
            {resources.map(res => (
              <div
                key={res.id}
                className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs mb-1"
              >
                <span className="font-semibold text-slate-700 dark:text-slate-300 mr-2">
                  {res.title}
                </span>
                <span className="truncate flex-1 text-slate-500">{res.url}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveResource(res.id)}
                  className="text-rose-500 hover:text-rose-700 ml-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {subjectToEdit ? (
              <button
                type="button"
                onClick={() => {
                  deleteSubject(subjectToEdit.id);
                  onClose();
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> ลบวิชานี้
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
              >
                {subjectToEdit ? 'บันทึกการแก้ไข' : 'สร้างวิชาใหม่'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
