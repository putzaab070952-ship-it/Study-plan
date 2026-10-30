import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { type User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  Subject,
  Task,
  StudySession,
  ReviewItem,
  Exam,
  UserSettings
} from '../types';

export interface UserProfileDoc {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  settings?: UserSettings;
  dataMigrated?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Deep sanitization utility to remove all undefined values and undefined items from arrays.
 * This guarantees Firestore setDoc / writeBatch calls never throw "Unsupported field value: undefined".
 */
export function sanitizeData<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => sanitizeData(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeData(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

// Subscribe to all user data collections in real time
export function subscribeToUserData(
  userId: string,
  callbacks: {
    onSubjects: (subjects: Subject[]) => void;
    onTasks: (tasks: Task[]) => void;
    onSessions: (sessions: StudySession[]) => void;
    onReviews: (reviews: ReviewItem[]) => void;
    onExams: (exams: Exam[]) => void;
    onSettings: (settings: UserSettings) => void;
    onError: (err: unknown) => void;
  }
): () => void {
  const unsubscribers: Unsubscribe[] = [];

  try {
    // 1. User Profile & Settings
    const userDocRef = doc(db, 'users', userId);
    const unsubProfile = onSnapshot(
      userDocRef,
      snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserProfileDoc;
          if (data.settings) {
            callbacks.onSettings(data.settings);
          }
        }
      },
      error => {
        console.warn(`Firestore profile onSnapshot warning:`, error);
        callbacks.onError(error);
      }
    );
    unsubscribers.push(unsubProfile);

    // 2. Subjects
    const subjectsRef = collection(db, 'users', userId, 'subjects');
    const unsubSubjects = onSnapshot(
      subjectsRef,
      snapshot => {
        const list: Subject[] = [];
        snapshot.forEach(d => list.push(d.data() as Subject));
        callbacks.onSubjects(list);
      },
      error => {
        console.warn(`Firestore subjects onSnapshot warning:`, error);
        callbacks.onError(error);
      }
    );
    unsubscribers.push(unsubSubjects);

    // 3. Tasks
    const tasksRef = collection(db, 'users', userId, 'tasks');
    const unsubTasks = onSnapshot(
      tasksRef,
      snapshot => {
        const list: Task[] = [];
        snapshot.forEach(d => list.push(d.data() as Task));
        callbacks.onTasks(list);
      },
      error => {
        console.warn(`Firestore tasks onSnapshot warning:`, error);
        callbacks.onError(error);
      }
    );
    unsubscribers.push(unsubTasks);

    // 4. Study Sessions
    const sessionsRef = collection(db, 'users', userId, 'studySessions');
    const unsubSessions = onSnapshot(
      sessionsRef,
      snapshot => {
        const list: StudySession[] = [];
        snapshot.forEach(d => list.push(d.data() as StudySession));
        callbacks.onSessions(list);
      },
      error => {
        console.warn(`Firestore studySessions onSnapshot warning:`, error);
        callbacks.onError(error);
      }
    );
    unsubscribers.push(unsubSessions);

    // 5. Review Items
    const reviewsRef = collection(db, 'users', userId, 'reviewItems');
    const unsubReviews = onSnapshot(
      reviewsRef,
      snapshot => {
        const list: ReviewItem[] = [];
        snapshot.forEach(d => list.push(d.data() as ReviewItem));
        callbacks.onReviews(list);
      },
      error => {
        console.warn(`Firestore reviewItems onSnapshot warning:`, error);
        callbacks.onError(error);
      }
    );
    unsubscribers.push(unsubReviews);

    // 6. Exams
    const examsRef = collection(db, 'users', userId, 'exams');
    const unsubExams = onSnapshot(
      examsRef,
      snapshot => {
        const list: Exam[] = [];
        snapshot.forEach(d => list.push(d.data() as Exam));
        callbacks.onExams(list);
      },
      error => {
        console.warn(`Firestore exams onSnapshot warning:`, error);
        callbacks.onError(error);
      }
    );
    unsubscribers.push(unsubExams);
  } catch (err) {
    callbacks.onError(err);
  }

  return () => {
    unsubscribers.forEach(unsub => unsub());
  };
}

// Fetch all user data once (for manual sync refresh)
export async function fetchAllUserData(userId: string): Promise<{
  subjects: Subject[];
  tasks: Task[];
  studySessions: StudySession[];
  reviewItems: ReviewItem[];
  exams: Exam[];
  settings?: UserSettings;
}> {
  const [profileSnap, subjectsSnap, tasksSnap, sessionsSnap, reviewsSnap, examsSnap] =
    await Promise.all([
      getDoc(doc(db, 'users', userId)),
      getDocs(collection(db, 'users', userId, 'subjects')),
      getDocs(collection(db, 'users', userId, 'tasks')),
      getDocs(collection(db, 'users', userId, 'studySessions')),
      getDocs(collection(db, 'users', userId, 'reviewItems')),
      getDocs(collection(db, 'users', userId, 'exams'))
    ]);

  const subjects: Subject[] = [];
  subjectsSnap.forEach(d => subjects.push(d.data() as Subject));

  const tasks: Task[] = [];
  tasksSnap.forEach(d => tasks.push(d.data() as Task));

  const studySessions: StudySession[] = [];
  sessionsSnap.forEach(d => studySessions.push(d.data() as StudySession));

  const reviewItems: ReviewItem[] = [];
  reviewsSnap.forEach(d => reviewItems.push(d.data() as ReviewItem));

  const exams: Exam[] = [];
  examsSnap.forEach(d => exams.push(d.data() as Exam));

  const profileData = profileSnap.exists() ? (profileSnap.data() as UserProfileDoc) : null;

  return {
    subjects,
    tasks,
    studySessions,
    reviewItems,
    exams,
    settings: profileData?.settings
  };
}

// User Document Operations
export async function saveUserProfile(
  userId: string,
  profile: Partial<UserProfileDoc>
): Promise<void> {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    const sanitized = sanitizeData({
      ...profile,
      updatedAt: new Date().toISOString()
    });
    await setDoc(userDocRef, sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getUserProfile(userId: string): Promise<UserProfileDoc | null> {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserProfileDoc;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Task Operations
export async function saveTaskToCloud(userId: string, task: Task): Promise<void> {
  const path = `users/${userId}/tasks/${task.id}`;
  try {
    const taskRef = doc(db, 'users', userId, 'tasks', task.id);
    const sanitized = sanitizeData(task);
    await setDoc(taskRef, sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTaskFromCloud(userId: string, taskId: string): Promise<void> {
  const path = `users/${userId}/tasks/${taskId}`;
  try {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    await deleteDoc(taskRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Subject Operations
export async function saveSubjectToCloud(userId: string, subject: Subject): Promise<void> {
  const path = `users/${userId}/subjects/${subject.id}`;
  try {
    const subRef = doc(db, 'users', userId, 'subjects', subject.id);
    const sanitized = sanitizeData(subject);
    await setDoc(subRef, sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSubjectFromCloud(userId: string, subjectId: string): Promise<void> {
  const path = `users/${userId}/subjects/${subjectId}`;
  try {
    const subRef = doc(db, 'users', userId, 'subjects', subjectId);
    await deleteDoc(subRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Study Session Operations
export async function saveSessionToCloud(userId: string, session: StudySession): Promise<void> {
  const path = `users/${userId}/studySessions/${session.id}`;
  try {
    const sessionRef = doc(db, 'users', userId, 'studySessions', session.id);
    const sanitized = sanitizeData(session);
    await setDoc(sessionRef, sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSessionFromCloud(userId: string, sessionId: string): Promise<void> {
  const path = `users/${userId}/studySessions/${sessionId}`;
  try {
    const sessionRef = doc(db, 'users', userId, 'studySessions', sessionId);
    await deleteDoc(sessionRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Review Item Operations
export async function saveReviewItemToCloud(userId: string, item: ReviewItem): Promise<void> {
  const path = `users/${userId}/reviewItems/${item.id}`;
  try {
    const itemRef = doc(db, 'users', userId, 'reviewItems', item.id);
    const sanitized = sanitizeData(item);
    await setDoc(itemRef, sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteReviewItemFromCloud(userId: string, itemId: string): Promise<void> {
  const path = `users/${userId}/reviewItems/${itemId}`;
  try {
    const itemRef = doc(db, 'users', userId, 'reviewItems', itemId);
    await deleteDoc(itemRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Exam Operations
export async function saveExamToCloud(userId: string, exam: Exam): Promise<void> {
  const path = `users/${userId}/exams/${exam.id}`;
  try {
    const examRef = doc(db, 'users', userId, 'exams', exam.id);
    const sanitized = sanitizeData(exam);
    await setDoc(examRef, sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteExamFromCloud(userId: string, examId: string): Promise<void> {
  const path = `users/${userId}/exams/${examId}`;
  try {
    const examRef = doc(db, 'users', userId, 'exams', examId);
    await deleteDoc(examRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Migration of Local Data to Cloud Firestore
export async function migrateLocalDataToCloud(
  userId: string,
  localData: {
    subjects: Subject[];
    tasks: Task[];
    studySessions: StudySession[];
    reviewItems: ReviewItem[];
    exams: Exam[];
    settings: UserSettings;
  }
): Promise<{ migrated: boolean; count: number }> {
  try {
    const existingProfile = await getUserProfile(userId);

    // Fetch existing cloud collections to check if remote already has items
    const [subjectsSnap, tasksSnap] = await Promise.all([
      getDocs(collection(db, 'users', userId, 'subjects')),
      getDocs(collection(db, 'users', userId, 'tasks'))
    ]);

    const cloudHasData = !subjectsSnap.empty || !tasksSnap.empty;

    // If cloud already has authoritative data from another device
    if (cloudHasData) {
      // Check if there are any non-sample custom tasks created on this local device
      // that don't exist in cloud, to avoid losing newly created tasks
      const cloudTaskIds = new Set(tasksSnap.docs.map(d => d.id));
      const customLocalTasks = (localData.tasks || []).filter(
        t => !cloudTaskIds.has(t.id) && !t.id.startsWith('task-1') && !t.id.startsWith('task-2') && !t.id.startsWith('task-3') && !t.id.startsWith('task-4') && !t.id.startsWith('task-5') && !t.id.startsWith('task-inbox-1')
      );

      if (customLocalTasks.length > 0) {
        const batch = writeBatch(db);
        for (const t of customLocalTasks) {
          const ref = doc(db, 'users', userId, 'tasks', t.id);
          batch.set(ref, sanitizeData(t), { merge: true });
        }
        await batch.commit();
        return { migrated: true, count: customLocalTasks.length };
      }

      await saveUserProfile(userId, { dataMigrated: true });
      return { migrated: false, count: 0 };
    }

    // If already marked as migrated and cloud is empty (or no data), skip
    if (existingProfile?.dataMigrated) {
      return { migrated: false, count: 0 };
    }

    const hasAnyLocalData =
      (localData.subjects && localData.subjects.length > 0) ||
      (localData.tasks && localData.tasks.length > 0) ||
      (localData.studySessions && localData.studySessions.length > 0) ||
      (localData.reviewItems && localData.reviewItems.length > 0) ||
      (localData.exams && localData.exams.length > 0);

    if (!hasAnyLocalData) {
      await saveUserProfile(userId, { dataMigrated: true });
      return { migrated: false, count: 0 };
    }

    // Perform batch write with sanitized payloads
    const batch = writeBatch(db);
    let totalCount = 0;

    // Subjects
    for (const sub of (localData.subjects || [])) {
      const ref = doc(db, 'users', userId, 'subjects', sub.id);
      batch.set(ref, sanitizeData(sub));
      totalCount++;
    }

    // Tasks
    for (const task of (localData.tasks || [])) {
      const ref = doc(db, 'users', userId, 'tasks', task.id);
      batch.set(ref, sanitizeData(task));
      totalCount++;
    }

    // Sessions
    for (const session of (localData.studySessions || [])) {
      const ref = doc(db, 'users', userId, 'studySessions', session.id);
      batch.set(ref, sanitizeData(session));
      totalCount++;
    }

    // Review Items
    for (const review of (localData.reviewItems || [])) {
      const ref = doc(db, 'users', userId, 'reviewItems', review.id);
      batch.set(ref, sanitizeData(review));
      totalCount++;
    }

    // Exams
    for (const exam of (localData.exams || [])) {
      const ref = doc(db, 'users', userId, 'exams', exam.id);
      batch.set(ref, sanitizeData(exam));
      totalCount++;
    }

    // User Profile & Settings
    const userRef = doc(db, 'users', userId);
    batch.set(
      userRef,
      sanitizeData({
        uid: userId,
        settings: localData.settings,
        dataMigrated: true,
        updatedAt: new Date().toISOString()
      }),
      { merge: true }
    );

    await batch.commit();
    return { migrated: true, count: totalCount };
  } catch (err) {
    console.error('Failed to migrate local data to cloud:', err);
    throw err;
  }
}

/**
 * Ensures that the authenticated user document (/users/{userId}) exists in Cloud Firestore,
 * and initializes their subjects, tasks, and data immediately upon registration/login so the
 * database is never empty.
 */
export async function ensureUserInDatabase(
  user: User,
  fallbackData?: {
    subjects: Subject[];
    tasks: Task[];
    studySessions: StudySession[];
    reviewItems: ReviewItem[];
    exams: Exam[];
    settings: UserSettings;
  }
): Promise<{ isNewUser: boolean; count: number }> {
  const userDocRef = doc(db, 'users', user.uid);
  const now = new Date().toISOString();

  try {
    const snap = await getDoc(userDocRef);

    if (!snap.exists()) {
      // 1. Create User Document in Firestore
      const newProfile: UserProfileDoc = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL,
        settings: fallbackData?.settings,
        dataMigrated: true,
        createdAt: now,
        updatedAt: now
      };
      await setDoc(userDocRef, sanitizeData(newProfile));

      // 2. Also populate initial/local collections so database immediately has records
      let totalCount = 0;
      if (fallbackData) {
        const batch = writeBatch(db);
        for (const s of fallbackData.subjects || []) {
          batch.set(doc(db, 'users', user.uid, 'subjects', s.id), sanitizeData(s));
          totalCount++;
        }
        for (const t of fallbackData.tasks || []) {
          batch.set(doc(db, 'users', user.uid, 'tasks', t.id), sanitizeData(t));
          totalCount++;
        }
        for (const ss of fallbackData.studySessions || []) {
          batch.set(doc(db, 'users', user.uid, 'studySessions', ss.id), sanitizeData(ss));
          totalCount++;
        }
        for (const r of fallbackData.reviewItems || []) {
          batch.set(doc(db, 'users', user.uid, 'reviewItems', r.id), sanitizeData(r));
          totalCount++;
        }
        for (const e of fallbackData.exams || []) {
          batch.set(doc(db, 'users', user.uid, 'exams', e.id), sanitizeData(e));
          totalCount++;
        }
        if (totalCount > 0) {
          await batch.commit();
        }
      }
      return { isNewUser: true, count: totalCount };
    } else {
      // Existing user: ensure profile metadata is up-to-date
      await setDoc(
        userDocRef,
        sanitizeData({
          email: user.email,
          displayName: user.displayName || snap.data()?.displayName,
          photoURL: user.photoURL || snap.data()?.photoURL,
          updatedAt: now
        }),
        { merge: true }
      );
      return { isNewUser: false, count: 0 };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }
}

