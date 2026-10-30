import React from 'react';
import {
  Calendar,
  CheckSquare,
  BookOpen,
  Timer,
  RotateCw,
  BarChart2,
  Sparkles,
  Settings,
  LayoutDashboard,
  Moon,
  Sun,
  Play,
  Pause,
  X
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { formatMinutesThai } from '../../utils/dateUtils';

export type MainNavView =
  | 'today'
  | 'calendar'
  | 'tasks'
  | 'subjects'
  | 'timer'
  | 'reviews'
  | 'analytics'
  | 'scheduler'
  | 'settings';

interface SidebarProps {
  currentView: MainNavView;
  setCurrentView: (view: MainNavView) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  isOpen,
  setIsOpen
}) => {
  const { settings, toggleDarkMode, activeTimer, pauseTimer, resumeTimer } = useStudy();

  const navItems: Array<{ id: MainNavView; label: string; icon: React.FC<any>; badge?: string }> = [
    { id: 'today', label: 'ภาพรวมวันนี้', icon: LayoutDashboard },
    { id: 'calendar', label: 'ปฏิทิน & ตารางอ่าน', icon: Calendar },
    { id: 'tasks', label: 'จัดการงาน & To-do', icon: CheckSquare },
    { id: 'subjects', label: 'รายวิชา & เนื้อหา', icon: BookOpen },
    { id: 'timer', label: 'จับเวลาอ่าน (Timer)', icon: Timer },
    { id: 'reviews', label: 'ทบทวน & สอบ', icon: RotateCw },
    { id: 'scheduler', label: 'จัดตารางอัจฉริยะ', icon: Sparkles },
    { id: 'analytics', label: 'ความคืบหน้า & สถิติ', icon: BarChart2 },
    { id: 'settings', label: 'ตั้งค่า & สำรองข้อมูล', icon: Settings }
  ];

  const handleNavClick = (viewId: MainNavView) => {
    setCurrentView(viewId);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const timerMin = Math.floor(activeTimer.secondsLeft / 60);
  const timerSec = activeTimer.secondsLeft % 60;
  const timerFormatted = `${timerMin.toString().padStart(2, '0')}:${timerSec.toString().padStart(2, '0')}`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo / Branding */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-linear-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-300 bg-clip-text text-transparent">
                StudyFlow
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Study Planner</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="ปิดเมนู"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {item.id === 'timer' && activeTimer.isActive && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-500 text-white font-mono animate-pulse">
                    {timerFormatted}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Active Timer Floating Card inside Sidebar */}
        {activeTimer.isActive && (
          <div className="mx-3 mb-3 p-3 rounded-xl bg-linear-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200/50 dark:border-indigo-800/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                กำลังโฟกัส
              </span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                {timerFormatted}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 truncate mb-2">
              {activeTimer.title || 'อ่านหนังสือ'}
            </p>
            <div className="flex items-center gap-2">
              {activeTimer.isPaused ? (
                <button
                  onClick={resumeTimer}
                  className="flex-1 py-1 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                >
                  <Play className="w-3 h-3" /> ต่อ
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className="flex-1 py-1 px-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                >
                  <Pause className="w-3 h-3" /> พัก
                </button>
              )}
              <button
                onClick={() => setCurrentView('timer')}
                className="py-1 px-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
              >
                ดูตัวจับเวลา
              </button>
            </div>
          </div>
        )}

        {/* Footer / Theme switch */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Asia/Bangkok (GMT+7)</span>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={settings.darkMode ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
            aria-label="สลับธีม"
          >
            {settings.darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
};
