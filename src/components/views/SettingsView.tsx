import React, { useState } from 'react';
import {
  Settings,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Moon,
  Sun,
  ShieldCheck,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    toggleDarkMode,
    exportJSON,
    exportTasksCSV,
    importJSON,
    clearDemoData,
    resetToSampleData,
    user,
    authLoading,
    syncStatus,
    openAuthModal,
    logout,
    forceSyncCloud
  } = useStudy();

  const [dailyTarget, setDailyTarget] = useState(settings.dailyTargetHours || 4);
  const [weeklyTarget, setWeeklyTarget] = useState(settings.weeklyTargetHours || 24);
  const [maxDaily, setMaxDaily] = useState(settings.maxDailyStudyHours || 6);
  const [pomodoroWork, setPomodoroWork] = useState(settings.pomodoroWorkMinutes || 25);
  const [pomodoroBreak, setPomodoroBreak] = useState(settings.pomodoroBreakMinutes || 5);

  const [importStatus, setImportStatus] = useState<{ message: string; isError?: boolean } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      dailyTargetHours: Number(dailyTarget),
      weeklyTargetHours: Number(weeklyTarget),
      maxDailyStudyHours: Number(maxDaily),
      pomodoroWorkMinutes: Number(pomodoroWork),
      pomodoroBreakMinutes: Number(pomodoroBreak)
    });
    setImportStatus({ message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' });
    setTimeout(() => setImportStatus(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const res = importJSON(content);
        if (res.success) {
          setImportStatus({ message: 'นำเข้าข้อมูล JSON สำเร็จเรียบร้อยแล้ว!' });
        } else {
          setImportStatus({ message: res.error || 'เกิดข้อผิดพลาดในการนำเข้า', isError: true });
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-500" />
          การตั้งค่า & การจัดการข้อมูล (Settings & Data)
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          ปรับแต่งเป้าหมายการเรียน เวลาตัวจับเวลา และสำรองข้อมูลเพื่อความปลอดภัย
        </p>
      </div>

      {/* Cloud & Account Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                บัญชีและการซิงค์คลาวด์ (Cloud Firestore & Auth)
              </h3>
              <p className="text-xs text-slate-400">
                ซิงค์ข้อมูลการเรียน ตารางอ่านหนังสือ และบันทึกคะแนนข้ามอุปกรณ์แบบเรียลไทม์
              </p>
            </div>
          </div>

          <div>
            {user ? (
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors"
              >
                ออกจากระบบ
              </button>
            ) : (
              <button
                type="button"
                onClick={openAuthModal}
                disabled={authLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>เข้าสู่ระบบ / ซิงค์ข้อมูล</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {user ? (
              user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                  {user.displayName ? user.displayName[0] : 'U'}
                </div>
              )
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {user ? user.displayName || user.email : 'โหมดแขก (Local Storage)'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {user ? user.email : 'ข้อมูลบันทึกในบราวเซอร์นี้เท่านั้น เข้าสู่ระบบเพื่อซิงค์ไปยังมือถือและแท็บเล็ต'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 ${
                user
                  ? syncStatus === 'saving'
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                    : syncStatus === 'error'
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  user
                    ? syncStatus === 'saving'
                      ? 'bg-amber-500 animate-pulse'
                      : syncStatus === 'error'
                      ? 'bg-rose-500'
                      : 'bg-emerald-500'
                    : 'bg-slate-400'
                }`}
              />
              {user
                ? syncStatus === 'saving'
                  ? 'กำลังซิงค์ขึ้น Cloud...'
                  : syncStatus === 'error'
                  ? 'ซิงค์ติดขัด'
                  : 'เชื่อมต่อและซิงค์เรียลไทม์'
                : 'ออฟไลน์ / บันทึกในเครื่อง'}
            </span>

            {user && (
              <button
                type="button"
                onClick={async () => {
                  await forceSyncCloud();
                  setImportStatus({ message: 'ดึงข้อมูลล่าสุดจาก Cloud Firestore สำเร็จแล้ว' });
                  setTimeout(() => setImportStatus(null), 3500);
                }}
                className="px-3 py-1 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${syncStatus === 'saving' ? 'animate-spin' : ''}`} />
                <span>ซิงค์ทันที</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {importStatus && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-sm font-semibold ${
            importStatus.isError
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          {importStatus.isError ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span>{importStatus.message}</span>
        </div>
      )}

      {/* Preferences Form */}
      <form onSubmit={handleSavePreferences} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
          เป้าหมายเวลาและเพดานการอ่าน
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              เป้าหมายรายวัน (ชั่วโมง)
            </label>
            <input
              type="number"
              min="1"
              max="16"
              value={dailyTarget}
              onChange={e => setDailyTarget(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              เป้าหมายรายสัปดาห์ (ชั่วโมง)
            </label>
            <input
              type="number"
              min="5"
              max="80"
              value={weeklyTarget}
              onChange={e => setWeeklyTarget(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              เพดานสูงสุดต่อวัน (ชั่วโมง)
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={maxDaily}
              onChange={e => setMaxDaily(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
            />
          </div>
        </div>

        {/* Timer Presets */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
            การตั้งเวลาโฟกัส (Pomodoro Presets)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                เวลาโฟกัสทำงาน (นาที)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={pomodoroWork}
                onChange={e => setPomodoroWork(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                เวลาพักผ่อน (นาที)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={pomodoroBreak}
                onChange={e => setPomodoroBreak(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-5 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">ธีมหน้าจอ (Dark Mode)</h4>
            <p className="text-xs text-slate-400">สลับระหว่างโหมดสว่างและโหมดมืด</p>
          </div>
          <button
            type="button"
            onClick={toggleDarkMode}
            className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2 text-xs font-semibold"
          >
            {settings.darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            <span>{settings.darkMode ? 'เปิดโหมดมืดอยู่' : 'เปิดโหมดสว่างอยู่'}</span>
          </button>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md"
          >
            บันทึกการตั้งค่า
          </button>
        </div>
      </form>

      {/* Data Management & Backup */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            การส่งออกและนำเข้าข้อมูล (Export & Import)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            ข้อมูลของคุณถูกบันทึกในเบราว์เซอร์อัตโนมัติ (LocalStorage) คุณสามารถดาวน์โหลดไฟล์สำรองไว้ได้ตลอดเวลา
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Export JSON */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40 space-y-2">
            <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-indigo-500" />
              ส่งออกข้อมูลทั้งหมด (JSON Backup)
            </div>
            <p className="text-[11px] text-slate-400">
              รวมทุกอย่าง: รายวิชา, งาน, ประวัติอ่านหนังสือ, หัวข้อทบทวน และการสอบ
            </p>
            <button
              onClick={exportJSON}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 text-indigo-600 dark:text-indigo-400 font-semibold text-xs transition-colors"
            >
              ดาวน์โหลด JSON
            </button>
          </div>

          {/* Export CSV */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40 space-y-2">
            <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              ส่งออกรายการงาน (Tasks CSV)
            </div>
            <p className="text-[11px] text-slate-400">
              เหมาะสำหรับเปิดใน Excel หรือ Google Sheets เพื่อดูตารางสรุป
            </p>
            <button
              onClick={exportTasksCSV}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 text-emerald-600 dark:text-emerald-400 font-semibold text-xs transition-colors"
            >
              ดาวน์โหลด CSV
            </button>
          </div>
        </div>

        {/* Import JSON */}
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40 space-y-3">
          <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-purple-500" />
            นำเข้าข้อมูลสำรอง (Restore from JSON)
          </div>
          <p className="text-[11px] text-slate-400">
            เลือกไฟล์ backup .json ที่เคยส่งออกไว้ ระบบจะตรวจสอบความถูกต้องก่อนแทนที่ข้อมูล
          </p>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
          />
        </div>

        {/* Danger Zone: Clear Demo / Reset */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
          <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            จัดการข้อมูลเริ่มต้น (Danger Zone)
          </h4>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>ล้างข้อมูลตัวอย่างทั้งหมด (เริ่มใหม่)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>รีเซ็ตกลับเป็นข้อมูลตัวอย่าง (Reset Demo)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clear Demo Confirm Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h4 className="text-base font-bold text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              ยืนยันการล้างข้อมูล?
            </h4>
            <p className="text-xs text-slate-500">
              การกระทำนี้จะล้างรายวิชา งาน และประวัติทั้งหมดในเครื่องของคุณ เพื่อให้คุณเริ่มใช้งานจากศูนย์
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  clearDemoData();
                  setShowClearConfirm(false);
                  setImportStatus({ message: 'ล้างข้อมูลตัวอย่างเรียบร้อยแล้ว' });
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md"
              >
                ลบข้อมูลทั้งหมด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset to Sample Confirm Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-600" />
              ยืนยันการรีเซ็ตข้อมูลตัวอย่าง?
            </h4>
            <p className="text-xs text-slate-500">
              ข้อมูลปัจจุบันจะถูกแทนที่ด้วยข้อมูลตัวอย่างสำหรับศึกษาการใช้งาน
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  resetToSampleData();
                  setShowResetConfirm(false);
                  setImportStatus({ message: 'รีเซ็ตข้อมูลตัวอย่างเรียบร้อยแล้ว' });
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md"
              >
                ยืนยันการรีเซ็ต
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
