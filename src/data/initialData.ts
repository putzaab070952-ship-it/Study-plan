import { Subject, Task, StudySession, ReviewItem, Exam, UserSettings } from '../types';
import { getBangkokToday, addDays } from '../utils/dateUtils';
import { STANDARD_SUBJECT_PRESETS } from '../utils/constants';

export function getInitialData(): {
  subjects: Subject[];
  tasks: Task[];
  studySessions: StudySession[];
  reviewItems: ReviewItem[];
  exams: Exam[];
  settings: UserSettings;
} {
  const today = getBangkokToday();
  const tomorrow = addDays(today, 1);
  const in3Days = addDays(today, 3);
  const in5Days = addDays(today, 5);
  const in7Days = addDays(today, 7);
  const in14Days = addDays(today, 14);

  // Generate subjects directly from standard presets as requested
  const subjects: Subject[] = STANDARD_SUBJECT_PRESETS.map((preset, index) => {
    return {
      id: `sub-${preset.id}`,
      name: preset.name,
      code: preset.code,
      color: preset.color,
      goal: preset.goal,
      examDate: index === 0 ? in14Days : index === 1 ? in7Days : index === 9 ? in14Days : undefined,
      targetHoursPerWeek: index < 4 ? 6 : index === 9 || index === 10 ? 5 : 4,
      createdAt: today,
      resources: [],
      topics: preset.defaultTopics.map((dt, topicIdx) => ({
        id: `top-${preset.id}-${topicIdx + 1}`,
        title: dt.title,
        chapter: dt.chapter,
        status: topicIdx === 0 ? 'completed' : topicIdx === 1 ? 'learning' : 'not_started',
        estimatedHours: 3
      }))
    };
  });

  const tasks: Task[] = [
    {
      id: 'task-1',
      title: 'ทบทวนสูตรแคลคูลัสและทำโจทย์อนุพันธ์ 20 ข้อ',
      description: 'ทำแบบฝึกหัดเรื่อง Chain Rule และ Product Rule',
      subjectId: 'sub-math',
      topicId: 'top-math-2',
      type: 'practice',
      dueDate: tomorrow,
      plannedDate: today,
      plannedStartTime: '10:00',
      plannedDurationMinutes: 60,
      priority: 'high',
      status: 'todo',
      subtasks: [
        { id: 'sub-1a', title: 'สรุปสูตรดิฟตรีโกณมิติ', completed: true },
        { id: 'sub-1b', title: 'ทำโจทย์ข้อ 1 - 10', completed: false },
        { id: 'sub-1c', title: 'ตรวจเฉลยและลงคะแนน', completed: false }
      ],
      notes: 'เน้นข้อที่เป็นตรีโกณมิติประยุกต์',
      resourceLinks: [],
      createdAt: today
    },
    {
      id: 'task-2',
      title: 'ดูวิดีโอบรรยาย ฟิสิกส์ งานและพลังงาน (Work & Energy)',
      description: 'เลกเชอร์ชั่วโมงที่ 3 พร้อมจดสมการอนุรักษ์พลังงานกล',
      subjectId: 'sub-physics',
      topicId: 'top-physics-2',
      type: 'lecture',
      dueDate: in3Days,
      plannedDate: today,
      plannedStartTime: '14:00',
      plannedDurationMinutes: 50,
      priority: 'high',
      status: 'in_progress',
      subtasks: [
        { id: 'sub-2a', title: 'ดูวิดีโอช่วงที่ 1 (30 นาที)', completed: true },
        { id: 'sub-2b', title: 'ดูวิดีโอช่วงที่ 2 (20 นาที)', completed: false }
      ],
      notes: 'ดูสไลด์ประกอบ',
      resourceLinks: [],
      createdAt: today
    },
    {
      id: 'task-3',
      title: 'ทำข้อสอบจำลอง TGAT 2 (การคิดอย่างมีเหตุผล)',
      description: 'จับเวลาจริง 60 นาที ฝึกวิเคราะห์ข้อมูลและตรรกศาสตร์',
      subjectId: 'sub-tgat',
      topicId: 'top-tgat-2',
      type: 'practice',
      dueDate: in5Days,
      plannedDate: today,
      plannedStartTime: '16:00',
      plannedDurationMinutes: 75,
      priority: 'medium',
      status: 'todo',
      subtasks: [
        { id: 'sub-3a', title: 'ทำพาร์ทข้อความและจับใจความ', completed: false },
        { id: 'sub-3b', title: 'ทำพาร์ทการแก้ปัญหาและตรรกศาสตร์', completed: false }
      ],
      notes: '',
      resourceLinks: [],
      createdAt: today
    },
    {
      id: 'task-4',
      title: 'ทบทวนคำศัพท์ภาษาอังกฤษ Core Academic Vocabulary (50 คำ)',
      description: 'ใช้แฟลชการ์ดท่องคำศัพท์และแต่งประโยคตัวอย่าง',
      subjectId: 'sub-english',
      topicId: 'top-english-2',
      type: 'review',
      dueDate: tomorrow,
      plannedDate: tomorrow,
      plannedStartTime: '09:30',
      plannedDurationMinutes: 30,
      priority: 'medium',
      status: 'todo',
      subtasks: [],
      notes: '',
      resourceLinks: [],
      createdAt: today
    },
    {
      id: 'task-5',
      title: 'ฝึกเชื่อมโยงเหตุและผล TPAT1 (พาร์ทเชื่อมโยงแพทย์)',
      description: 'ฝึกทำบทความตัวอย่าง กสพท. 2 บทความและระบุรหัสคำตอบ',
      subjectId: 'sub-tpat1',
      topicId: 'top-tpat1-3',
      type: 'practice',
      dueDate: in5Days,
      plannedDate: in3Days,
      plannedStartTime: '13:00',
      plannedDurationMinutes: 90,
      priority: 'high',
      status: 'todo',
      subtasks: [],
      notes: 'ระวังจุดหลอกเรื่องความสัมพันธ์แบบยับยั้ง (F)',
      resourceLinks: [],
      createdAt: today
    },
    {
      id: 'task-inbox-1',
      title: 'อ่านสรุปเคมี กรด-เบส และคำนวณค่า pH',
      description: 'ยังไม่ได้ระบุวัน รออ่านทบทวนโมลและสมดุลเคมีให้เสร็จก่อน',
      subjectId: 'sub-chemistry',
      topicId: 'top-chemistry-6',
      type: 'reading',
      dueDate: in14Days,
      plannedDate: '',
      plannedDurationMinutes: 45,
      priority: 'low',
      status: 'todo',
      subtasks: [],
      notes: '',
      resourceLinks: [],
      createdAt: today
    }
  ];

  const studySessions: StudySession[] = [
    {
      id: 'sess-1',
      subjectId: 'sub-math',
      topicId: 'top-math-1',
      title: 'ทบทวนเรื่องเซตและตรรกศาสตร์',
      date: today,
      startTime: '08:30',
      durationMinutes: 45,
      type: 'pomodoro',
      notes: 'ทำความเข้าใจแผนภาพเวนน์-ออยเลอร์และสมมูล',
      completedAt: `${today}T09:15:00`
    }
  ];

  const reviewItems: ReviewItem[] = [
    {
      id: 'rev-1',
      subjectId: 'sub-math',
      topicId: 'top-math-1',
      title: 'ทบทวนสูตรตรรกศาสตร์และตัวบ่งปริมาณ',
      level: 1,
      lastReviewedDate: today,
      nextReviewDate: today,
      history: [
        { date: addDays(today, -3), rating: 4, notes: 'จำสูตรสมมูลได้ดี' }
      ],
      createdAt: addDays(today, -3)
    },
    {
      id: 'rev-2',
      subjectId: 'sub-physics',
      topicId: 'top-physics-1',
      title: 'ทบทวนสูตร 5 สมการการเคลื่อนที่แนวตรง',
      level: 2,
      lastReviewedDate: addDays(today, -2),
      nextReviewDate: in3Days,
      history: [
        { date: addDays(today, -7), rating: 3, notes: 'ยังสับสนทิศทางความเร่ง' },
        { date: addDays(today, -2), rating: 5, notes: 'ทำโจทย์คล่องแล้ว' }
      ],
      createdAt: addDays(today, -7)
    }
  ];

  const exams: Exam[] = [
    {
      id: 'exam-phys',
      title: 'สอบกลางภาควิชาฟิสิกส์ทั่วไป',
      subjectId: 'sub-physics',
      examDate: in7Days,
      startTime: '09:00',
      location: 'ห้องบรรยาย SC-201',
      weightPercentage: 35,
      targetScore: '85/100',
      notes: 'เตรียมเครื่องคิดเลขและบัตรประจำตัว'
    },
    {
      id: 'exam-tpat1',
      title: 'สอบ TPAT1 ความถนัดแพทย์ กสพท.',
      subjectId: 'sub-tpat1',
      examDate: in14Days,
      startTime: '08:30',
      location: 'สนามสอบกรุงเทพฯ',
      weightPercentage: 30,
      targetScore: '70%+',
      notes: 'ดินสอ 2B ยางลบ และบัตรประชาชน'
    }
  ];

  const settings: UserSettings = {
    dailyTargetHours: 4,
    weeklyTargetHours: 24,
    maxDailyStudyHours: 6,
    restDays: [0],
    pomodoroWorkMinutes: 25,
    pomodoroBreakMinutes: 5,
    spacedIntervals: [1, 3, 7, 14, 30],
    darkMode: false
  };

  return {
    subjects,
    tasks,
    studySessions,
    reviewItems,
    exams,
    settings
  };
}
