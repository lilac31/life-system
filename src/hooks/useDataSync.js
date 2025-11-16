import { useState, useEffect, useCallback } from 'react';
import { dataAPI, useDataSync } from '../services/apiService';

export const useScheduleData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isOnline, syncStatus, manualSync, lastSync, dataVersion } = useDataSync();

  // 加载数据
  const loadData = useCallback(() => {
    try {
      const allData = dataAPI.getAllData();
      setData(allData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load schedule data:', error);
      setLoading(false);
    }
  }, []);

  // 监听云端数据更新事件
  useEffect(() => {
    const handleDataUpdate = (event) => {
      console.log('收到数据更新事件，重新加载数据');
      loadData();
    };

    window.addEventListener('data-updated', handleDataUpdate);
    return () => window.removeEventListener('data-updated', handleDataUpdate);
  }, [loadData]);

  // 当dataVersion变化时，重新加载数据
  useEffect(() => {
    if (dataVersion > 0) {
      console.log('数据版本变化，重新加载数据');
      loadData();
    }
  }, [dataVersion, loadData]);

  // 保存数据并尝试同步到云端
  const saveData = useCallback((newData, skipSync = false) => {
    try {
      dataAPI.saveData(newData);
      setData(newData);
      
      // 如果在线且没有跳过同步，尝试自动同步到云端
      if (isOnline && !skipSync) {
        // 使用异步方式同步，不阻塞用户操作
        setTimeout(() => {
          manualSync().catch(error => {
            console.warn('自动同步失败:', error);
          });
        }, 1000); // 延迟1秒，避免频繁同步
      }
    } catch (error) {
      console.error('Failed to save schedule data:', error);
    }
  }, [isOnline, manualSync]);

  // 获取特定周的数据
  const getWeekData = useCallback((weekKey) => {
    if (!data) return null;
    return dataAPI.getWeekData(weekKey);
  }, [data]);

  // 保存特定周的数据
  const saveWeekData = useCallback((weekKey, weekData) => {
    const newData = { ...data };
    newData.weeks[weekKey] = weekData;
    saveData(newData);
  }, [data, saveData]);

  // 添加重要任务
  const addImportantTask = useCallback((task) => {
    dataAPI.addImportantTask(task);
    loadData(); // 重新加载数据
  }, [loadData]);

  // 更新重要任务
  const updateImportantTask = useCallback((taskId, updates) => {
    dataAPI.updateImportantTask(taskId, updates);
    loadData(); // 重新加载数据
  }, [loadData]);

  // 删除重要任务
  const deleteImportantTask = useCallback((taskId) => {
    dataAPI.deleteImportantTask(taskId);
    loadData(); // 重新加载数据
  }, [loadData]);

  // 创建一个立即同步数据的函数，用于批量更新时避免多次同步
  const saveDataWithImmediateSync = useCallback((newData) => {
    try {
      dataAPI.saveData(newData);
      setData(newData);
      
      // 如果在线，立即同步到云端
      if (isOnline) {
        manualSync().catch(error => {
          console.warn('立即同步失败:', error);
        });
      }
    } catch (error) {
      console.error('Failed to save schedule data:', error);
    }
  }, [isOnline, manualSync]);

  // 初始化加载数据
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 监听网络状态变化，重新同步
  useEffect(() => {
    let wasOffline = false;
    
    const handleOfflineEvent = () => {
      wasOffline = true;
    };
    
    const handleOnline = () => {
      // 只有在确实从离线恢复时才同步，避免页面刷新时触发
      if (wasOffline && isOnline && syncStatus !== 'success') {
        console.log('📡 网络恢复，开始同步数据');
        manualSync().then(() => {
          loadData(); // 同步完成后重新加载数据
        }).catch(err => {
          console.warn('网络恢复同步失败:', err);
        });
        wasOffline = false;
      }
    };

    window.addEventListener('offline', handleOfflineEvent);
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('offline', handleOfflineEvent);
      window.removeEventListener('online', handleOnline);
    };
  }, [isOnline, syncStatus, manualSync, loadData]);

  return {
    data,
    loading,
    isOnline,
    syncStatus,
    manualSync,
    lastSync,
    loadData,
    saveData,
    saveDataWithImmediateSync,
    getWeekData,
    saveWeekData,
    addImportantTask,
    updateImportantTask,
    deleteImportantTask
  };
};

export default useScheduleData;