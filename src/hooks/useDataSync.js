import { useState, useEffect, useCallback, useRef } from 'react';
import { scheduleAPI } from '../services/apiService';

// 使用本地存储作为后备
const LOCAL_STORAGE_KEYS = {
  TASKS: 'schedule_tasks',
  WEEKLY_IMPORTANT_TASKS: 'schedule_weekly_important_tasks',
  QUICK_TASKS: 'schedule_quick_tasks',
  TIME_RECORDS: 'schedule_time_records',
  TOTAL_WORKING_HOURS: 'schedule_total_working_hours',
  LAST_SYNC: 'schedule_last_sync'
};

// 数据同步Hook
export const useDataSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(() => {
    const timestamp = localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_SYNC);
    return timestamp ? new Date(parseInt(timestamp)) : null;
  });
  const [syncError, setSyncError] = useState(null);
  
  const syncTimeoutRef = useRef(null);
  const pendingSyncRef = useRef(false);
  
  // 监听网络状态变化
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // 网络恢复时自动同步
      if (pendingSyncRef.current) {
        syncToServer();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // 从本地存储加载数据
  const loadFromLocalStorage = useCallback(() => {
    try {
      const tasks = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.TASKS) || '[]');
      const weeklyImportantTasks = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.WEEKLY_IMPORTANT_TASKS) || '{}');
      const quickTasks = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.QUICK_TASKS) || '{}');
      const timeRecords = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.TIME_RECORDS) || '{}');
      
      return {
        tasks,
        weeklyImportantTasks,
        quickTasks,
        timeRecords
      };
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
      return {
        tasks: [],
        weeklyImportantTasks: {},
        quickTasks: {},
        timeRecords: {}
      };
    }
  }, []);
  
  // 保存数据到本地存储
  const saveToLocalStorage = useCallback((data) => {
    try {
      if (data.tasks) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.TASKS, JSON.stringify(data.tasks));
      }
      if (data.weeklyImportantTasks) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.WEEKLY_IMPORTANT_TASKS, JSON.stringify(data.weeklyImportantTasks));
      }
      if (data.quickTasks) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.QUICK_TASKS, JSON.stringify(data.quickTasks));
      }
      if (data.timeRecords) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.TIME_RECORDS, JSON.stringify(data.timeRecords));
      }
      if (data.totalWorkingHours !== undefined) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.TOTAL_WORKING_HOURS, data.totalWorkingHours.toString());
      }
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
    }
  }, []);
  
  // 从服务器加载数据
  const loadFromServer = useCallback(async () => {
    if (!isOnline) {
      return loadFromLocalStorage();
    }
    
    try {
      setIsSyncing(true);
      setSyncError(null);
      
      const serverData = await scheduleAPI.getAllData();
      
      // 保存到本地存储作为备份
      saveToLocalStorage(serverData);
      
      // 更新同步时间
      const now = new Date();
      setLastSyncTime(now);
      localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_SYNC, now.getTime().toString());
      
      return serverData;
    } catch (error) {
      console.error('Failed to load data from server:', error);
      setSyncError(error.message);
      
      // 如果服务器不可用，回退到本地存储
      return loadFromLocalStorage();
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, loadFromLocalStorage, saveToLocalStorage]);
  
  // 同步数据到服务器
  const syncToServer = useCallback(async (data = null) => {
    if (!isOnline) {
      // 如果离线，标记待同步并保存到本地
      pendingSyncRef.current = true;
      if (data) {
        saveToLocalStorage(data);
      }
      return false;
    }
    
    try {
      setIsSyncing(true);
      setSyncError(null);
      
      // 如果没有提供数据，从本地存储获取
      if (!data) {
        data = loadFromLocalStorage();
      }
      
      await scheduleAPI.saveAllData(data);
      
      // 更新同步时间
      const now = new Date();
      setLastSyncTime(now);
      localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_SYNC, now.getTime().toString());
      
      pendingSyncRef.current = false;
      return true;
    } catch (error) {
      console.error('Failed to sync data to server:', error);
      setSyncError(error.message);
      pendingSyncRef.current = true;
      
      // 确保数据保存到本地
      if (data) {
        saveToLocalStorage(data);
      }
      
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, loadFromLocalStorage, saveToLocalStorage]);
  
  // 自动同步
  const scheduleAutoSync = useCallback(() => {
    // 清除之前的定时器
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    // 设置新的定时器，每5分钟同步一次
    syncTimeoutRef.current = setTimeout(() => {
      syncToServer();
      scheduleAutoSync(); // 递归调用，形成循环
    }, 5 * 60 * 1000); // 5分钟
  }, [syncToServer]);
  
  // 启动自动同步
  useEffect(() => {
    scheduleAutoSync();
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [scheduleAutoSync]);
  
  // 部分同步函数 - 用于特定类型的数据更新
  const syncTasks = useCallback(async (tasks) => {
    if (!isOnline) {
      pendingSyncRef.current = true;
      localStorage.setItem(LOCAL_STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      return false;
    }
    
    try {
      await scheduleAPI.saveAllData({ tasks });
      return true;
    } catch (error) {
      console.error('Failed to sync tasks:', error);
      setSyncError(error.message);
      pendingSyncRef.current = true;
      localStorage.setItem(LOCAL_STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      return false;
    }
  }, [isOnline]);
  
  // 立即同步
  const forceSync = useCallback(() => {
    return syncToServer();
  }, [syncToServer]);
  
  return {
    isOnline,
    isSyncing,
    lastSyncTime,
    syncError,
    loadFromServer,
    loadFromLocalStorage,
    saveToLocalStorage,
    syncToServer,
    syncTasks,
    forceSync
  };
};

export default useDataSync;