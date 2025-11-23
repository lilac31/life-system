import React, { useState, useEffect } from 'react';
import TestPage from './TestPage';
import WeekView from './components/WeekView';
import YearView from './components/YearView';
import ManagementView from './components/ManagementView';
import ThinkingTools from './components/ThinkingTools';
import LifeTimeline from './components/LifeTimeline';
import GrowthPlan from './components/GrowthPlan';
import AddTaskModal from './components/AddTaskModal';
import SyncStatus from './components/SyncStatus';
import SyncSettings from './components/SyncSettings';
import SyncDebugger from './components/SyncDebugger';
import DataImportExport from './components/DataImportExport';
import DataDebugger from './components/DataDebugger';
import { dataAPI, dataSyncService, useDataSync } from './services/apiService';
import { RefreshCw } from 'lucide-react';

function App() {
  const [tasks, setTasks] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('week');
  const [showSyncSettings, setShowSyncSettings] = useState(false);
  const [dataUpdateKey, setDataUpdateKey] = useState(0); // 用于触发子组件重新渲染
  const [showDebugger, setShowDebugger] = useState(false); // 默认隐藏调试器
  const [showImportExport, setShowImportExport] = useState(false); // 显示导入/导出
  const [isSyncingManually, setIsSyncingManually] = useState(false); // 手动同步状态
  
  // 获取同步状态
  const { isOnline, syncStatus, manualSync } = useDataSync();

  // 手动刷新同步
  const handleManualSync = async () => {
    if (!isOnline || syncStatus === 'syncing' || isSyncingManually) return;
    
    setIsSyncingManually(true);
    try {
      await manualSync();
      setDataUpdateKey(prev => prev + 1); // 触发界面刷新
    } catch (error) {
      console.error('手动同步失败:', error);
    } finally {
      setIsSyncingManually(false);
    }
  };

  // 监听键盘快捷键切换调试器
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + Shift + D 切换调试器
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDebugger(prev => !prev);
      }
      // Ctrl/Cmd + Shift + E 打开导入/导出
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        setShowImportExport(true);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // 监听云端数据更新事件
  useEffect(() => {
    const handleDataUpdate = () => {
      console.log('App收到数据更新事件');
      setDataUpdateKey(prev => prev + 1);
    };

    window.addEventListener('data-updated', handleDataUpdate);
    return () => window.removeEventListener('data-updated', handleDataUpdate);
  }, []);

  // 初始化数据
  useEffect(() => {
    // 检查是否已设置云同步
    const hasApiKey = localStorage.getItem('jsonbin_api_key');
    const hasSkippedSync = localStorage.getItem('cloud_sync_enabled') === 'false';
    
    // 如果没有API密钥且没有跳过设置，显示设置界面
    if (!hasApiKey && !hasSkippedSync) {
      console.log('未设置 JSONBin API密钥，显示设置界面');
      // setShowSyncSettings(true);
    } else if (hasApiKey) {
      console.log('已设置 JSONBin API密钥，获取用户信息并尝试自动同步');
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
      // setShowSyncSettings(true);
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
        return <TestPage key={dataUpdateKey} />;
      case 'week':
        return (
          <WeekView
            key={dataUpdateKey}
            tasks={tasks}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            currentView={currentView}
            onViewChange={setCurrentView}
            onShowSyncSettings={() => setShowSyncSettings(true)}
            onManualSync={handleManualSync}
            isSyncingManually={isSyncingManually}
          />
        );
      case 'year':
        return <YearView key={dataUpdateKey} currentView={currentView} onViewChange={setCurrentView} />;
      case 'management':
        return <ManagementView key={dataUpdateKey} currentView={currentView} onViewChange={setCurrentView} />;
      case 'thinking':
        return <ThinkingTools key={dataUpdateKey} onBack={() => setCurrentView('week')} />;
      case 'life':
        return <LifeTimeline key={dataUpdateKey} onBack={() => setCurrentView('week')} />;
      case 'growth':
        return <GrowthPlan key={dataUpdateKey} />;
      default:
        return (
          <WeekView
            key={dataUpdateKey}
            tasks={tasks}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            currentView={currentView}
            onViewChange={setCurrentView}
            onShowSyncSettings={() => setShowSyncSettings(true)}
            onManualSync={handleManualSync}
            isSyncingManually={isSyncingManually}
          />
        );
    }
  };

  return (
    <>
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

      {showSyncSettings && (
        <SyncSettings onClose={() => setShowSyncSettings(false)} />
      )}

      {showDebugger && <SyncDebugger />}

      {showImportExport && (
        <DataImportExport onClose={() => setShowImportExport(false)} />
      )}

      {/* <DataDebugger /> */}
    </>
  );
}

export default App;