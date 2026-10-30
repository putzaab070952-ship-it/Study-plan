import React, { useState } from 'react';
import {
  Menu,
  Search,
  Plus,
  Timer,
  Sparkles,
  X,
  CheckCircle,
  Cloud,
  CloudOff,
  RefreshCw,
  LogOut,
  User as UserIcon,
  Check,
  AlertCircle
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { getBangkokToday, formatDateThai } from '../../utils/dateUtils';
import { MainNavView } from './Sidebar';

interface TopbarProps {
  onOpenSidebar: () => void;
  onOpenAddTask: () => void;
  onNavigate: (view: MainNavView) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenSidebar,
  onOpenAddTask,
  onNavigate
}) => {
  const {
    tasks,
    subjects,
    toggleTaskComplete,
    user,
    authLoading,
    syncStatus,
    syncError,
    migrationNotification,
    clearMigrationNotification,
    openAuthModal,
    logout,
    forceSyncCloud
  } = useStudy();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const todayStr = getBangkokToday();
  const todayFormatted = formatDateThai(todayStr, true);

  // Search filtering
  const searchResults = searchQuery.trim()
    ? {
        tasks: tasks.filter(
          t =>
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
        ),
        subjects: subjects.filter(
          s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.code.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }
    : null;

  return (
    <header className="h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between gap-3">
      {/* Left side: Hamburger + Bangkok Date */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          aria-label="เปิดเมนู"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline-block">
            เขตเวลา Asia/Bangkok
          </span>
          <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
            {todayFormatted}
          </span>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="relative flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="ค้นหางาน, วิชา, แบบฝึกหัด..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Live Search Popup */}
        {isSearchOpen && searchResults && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsSearchOpen(false)}
            />
            <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-40 max-h-96 overflow-y-auto space-y-3">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
                  งานที่ตรงกับการค้นหา ({searchResults.tasks.length})
                </span>
                {searchResults.tasks.length === 0 ? (
                  <p className="text-xs text-slate-400 px-2 py-1">ไม่พบงานที่ค้นหา</p>
                ) : (
                  <div className="mt-1 space-y-1">
                    {searchResults.tasks.slice(0, 5).map(task => {
                      const sub = subjects.find(s => s.id === task.subjectId);
                      return (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm transition-colors cursor-pointer"
                          onClick={() => {
                            setIsSearchOpen(false);
                            onNavigate('tasks');
                          }}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                toggleTaskComplete(task.id);
                              }}
                              className={`p-1 rounded-lg transition-colors ${
                                task.status === 'completed'
                                  ? 'text-emerald-500'
                                  : 'text-slate-300 hover:text-indigo-500'
                              }`}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <span
                              className={`truncate font-medium ${
                                task.status === 'completed'
                                  ? 'line-through text-slate-400'
                                  : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>
                          {sub && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-md shrink-0 font-medium"
                              style={{
                                backgroundColor: `${sub.color}15`,
                                color: sub.color
                              }}
                            >
                              {sub.code || sub.name}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {searchResults.subjects.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
                    รายวิชา ({searchResults.subjects.length})
                  </span>
                  <div className="mt-1 space-y-1">
                    {searchResults.subjects.map(s => (
                      <div
                        key={s.id}
                        className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm cursor-pointer"
                        onClick={() => {
                          setIsSearchOpen(false);
                          onNavigate('subjects');
                        }}
                      >
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {s.code}:
                        </span>
                        <span className="text-slate-600 dark:text-slate-300 truncate">
                          {s.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right side: Sync Status, Auth Buttons, Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Real-time Cloud Sync Status Indicator */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title={
                syncStatus === 'synced'
                  ? 'เชื่อมต่อ Cloud Firestore แล้ว - ข้อมูลซิงค์อัตโนมัติ'
                  : syncStatus === 'saving'
                  ? 'กำลังบันทึกลงคลาวด์...'
                  : syncStatus === 'error'
                  ? `ข้อผิดพลาด: ${syncError || 'ไม่สามารถซิงค์ได้'}`
                  : 'สถานะคลาวด์'
              }
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-6 h-6 rounded-full object-cover border border-slate-300 dark:border-slate-600 shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}

              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[100px] truncate leading-tight">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <span className="text-[10px] flex items-center gap-1 font-medium leading-none mt-0.5">
                  {syncStatus === 'saving' ? (
                    <span className="text-amber-500 flex items-center gap-1">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      กำลังซิงค์...
                    </span>
                  ) : syncStatus === 'error' ? (
                    <span className="text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-2.5 h-2.5" />
                      ซิงค์ผิดพลาด
                    </span>
                  ) : (
                    <span className="text-emerald-500 flex items-center gap-1">
                      <Cloud className="w-2.5 h-2.5" />
                      คลาวด์พร้อม
                    </span>
                  )}
                </span>
              </div>
            </button>

            {/* Profile & Cloud Sync Dropdown Modal */}
            {isProfileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsProfileMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 z-40 space-y-3">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                        {user.displayName || 'Google User'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Sync Details */}
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-slate-600 dark:text-slate-400">สถานะคลาวด์:</span>
                      <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        <Check className="w-3.5 h-3.5" />
                        ซิงค์แบบเรียลไทม์
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      ข้อมูลทุกชิ้นได้รับการสำรองและส่งต่อไปยังอุปกรณ์ทุกเครื่องของคุณอัตโนมัติ
                    </p>
                  </div>

                  <button
                    onClick={async () => {
                      await forceSyncCloud();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'saving' ? 'animate-spin' : ''}`} />
                    <span>ซิงค์ข้อมูลเดี๋ยวนี้ (Sync Now)</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={openAuthModal}
            disabled={authLoading}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/70 transition-all shadow-xs cursor-pointer"
            title="เข้าสู่ระบบด้วย Google หรือ อีเมล เพื่อซิงค์ข้อมูลข้ามอุปกรณ์"
          >
            <UserIcon className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="hidden sm:inline">เข้าสู่ระบบ / ซิงค์</span>
            <span className="sm:hidden">เข้าสู่ระบบ</span>
          </button>
        )}

        <button
          onClick={() => onNavigate('timer')}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shadow-xs"
          title="เริ่มเซสชันจับเวลาอ่านหนังสือ"
        >
          <Timer className="w-4 h-4" />
          <span className="hidden sm:inline">เริ่มโฟกัส</span>
        </button>

        <button
          onClick={() => onNavigate('scheduler')}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors shadow-xs"
          title="จัดตารางอัจฉริยะ"
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">จัดตาราง</span>
        </button>

        <button
          onClick={onOpenAddTask}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white transition-all shadow-md shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline">เพิ่มงาน</span>
        </button>
      </div>

      {/* Migration Alert Notification Toast */}
      {migrationNotification && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md bg-emerald-600 text-white p-3.5 rounded-2xl shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <Cloud className="w-5 h-5 shrink-0 mt-0.5 text-emerald-200" />
          <div className="flex-1 text-xs sm:text-sm leading-snug">
            {migrationNotification}
          </div>
          <button
            onClick={clearMigrationNotification}
            className="p-1 hover:bg-emerald-700 rounded-lg text-emerald-200 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
};
