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
    this.userId = null;
    this.gistId = null;
    this.githubUsername = null;
  }

  // 获取或创建用户ID - 现在基于GitHub用户信息
  async getUserId() {
    // 如果已经有用户ID且是GitHub用户ID，直接返回
    if (this.userId && this.userId.startsWith('github_user_')) {
      return this.userId;
    }
    
    try {
      // 获取GitHub用户信息
      const token = this.getApiKey();
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        this.githubUsername = userData.login;
        // 使用GitHub用户ID作为唯一标识
        const userId = `github_user_${userData.id}`;
        localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
        localStorage.setItem('github_username', userData.login);
        console.log('获取GitHub用户ID:', userId, '用户名:', userData.login);
        this.userId = userId;
        return userId;
      }
    } catch (error) {
      console.error('获取GitHub用户信息失败:', error);
    }
    
    // 如果无法获取GitHub用户信息，生成一个随机ID
    let userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!userId) {
      userId = `temp_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
      console.log('创建临时用户ID:', userId);
    }
    this.userId = userId;
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
    // 尝试从localStorage获取GitHub token
    const savedKey = localStorage.getItem('github_token');
    if (savedKey) {
      return savedKey;
    }
    
    // 尝试从环境变量获取
    if (import.meta.env.VITE_GITHUB_TOKEN) {
      return import.meta.env.VITE_GITHUB_TOKEN;
    }
    
    throw new Error('No GitHub token configured');
  }

  // 上传数据到GitHub Gist
  async uploadToCloud(data) {
    try {
      // 确保已获取用户ID
      await this.getUserId();
      
      const token = this.getApiKey();
      console.log('开始上传数据到GitHub Gist，用户:', this.githubUsername);
      
      // 查找现有Gist
      await this.findUserGist();
      
      const gistData = {
        description: `Life System Schedule Data - ${this.githubUsername || 'User'}`,
        public: false,
        files: {
          'schedule-data.json': {
            content: JSON.stringify({
              data,
              userId: this.userId,
              githubUsername: this.githubUsername,
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
        console.log('更新现有Gist:', this.gistId);
        response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(gistData)
        });
      } else {
        // 创建新gist
        console.log('创建新Gist');
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
      
      // 无论创建还是更新，都保存最新的Gist ID
      this.gistId = result.id;
      localStorage.setItem('gist_id', result.id);
      console.log('保存Gist ID:', result.id);

      this.setSyncStatus('success');
      return result;
    } catch (error) {
      console.error('Cloud upload failed:', error);
      this.setSyncStatus('error');
      throw error;
    }
  }

  // 查找用户的Gist
  async findUserGist() {
    // 确保已获取用户ID
    await this.getUserId();
    
    const token = this.getApiKey();
    console.log('查找用户的Gist，用户:', this.githubUsername);
    
    // 首先检查本地是否已有gistId
    const localGistId = localStorage.getItem('gist_id');
    if (localGistId) {
      console.log('找到本地存储的Gist ID:', localGistId);
      try {
        // 验证本地存储的Gist是否有效
        const response = await fetch(`https://api.github.com/gists/${localGistId}`, {
          headers: {
            'Authorization': `token ${token}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          // 检查这个Gist是否属于当前用户
          if (result.description.includes(`Life System Schedule Data - ${this.githubUsername}`)) {
            console.log('本地Gist有效且属于当前用户');
            return result;
          }
        }
      } catch (error) {
        console.warn('验证本地Gist失败:', error);
      }
    }
    
    // 如果本地Gist无效，则查找用户的Gists
    try {
      console.log('查找用户的Gists列表...');
      const response = await fetch('https://api.github.com/gists', {
        headers: {
          'Authorization': `token ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user gists');
      }
      
      const gists = await response.json();
      console.log('获取到Gists列表:', gists.length, '个');
      
      // 查找属于当前用户的Gist
      const userGist = gists.find(gist => 
        gist.description && 
        gist.description.includes(`Life System Schedule Data - ${this.githubUsername}`)
      );
      
      if (userGist) {
        console.log('找到用户的Gist:', userGist.id);
        // 更新本地存储
        localStorage.setItem('gist_id', userGist.id);
        this.gistId = userGist.id;
        return userGist;
      }
      
      console.log('未找到用户的Gist，可能需要创建新的');
      return null;
    } catch (error) {
      console.error('查找用户Gist失败:', error);
      throw error;
    }
  }

  // 从GitHub Gist下载数据
  async downloadFromCloud() {
    try {
      // 确保已获取用户ID
      await this.getUserId();
      
      const token = this.getApiKey();
      console.log('尝试下载云端数据，用户:', this.githubUsername);
      
      // 查找用户的Gist
      const gist = await this.findUserGist();
      
      if (!gist) {
        console.log('未找到用户的Gist，可能是首次使用');
        throw new Error('No cloud data found');
      }
      
      // 获取文件内容
      const fileContent = gist.files['schedule-data.json']?.content;
      if (!fileContent) {
        throw new Error('No data file found in gist');
      }
      
      const parsedData = JSON.parse(fileContent);
      console.log('下载到的Gist数据:', parsedData);
      
      // 确保数据来自同一GitHub用户
      // 首先检查用户ID是否匹配
      if (parsedData.userId === this.userId) {
        this.setSyncStatus('success');
        return parsedData.data;
      } 
      // 如果用户ID不匹配，但都是GitHub用户，则检查用户名
      else if (this.githubUsername && parsedData.githubUsername === this.githubUsername) {
        console.log('用户ID不匹配但用户名匹配，更新用户ID');
        // 更新本地存储的用户ID为云端存储的用户ID
        this.userId = parsedData.userId;
        localStorage.setItem(STORAGE_KEYS.USER_ID, parsedData.userId);
        this.setSyncStatus('success');
        return parsedData.data;
      }
      // 如果都不匹配，则表示数据不属于当前用户
      else {
        console.log('数据不属于当前用户:', {
          local: { userId: this.userId, username: this.githubUsername },
          cloud: { userId: parsedData.userId, username: parsedData.githubUsername }
        });
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
      // 确保已获取用户ID
      await this.getUserId();
      
      console.log('开始同步数据...用户:', this.githubUsername);
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
  saveData: async (data) => {
    dataSyncService.saveLocalData(data);
    
    // 如果在线，尝试同步到云端
    if (navigator.onLine) {
      // 确保已获取用户ID
      try {
        await dataSyncService.getUserId();
        dataSyncService.uploadToCloud(data).catch(err => {
          console.warn('Background sync failed, will retry later');
        });
      } catch (error) {
        console.warn('无法获取用户信息，跳过同步:', error);
      }
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
  saveWeekData: async (weekKey, weekData) => {
    const data = dataSyncService.getLocalData();
    data.weeks[weekKey] = weekData;
    dataSyncService.saveLocalData(data);
    
    // 如果在线，尝试同步到云端
    if (navigator.onLine) {
      // 确保已获取用户ID
      try {
        await dataSyncService.getUserId();
        dataSyncService.uploadToCloud(data).catch(err => {
          console.warn('Background sync failed, will retry later');
        });
      } catch (error) {
        console.warn('无法获取用户信息，跳过同步:', error);
      }
    }
  },

  // 添加重要任务
  addImportantTask: async (task) => {
    const data = dataSyncService.getLocalData();
    if (!data.importantTasks) data.importantTasks = [];
    data.importantTasks.push(task);
    dataSyncService.saveLocalData(data);
    
    if (navigator.onLine) {
      // 确保已获取用户ID
      try {
        await dataSyncService.getUserId();
        dataSyncService.uploadToCloud(data).catch(err => {
          console.warn('Background sync failed, will retry later');
        });
      } catch (error) {
        console.warn('无法获取用户信息，跳过同步:', error);
      }
    }
  },

  // 更新重要任务
  updateImportantTask: async (taskId, updates) => {
    const data = dataSyncService.getLocalData();
    const taskIndex = data.importantTasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      data.importantTasks[taskIndex] = { ...data.importantTasks[taskIndex], ...updates };
      dataSyncService.saveLocalData(data);
      
      if (navigator.onLine) {
        // 确保已获取用户ID
        try {
          await dataSyncService.getUserId();
          dataSyncService.uploadToCloud(data).catch(err => {
            console.warn('Background sync failed, will retry later');
          });
        } catch (error) {
          console.warn('无法获取用户信息，跳过同步:', error);
        }
      }
    }
  },

  // 删除重要任务
  deleteImportantTask: async (taskId) => {
    const data = dataSyncService.getLocalData();
    data.importantTasks = data.importantTasks.filter(t => t.id !== taskId);
    dataSyncService.saveLocalData(data);
    
    if (navigator.onLine) {
      // 确保已获取用户ID
      try {
        await dataSyncService.getUserId();
        dataSyncService.uploadToCloud(data).catch(err => {
          console.warn('Background sync failed, will retry later');
        });
      } catch (error) {
        console.warn('无法获取用户信息，跳过同步:', error);
      }
    }
  }
};

export default {
  dataSyncService,
  useDataSync,
  dataAPI
};