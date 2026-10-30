import React, { useState } from 'react';
import {
  RotateCw,
  Award,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Star,
  Info
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { ReviewItem, Exam } from '../../types';
import {
  getBangkokToday,
  formatDateThai,
  diffDays,
  addDays
} from '../../utils/dateUtils';
import { calculateSubjectTopicProgress } from '../../utils/analytics';

export const SpacedRepetitionView: React.FC = () => {
  const {
    subjects,
    reviewItems,
    exams,
    addReviewItem,
    submitReviewRating,
    rescheduleReview,
    deleteReviewItem,
    addExam,
    deleteExam,
    settings
  } = useStudy();

  const todayStr = getBangkokToday();

  // Review Items: due today vs upcoming
  const dueReviews = reviewItems.filter(r => r.nextReviewDate <= todayStr);
  const futureReviews = reviewItems.filter(r => r.nextReviewDate > todayStr);

  // Modal / Form states for Manual Review Item
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewSubjectId, setNewReviewSubjectId] = useState(subjects[0]?.id || '');
  const [newReviewDays, setNewReviewDays] = useState(1);

  // Modal / Form states for Exam
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamSubjectId, setNewExamSubjectId] = useState(subjects[0]?.id || '');
  const [newExamDate, setNewExamDate] = useState(addDays(todayStr, 14));
  const [newExamLocation, setNewExamLocation] = useState('');
  const [newExamTargetScore, setNewExamTargetScore] = useState('');

  // Rating interaction state
  const [ratingNotes, setRatingNotes] = useState<Record<string, string>>({});

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewTitle.trim() || !newReviewSubjectId) return;

    addReviewItem({
      subjectId: newReviewSubjectId,
      title: newReviewTitle.trim(),
      level: 0,
      nextReviewDate: addDays(todayStr, newReviewDays)
    });

    setNewReviewTitle('');
    setShowAddReviewModal(false);
  };

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle.trim() || !newExamSubjectId || !newExamDate) return;

    addExam({
      title: newExamTitle.trim(),
      subjectId: newExamSubjectId,
      examDate: newExamDate,
      location: newExamLocation.trim() || undefined,
      targetScore: newExamTargetScore.trim() || undefined
    });

    setNewExamTitle('');
    setNewExamLocation('');
    setNewExamTargetScore('');
    setShowAddExamModal(false);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <RotateCw className="w-5 h-5 text-purple-600" />
            การทบทวนเว้นระยะ & วางแผนเตรียมสอบ (Spaced Repetition & Exam Planner)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            ทบทวนเนื้อหาก่อนจะลืมตามกราฟความจำ Ebbinghaus และเก็งคะแนนสอบ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddReviewModal(true)}
            className="px-3.5 py-2 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 font-semibold text-xs hover:bg-purple-100 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างหัวข้อทบทวน</span>
          </button>
          <button
            onClick={() => setShowAddExamModal(true)}
            className="px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
          >
            <Award className="w-4 h-4" />
            <span>เพิ่มการสอบใหม่</span>
          </button>
        </div>
      </div>

      {/* Scientific note notice */}
      <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 flex items-start gap-3 text-xs text-purple-900 dark:text-purple-200">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-purple-600" />
        <p>
          ระบบใช้การประเมินตนเอง (Self-Assessment) ระดับ 1–5 เพื่อช่วยคำนวณรอบถัดไปสำหรับวางแผนอ่านหนังสือ
          โดยเว้นระยะตามช่วงที่ตั้งไว้ ({settings.spacedIntervals.join(', ')} วัน) มิใช่การวัดผลทางสติปัญญาอย่างสมบูรณ์
        </p>
      </div>

      {/* Section 1: Reviews Due Today */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            หัวข้อที่ถึงกำหนดทบทวนในวันนี้ ({dueReviews.length})
          </h3>
          <span className="text-xs text-slate-400">
            {dueReviews.length === 0 ? 'ทบทวนครบหมดแล้ว!' : 'ให้คะแนนความเข้าใจเพื่อคำนวณวันถัดไป'}
          </span>
        </div>

        {dueReviews.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              ไม่มีหัวข้อที่ต้องทบทวนในวันนี้
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              คุณสามารถสร้างหัวข้อทบทวนด้วยตนเอง หรือเมื่อเรียนจบแต่ละบทเรียนในหน้ารายวิชา
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dueReviews.map(item => {
              const sub = subjects.find(s => s.id === item.subjectId);
              return (
                <div
                  key={item.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-purple-200/80 dark:border-purple-900/40 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
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
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        รอบการทบทวนที่ {item.level + 1}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteReviewItem(item.id)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Rating Selector 1 to 5 */}
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      ประเมินความจำ / ความเข้าใจ:
                    </span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { score: 1, label: 'ลืมหมด' },
                        { score: 2, label: 'นึกยาก' },
                        { score: 3, label: 'ปานกลาง' },
                        { score: 4, label: 'จำได้ดี' },
                        { score: 5, label: 'แม่นยำ' }
                      ].map(r => (
                        <button
                          key={r.score}
                          onClick={() => submitReviewRating(item.id, r.score, ratingNotes[item.id])}
                          className="py-2 px-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-600 hover:text-white text-purple-700 dark:text-purple-300 text-center transition-colors text-xs font-semibold border border-purple-200 dark:border-purple-800"
                        >
                          <span className="block text-sm font-bold">{r.score}</span>
                          <span className="text-[9px] block truncate">{r.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Reschedule */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">ยังไม่พร้อมทบทวน?</span>
                    <button
                      onClick={() => rescheduleReview(item.id, addDays(todayStr, 2))}
                      className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                      เลื่อนไปอีก 2 วัน &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Upcoming Exam Board */}
      <div className="space-y-4 pt-4 border-t border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-rose-500" />
            การสอบและเป้าหมายความพร้อม ({exams.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exams.map(exam => {
            const sub = subjects.find(s => s.id === exam.subjectId);
            const daysLeft = diffDays(exam.examDate, todayStr);
            const progress = sub ? calculateSubjectTopicProgress(sub) : { progressPercentage: 0, completedTopics: 0, totalTopics: 0 };

            return (
              <div
                key={exam.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {sub && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: `${sub.color}15`,
                          color: sub.color
                        }}
                      >
                        {sub.code || sub.name}
                      </span>
                    )}
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">
                      {exam.title}
                    </h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDateThai(exam.examDate, true)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-2xl font-black ${
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
                    <p className="text-[10px] text-slate-400">นับถอยหลัง</p>
                  </div>
                </div>

                {/* Scope & Syllabus progress */}
                <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">
                      ความพร้อมเนื้อหา ({progress.completedTopics}/{progress.totalTopics} หัวข้อ)
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                      {progress.progressPercentage}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${progress.progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Additional Exam Info */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                  {exam.location && <span>สถานที่: {exam.location}</span>}
                  {exam.targetScore && (
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      เป้าหมายคะแนน: {exam.targetScore}
                    </span>
                  )}
                  <button
                    onClick={() => deleteExam(exam.id)}
                    className="text-slate-400 hover:text-rose-500 p-1 ml-auto"
                    title="ลบรายการสอบ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Review Item Modal */}
      {showAddReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              สร้างหัวข้อทบทวนด้วยตนเอง
            </h3>
            <form onSubmit={handleAddReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  หัวข้อ / บทเรียน
                </label>
                <input
                  type="text"
                  value={newReviewTitle}
                  onChange={e => setNewReviewTitle(e.target.value)}
                  placeholder="เช่น ทฤษฎีบทแซนด์วิช, 5 สมการการเคลื่อนที่"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  วิชา
                </label>
                <select
                  value={newReviewSubjectId}
                  onChange={e => setNewReviewSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
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
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  ทบทวนครั้งแรกในอีกกี่วัน?
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={newReviewDays}
                  onChange={e => setNewReviewDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddReviewModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md"
                >
                  สร้างหัวข้อทบทวน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Exam Modal */}
      {showAddExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              เพิ่มรายการสอบใหม่
            </h3>
            <form onSubmit={handleAddExam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  ชื่อการสอบ
                </label>
                <input
                  type="text"
                  value={newExamTitle}
                  onChange={e => setNewExamTitle(e.target.value)}
                  placeholder="เช่น สอบปลายภาค ฟิสิกส์ 1"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  วิชา
                </label>
                <select
                  value={newExamSubjectId}
                  onChange={e => setNewExamSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
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
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  วันสอบ
                </label>
                <input
                  type="date"
                  value={newExamDate}
                  onChange={e => setNewExamDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  สถานที่ หรือ ห้องสอบ (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={newExamLocation}
                  onChange={e => setNewExamLocation(e.target.value)}
                  placeholder="เช่น ตึกวิศวะ ห้อง 402"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  เป้าหมายคะแนน
                </label>
                <input
                  type="text"
                  value={newExamTargetScore}
                  onChange={e => setNewExamTargetScore(e.target.value)}
                  placeholder="เช่น 85/100 หรือ เกรด A"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExamModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md"
                >
                  บันทึกการสอบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
