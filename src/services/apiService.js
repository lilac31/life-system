import { useState, useEffect } from 'react';

// 本地存储键名
const STORAGE_KEYS = {
  SCHEDULE_DATA: 'schedule_data',
  USER_ID: 'user_id',
  SYNC_STATUS: 'sync_status',
  LAST_SYNC: 'last_sync'
};

// 数据同步服务 - 使用GitHub Gist作为免费云存储
class DataSyncService {
  constructor() {
    this.userId = this.getUserId();
    this.gistId = null;
    this._tokenPrompted = false; // 防止重复弹窗
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
    console.log('🔍 getApiKey 被调用');
    
    // 尝试从localStorage获取
    const savedKey = localStorage.getItem('github_token');
    console.log('📦 localStorage.getItem("github_token"):', savedKey ? '✅ 存在 (长度: ' + savedKey.length + ')' : '❌ 不存在');
    
    if (savedKey) {
      console.log('✅ 返回保存的 Token');
      return savedKey;
    }
    
    // 尝试从环境变量获取
    const envToken = import.meta.env.VITE_GITHUB_TOKEN;
    console.log('🌍 环境变量 Token:', envToken ? '✅ 存在' : '❌ 不存在');
    
    if (envToken) {
      console.log('✅ 返回环境变量 Token');
      return envToken;
    }
    
    // 如果都没有，弹出提示让用户输入
    console.error('❌ 没有找到任何 Token！');
    
    // 使用 prompt 让用户输入
    if (typeof window !== 'undefined' && !this._tokenPrompted) {
      this._tokenPrompted = true;
      const userToken = prompt('请输入你的 GitHub Personal Access Token\n\n获取方式：\n1. 访问 https://github.com/settings/tokens\n2. 创建新 Token，勾选 gist 权限\n3. 复制 Token 粘贴到这里');
      
      if (userToken && userToken.trim()) {
        localStorage.setItem('github_token', userToken.trim());
        localStorage.setItem('sync_provider', 'gist');
        console.log('✅ Token 已保存！刷新页面...');
        setTimeout(() => location.reload(), 500);
        return userToken.trim();
      }
    }
    
    throw new Error('No GitHub token configured');
  }

  // 上传数据到GitHub Gist
  async uploadToCloud(data) {
    try {
      const token = this.getApiKey();
      console.log('开始上传数据到GitHub Gist，gistId:', this.gistId);
      
      const gistData = {
        description: 'Life System Schedule Data',
        public: false,
        files: {
          'schedule-data.json': {
            content: JSON.stringify({
              data,
              userId: this.userId,
              lastUpdated: new Date().toISOString()
            })
          }
        }
      };

      const headers = {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json'
      };

      let response;
      
      if (this.gistId) {
        // 更新现有gist
        response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(gistData)
        });
      } else {
        // 创建新gist
        response = await fetch('https://api.github.com/gists', {
          method: 'POST',
          headers,
          body: JSON.stringify(gistData)
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('上传请求失败:', response.status, errorText);
        throw new Error(`Failed to upload data to cloud: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('上传响应:', result);
      
      if (!this.gistId) {
        this.gistId = result.id;
        localStorage.setItem('gist_id', result.id);
        console.log('保存新的Gist ID:', result.id);
      }

      this.setSyncStatus('success');
      return result;
    } catch (error) {
      console.error('Cloud upload failed:', error);
      this.setSyncStatus('error');
      throw error;
    }
  }

  // 从GitHub Gist下载数据
  async downloadFromCloud() {
    try {
      const token = this.getApiKey();
      const gistId = localStorage.getItem('gist_id');
      console.log('尝试下载云端数据，gistId:', gistId);
      
      if (!gistId) {
        console.log('没有找到Gist ID，可能是首次使用');
        throw new Error('No cloud data found');
      }

      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: {
          'Authorization': `token ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('下载请求失败:', response.status, errorText);
        throw new Error(`Failed to download data from cloud: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('下载到的Gist数据:', result);
      
      // 获取文件内容
      const fileContent = result.files['schedule-data.json']?.content;
      if (!fileContent) {
        throw new Error('No data file found in gist');
      }
      
      const parsedData = JSON.parse(fileContent);
      
      // 确保数据来自同一用户
      if (parsedData.userId === this.userId) {
        this.setSyncStatus('success');
        return parsedData.data;
      } else {
        console.log('数据不属于当前用户:', parsedData.userId, 'vs', this.userId);
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