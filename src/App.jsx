import React, { useState, useEffect } from 'react';
import TestPage from './TestPage';
import WeekView from './components/WeekView';
import YearView from './components/YearView';
import ManagementView from './components/ManagementView';
import AddTaskModal from './components/AddTaskModal';
import SyncStatus from './components/SyncStatus';
import CloudSyncSetup from './services/CloudSyncSetup';
import { dataAPI, dataSyncService } from './services/apiService';

function App() {
  const [tasks, setTasks] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('week');
  const [showSetup, setShowSetup] = useState(false);

  // 初始化数据
  useEffect(() => {
    // 检查是否已设置云同步
    const hasGithubToken = localStorage.getItem('github_token');
    const hasApiKey = localStorage.getItem('jsonbin_api_key');
    const hasSkippedSync = localStorage.getItem('cloud_sync_enabled') === 'false';
    
    // 如果没有任何API密钥且没有跳过设置，显示设置界面
    if (!hasGithubToken && !hasApiKey && !hasSkippedSync) {
      console.log('未设置API密钥，显示设置界面');
      setShowSetup(true);
    } else if ((hasGithubToken || hasApiKey)) {
      console.log('已设置API密钥，获取用户信息并尝试自动同步');
      // 确保获取用户信息后再尝试自动同步
      dataSyncService.getUserId().then(userId => {
        console.log('获取到用户ID:', userId);
        // 尝试自动同步
        setTimeout(() => {
          try {
            dataSyncService.syncData().then(result => {
              console.log('启动时同步结果:', result);
            }).catch(error => {
              console.warn('启动时同步失败:', error);
            });
          } catch (error) {
            console.warn('同步服务不可用:', error);
          }
        }, 2000);
      }).catch(error => {
        console.error('获取用户信息失败:', error);
      });
    }
    
    // 加载本地数据
    const allData = dataAPI.getAllData();
    console.log('加载本地数据:', allData);
    
    // 如果本地没有数据，创建默认数据
    if (!allData.weeks || Object.keys(allData.weeks).length === 0) {
      console.log('创建默认数据');
      const defaultData = dataAPI.getAllData();
      dataAPI.saveData(defaultData);
    }
  }, []);

  // 监听显示云同步设置的事件
  useEffect(() => {
    const handleShowCloudSetup = () => {
      setShowSetup(true);
    };

    window.addEventListener('show-cloud-setup', handleShowCloudSetup);
    return () => {
      window.removeEventListener('show-cloud-setup', handleShowCloudSetup);
    };
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
    <>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-2">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">生活管理系统</h1>
            <SyncStatus />
          </div>
        </header>
        
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

      {showSetup && (
        <CloudSyncSetup
          isOpen={showSetup}
          onClose={() => setShowSetup(false)}
        />
      )}
    </>
  );
}

export default App;