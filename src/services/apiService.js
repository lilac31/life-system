import { useState, useEffect } from 'react';

// JSONBin.io API配置
let JSONBIN_API_KEY = ''; // 将从localStorage或环境变量获取
const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3';

// 本地存储键名
const STORAGE_KEYS = {
  SCHEDULE_DATA: 'schedule_data',
  USER_ID: 'user_id',
  SYNC_STATUS: 'sync_status',
  LAST_SYNC: 'last_sync'
};

// 数据同步服务
class DataSyncService {
  constructor() {
    this.userId = this.getUserId();
    this.binId = null;
  }

  // 获取或创建用户ID
  getUserId() {
    let userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!userId) {
      // 使用固定的用户ID，确保不同浏览器可以使用相同的ID
      userId = 'life_system_user_2025';
      localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
      console.log('创建新的用户ID:', userId);
    } else {
      console.log('使用现有用户ID:', userId);
    }
    return userId;
  }

  // 获取本地数据
  getLocalData() {
    const data = localStorage.getItem(STORAGE_KEYS.SCHEDULE_DATA);
    return data ? JSON.parse(data) : this.getDefaultData();
  }

  // 获取默认数据结构
  getDefaultData() {
    return {
      weeks: {},
      importantTasks: [],
      quickTasks: {},
      timeRecords: [],
      settings: {
        weekStart: 1, // 1表示周一，0表示周日
        timeTrackingEnabled: true,
        theme: 'light'
      }
    };
  }

  // 保存本地数据
  saveLocalData(data) {
    localStorage.setItem(STORAGE_KEYS.SCHEDULE_DATA, JSON.stringify(data));
    this.setSyncStatus('pending');
  }

  // 设置同步状态
  setSyncStatus(status) {
    localStorage.setItem(STORAGE_KEYS.SYNC_STATUS, status);
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  }

  // 获取同步状态
  getSyncStatus() {
    return {
      status: localStorage.getItem(STORAGE_KEYS.SYNC_STATUS) || 'pending',
      lastSync: localStorage.getItem(STORAGE_KEYS.LAST_SYNC)
    };
  }

  // 获取API密钥
  getApiKey() {
    if (JSONBIN_API_KEY) return JSONBIN_API_KEY;
    
    // 尝试从localStorage获取
    const savedKey = localStorage.getItem('jsonbin_api_key');
    if (savedKey) {
      JSONBIN_API_KEY = savedKey;
      return savedKey;
    }
    
    // 尝试从环境变量获取
    if (import.meta.env.VITE_JSONBIN_API_KEY) {
      JSONBIN_API_KEY = import.meta.env.VITE_JSONBIN_API_KEY;
      return JSONBIN_API_KEY;
    }
    
    throw new Error('No API key configured');
  }

  // 上传数据到JSONBin
  async uploadToCloud(data) {
    try {
      const apiKey = this.getApiKey();
      const headers = {
        'Content-Type': 'application/json',
        'X-Master-Key': apiKey,
        'X-Bin-Meta': '{"name":"life-system-data"}'
      };

      let response;
      
      if (this.binId) {
        // 更新现有bin
        response = await fetch(`${JSONBIN_BASE_URL}/b/${this.binId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            data,
            userId: this.userId,
            lastUpdated: new Date().toISOString()
          })
        });
      } else {
        // 创建新bin
        response = await fetch(`${JSONBIN_BASE_URL}/b`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            data,
            userId: this.userId,
            lastUpdated: new Date().toISOString()
          })
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to upload data to cloud: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      
      if (!this.binId) {
        this.binId = result.id;
        localStorage.setItem('bin_id', result.id);
      }

      this.setSyncStatus('success');
      return result;
    } catch (error) {
      console.error('Cloud upload failed:', error);
      this.setSyncStatus('error');
      throw error;
    }
  }

  // 从JSONBin下载数据
  async downloadFromCloud() {
    try {
      const apiKey = this.getApiKey();
      const binId = localStorage.getItem('bin_id');
      if (!binId) {
        throw new Error('No cloud data found');
      }

      const response = await fetch(`${JSONBIN_BASE_URL}/b/${binId}/latest`, {
        headers: {
          'X-Master-Key': apiKey,
          'X-Access-Key': apiKey // 添加访问密钥头
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to download data from cloud: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      
      // 确保数据来自同一用户
      if (result.record && result.record.userId === this.userId) {
        this.setSyncStatus('success');
        return result.record.data;
      } else {
        throw new Error('Data does not belong to current user');
      }
    } catch (error) {
      console.error('Cloud download failed:', error);
      this.setSyncStatus('error');
      throw error;
    }
  }

  // 合并本地和云端数据
  mergeData(localData, cloudData) {
    // 简单的合并策略：优先使用最新修改的数据
    // 这里可以根据需要实现更复杂的合并逻辑
    
    const merged = { ...localData };
    
    // 合并weeks数据
    Object.keys(cloudData.weeks || {}).forEach(weekKey => {
      if (!localData.weeks[weekKey]) {
        merged.weeks[weekKey] = cloudData.weeks[weekKey];
      } else {
        // 比较更新时间，选择更新的版本
        const localWeek = localData.weeks[weekKey];
        const cloudWeek = cloudData.weeks[weekKey];
        
        // 合并每日任务
        Object.keys(cloudWeek.days || {}).forEach(dayKey => {
          if (!localWeek.days[dayKey]) {
            localWeek.days[dayKey] = cloudWeek.days[dayKey];
          }
        });
      }
    });
    
    // 合并重要任务
    if (cloudData.importantTasks && cloudData.importantTasks.length > 0) {
      const localIds = localData.importantTasks.map(task => task.id);
      const newTasks = cloudData.importantTasks.filter(task => !localIds.includes(task.id));
      merged.importantTasks = [...localData.importantTasks, ...newTasks];
    }
    
    // 合并快速任务
    Object.keys(cloudData.quickTasks || {}).forEach(weekKey => {
      if (!localData.quickTasks[weekKey]) {
        merged.quickTasks[weekKey] = cloudData.quickTasks[weekKey];
      }
    });
    
    return merged;
  }

  // 同步数据
  async syncData() {
    try {
      console.log('开始同步数据...');
      const localData = this.getLocalData();
      console.log('本地数据:', localData);
      
      // 尝试从云端获取数据
      try {
        console.log('尝试从云端获取数据...');
        const cloudData = await this.downloadFromCloud();
        console.log('云端数据:', cloudData);
        const mergedData = this.mergeData(localData, cloudData);
        this.saveLocalData(mergedData);
        
        // 上传合并后的数据
        console.log('上传合并后的数据...');
        await this.uploadToCloud(mergedData);
        
        return { success: true, data: mergedData, source: 'merged' };
      } catch (error) {
        console.warn('云端数据获取失败，只上传本地数据:', error);
        
        // 如果云端数据获取失败，只上传本地数据
        console.log('只上传本地数据:', localData);
        await this.uploadToCloud(localData);
        return { success: true, data: localData, source: 'local' };
      }
    } catch (error) {
      console.error('同步完全失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 检查是否需要同步
  needsSync() {
    const { lastSync } = this.getSyncStatus();
    if (!lastSync) return true;
    
    const lastSyncTime = new Date(lastSync).getTime();
    const now = new Date().getTime();
    const oneMinute = 60 * 1000; // 1分钟，更频繁地检查同步
    
    return (now - lastSyncTime) > oneMinute;
  }
}

// 导出服务实例
export const dataSyncService = new DataSyncService();

// 自定义Hook用于数据同步
export const useDataSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('pending');
  const [lastSync, setLastSync] = useState(null);

  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 自动同步
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(async () => {
      if (dataSyncService.needsSync()) {
        setSyncStatus('syncing');
        try {
          await dataSyncService.syncData();
          setSyncStatus('success');
          setLastSync(new Date());
        } catch (error) {
          setSyncStatus('error');
        }
      }
    }, 60000); // 每分钟检查一次

    return () => clearInterval(interval);
  }, [isOnline]);

  // 手动同步
  const manualSync = async () => {
    if (!isOnline) {
      alert('请检查网络连接');
      return;
    }

    setSyncStatus('syncing');
    try {
      const result = await dataSyncService.syncData();
      setSyncStatus('success');
      setLastSync(new Date());
      return result;
    } catch (error) {
      setSyncStatus('error');
      throw error;
    }
  };

  return {
    isOnline,
    syncStatus,
    lastSync,
    manualSync,
    needsSync: dataSyncService.needsSync()
  };
};

// 数据操作API
export const dataAPI = {
  // 获取所有数据
  getAllData: () => {
    return dataSyncService.getLocalData();
  },

  // 保存数据
  saveData: (data) => {
    dataSyncService.saveLocalData(data);
    
    // 如果在线，尝试同步到云端
    if (navigator.onLine) {
      dataSyncService.uploadToCloud(data).catch(err => {
        console.warn('Background sync failed, will retry later');
      });
    }
  },

  // 获取特定周的数据
  getWeekData: (weekKey) => {
    const data = dataSyncService.getLocalData();
    return data.weeks[weekKey] || {
      days: {},
      weekNumber: parseInt(weekKey.split('-')[1]),
      year: parseInt(weekKey.split('-')[0])
    };
  },

  // 保存特定周的数据
  saveWeekData: (weekKey, weekData) => {
    const data = dataSyncService.getLocalData();
    data.weeks[weekKey] = weekData;
    dataSyncService.saveLocalData(data);
    
    // 如果在线，尝试同步到云端
    if (navigator.onLine) {
      dataSyncService.uploadToCloud(data).catch(err => {
        console.warn('Background sync failed, will retry later');
      });
    }
  },

  // 添加重要任务
  addImportantTask: (task) => {
    const data = dataSyncService.getLocalData();
    if (!data.importantTasks) data.importantTasks = [];
    data.importantTasks.push(task);
    dataSyncService.saveLocalData(data);
    
    if (navigator.onLine) {
      dataSyncService.uploadToCloud(data).catch(err => {
        console.warn('Background sync failed, will retry later');
      });
    }
  },

  // 更新重要任务
  updateImportantTask: (taskId, updates) => {
    const data = dataSyncService.getLocalData();
    const taskIndex = data.importantTasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      data.importantTasks[taskIndex] = { ...data.importantTasks[taskIndex], ...updates };
      dataSyncService.saveLocalData(data);
      
      if (navigator.onLine) {
        dataSyncService.uploadToCloud(data).catch(err => {
          console.warn('Background sync failed, will retry later');
        });
      }
    }
  },

  // 删除重要任务
  deleteImportantTask: (taskId) => {
    const data = dataSyncService.getLocalData();
    data.importantTasks = data.importantTasks.filter(t => t.id !== taskId);
    dataSyncService.saveLocalData(data);
    
    if (navigator.onLine) {
      dataSyncService.uploadToCloud(data).catch(err => {
        console.warn('Background sync failed, will retry later');
      });
    }
  }
};

export default {
  dataSyncService,
  useDataSync,
  dataAPI
};