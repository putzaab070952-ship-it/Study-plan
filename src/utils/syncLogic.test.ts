import { test, describe } from 'node:test';
import assert from 'node:assert';
import { getBangkokToday, addDays, formatDateThai } from './dateUtils';
import { STANDARD_SUBJECT_PRESETS } from './constants';

describe('Bangkok Date & Time Utils', () => {
  test('getBangkokToday returns valid YYYY-MM-DD format', () => {
    const today = getBangkokToday();
    assert.match(today, /^\d{4}-\d{2}-\d{2}$/, 'Should match YYYY-MM-DD pattern');
  });

  test('addDays calculates correct offsets', () => {
    const baseDate = '2026-10-26';
    const nextDay = addDays(baseDate, 1);
    assert.strictEqual(nextDay, '2026-10-27');

    const nextWeek = addDays(baseDate, 7);
    assert.strictEqual(nextWeek, '2026-11-02');
  });

  test('formatDateThai formats dates properly in Thai locale', () => {
    const formatted = formatDateThai('2026-10-26', false);
    assert.ok(formatted.includes('ตุลาคม') || formatted.includes('ต.ค.'), 'Should include Thai month');
  });
});

describe('Subject Presets Verification', () => {
  test('Contains all required Thai subject options', () => {
    const requiredNames = [
      'คณิตศาสตร์',
      'ฟิสิกส์',
      'เคมี',
      'ชีววิทยา',
      'ภาษาไทย',
      'สังคมศึกษา',
      'ประวัติศาสตร์',
      'คอมพิวเตอร์',
      'ภาษาอังกฤษ',
      'TPAT1',
      'TGAT'
    ];

    const presetNames = STANDARD_SUBJECT_PRESETS.map(p => p.name);
    for (const req of requiredNames) {
      assert.ok(
        presetNames.includes(req),
        `Subject preset list must include "${req}"`
      );
    }
  });

  test('All subject IDs match Firestore security rules pattern', () => {
    const firestoreIdRegex = /^[a-zA-Z0-9_\-]+$/;
    for (const preset of STANDARD_SUBJECT_PRESETS) {
      const subjectDocId = `sub-${preset.id}`;
      assert.ok(
        firestoreIdRegex.test(subjectDocId),
        `Subject ID "${subjectDocId}" must be valid alphanumeric/hyphen`
      );
    }
  });
});

describe('Firestore Data Integrity & Migration Logic', () => {
  // Pure logic replica of migration decision tree
  function shouldMigrateLocalData(
    hasCloudData: boolean,
    alreadyMigrated: boolean,
    localItemCount: number
  ): { migrate: boolean; reason: string } {
    if (alreadyMigrated) {
      return { migrate: false, reason: 'Already marked as migrated' };
    }
    if (hasCloudData) {
      return { migrate: false, reason: 'Cloud already contains authoritative data from another device' };
    }
    if (localItemCount === 0) {
      return { migrate: false, reason: 'No local items to migrate' };
    }
    return { migrate: true, reason: 'Migrated successfully' };
  }

  test('Protects cloud data: Does NOT overwrite when cloud has records from device A', () => {
    const decision = shouldMigrateLocalData(true, false, 5);
    assert.strictEqual(decision.migrate, false);
    assert.strictEqual(
      decision.reason,
      'Cloud already contains authoritative data from another device'
    );
  });

  test('Performs migration when user logs in with local data and clean cloud account', () => {
    const decision = shouldMigrateLocalData(false, false, 8);
    assert.strictEqual(decision.migrate, true);
  });

  test('Does not re-run migration on subsequent logins', () => {
    const decision = shouldMigrateLocalData(false, true, 8);
    assert.strictEqual(decision.migrate, false);
  });
});

describe('Sanitization for Firestore Writes', () => {
  function sanitizeData<T>(data: T): T {
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

  test('Strips undefined fields from task objects without breaking defined fields', () => {
    const taskWithUndefined = {
      id: 'task-test-1',
      title: 'Math homework',
      topicId: undefined,
      plannedStartTime: undefined,
      dueDate: '2026-10-30',
      subtasks: [
        { id: 'sub-1', title: 'Part 1', completed: false }
      ]
    };

    const sanitized = sanitizeData(taskWithUndefined);
    assert.strictEqual('topicId' in sanitized, false);
    assert.strictEqual('plannedStartTime' in sanitized, false);
    assert.strictEqual(sanitized.title, 'Math homework');
    assert.strictEqual(sanitized.subtasks.length, 1);
  });

  test('Strips undefined fields from nested objects', () => {
    const subjectWithUndefined = {
      id: 'sub-test-1',
      name: 'Physics',
      examDate: undefined,
      topics: [
        { id: 'top-1', title: 'Forces', chapter: undefined, status: 'learning' }
      ]
    };

    const sanitized = sanitizeData(subjectWithUndefined);
    assert.strictEqual('examDate' in sanitized, false);
    assert.strictEqual('chapter' in sanitized.topics[0], false);
    assert.strictEqual(sanitized.topics[0].title, 'Forces');
  });
});

describe('Database User Registration Logic', () => {
  interface MockDbUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    createdAt: string;
    updatedAt: string;
  }

  function simulateUserRegistration(
    user: { uid: string; email: string | null; displayName: string | null },
    existingUsers: Map<string, MockDbUser>
  ): { isNewUser: boolean; profile: MockDbUser } {
    const now = '2026-10-30T07:25:00.000Z';
    if (!existingUsers.has(user.uid)) {
      const newProfile: MockDbUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        createdAt: now,
        updatedAt: now
      };
      existingUsers.set(user.uid, newProfile);
      return { isNewUser: true, profile: newProfile };
    } else {
      const existing = existingUsers.get(user.uid)!;
      existing.updatedAt = now;
      if (user.displayName) existing.displayName = user.displayName;
      return { isNewUser: false, profile: existing };
    }
  }

  test('Creates user profile in database upon first sign-in', () => {
    const db = new Map<string, MockDbUser>();
    const res = simulateUserRegistration(
      { uid: 'u-123', email: 'putzaab070952@gmail.com', displayName: 'Putzaab' },
      db
    );
    assert.strictEqual(res.isNewUser, true);
    assert.strictEqual(db.has('u-123'), true);
    assert.strictEqual(db.get('u-123')?.email, 'putzaab070952@gmail.com');
  });

  test('Updates existing profile without overwriting original createdAt', () => {
    const db = new Map<string, MockDbUser>();
    const first = simulateUserRegistration(
      { uid: 'u-123', email: 'putzaab070952@gmail.com', displayName: 'Putzaab' },
      db
    );
    const second = simulateUserRegistration(
      { uid: 'u-123', email: 'putzaab070952@gmail.com', displayName: 'Putzaab Updated' },
      db
    );
    assert.strictEqual(second.isNewUser, false);
    assert.strictEqual(db.get('u-123')?.displayName, 'Putzaab Updated');
    assert.strictEqual(db.get('u-123')?.createdAt, first.profile.createdAt);
  });
});


