import { useState, useEffect, useCallback } from 'react';
import { dataAPI, useDataSync } from '../services/apiService';

export const useScheduleData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isOnline, syncStatus, manualSync, lastSync } = useDataSync();

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

  // 保存数据
  const saveData = useCallback((newData) => {
    try {
      dataAPI.saveData(newData);
      setData(newData);
    } catch (error) {
      console.error('Failed to save schedule data:', error);
    }
  }, []);

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

  // 初始化加载数据
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 监听网络状态变化，重新同步
  useEffect(() => {
    const handleOnline = () => {
      if (isOnline && syncStatus !== 'success') {
        manualSync().then(() => {
          loadData(); // 同步完成后重新加载数据
        });
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
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
    getWeekData,
    saveWeekData,
    addImportantTask,
    updateImportantTask,
    deleteImportantTask
  };
};

export default useScheduleData;