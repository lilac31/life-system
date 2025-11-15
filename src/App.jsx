import React, { useState, useEffect } from 'react';
import TestPage from './TestPage';
import WeekView from './components/WeekView';
import YearView from './components/YearView';
import ManagementView from './components/ManagementView';
import AddTaskModal from './components/AddTaskModal';

function App() {
  const [tasks, setTasks] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('week');

  // 初始化空任务数据
  useEffect(() => {
    setTasks([]);
  }, []);

  const addTask = (newTask) => {
    const task = {
      ...newTask,
      id: Date.now(),
      completed: false
    };
    setTasks(prev => [...prev, task]);
  };

  const updateTask = (taskId, updates) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const deleteTask = (taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const toggleTaskComplete = (taskId) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'test':
        return <TestPage />;
      case 'week':
        return (
          <WeekView
            tasks={tasks}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            currentView={currentView}
            onViewChange={setCurrentView}
          />
        );
      case 'year':
        return <YearView currentView={currentView} onViewChange={setCurrentView} />;
      case 'management':
        return <ManagementView currentView={currentView} onViewChange={setCurrentView} />;
      default:
        return (
          <WeekView
            tasks={tasks}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            currentView={currentView}
            onViewChange={setCurrentView}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="p-3">
        <div className="w-full max-w-full mx-auto px-4">
          {renderCurrentView()}
        </div>
      </main>

      {isAddModalOpen && (
        <AddTaskModal
          onClose={() => setIsAddModalOpen(false)}
          onAddTask={addTask}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
}

export default App;