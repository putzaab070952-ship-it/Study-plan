import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Calendar,
  Clock,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  Circle,
  RotateCw,
  Award
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { Subject, Topic, TopicStatus } from '../../types';
import { calculateSubjectTopicProgress } from '../../utils/analytics';
import { formatDateThai } from '../../utils/dateUtils';
import { TOPIC_STATUSES } from '../../utils/constants';

interface SubjectsViewProps {
  onOpenAddSubject: () => void;
  onEditSubject: (subject: Subject) => void;
  onOpenAddTaskForSubject: (subjectId: string, topicId?: string) => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  onOpenAddSubject,
  onEditSubject,
  onOpenAddTaskForSubject
}) => {
  const { subjects, updateTopic, addTopic, deleteTopic, tasks, loadStandardSubjects } = useStudy();

  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(
    subjects[0]?.id || null
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            รายวิชา & หลักสูตรเนื้อหา (Subjects & Courses)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            ติดตามความคืบหน้าของบทเรียนอย่างเป็นระบบ เชื่อมโยงสู่ตารางและเป้าหมายการสอบ
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadStandardSubjects()}
            className="px-3.5 py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors border border-indigo-200/60 dark:border-indigo-800"
            title="เพิ่มรายวิชามาตรฐานทั้งหมด: คณิตศาสตร์, ฟิสิกส์, เคมี, ชีววิทยา, ภาษาไทย, สังคมศึกษา, ประวัติศาสตร์, คอมพิวเตอร์, ภาษาอังกฤษ, TPAT1, TGAT"
          >
            <BookOpen className="w-4 h-4" />
            <span>+ เพิ่มวิชามาตรฐานครบชุด</span>
          </button>
          <button
            onClick={onOpenAddSubject}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มรายวิชา</span>
          </button>
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subjects.map(subject => {
          const progress = calculateSubjectTopicProgress(subject);
          const relatedTasks = tasks.filter(t => t.subjectId === subject.id && t.status !== 'cancelled');
          const isExpanded = expandedSubjectId === subject.id;

          return (
            <div
              key={subject.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between space-y-5"
            >
              <div>
                {/* Subject Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-md"
                      style={{ backgroundColor: subject.color }}
                    >
                      {subject.code ? subject.code.substring(0, 3) : <BookOpen className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {subject.code && (
                          <span className="text-xs font-mono font-bold text-slate-500">
                            {subject.code}
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                          เป้าหมาย {subject.targetHoursPerWeek} ชม./สัปดาห์
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                        {subject.name}
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={() => onEditSubject(subject)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="แก้ไขรายวิชา"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Goal & Exam Date */}
                {subject.goal && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">เป้าหมาย: </span>
                    {subject.goal}
                  </p>
                )}

                {subject.examDate && (
                  <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 font-semibold mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>สอบ: {formatDateThai(subject.examDate)}</span>
                  </div>
                )}

                {/* Syllabus Progress (Strictly Topic-based) */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">
                      ความคืบหน้าเนื้อหา ({progress.completedTopics}/{progress.totalTopics} หัวข้อ)
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                      {progress.progressPercentage}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${progress.progressPercentage}%`,
                        backgroundColor: subject.color
                      }}
                    />
                  </div>
                </div>

                {/* Syllabus Topics Section */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      หัวข้อบทเรียน ({subject.topics.length})
                    </span>
                    <button
                      onClick={() => setExpandedSubjectId(isExpanded ? null : subject.id)}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {isExpanded ? 'ย่อรายการ' : 'ดูและแก้ไขหัวข้อ'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="space-y-2 mt-3 max-h-60 overflow-y-auto pr-1">
                      {subject.topics.map(topic => {
                        return (
                          <div
                            key={topic.id}
                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2 truncate flex-1">
                              <button
                                onClick={() => {
                                  const nextStatus: TopicStatus =
                                    topic.status === 'completed'
                                      ? 'needs_review'
                                      : topic.status === 'learning'
                                      ? 'completed'
                                      : 'learning';
                                  updateTopic(subject.id, { ...topic, status: nextStatus });
                                }}
                                className="text-slate-400 hover:text-indigo-600 shrink-0"
                                title="คลิกเพื่อเปลี่ยนสถานะ"
                              >
                                {topic.status === 'completed' ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <Circle className="w-4 h-4 text-slate-400" />
                                )}
                              </button>
                              <div className="truncate">
                                {topic.chapter && (
                                  <span className="text-[10px] text-slate-400 font-semibold mr-1">
                                    [{topic.chapter}]
                                  </span>
                                )}
                                <span className={`font-medium ${topic.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                  {topic.title}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <select
                                value={topic.status}
                                onChange={e =>
                                  updateTopic(subject.id, {
                                    ...topic,
                                    status: e.target.value as TopicStatus
                                  })
                                }
                                className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px]"
                              >
                                {Object.entries(TOPIC_STATUSES).map(([k, val]) => (
                                  <option key={k} value={k}>
                                    {val.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => onOpenAddTaskForSubject(subject.id, topic.id)}
                                className="p-1 rounded-md text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                                title="สร้างงานสำหรับหัวข้อนี้"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {subject.topics.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-2">ยังไม่มีหัวข้อย่อย</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Quick Action */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-400 font-medium">
                  {relatedTasks.length} งานในระบบ
                </span>
                <button
                  onClick={() => onOpenAddTaskForSubject(subject.id)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> เพิ่มงานในวิชานี้
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
