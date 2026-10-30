import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Subject,
  Task,
  StudySession,
  ReviewItem,
  Exam,
  UserSettings,
  Topic
} from '../types';
import { getInitialData } from '../data/initialData';
import { getBangkokToday, getBangkokNowTime, addDays } from '../utils/dateUtils';
import { STANDARD_SUBJECT_PRESETS } from '../utils/constants';
import {
  auth,
  testConnection,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  onAuthStateChanged,
  User
} from '../lib/firebase';
import {
  subscribeToUserData,
  saveTaskToCloud,
  deleteTaskFromCloud,
  saveSubjectToCloud,
  deleteSubjectFromCloud,
  saveSessionToCloud,
  deleteSessionFromCloud,
  saveReviewItemToCloud,
  deleteReviewItemFromCloud,
  saveExamToCloud,
  deleteExamFromCloud,
  saveUserProfile,
  migrateLocalDataToCloud,
  fetchAllUserData,
  ensureUserInDatabase
} from '../lib/firestoreService';

const STORAGE_KEY = 'studyflow_data_v2';

export type SyncStatus = 'synced' | 'saving' | 'offline' | 'error' | 'guest';

export interface ActiveTimerState {
  isActive: boolean;
  isPaused: boolean;
  mode: 'work' | 'break';
  secondsLeft: number;
  totalSeconds: number;
  subjectId: string;
  topicId?: string;
  taskId?: string;
  title: string;
  startTime: string;
  accumulatedSeconds: number;
}

interface StudyContextType {
  subjects: Subject[];
  tasks: Task[];
  studySessions: StudySession[];
  reviewItems: ReviewItem[];
  exams: Exam[];
  settings: UserSettings;
  activeTimer: ActiveTimerState;

  // Authentication & Cloud Sync
  user: User | null;
  authLoading: boolean;
  syncStatus: SyncStatus;
  syncError: string | null;
  migrationNotification: string | null;
  clearMigrationNotification: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  forceSyncCloud: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  
  // Task operations
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Task;
  updateTask: (task: Task, recurrenceChoice?: 'this_only' | 'all') => void;
  deleteTask: (taskId: string) => void;
  duplicateTask: (taskId: string) => void;
  toggleTaskComplete: (taskId: string) => void;
  postponeTask: (taskId: string, newPlannedDate: string) => void;

  // Subject & Topic operations
  addSubject: (subject: Omit<Subject, 'id' | 'createdAt'>) => Subject;
  updateSubject: (subject: Subject) => void;
  deleteSubject: (subjectId: string) => void;
  addTopic: (subjectId: string, topic: Omit<Topic, 'id'>) => void;
  updateTopic: (subjectId: string, topic: Topic) => void;
  deleteTopic: (subjectId: string, topicId: string) => void;
  loadStandardSubjects: () => void;

  // Focus Timer operations
  startTimer: (params: {
    subjectId: string;
    topicId?: string;
    taskId?: string;
    title: string;
    durationMinutes: number;
    mode?: 'work' | 'break';
  }) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopAndLogSession: (notes?: string) => void;
  cancelTimer: () => void;
  deleteSession: (sessionId: string) => void;

  // Spaced Repetition operations
  addReviewItem: (item: Omit<ReviewItem, 'id' | 'createdAt' | 'history'>) => void;
  submitReviewRating: (reviewId: string, rating: number, notes?: string) => void;
  rescheduleReview: (reviewId: string, newDate: string) => void;
  deleteReviewItem: (reviewId: string) => void;

  // Exam operations
  addExam: (exam: Omit<Exam, 'id'>) => void;
  updateExam: (exam: Exam) => void;
  deleteExam: (examId: string) => void;

  // Settings & Storage operations
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  toggleDarkMode: () => void;
  clearDemoData: () => void;
  resetToSampleData: () => void;
  exportJSON: () => void;
  exportTasksCSV: () => void;
  importJSON: (jsonStr: string) => { success: boolean; error?: string };
}

const StudyContext = createContext<StudyContextType | null>(null);

export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('guest');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [migrationNotification, setMigrationNotification] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // App Data State
  const [dataLoaded, setDataLoaded] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [settings, setSettings] = useState<UserSettings>(() => ({
    dailyTargetHours: 4,
    weeklyTargetHours: 24,
    maxDailyStudyHours: 6,
    restDays: [0],
    pomodoroWorkMinutes: 25,
    pomodoroBreakMinutes: 5,
    spacedIntervals: [1, 3, 7, 14, 30],
    darkMode: false
  }));

  // Focus Timer State
  const [activeTimer, setActiveTimer] = useState<ActiveTimerState>({
    isActive: false,
    isPaused: false,
    mode: 'work',
    secondsLeft: 25 * 60,
    totalSeconds: 25 * 60,
    subjectId: '',
    topicId: '',
    taskId: '',
    title: '',
    startTime: '',
    accumulatedSeconds: 0
  });

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const firestoreUnsubscribeRef = useRef<(() => void) | null>(null);

  // Maintain latest in-memory state ref to avoid stale closures in auth listeners
  const latestDataRef = useRef({
    subjects,
    tasks,
    studySessions,
    reviewItems,
    exams,
    settings
  });

  useEffect(() => {
    latestDataRef.current = {
      subjects,
      tasks,
      studySessions,
      reviewItems,
      exams,
      settings
    };
  }, [subjects, tasks, studySessions, reviewItems, exams, settings]);

  // Initial Boot: Test Firestore Connection
  useEffect(() => {
    testConnection().catch(err => {
      console.warn('Initial Firebase connection test:', err);
    });
  }, []);

  // Helper to load local storage data
  const loadFromLocalStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.subjects) && Array.isArray(parsed.tasks)) {
          setSubjects(parsed.subjects);
          setTasks(parsed.tasks);
          setStudySessions(parsed.studySessions || []);
          setReviewItems(parsed.reviewItems || []);
          setExams(parsed.exams || []);
          if (parsed.settings) setSettings(parsed.settings);
          setDataLoaded(true);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to parse stored studyflow data, loading defaults', err);
    }

    // Default seed if no local data
    const initial = getInitialData();
    setSubjects(initial.subjects);
    setTasks(initial.tasks);
    setStudySessions(initial.studySessions);
    setReviewItems(initial.reviewItems);
    setExams(initial.exams);
    setSettings(initial.settings);
    setDataLoaded(true);
  }, []);

  // Initialize from LocalStorage first for instant view
  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  // Auth State Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        setSyncStatus('saving');
        setSyncError(null);

        // Check and migrate local data safely on first sign-in
        let dataToMigrate = latestDataRef.current;
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (
              parsed &&
              Array.isArray(parsed.tasks) &&
              (parsed.tasks.length > 0 || (parsed.subjects && parsed.subjects.length > 0))
            ) {
              dataToMigrate = {
                subjects:
                  Array.isArray(parsed.subjects) && parsed.subjects.length > 0
                    ? parsed.subjects
                    : dataToMigrate.subjects,
                tasks:
                  Array.isArray(parsed.tasks) && parsed.tasks.length > 0
                    ? parsed.tasks
                    : dataToMigrate.tasks,
                studySessions: Array.isArray(parsed.studySessions)
                  ? parsed.studySessions
                  : dataToMigrate.studySessions,
                reviewItems: Array.isArray(parsed.reviewItems)
                  ? parsed.reviewItems
                  : dataToMigrate.reviewItems,
                exams: Array.isArray(parsed.exams) ? parsed.exams : dataToMigrate.exams,
                settings: parsed.settings || dataToMigrate.settings
              };
            }
          }
        } catch (storageErr) {
          console.warn('LocalStorage read during migration:', storageErr);
        }

        try {
          // Guaranteed database registration: writes users/{uid} and collections to Firestore
          const userInitResult = await ensureUserInDatabase(currentUser, dataToMigrate);
          if (userInitResult.isNewUser && userInitResult.count > 0) {
            setMigrationNotification(
              `ลงทะเบียนบัญชีและบันทึกข้อมูลขึ้น Cloud Firestore เรียบร้อยแล้ว (${userInitResult.count} รายการ) ข้อมูลของคุณจะซิงค์อัตโนมัติในทุกอุปกรณ์`
            );
          } else {
            // Check any pending local items migration
            const migrationResult = await migrateLocalDataToCloud(currentUser.uid, dataToMigrate);
            if (migrationResult.migrated && migrationResult.count > 0) {
              setMigrationNotification(
                `นำเข้าข้อมูลจากเครื่องนี้ขึ้นคลาวด์สำเร็จแล้ว (${migrationResult.count} รายการ) ข้อมูลของคุณจะซิงค์อัตโนมัติในทุกอุปกรณ์`
              );
            }
          }
        } catch (migErr) {
          console.warn('User initialization / migration check notice:', migErr);
        }

        // Clean up previous Firestore listener if any
        if (firestoreUnsubscribeRef.current) {
          firestoreUnsubscribeRef.current();
          firestoreUnsubscribeRef.current = null;
        }

        // Attach real-time listener for current user
        firestoreUnsubscribeRef.current = subscribeToUserData(currentUser.uid, {
          onSubjects: cloudSubjects => {
            setSubjects(cloudSubjects);
            setSyncStatus('synced');
          },
          onTasks: cloudTasks => {
            setTasks(cloudTasks);
            setSyncStatus('synced');
          },
          onSessions: cloudSessions => {
            setStudySessions(cloudSessions);
            setSyncStatus('synced');
          },
          onReviews: cloudReviews => {
            setReviewItems(cloudReviews);
            setSyncStatus('synced');
          },
          onExams: cloudExams => {
            setExams(cloudExams);
            setSyncStatus('synced');
          },
          onSettings: cloudSettings => {
            if (cloudSettings) setSettings(prev => ({ ...prev, ...cloudSettings }));
            setSyncStatus('synced');
          },
          onError: err => {
            console.error('Firestore real-time sync error:', err);
            setSyncStatus('error');
            setSyncError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อคลาวด์');
          }
        });
      } else {
        // Logged out / Guest Mode
        if (firestoreUnsubscribeRef.current) {
          firestoreUnsubscribeRef.current();
          firestoreUnsubscribeRef.current = null;
        }
        setSyncStatus('guest');
        setSyncError(null);
      }
    });

    return () => {
      unsubscribeAuth();
      if (firestoreUnsubscribeRef.current) {
        firestoreUnsubscribeRef.current();
      }
    };
  }, []); // Run on mount

  // Backup cache to LocalStorage for offline and instant startup
  useEffect(() => {
    if (!dataLoaded) return;
    try {
      const payload = {
        subjects,
        tasks,
        studySessions,
        reviewItems,
        exams,
        settings,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('LocalStorage write failed:', e);
    }
  }, [subjects, tasks, studySessions, reviewItems, exams, settings, dataLoaded]);

  // Handle Dark Mode class on document.documentElement
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Timer Tick Effect
  useEffect(() => {
    if (activeTimer.isActive && !activeTimer.isPaused) {
      timerIntervalRef.current = setInterval(() => {
        setActiveTimer(prev => {
          if (prev.secondsLeft <= 1) {
            // Completed timer cycle
            return {
              ...prev,
              secondsLeft: 0,
              isPaused: true,
              accumulatedSeconds: prev.accumulatedSeconds + 1
            };
          }
          return {
            ...prev,
            secondsLeft: prev.secondsLeft - 1,
            accumulatedSeconds: prev.accumulatedSeconds + 1
          };
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [activeTimer.isActive, activeTimer.isPaused]);

  // Auth Operations
  const loginWithGoogle = async () => {
    try {
      setSyncStatus('saving');
      setSyncError(null);
      await signInWithGoogle();
    } catch (err: unknown) {
      console.error('Google Sign In Error:', err);
      setSyncStatus('error');
      setSyncError('ไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      setSyncStatus('saving');
      setSyncError(null);
      await signInWithEmail(email, pass);
    } catch (err: unknown) {
      console.error('Email Sign In Error:', err);
      setSyncStatus('error');
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('operation-not-allowed')) {
        setSyncError('Firebase โปรเจกต์นี้เปิดใช้งาน Google Sign-In ไว้เป็นค่าเริ่มต้น กรุณากดปุ่ม "ดำเนินการต่อด้วย Google" ด้านบน เพื่อเข้าสู่ระบบได้ทันที (ไม่ต้องตั้งรหัสผ่าน) หรือเปิดใช้งาน Email/Password ใน Firebase Console');
      } else if (
        msg.includes('user-not-found') ||
        msg.includes('wrong-password') ||
        msg.includes('invalid-credential')
      ) {
        setSyncError('อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือยังไม่ได้ลงทะเบียนบัญชีนี้');
      } else if (msg.includes('invalid-email')) {
        setSyncError('รูปแบบอีเมลไม่ถูกต้อง');
      } else {
        setSyncError('ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง');
      }
      throw err;
    }
  };

  const signupWithEmail = async (email: string, pass: string, name?: string) => {
    try {
      setSyncStatus('saving');
      setSyncError(null);
      await signUpWithEmail(email, pass, name);
    } catch (err: unknown) {
      console.error('Email Sign Up Error:', err);
      setSyncStatus('error');
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('operation-not-allowed')) {
        setSyncError('Firebase โปรเจกต์นี้เปิดใช้งาน Google Sign-In ไว้เป็นค่าเริ่มต้น กรุณากดปุ่ม "ดำเนินการต่อด้วย Google" ด้านบน เพื่อเข้าสู่ระบบได้ทันที (ไม่ต้องตั้งรหัสผ่าน) หรือเปิดใช้งาน Email/Password ใน Firebase Console');
      } else if (msg.includes('email-already-in-use')) {
        setSyncError('อีเมลนี้ถูกใช้งานแล้วในระบบ กรุณาเข้าสู่ระบบแทน');
      } else if (msg.includes('weak-password')) {
        setSyncError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      } else if (msg.includes('invalid-email')) {
        setSyncError('รูปแบบอีเมลไม่ถูกต้อง');
      } else {
        setSyncError('ไม่สามารถลงทะเบียนได้ กรุณาลองใหม่อีกครั้ง');
      }
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOutUser();
      setUser(null);
      setSyncStatus('guest');
    } catch (err: unknown) {
      console.error('Logout error:', err);
    }
  };

  const clearMigrationNotification = () => {
    setMigrationNotification(null);
  };

  const forceSyncCloud = async () => {
    const activeUid = auth.currentUser?.uid || user?.uid;
    if (!activeUid) return;
    try {
      setSyncStatus('saving');
      setSyncError(null);
      const data = await fetchAllUserData(activeUid);
      setSubjects(data.subjects);
      setTasks(data.tasks);
      setStudySessions(data.studySessions);
      setReviewItems(data.reviewItems);
      setExams(data.exams);
      if (data.settings) {
        setSettings(prev => ({ ...prev, ...data.settings }));
      }
      setSyncStatus('synced');
    } catch (err) {
      console.error('Force sync failed:', err);
      setSyncStatus('error');
      setSyncError(err instanceof Error ? err.message : 'ไม่สามารถดึงข้อมูลล่าสุดจากคลาวด์ได้');
    }
  };

  // Cloud Sync Helper
  const syncToCloud = useCallback(async (action: () => Promise<void>) => {
    const activeUid = auth.currentUser?.uid || user?.uid;
    if (!activeUid) return;
    try {
      setSyncStatus('saving');
      await action();
      setSyncStatus('synced');
    } catch (err) {
      console.error('Cloud mutation failed:', err);
      setSyncStatus('error');
      setSyncError(err instanceof Error ? err.message : 'บันทึกข้อมูลไปยังคลาวด์ไม่สำเร็จ');
    }
  }, [user]);

  // Task Operations
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt'>): Task => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: getBangkokToday()
    };
    setTasks(prev => [newTask, ...prev]);

    if (user) {
      syncToCloud(() => saveTaskToCloud(user.uid, newTask));
    }
    return newTask;
  };

  const updateTask = (updatedTask: Task, recurrenceChoice: 'this_only' | 'all' = 'this_only') => {
    setTasks(prev => {
      if (updatedTask.recurrence?.groupId && recurrenceChoice === 'all') {
        const nextTasks = prev.map(t => {
          if (t.recurrence?.groupId === updatedTask.recurrence?.groupId) {
            const modified = {
              ...t,
              title: updatedTask.title,
              subjectId: updatedTask.subjectId,
              topicId: updatedTask.topicId,
              type: updatedTask.type,
              priority: updatedTask.priority,
              plannedDurationMinutes: updatedTask.plannedDurationMinutes,
              plannedStartTime: updatedTask.plannedStartTime
            };
            if (user) {
              syncToCloud(() => saveTaskToCloud(user.uid, modified));
            }
            return modified;
          }
          return t.id === updatedTask.id ? updatedTask : t;
        });
        return nextTasks;
      }
      return prev.map(t => (t.id === updatedTask.id ? updatedTask : t));
    });

    if (user) {
      syncToCloud(() => saveTaskToCloud(user.uid, updatedTask));
    }
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (user) {
      syncToCloud(() => deleteTaskFromCloud(user.uid, taskId));
    }
  };

  const duplicateTask = (taskId: string) => {
    const original = tasks.find(t => t.id === taskId);
    if (!original) return;
    const duplicated: Task = {
      ...original,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `${original.title} (สำเนา)`,
      status: 'todo',
      completedAt: undefined,
      createdAt: getBangkokToday()
    };
    setTasks(prev => [duplicated, ...prev]);
    if (user) {
      syncToCloud(() => saveTaskToCloud(user.uid, duplicated));
    }
  };

  const toggleTaskComplete = (taskId: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const willComplete = t.status !== 'completed';
          const updated: Task = {
            ...t,
            status: willComplete ? 'completed' : 'todo',
            completedAt: willComplete ? new Date().toISOString() : undefined
          };
          if (user) {
            syncToCloud(() => saveTaskToCloud(user.uid, updated));
          }
          return updated;
        }
        return t;
      })
    );
  };

  const postponeTask = (taskId: string, newPlannedDate: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const updated: Task = {
            ...t,
            postponedFrom: t.plannedDate || t.postponedFrom,
            plannedDate: newPlannedDate,
            status: t.status === 'completed' ? 'todo' : t.status
          };
          if (user) {
            syncToCloud(() => saveTaskToCloud(user.uid, updated));
          }
          return updated;
        }
        return t;
      })
    );
  };

  // Subject Operations
  const addSubject = (subjectData: Omit<Subject, 'id' | 'createdAt'>): Subject => {
    const newSubject: Subject = {
      ...subjectData,
      id: `sub-${Date.now()}`,
      createdAt: getBangkokToday()
    };
    setSubjects(prev => [...prev, newSubject]);
    if (user) {
      syncToCloud(() => saveSubjectToCloud(user.uid, newSubject));
    }
    return newSubject;
  };

  const updateSubject = (updated: Subject) => {
    setSubjects(prev => prev.map(s => (s.id === updated.id ? updated : s)));
    if (user) {
      syncToCloud(() => saveSubjectToCloud(user.uid, updated));
    }
  };

  const deleteSubject = (subjectId: string) => {
    setSubjects(prev => prev.filter(s => s.id !== subjectId));
    if (user) {
      syncToCloud(() => deleteSubjectFromCloud(user.uid, subjectId));
    }
  };

  const addTopic = (subjectId: string, topicData: Omit<Topic, 'id'>) => {
    const newTopic: Topic = {
      ...topicData,
      id: `top-${Date.now()}`
    };
    setSubjects(prev => {
      const nextSubjects = prev.map(s => {
        if (s.id === subjectId) {
          const updated = {
            ...s,
            topics: [...s.topics, newTopic]
          };
          if (user) {
            syncToCloud(() => saveSubjectToCloud(user.uid, updated));
          }
          return updated;
        }
        return s;
      });
      return nextSubjects;
    });
  };

  const updateTopic = (subjectId: string, updatedTopic: Topic) => {
    setSubjects(prev => {
      const nextSubjects = prev.map(s => {
        if (s.id === subjectId) {
          const updated = {
            ...s,
            topics: s.topics.map(tp => (tp.id === updatedTopic.id ? updatedTopic : tp))
          };
          if (user) {
            syncToCloud(() => saveSubjectToCloud(user.uid, updated));
          }
          return updated;
        }
        return s;
      });
      return nextSubjects;
    });
  };

  const deleteTopic = (subjectId: string, topicId: string) => {
    setSubjects(prev => {
      const nextSubjects = prev.map(s => {
        if (s.id === subjectId) {
          const updated = {
            ...s,
            topics: s.topics.filter(tp => tp.id !== topicId)
          };
          if (user) {
            syncToCloud(() => saveSubjectToCloud(user.uid, updated));
          }
          return updated;
        }
        return s;
      });
      return nextSubjects;
    });
  };

  const loadStandardSubjects = () => {
    const today = getBangkokToday();
    const standardList: Subject[] = STANDARD_SUBJECT_PRESETS.map((preset, index) => ({
      id: `sub-${preset.id}`,
      name: preset.name,
      code: preset.code,
      color: preset.color,
      goal: preset.goal,
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
    }));

    setSubjects(prev => {
      const existingNames = new Set(prev.map(s => s.name));
      const toAdd = standardList.filter(s => !existingNames.has(s.name));
      if (user) {
        for (const sub of toAdd) {
          saveSubjectToCloud(user.uid, sub);
        }
      }
      return [...prev, ...toAdd];
    });
  };

  // Focus Timer operations
  const startTimer = ({
    subjectId,
    topicId,
    taskId,
    title,
    durationMinutes,
    mode = 'work'
  }: {
    subjectId: string;
    topicId?: string;
    taskId?: string;
    title: string;
    durationMinutes: number;
    mode?: 'work' | 'break';
  }) => {
    const totalSecs = Math.max(1, durationMinutes * 60);
    setActiveTimer({
      isActive: true,
      isPaused: false,
      mode,
      secondsLeft: totalSecs,
      totalSeconds: totalSecs,
      subjectId,
      topicId,
      taskId,
      title: title || 'โฟกัสการอ่านหนังสือ',
      startTime: getBangkokNowTime(),
      accumulatedSeconds: 0
    });
  };

  const pauseTimer = () => {
    setActiveTimer(prev => ({ ...prev, isPaused: true }));
  };

  const resumeTimer = () => {
    setActiveTimer(prev => ({ ...prev, isPaused: false }));
  };

  const stopAndLogSession = (notes?: string) => {
    if (!activeTimer.isActive) return;

    const actualMinutes = Math.max(1, Math.round(activeTimer.accumulatedSeconds / 60));

    if (activeTimer.mode === 'work' && activeTimer.subjectId && actualMinutes > 0) {
      const today = getBangkokToday();
      const newSession: StudySession = {
        id: `sess-${Date.now()}`,
        taskId: activeTimer.taskId,
        subjectId: activeTimer.subjectId,
        topicId: activeTimer.topicId,
        title: activeTimer.title || 'เซสชันอ่านหนังสือ',
        date: today,
        startTime: activeTimer.startTime || getBangkokNowTime(),
        durationMinutes: actualMinutes,
        type: 'pomodoro',
        notes: notes || '',
        completedAt: new Date().toISOString()
      };
      setStudySessions(prev => [newSession, ...prev]);

      if (user) {
        syncToCloud(() => saveSessionToCloud(user.uid, newSession));
      }

      if (activeTimer.taskId) {
        setTasks(prev =>
          prev.map(t => {
            if (t.id === activeTimer.taskId && t.status === 'todo') {
              const updated: Task = { ...t, status: 'in_progress' };
              if (user) {
                syncToCloud(() => saveTaskToCloud(user.uid, updated));
              }
              return updated;
            }
            return t;
          })
        );
      }
    }

    // Reset active timer
    setActiveTimer({
      isActive: false,
      isPaused: false,
      mode: 'work',
      secondsLeft: 25 * 60,
      totalSeconds: 25 * 60,
      subjectId: '',
      topicId: '',
      taskId: '',
      title: '',
      startTime: '',
      accumulatedSeconds: 0
    });
  };

  const cancelTimer = () => {
    setActiveTimer({
      isActive: false,
      isPaused: false,
      mode: 'work',
      secondsLeft: 25 * 60,
      totalSeconds: 25 * 60,
      subjectId: '',
      topicId: '',
      taskId: '',
      title: '',
      startTime: '',
      accumulatedSeconds: 0
    });
  };

  const deleteSession = (sessionId: string) => {
    setStudySessions(prev => prev.filter(s => s.id !== sessionId));
    if (user) {
      syncToCloud(() => deleteSessionFromCloud(user.uid, sessionId));
    }
  };

  // Spaced Repetition Operations
  const addReviewItem = (itemData: Omit<ReviewItem, 'id' | 'createdAt' | 'history'>) => {
    const today = getBangkokToday();
    const newItem: ReviewItem = {
      ...itemData,
      id: `rev-${Date.now()}`,
      createdAt: today,
      history: []
    };
    setReviewItems(prev => [newItem, ...prev]);
    if (user) {
      syncToCloud(() => saveReviewItemToCloud(user.uid, newItem));
    }
  };

  const submitReviewRating = (reviewId: string, rating: number, notes?: string) => {
    const today = getBangkokToday();
    const intervals = settings.spacedIntervals || [1, 3, 7, 14, 30];

    setReviewItems(prev =>
      prev.map(item => {
        if (item.id === reviewId) {
          let nextLevel = item.level;
          if (rating >= 4) {
            nextLevel = Math.min(intervals.length - 1, item.level + 1);
          } else if (rating <= 2) {
            nextLevel = Math.max(0, item.level - 1);
          }
          const nextDays = intervals[nextLevel] || 3;
          const nextDate = addDays(today, nextDays);

          const updated: ReviewItem = {
            ...item,
            level: nextLevel,
            lastReviewedDate: today,
            nextReviewDate: nextDate,
            history: [
              ...item.history,
              {
                date: today,
                rating,
                notes: notes || ''
              }
            ]
          };

          if (user) {
            syncToCloud(() => saveReviewItemToCloud(user.uid, updated));
          }
          return updated;
        }
        return item;
      })
    );
  };

  const rescheduleReview = (reviewId: string, newDate: string) => {
    setReviewItems(prev =>
      prev.map(item => {
        if (item.id === reviewId) {
          const updated = { ...item, nextReviewDate: newDate };
          if (user) {
            syncToCloud(() => saveReviewItemToCloud(user.uid, updated));
          }
          return updated;
        }
        return item;
      })
    );
  };

  const deleteReviewItem = (reviewId: string) => {
    setReviewItems(prev => prev.filter(r => r.id !== reviewId));
    if (user) {
      syncToCloud(() => deleteReviewItemFromCloud(user.uid, reviewId));
    }
  };

  // Exam Operations
  const addExam = (examData: Omit<Exam, 'id'>) => {
    const newExam: Exam = {
      ...examData,
      id: `exam-${Date.now()}`
    };
    setExams(prev => [...prev, newExam]);
    if (user) {
      syncToCloud(() => saveExamToCloud(user.uid, newExam));
    }
  };

  const updateExam = (updated: Exam) => {
    setExams(prev => prev.map(e => (e.id === updated.id ? updated : e)));
    if (user) {
      syncToCloud(() => saveExamToCloud(user.uid, updated));
    }
  };

  const deleteExam = (examId: string) => {
    setExams(prev => prev.filter(e => e.id !== examId));
    if (user) {
      syncToCloud(() => deleteExamFromCloud(user.uid, examId));
    }
  };

  // Settings & Storage operations
  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => {
      const merged = { ...prev, ...newSettings };
      if (user) {
        syncToCloud(() => saveUserProfile(user.uid, { settings: merged }));
      }
      return merged;
    });
  };

  const toggleDarkMode = () => {
    setSettings(prev => {
      const updated = { ...prev, darkMode: !prev.darkMode };
      if (user) {
        syncToCloud(() => saveUserProfile(user.uid, { settings: updated }));
      }
      return updated;
    });
  };

  const clearDemoData = () => {
    setSubjects([]);
    setTasks([]);
    setStudySessions([]);
    setReviewItems([]);
    setExams([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const resetToSampleData = () => {
    const initial = getInitialData();
    setSubjects(initial.subjects);
    setTasks(initial.tasks);
    setStudySessions(initial.studySessions);
    setReviewItems(initial.reviewItems);
    setExams(initial.exams);
    setSettings(initial.settings);
    if (user) {
      for (const s of initial.subjects) saveSubjectToCloud(user.uid, s);
      for (const t of initial.tasks) saveTaskToCloud(user.uid, t);
      for (const ss of initial.studySessions) saveSessionToCloud(user.uid, ss);
      for (const r of initial.reviewItems) saveReviewItemToCloud(user.uid, r);
      for (const e of initial.exams) saveExamToCloud(user.uid, e);
      saveUserProfile(user.uid, { settings: initial.settings });
    }
  };

  const exportJSON = () => {
    const data = {
      subjects,
      tasks,
      studySessions,
      reviewItems,
      exams,
      settings,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyflow-backup-${getBangkokToday()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportTasksCSV = () => {
    const headers = [
      'ID',
      'ชื่องาน',
      'วิชา',
      'ประเภท',
      'สถานะ',
      'ความสำคัญ',
      'กำหนดส่ง (Due Date)',
      'วันที่วางแผน (Planned Date)',
      'เวลาเริ่ม',
      'ระยะเวลา (นาที)',
      'รายละเอียด'
    ];

    const rows = tasks.map(t => {
      const sub = subjects.find(s => s.id === t.subjectId);
      return [
        t.id,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${sub ? sub.name : ''}"`,
        t.type,
        t.status,
        t.priority,
        t.dueDate,
        t.plannedDate || '',
        t.plannedStartTime || '',
        t.plannedDurationMinutes,
        `"${(t.description || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyflow-tasks-${getBangkokToday()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (jsonStr: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'โครงสร้างไฟล์ JSON ไม่ถูกต้อง' };
      }
      if (!Array.isArray(parsed.subjects) || !Array.isArray(parsed.tasks)) {
        return { success: false, error: 'ไฟล์ข้อมูลต้องมีรายการวิชาและงานที่ถูกต้อง' };
      }

      setSubjects(parsed.subjects);
      setTasks(parsed.tasks);
      setStudySessions(Array.isArray(parsed.studySessions) ? parsed.studySessions : []);
      setReviewItems(Array.isArray(parsed.reviewItems) ? parsed.reviewItems : []);
      setExams(Array.isArray(parsed.exams) ? parsed.exams : []);
      if (parsed.settings) {
        setSettings(prev => ({ ...prev, ...parsed.settings }));
      }

      if (user) {
        for (const s of parsed.subjects) saveSubjectToCloud(user.uid, s);
        for (const t of parsed.tasks) saveTaskToCloud(user.uid, t);
        for (const ss of (parsed.studySessions || [])) saveSessionToCloud(user.uid, ss);
        for (const r of (parsed.reviewItems || [])) saveReviewItemToCloud(user.uid, r);
        for (const e of (parsed.exams || [])) saveExamToCloud(user.uid, e);
        if (parsed.settings) saveUserProfile(user.uid, { settings: parsed.settings });
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'เกิดข้อผิดพลาดในการอ่านไฟล์ JSON' };
    }
  };

  return (
    <StudyContext.Provider
      value={{
        subjects,
        tasks,
        studySessions,
        reviewItems,
        exams,
        settings,
        activeTimer,
        user,
        authLoading,
        syncStatus,
        syncError,
        migrationNotification,
        clearMigrationNotification,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        logout,
        forceSyncCloud,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        addTask,
        updateTask,
        deleteTask,
        duplicateTask,
        toggleTaskComplete,
        postponeTask,
        addSubject,
        updateSubject,
        deleteSubject,
        addTopic,
        updateTopic,
        deleteTopic,
        loadStandardSubjects,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopAndLogSession,
        cancelTimer,
        deleteSession,
        addReviewItem,
        submitReviewRating,
        rescheduleReview,
        deleteReviewItem,
        addExam,
        updateExam,
        deleteExam,
        updateSettings,
        toggleDarkMode,
        clearDemoData,
        resetToSampleData,
        exportJSON,
        exportTasksCSV,
        importJSON
      }}
    >
      {children}
    </StudyContext.Provider>
  );
};

export const useStudy = () => {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error('useStudy must be used within StudyProvider');
  return ctx;
};
