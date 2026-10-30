import React, { useState } from 'react';
import { StudyProvider, useStudy } from './context/StudyContext';
import { Sidebar, MainNavView } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { TodayDashboard } from './components/views/TodayDashboard';
import { CalendarView } from './components/views/CalendarView';
import { TaskManagerView } from './components/views/TaskManagerView';
import { SubjectsView } from './components/views/SubjectsView';
import { FocusTimerView } from './components/views/FocusTimerView';
import { SpacedRepetitionView } from './components/views/SpacedRepetitionView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { SmartSchedulerView } from './components/views/SmartSchedulerView';
import { SettingsView } from './components/views/SettingsView';

import { TaskModal } from './components/modals/TaskModal';
import { SubjectModal } from './components/modals/SubjectModal';
import { RescheduleModal } from './components/modals/RescheduleModal';
import { AuthModal } from './components/modals/AuthModal';
import { Task, Subject } from './types';

const MainLayout: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal } = useStudy();
  const [currentView, setCurrentView] = useState<MainNavView>('today');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskDefaultDate, setTaskDefaultDate] = useState<string | undefined>(undefined);
  const [taskDefaultTime, setTaskDefaultTime] = useState<string | undefined>(undefined);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);

  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [taskToReschedule, setTaskToReschedule] = useState<Task | null>(null);

  // Handlers
  const handleOpenAddTask = () => {
    setTaskToEdit(null);
    setTaskDefaultDate(undefined);
    setTaskDefaultTime(undefined);
    setIsTaskModalOpen(true);
  };

  const handleOpenAddTaskWithDate = (date: string, time?: string) => {
    setTaskToEdit(null);
    setTaskDefaultDate(date);
    setTaskDefaultTime(time);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleRescheduleTask = (task: Task) => {
    setTaskToReschedule(task);
    setIsRescheduleModalOpen(true);
  };

  const handleOpenAddSubject = () => {
    setSubjectToEdit(null);
    setIsSubjectModalOpen(true);
  };

  const handleEditSubject = (subject: Subject) => {
    setSubjectToEdit(subject);
    setIsSubjectModalOpen(true);
  };

  const handleOpenAddTaskForSubject = (subjectId: string, topicId?: string) => {
    setTaskToEdit(null);
    setTaskDefaultDate(undefined);
    setTaskDefaultTime(undefined);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col lg:flex-row font-sans transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Topbar
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenAddTask={handleOpenAddTask}
          onNavigate={view => setCurrentView(view)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentView === 'today' && (
            <TodayDashboard
              onNavigate={view => setCurrentView(view)}
              onOpenAddTask={handleOpenAddTask}
              onEditTask={handleEditTask}
              onRescheduleTask={handleRescheduleTask}
            />
          )}

          {currentView === 'calendar' && (
            <CalendarView
              onOpenAddTaskWithDate={handleOpenAddTaskWithDate}
              onEditTask={handleEditTask}
              onRescheduleTask={handleRescheduleTask}
            />
          )}

          {currentView === 'tasks' && (
            <TaskManagerView
              onOpenAddTask={handleOpenAddTask}
              onEditTask={handleEditTask}
              onRescheduleTask={handleRescheduleTask}
            />
          )}

          {currentView === 'subjects' && (
            <SubjectsView
              onOpenAddSubject={handleOpenAddSubject}
              onEditSubject={handleEditSubject}
              onOpenAddTaskForSubject={handleOpenAddTaskForSubject}
            />
          )}

          {currentView === 'timer' && <FocusTimerView />}

          {currentView === 'reviews' && <SpacedRepetitionView />}

          {currentView === 'analytics' && <AnalyticsView />}

          {currentView === 'scheduler' && <SmartSchedulerView />}

          {currentView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskToEdit={taskToEdit}
        defaultDate={taskDefaultDate}
        defaultTime={taskDefaultTime}
      />

      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        subjectToEdit={subjectToEdit}
      />

      <RescheduleModal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        task={taskToReschedule}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
      />
    </div>
  );
};

export default function App() {
  return (
    <StudyProvider>
      <MainLayout />
    </StudyProvider>
  );
}
