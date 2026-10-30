import { TaskType, TaskPriority, TaskStatus, TopicStatus } from '../types';

export const TASK_TYPES: Record<TaskType, { label: string; icon: string; color: string; bgColor: string }> = {
  reading: { label: 'อ่านเนื้อหา', icon: 'BookOpen', color: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800' },
  lecture: { label: 'ดูบทเรียน', icon: 'Video', color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
  practice: { label: 'ทำโจทย์', icon: 'PenTool', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  review: { label: 'ทบทวน', icon: 'RotateCw', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
  homework: { label: 'การบ้าน', icon: 'FileText', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  exam: { label: 'สอบ', icon: 'Award', color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' }
};

export const TASK_PRIORITIES: Record<TaskPriority, { label: string; color: string; dotColor: string; bg: string }> = {
  high: { label: 'สูง', color: 'text-rose-600 dark:text-rose-400', dotColor: 'bg-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' },
  medium: { label: 'กลาง', color: 'text-amber-600 dark:text-amber-400', dotColor: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
  low: { label: 'ต่ำ', color: 'text-slate-500 dark:text-slate-400', dotColor: 'bg-slate-400', bg: 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700' }
};

export const TASK_STATUSES: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  todo: { label: 'ยังไม่เริ่ม', color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800' },
  in_progress: { label: 'กำลังทำ', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
  completed: { label: 'เสร็จแล้ว', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
  postponed: { label: 'เลื่อนเวลา', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
  cancelled: { label: 'ยกเลิก', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300' }
};

export const TOPIC_STATUSES: Record<TopicStatus, { label: string; color: string; bg: string }> = {
  not_started: { label: 'ยังไม่เรียน', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
  learning: { label: 'กำลังเรียน', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
  completed: { label: 'เรียนจบแล้ว', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
  needs_review: { label: 'ต้องทบทวน', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' }
};

export const SUBJECT_PALETTE = [
  '#6366F1', // Indigo (Math / General)
  '#06B6D4', // Cyan (Physics)
  '#F59E0B', // Amber (Chemistry)
  '#10B981', // Emerald (Biology)
  '#EC4899', // Pink (English / Thai)
  '#8B5CF6', // Purple (TGAT / TPAT)
  '#3B82F6', // Blue (Social / History)
  '#14B8A6', // Teal (Computer)
  '#F97316'  // Orange
];

export interface StandardSubjectPreset {
  id: string;
  name: string;
  code: string;
  color: string;
  goal: string;
  defaultTopics: Array<{ chapter: string; title: string }>;
}

export const STANDARD_SUBJECT_PRESETS: StandardSubjectPreset[] = [
  {
    id: 'math',
    name: 'คณิตศาสตร์',
    code: 'MATH',
    color: '#6366F1', // Indigo
    goal: 'เข้าใจนิยาม ทฤษฎีบท และทำโจทย์ข้อสอบเก่าให้ได้คะแนน 80% ขึ้นไป',
    defaultTopics: [
      { chapter: 'บทที่ 1', title: 'เซตและตรรกศาสตร์' },
      { chapter: 'บทที่ 2', title: 'ระบบจำนวนจริงและพหุนาม' },
      { chapter: 'บทที่ 3', title: 'ฟังก์ชันและเรขาคณิตวิเคราะห์' },
      { chapter: 'บทที่ 4', title: 'เอกซ์โพเนนเชียลและลอการิทึม' },
      { chapter: 'บทที่ 5', title: 'แคลคูลัส (ลิมิต อนุพันธ์ อินทิกรัล)' },
      { chapter: 'บทที่ 6', title: 'สถิติและความน่าจะเป็น' }
    ]
  },
  {
    id: 'physics',
    name: 'ฟิสิกส์',
    code: 'PHYS',
    color: '#06B6D4', // Cyan
    goal: 'เข้าใจปรากฏการณ์ธรรมชาติ กฎของนิวตัน และสูตรคำนวณกลศาสตร์-ไฟฟ้า',
    defaultTopics: [
      { chapter: 'บทที่ 1', title: 'การเคลื่อนที่แนวตรงและกฎของนิวตัน' },
      { chapter: 'บทที่ 2', title: 'งาน พลังงาน และโมเมนตัม' },
      { chapter: 'บทที่ 3', title: 'การเคลื่อนที่แบบต่างๆ (โพรเจกไทล์, วงกลม)' },
      { chapter: 'บทที่ 4', title: 'คลื่น เสียง และแสงเชิงฟิสิกส์' },
      { chapter: 'บทที่ 5', title: 'ไฟฟ้าสถิตและไฟฟ้ากระแส' },
      { chapter: 'บทที่ 6', title: 'ฟิสิกส์อะตอมและนิวเคลียร์' }
    ]
  },
  {
    id: 'chemistry',
    name: 'เคมี',
    code: 'CHEM',
    color: '#F59E0B', // Amber
    goal: 'จำตารางธาตุ เข้าใจพันธะเคมี และคำนวณปริมาณสารสัมพันธ์ได้อย่างแม่นยำ',
    defaultTopics: [
      { chapter: 'บทที่ 1', title: 'โครงสร้างอะตอมและตารางธาตุ' },
      { chapter: 'บทที่ 2', title: 'พันธะเคมี (ไอออนิก โคเวเลนต์ โลหะ)' },
      { chapter: 'บทที่ 3', title: 'โมลและสูตรเคมี (ปริมาณสารสัมพันธ์)' },
      { chapter: 'บทที่ 4', title: 'แก๊ส ของเหลว และของแข็ง' },
      { chapter: 'บทที่ 5', title: 'อัตราการเกิดปฏิกิริยาเคมีและสมดุลเคมี' },
      { chapter: 'บทที่ 6', title: 'กรด-เบส และเคมีอินทรีย์' }
    ]
  },
  {
    id: 'biology',
    name: 'ชีววิทยา',
    code: 'BIO',
    color: '#10B981', // Emerald
    goal: 'จดจำและเชื่อมโยงระบบต่างๆ ของสิ่งมีชีวิต พันธุศาสตร์ และนิเวศวิทยา',
    defaultTopics: [
      { chapter: 'บทที่ 1', title: 'เคมีที่เป็นพื้นฐานของสิ่งมีชีวิตและเซลล์' },
      { chapter: 'บทที่ 2', title: 'การลำเลียงสารและการหายใจระดับเซลล์' },
      { chapter: 'บทที่ 3', title: 'การแบ่งเซลล์และพันธุศาสตร์ (DNA/ยีน)' },
      { chapter: 'บทที่ 4', title: 'กายวิภาคและสรีรวิทยาของพืช' },
      { chapter: 'บทที่ 5', title: 'ระบบร่างกายมนุษย์ (หมุนเวียนเลือด ย่อย ขับถ่าย)' },
      { chapter: 'บทที่ 6', title: 'วิวัฒนาการและระบบนิเวศ' }
    ]
  },
  {
    id: 'thai',
    name: 'ภาษาไทย',
    code: 'THAI',
    color: '#EC4899', // Pink
    goal: 'หลักภาษา การใช้คำ การอ่านจับใจความ วรรณคดี และการเขียนสื่อสาร',
    defaultTopics: [
      { chapter: 'ตอนที่ 1', title: 'การสะกดคำ การสร้างคำ และชนิดของคำ' },
      { chapter: 'ตอนที่ 2', title: 'ประโยคและการใช้ภาษาให้ถูกต้อง' },
      { chapter: 'ตอนที่ 3', title: 'การอ่านจับใจความและวิเคราะห์สาระสำคัญ' },
      { chapter: 'ตอนที่ 4', title: 'ระดับภาษา ราชาศัพท์ และสำนวนไทย' },
      { chapter: 'ตอนที่ 5', title: 'วรรณคดีและวรรณกรรมสำคัญ' }
    ]
  },
  {
    id: 'social',
    name: 'สังคมศึกษา',
    code: 'SOC',
    color: '#3B82F6', // Blue
    goal: 'เข้าใจหน้าที่พลเมือง เศรษฐศาสตร์ ศาสนา และภูมิศาสตร์รอบตัว',
    defaultTopics: [
      { chapter: 'สาระที่ 1', title: 'ศาสนา ศีลธรรม จริยธรรม' },
      { chapter: 'สาระที่ 2', title: 'หน้าที่พลเมือง วัฒนธรรม และการดำเนินชีวิต' },
      { chapter: 'สาระที่ 3', title: 'เศรษฐศาสตร์เบื้องต้นและการเงินการธนาคาร' },
      { chapter: 'สาระที่ 4', title: 'ภูมิศาสตร์ กายภาพ และสิ่งแวดล้อม' }
    ]
  },
  {
    id: 'history',
    name: 'ประวัติศาสตร์',
    code: 'HIST',
    color: '#854D0E', // Dark Yellow/Brown
    goal: 'เข้าใจลำดับเหตุการณ์ประวัติศาสตร์ไทยและประวัติศาสตร์สากล',
    defaultTopics: [
      { chapter: 'ยุคที่ 1', title: 'วิธีการทางประวัติศาสตร์และหลักฐาน' },
      { chapter: 'ยุคที่ 2', title: 'ประวัติศาสตร์ไทยสมัยอยุธยาและธนบุรี' },
      { chapter: 'ยุคที่ 3', title: 'ประวัติศาสตร์ไทยสมัยรัตนโกสินทร์' },
      { chapter: 'ยุคที่ 4', title: 'อารยธรรมโลกตะวันออกและตะวันตก' },
      { chapter: 'ยุคที่ 5', title: 'สงครามโลกและเหตุการณ์ร่วมสมัย' }
    ]
  },
  {
    id: 'computer',
    name: 'คอมพิวเตอร์',
    code: 'COMP',
    color: '#14B8A6', // Teal
    goal: 'วิทยาการคำนวณ การเขียนโปรแกรม โครงสร้างข้อมูล และความปลอดภัยดิจิทัล',
    defaultTopics: [
      { chapter: 'โมดูล 1', title: 'แนวคิดเชิงคำนวณ (Computational Thinking)' },
      { chapter: 'โมดูล 2', title: 'พื้นฐานการเขียนโปรแกรมและการแก้ปัญหา' },
      { chapter: 'โมดูล 3', title: 'โครงสร้างข้อมูลและอัลกอริทึมเบื้องต้น' },
      { chapter: 'โมดูล 4', title: 'ระบบเครือข่ายและความมั่นคงปลอดภัยไซเบอร์' },
      { chapter: 'โมดูล 5', title: 'ปัญญาประดิษฐ์และวิทยาศาสตร์ข้อมูล' }
    ]
  },
  {
    id: 'english',
    name: 'ภาษาอังกฤษ',
    code: 'ENG',
    color: '#8B5CF6', // Purple
    goal: 'จดจำคำศัพท์ แกรมม่า Reading Comprehension และฝึกทำโจทย์สอบเข้า',
    defaultTopics: [
      { chapter: 'Part 1', title: 'Essential Grammar (Tenses, Passive, Conditionals)' },
      { chapter: 'Part 2', title: 'Core Academic Vocabulary & Synonyms' },
      { chapter: 'Part 3', title: 'Reading Comprehension & Context Clues' },
      { chapter: 'Part 4', title: 'Conversation & Everyday Situational English' },
      { chapter: 'Part 5', title: 'Error Identification & Cloze Test Techniques' }
    ]
  },
  {
    id: 'tpat1',
    name: 'TPAT1',
    code: 'TPAT1',
    color: '#D97706', // Amber-600
    goal: 'เตรียมสอบความถนัดแพทย์ (กสพท.) ให้ได้คะแนนรวมเกิน 70%',
    defaultTopics: [
      { chapter: 'พาร์ท 1', title: 'เชาวน์ปัญญา (คณิตศาสตร์ประยุกต์และตรรกศาสตร์)' },
      { chapter: 'พาร์ท 2', title: 'จริยธรรมทางการแพทย์' },
      { chapter: 'พาร์ท 3', title: 'ทักษะการเชื่อมโยงเหตุและผล (ข้อสอบเชื่อมโยง)' }
    ]
  },
  {
    id: 'tgat',
    name: 'TGAT',
    code: 'TGAT',
    color: '#4F46E5', // Indigo-600
    goal: 'ฝึกทำโจทย์ TGAT 1, 2, 3 ให้ครอบคลุมและบริหารเวลาสอบจริง',
    defaultTopics: [
      { chapter: 'TGAT 1', title: 'การสื่อสารภาษาอังกฤษ (English Communication)' },
      { chapter: 'TGAT 2', title: 'การคิดอย่างมีเหตุผล (Critical & Logical Thinking)' },
      { chapter: 'TGAT 3', title: 'สมรรถนะการทำงาน (Future Workforce Competencies)' }
    ]
  }
];
