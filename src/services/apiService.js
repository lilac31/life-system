import { useState, useEffect } from 'react';

// 本地存储键名
const STORAGE_KEYS = {
  SCHEDULE_DATA: 'schedule_data',
  USER_ID: 'user_id',
  SYNC_STATUS: 'sync_status',
  LAST_SYNC: 'last_sync',
  LAST_CLOUD_UPDATE: 'last_cloud_update'
};

// 数据同步服务 - 使用JSONBin.io作为免费云存储
class DataSyncService {
  constructor() {
    this.userId = null;
    this.binId = null;
    this.pollingInterval = null;
    this.isPolling = false;
    this.listeners = new Set();
    this.lastSyncTime = 0; // 上次同步时间
    this.syncDebounceTime = 5000; // 防抖时间：5秒
    this.isSyncing = false; // 是否正在同步
  }

  // 添加数据变更监听器
  addDataChangeListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // 通知所有监听器数据已变更
  notifyDataChange(data) {
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in data change listener:', error);
      }
    });
  }

  // 启动轮询检查云端数据更新
  startPolling(intervalMs = 30000) { // 默认30秒检查一次（降低API调用频率）
    if (this.isPolling) {
      console.log('轮询已在运行中');
      return;
    }

    console.log('启动云端数据轮询，间隔:', intervalMs, 'ms');
    this.isPolling = true;

    // 立即执行一次检查
    this.checkCloudUpdates();

    // 定期检查
    this.pollingInterval = setInterval(() => {
      this.checkCloudUpdates();
    }, intervalMs);
  }

  // 停止轮询
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isPolling = false;
      console.log('停止云端数据轮询');
    }
  }

  // 检查云端数据是否有更新 - 使用 /latest 端点避免版本冲突
  async checkCloudUpdates() {
    try {
      // 确保已配置 JSONBin API Key
      try {
        const apiKey = this.getApiKey();
        if (!apiKey) {
          console.log('⚠️ 未配置 JSONBin API Key，跳过云端检查');
          return;
        }
      } catch (error) {
        console.log('⚠️ 获取API密钥失败，跳过云端检查:', error.message);
        return;
      }

      // 确保已获取 Bin ID
      await this.getUserId();

      if (!this.binId) {
        console.log('📭 未找到云端 Bin，跳过检查');
        return;
      }

      // 直接使用 /latest 端点获取数据，避免使用 /meta 端点
      const apiKey = this.getApiKey();
      console.log('🔍 使用 /latest 端点检查云端更新...');
      
      const response = await fetch(`https://api.jsonbin.io/v3/b/${this.binId}/latest`, {
        headers: {
          'X-Master-Key': apiKey
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('📭 Bin 不存在，清除本地 Bin ID');
          this.binId = null;
          localStorage.removeItem('jsonbin_id');
        } else {
          console.warn('⚠️ 获取云端数据失败:', response.status);
        }
        return;
      }

      const result = await response.json();
      const cloudData = result.record;
      
      if (!cloudData || !cloudData._metadata) {
        console.log('⚠️ 云端数据格式异常，跳过检查');
        return;
      }

      const cloudUpdateTime = cloudData._metadata.lastUpdated;
      const localUpdateTime = localStorage.getItem(STORAGE_KEYS.LAST_CLOUD_UPDATE);

      console.log('🔍 检查云端更新 - 云端时间:', cloudUpdateTime, '本地时间:', localUpdateTime);

      // 如果云端数据更新时间晚于本地记录的时间，说明有新数据
      if (!localUpdateTime || new Date(cloudUpdateTime) > new Date(localUpdateTime)) {
        console.log('🆕 检测到云端数据更新，开始同步...');
        
        try {
          // 提取实际数据（去除 _metadata）
          const { _metadata, ...actualCloudData } = cloudData;
          const localData = dataAPI.getAllData();
          
          // 比较数据是否真的不同
          if (JSON.stringify(actualCloudData) !== JSON.stringify(localData)) {
            console.log('🔄 云端数据与本地不同，开始合并...');
            const mergedData = this.mergeData(localData, actualCloudData);
            
            // 保存合并后的数据（不触发上传，避免循环）
            const { saveData, ...otherAPIs } = dataAPI;
            Object.keys(mergedData).forEach(key => {
              if (key === 'weeklyImportantTasks') {
                localStorage.setItem('weeklyImportantTasks', JSON.stringify(mergedData[key]));
              } else if (key === 'quickTasks') {
                localStorage.setItem('quickTasks', JSON.stringify(mergedData[key]));
              } else if (key === 'taskTimeRecords') {
                localStorage.setItem('taskTimeRecords', JSON.stringify(mergedData[key]));
              } else if (key === 'totalWorkingHours') {
                localStorage.setItem('totalWorkingHours', mergedData[key].toString());
              } else if (key === 'yearGoals') {
                localStorage.setItem('yearGoals', JSON.stringify(mergedData[key]));
              }
            });
            
            // 保存基础数据
            const { weeklyImportantTasks, quickTasks, taskTimeRecords, totalWorkingHours, yearGoals, ...baseData } = mergedData;
            this.saveLocalData(baseData);
            
            localStorage.setItem(STORAGE_KEYS.LAST_CLOUD_UPDATE, cloudUpdateTime);
            
            // 通知监听器数据已更新
            this.notifyDataChange(mergedData);
            
            console.log('✅ 云端数据已同步到本地');
          } else {
            console.log('✅ 云端数据与本地相同，无需更新');
            localStorage.setItem(STORAGE_KEYS.LAST_CLOUD_UPDATE, cloudUpdateTime);
          }
        } catch (error) {
          console.error('❌ 同步云端数据失败:', error);
        }
      } else {
        console.log('✅ 云端数据未更新');
      }
    } catch (error) {
      console.error('❌ 检查云端更新失败:', error);
    }
  }

  // 基于 API Key 生成稳定的用户ID（SHA-256哈希）
  async generateUserIdFromApiKey(apiKey) {
    // 使用 Web Crypto API 生成 SHA-256 哈希
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // 取前16位作为用户ID（保持简短）
    return `user_${hashHex.substring(0, 16)}`;
  }

  // 获取或创建用户ID（自动基于 API Key 生成）
  async getUserId() {
    try {
      // 获取 API Key
      const apiKey = this.getApiKey();
      
      // 基于 API Key 生成稳定的用户ID
      const generatedUserId = await this.generateUserIdFromApiKey(apiKey);
      
      // 检查本地是否已有用户ID
      const savedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      
      if (savedUserId && savedUserId !== generatedUserId) {
        // 如果本地保存的用户ID与生成的不一致，说明可能更换了API Key
        console.warn('⚠️ 检测到API Key已更换，更新用户ID');
        localStorage.setItem(STORAGE_KEYS.USER_ID, generatedUserId);
        // 清除旧的 Bin ID，因为新的用户ID需要新的数据
        localStorage.removeItem('jsonbin_id');
        this.binId = null;
      } else if (!savedUserId) {
        // 首次使用，保存生成的用户ID
        console.log('✨ 首次使用，基于API Key生成用户ID');
        localStorage.setItem(STORAGE_KEYS.USER_ID, generatedUserId);
      }
      
      this.userId = generatedUserId;
      console.log('📱 当前用户ID:', generatedUserId);
      console.log('🔑 基于 API Key 自动生成，所有使用相同 API Key 的设备将拥有相同的用户ID');
      
      // 从本地存储获取 Bin ID
      const savedBinId = localStorage.getItem('jsonbin_id');
      if (savedBinId) {
        this.binId = savedBinId;
        console.log('📦 使用已保存的 Bin ID:', this.binId);
      } else {
        // 如果本地没有 Bin ID，尝试从云端查找
        console.log('🔍 本地无 Bin ID，尝试从云端查找...');
        try {
          const foundBinId = await this.findUserBin();
          if (foundBinId) {
            this.binId = foundBinId;
            localStorage.setItem('jsonbin_id', foundBinId);
            console.log('✅ 从云端找到 Bin ID:', foundBinId);
          } else {
            console.log('📭 云端未找到该用户的 Bin，将在首次保存时创建');
          }
        } catch (error) {
          console.warn('⚠️ 查找云端 Bin 失败:', error.message);
        }
      }
      
      return generatedUserId;
    } catch (error) {
      console.error('获取用户ID失败:', error);
      throw error;
    }
  }
  
  // 重新初始化服务（用户ID变更时调用）
  async reinitialize() {
    console.log('🔄 重新初始化同步服务...');
    
    // 清除当前状态
    this.userId = null;
    this.binId = null;
    
    // 重新获取用户ID
    await this.getUserId();
    
    // 尝试从云端下载该用户的数据
    try {
      const cloudData = await this.downloadFromCloud();
      // downloadFromCloud 已经验证了用户ID，如果到这里说明验证通过
      console.log('✅ 找到匹配的云端数据，开始同步');
      await dataAPI.saveData(cloudData);
      return true;
    } catch (error) {
      if (error.message.includes('User ID mismatch')) {
        console.error('❌ 云端数据属于其他用户！');
        throw new Error('云端数据的用户ID与当前用户ID不匹配，请确认用户ID是否正确');
      }
      console.log('📭 未找到云端数据，将在下次保存时上传');
      // 上传当前用户的数据
      try {
        const localData = dataAPI.getAllData();
        await this.uploadToCloud(localData);
        console.log('✅ 本地数据已上传到云端');
      } catch (uploadError) {
        console.warn('⚠️ 上传失败:', uploadError);
      }
    }
    
    return false;
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
    // 尝试从localStorage获取 JSONBin API Key
    const savedKey = localStorage.getItem('jsonbin_api_key');
    if (savedKey) {
      return savedKey;
    }
    
    // 尝试从环境变量获取
    if (import.meta.env.VITE_JSONBIN_API_KEY) {
      return import.meta.env.VITE_JSONBIN_API_KEY;
    }
    
    throw new Error('No JSONBin API Key configured');
  }

  // 清理无效的 Bin ID（当遇到 404 错误时调用）
  clearInvalidBinId() {
    console.warn('🗑️ 清理无效的 Bin ID:', this.binId);
    this.binId = null;
    localStorage.removeItem('jsonbin_id');
    console.log('✅ Bin ID 已清除，下次保存时将创建新 Bin');
  }

  // 生成固定的 Bin ID（基于用户ID）
  // 注意：这不是真实的 Bin ID，而是用于 Collection 查找的标识
  generateBinIdentifier() {
    // 将用户ID转换为固定标识
    // 由于 Bin ID 是由 JSONBin 服务器生成的，我们无法预先确定
    // 所以改用 Collection Key 机制
    return `life-system-${this.userId}`;
  }

  // 查找该用户的 Bin（改进版）
  async findUserBin() {
    try {
      const apiKey = this.getApiKey();
      
      console.log('');
      console.log('═══════════════════════════════════════');
      console.log('🔍 开始查找用户的云端 Bin');
      console.log('用户ID:', this.userId);
      console.log('═══════════════════════════════════════');
      
      // 获取所有 Bin 列表
      const response = await fetch('https://api.jsonbin.io/v3/b', {
        headers: {
          'X-Master-Key': apiKey
        }
      });
      
      if (!response.ok) {
        console.warn('⚠️ 获取 Bin 列表失败:', response.status);
        return null;
      }
      
      const result = await response.json();
      console.log('📡 API 原始返回:', result);
      
      // 处理不同的返回格式
      let bins = [];
      if (Array.isArray(result)) {
        bins = result;
      } else if (result.bins && Array.isArray(result.bins)) {
        bins = result.bins;
      } else if (result.record && Array.isArray(result.record)) {
        bins = result.record;
      }
      
      if (!bins || bins.length === 0) {
        console.log('📭 未找到任何 Bin，这可能是首次使用');
        console.log('═══════════════════════════════════════');
        return null;
      }
      
      console.log('📋 找到', bins.length, '个 Bin');
      console.log('开始逐个检查 Bin 的 _metadata.userId...');
      console.log('');
      
      // 遍历所有 Bin
      let checkedCount = 0;
      for (const bin of bins) {
        checkedCount++;
        try {
          // 兼容不同的 ID 字段名
          const binId = bin.id || bin.record || bin.binId;
          if (!binId) {
            console.log(`⏭️  Bin #${checkedCount}: 无效（没有ID）`);
            continue;
          }
          
          console.log(`🔍 检查 Bin #${checkedCount}/${bins.length}: ${binId}`);
          
          const binResponse = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
            headers: { 'X-Master-Key': apiKey }
          });
          
          if (!binResponse.ok) {
            console.log(`   ❌ 读取失败 (${binResponse.status})`);
            continue;
          }
          
          const binData = await binResponse.json();
          const metadata = binData.record?._metadata;
          const binUserId = metadata?.userId;
          
          console.log(`   📊 用户ID: ${binUserId || '(无)'}`);
          
          if (binUserId === this.userId) {
            console.log('');
            console.log('✅✅✅ 找到匹配的 Bin！✅✅✅');
            console.log('Bin ID:', binId);
            console.log('用户ID:', binUserId);
            console.log('═══════════════════════════════════════');
            return binId;
          }
        } catch (err) {
          console.log(`   ⚠️  检查出错:`, err.message);
          continue;
        }
      }
      
      console.log('');
      console.log('📭 未找到匹配的 Bin');
      console.log(`已检查 ${checkedCount} 个 Bin，均不匹配当前用户ID`);
      console.log('═══════════════════════════════════════');
      return null;
    } catch (error) {
      console.error('❌ 查找 Bin 失败:', error);
      return null;
    }
  }

  // 上传数据到 JSONBin.io（确保上传完整数据）- 使用 latest 端点避免版本冲突
  async uploadToCloud(data) {
    try {
      // 防抖检查：如果距离上次同步不到5秒，跳过
      const now = Date.now();
      if (now - this.lastSyncTime < this.syncDebounceTime) {
        console.log('⏭️  跳过同步（距离上次同步不到5秒）');
        return;
      }
      
      // 如果正在同步，跳过
      if (this.isSyncing) {
        console.log('⏭️  跳过同步（已有同步任务在进行中）');
        return;
      }
      
      this.isSyncing = true;
      this.lastSyncTime = now;
      
      // 确保已获取用户ID
      await this.getUserId();
      
      const apiKey = this.getApiKey();
      console.log('🚀 开始上传完整数据到 JSONBin.io');
      console.log('📦 上传的数据包含:', {
        weeklyImportantTasks: data.weeklyImportantTasks ? Object.keys(data.weeklyImportantTasks).length + '周' : '无',
        quickTasks: data.quickTasks ? Object.keys(data.quickTasks).length + '天' : '无',
        taskTimeRecords: data.taskTimeRecords ? Object.keys(data.taskTimeRecords || {}).length + '条' : '无',
        weeks: data.weeks ? Object.keys(data.weeks).length + '周' : '无',
        importantTasks: data.importantTasks ? data.importantTasks.length + '个' : '无'
      });
      
      // JSONBin 直接接收数据，不需要包装
      // 我们在数据中添加元数据字段
      const payload = {
        ...data,
        _metadata: {
          userId: this.userId,
          lastUpdated: new Date().toISOString(),
          version: '3.0',
          dataKeys: Object.keys(data)
        }
      };

      const headers = {
        'Content-Type': 'application/json',
        'X-Master-Key': apiKey,
        'X-Bin-Versioning': 'false' // 全局禁用版本控制
      };

      let response;
      let binId = this.binId;
      
      // 验证 Bin ID 格式
      if (binId && !/^[a-f0-9]{24}$/i.test(binId)) {
        console.warn('⚠️ Bin ID 格式无效:', binId, '- 将创建新 Bin');
        binId = null;
        this.binId = null;
        localStorage.removeItem('jsonbin_id');
      }
      
      if (binId) {
        // 更新已存在的 Bin - 使用正确的端点（不带 /latest）
        console.log('📝 更新 Bin:', binId);
        
        try {
          response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(payload)
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.warn('⚠️ 更新失败:', response.status, errorText);
            
            // 如果是 404，说明 Bin 不存在或无权限（用旧API Key创建的），创建新的
            if (response.status === 404) {
              console.log('📭 Bin 不存在或无权限（可能是用旧 API Key 创建的），创建新 Bin');
              console.log('🗑️ 清理无法访问的 Bin ID:', binId);
              binId = null;
              this.binId = null;
              localStorage.removeItem('jsonbin_id');
            } 
            // 如果是 400 或其他错误，也尝试创建新 Bin
            else if (response.status === 400) {
              console.warn('⚠️ Bin 数据问题，创建新 Bin');
              binId = null;
              this.binId = null;
              localStorage.removeItem('jsonbin_id');
            } else {
              throw new Error(`更新失败: ${response.status} ${errorText}`);
            }
          } else {
            console.log('✅ Bin 更新成功');
          }
        } catch (fetchError) {
          console.error('❌ 更新请求错误:', fetchError);
          // 网络错误或其他问题，尝试创建新 Bin
          console.log('🔄 将尝试创建新 Bin');
          binId = null;
          this.binId = null;
          localStorage.removeItem('jsonbin_id');
        }
      }
      
      // 如果没有 binId 或更新失败，先尝试查找已存在的 Bin
      if (!binId || !response || !response.ok) {
        console.log('🔍 尝试查找已存在的用户 Bin...');
        const foundBinId = await this.findUserBin();
        
        if (foundBinId) {
          console.log('✅ 找到已存在的 Bin，将使用:', foundBinId);
          this.binId = foundBinId;
          localStorage.setItem('jsonbin_id', foundBinId);
          
          // 尝试更新找到的 Bin
          try {
            response = await fetch(`https://api.jsonbin.io/v3/b/${foundBinId}`, {
              method: 'PUT',
              headers,
              body: JSON.stringify(payload)
            });
            
            if (response.ok) {
              console.log('✅ 成功更新已存在的 Bin');
              binId = foundBinId;
            } else {
              console.warn('⚠️ 更新已存在的 Bin 失败，将创建新 Bin');
              binId = null;
            }
          } catch (err) {
            console.warn('⚠️ 更新已存在的 Bin 出错，将创建新 Bin:', err);
            binId = null;
          }
        }
        
        // 如果仍然没有 binId，创建新 bin
        if (!binId) {
          console.log('✨ 创建新 Bin');
          // 使用用户ID作为 Bin 名称的一部分，方便识别
          headers['X-Bin-Name'] = `life-system-${this.userId}`;
          
          response = await fetch('https://api.jsonbin.io/v3/b', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
          });
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 请求失败:', response.status, errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          console.error('❌ 错误详情:', errorJson);
        } catch (e) {
          // 忽略 JSON 解析错误
        }
        
        throw new Error(`操作失败: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ 操作成功!');
      
      // JSONBin 返回的 Bin ID
      const newBinId = result.metadata?.parentId || result.metadata?.id;
      
      if (!newBinId) {
        console.error('❌ 无法从响应中获取 Bin ID，完整响应:', result);
        throw new Error('无法获取 Bin ID');
      }
      
      console.log('✅ Bin ID:', newBinId);
      
      // 保存 Bin ID 和更新时间
      this.binId = newBinId;
      localStorage.setItem('jsonbin_id', newBinId);
      
      // 重要：在控制台显示 Bin ID，方便用户在其他设备配置
      console.log('');
      console.log('═══════════════════════════════════════════════════════');
      console.log('🔑 重要：多设备同步配置');
      console.log('═══════════════════════════════════════════════════════');
      console.log('📱 如需在其他设备同步，请保存以下信息：');
      console.log('');
      console.log('   用户ID:', this.userId);
      console.log('   Bin ID:', newBinId);
      console.log('');
      console.log('💡 在其他设备上：');
      console.log('   1. 配置相同的 API Key');
      console.log('   2. 在浏览器控制台运行：');
      console.log(`   localStorage.setItem('jsonbin_id', '${newBinId}');`);
      console.log('   3. 刷新页面即可同步数据');
      console.log('═══════════════════════════════════════════════════════');
      console.log('');
      
      const updatedAt = result.metadata?.createdAt || 
                       result.metadata?.updatedAt || 
                       new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.LAST_CLOUD_UPDATE, updatedAt);

      this.setSyncStatus('success');
      this.isSyncing = false;
      return result;
    } catch (error) {
      console.error('❌ 云端上传失败:', error);
      this.setSyncStatus('error');
      this.isSyncing = false;
      throw error;
    }
  }

  // 验证 Bin 是否存在且可访问 - 使用 /latest 端点
  async verifyBin(binId) {
    try {
      const apiKey = this.getApiKey();
      const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
        method: 'HEAD', // 只获取响应头，不获取数据体，节省流量
        headers: {
          'X-Master-Key': apiKey
        }
      });
      
      return response.ok;
    } catch (error) {
      console.warn('验证 Bin 失败:', error);
      return false;
    }
  }

  // 从 JSONBin.io 下载数据 - 使用 latest 端点避免版本冲突
  async downloadFromCloud() {
    try {
      // 确保已获取用户ID
      await this.getUserId();
      
      if (!this.binId) {
        console.log('⚠️ 未找到 Bin ID，可能是首次使用');
        throw new Error('No cloud data found');
      }
      
      const apiKey = this.getApiKey();
      console.log('📥 使用 /latest 端点下载云端数据，Bin ID:', this.binId);
      
      // 使用 /latest 端点获取最新版本，避免版本冲突
      const response = await fetch(`https://api.jsonbin.io/v3/b/${this.binId}/latest`, {
        headers: {
          'X-Master-Key': apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 下载请求失败:', response.status, errorText);
        
        // 如果是 404，说明 Bin 不存在
        if (response.status === 404) {
          console.warn('📭 Bin 不存在，清除本地 Bin ID');
          this.binId = null;
          localStorage.removeItem('jsonbin_id');
          throw new Error('No cloud data found');
        }
        
        throw new Error(`下载失败: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ 使用 /latest 端点下载成功');
      
      // JSONBin 将数据存储在 record 字段中
      const parsedData = result.record;
      
      if (!parsedData) {
        throw new Error('响应中没有数据');
      }
      
      // 提取我们的元数据和实际数据
      const { _metadata, ...actualData } = parsedData;
      
      console.log('📊 元数据:', _metadata);
      
      // 检查用户ID是否匹配
      if (_metadata && _metadata.userId && _metadata.userId !== this.userId) {
        console.warn('⚠️ 警告：云端数据的用户ID与当前用户ID不匹配！');
        console.warn('云端用户ID:', _metadata.userId);
        console.warn('当前用户ID:', this.userId);
        throw new Error('User ID mismatch - cloud data belongs to different user');
      }
      
      console.log('✅ 用户ID验证通过');
      
      if (_metadata) {
        console.log('✅ 找到元数据，版本:', _metadata.version);
        console.log('📋 数据包含的键:', _metadata.dataKeys);
        console.log('👤 用户ID:', _metadata.userId);
        
        // 确保数据来自同一用户（可选检查）
        if (_metadata.userId && _metadata.userId !== this.userId) {
          console.warn('⚠️ 数据来自不同用户 - 本地:', this.userId, '云端:', _metadata.userId);
          // 不抛出错误，允许使用云端数据
        }
        
        // 更新最后云端更新时间
        if (_metadata.lastUpdated) {
          localStorage.setItem(STORAGE_KEYS.LAST_CLOUD_UPDATE, _metadata.lastUpdated);
        }
      }
      
      this.setSyncStatus('success');
      
      // 返回实际数据（不包含 _metadata）
      return actualData;
    } catch (error) {
      console.error('❌ 云端下载失败:', error);
      this.setSyncStatus('error');
      throw error;
    }
  }

  // 合并本地和云端数据（智能合并所有字段）
  mergeData(localData, cloudData) {
    console.log('🔄 开始智能合并数据');
    console.log('📦 本地数据键:', Object.keys(localData || {}));
    console.log('☁️ 云端数据键:', Object.keys(cloudData || {}));
    
    // 如果云端数据为空或无效，返回本地数据
    if (!cloudData || typeof cloudData !== 'object') {
      console.log('⚠️ 云端数据无效，使用本地数据');
      return localData;
    }
    
    // 如果本地数据为空，返回云端数据
    if (!localData || typeof localData !== 'object') {
      console.log('⚠️ 本地数据无效，使用云端数据');
      return cloudData;
    }
    
    const merged = { ...localData };
    
    // 1. 合并 weeklyImportantTasks（周重要任务）
    if (cloudData.weeklyImportantTasks && typeof cloudData.weeklyImportantTasks === 'object') {
      console.log('🔄 合并 weeklyImportantTasks');
      if (!merged.weeklyImportantTasks) merged.weeklyImportantTasks = {};
      
      Object.keys(cloudData.weeklyImportantTasks).forEach(weekKey => {
        // 云端数据优先（更新覆盖）
        merged.weeklyImportantTasks[weekKey] = cloudData.weeklyImportantTasks[weekKey];
      });
    }
    
    // 2. 合并 quickTasks（快速任务）
    if (cloudData.quickTasks && typeof cloudData.quickTasks === 'object') {
      console.log('🔄 合并 quickTasks');
      if (!merged.quickTasks) merged.quickTasks = {};
      
      Object.keys(cloudData.quickTasks).forEach(dayKey => {
        // 云端数据优先
        merged.quickTasks[dayKey] = cloudData.quickTasks[dayKey];
      });
    }
    
    // 3. 合并 taskTimeRecords（时间记录）
    if (cloudData.taskTimeRecords && Array.isArray(cloudData.taskTimeRecords)) {
      console.log('🔄 合并 taskTimeRecords');
      const recordMap = new Map();
      
      // 先添加本地记录
      if (localData.taskTimeRecords && Array.isArray(localData.taskTimeRecords)) {
        localData.taskTimeRecords.forEach(record => {
          recordMap.set(record.id || JSON.stringify(record), record);
        });
      }
      
      // 再添加云端记录（覆盖重复的）
      cloudData.taskTimeRecords.forEach(record => {
        recordMap.set(record.id || JSON.stringify(record), record);
      });
      
      merged.taskTimeRecords = Array.from(recordMap.values());
    }
    
    // 4. 合并 weeks 数据
    if (cloudData.weeks && typeof cloudData.weeks === 'object') {
      console.log('🔄 合并 weeks');
      if (!merged.weeks) merged.weeks = {};
      
      Object.keys(cloudData.weeks).forEach(weekKey => {
        const cloudWeek = cloudData.weeks[weekKey];
        const localWeek = localData.weeks?.[weekKey];
        
        if (!localWeek) {
          // 本地没有这周的数据，直接使用云端数据
          merged.weeks[weekKey] = cloudWeek;
        } else {
          // 合并每日任务
          const mergedWeek = { ...cloudWeek }; // 云端数据优先
          merged.weeks[weekKey] = mergedWeek;
        }
      });
    }
    
    // 5. 合并 importantTasks（重要任务列表）
    if (cloudData.importantTasks && Array.isArray(cloudData.importantTasks)) {
      console.log('🔄 合并 importantTasks');
      const taskMap = new Map();
      
      // 先添加本地任务
      if (localData.importantTasks && Array.isArray(localData.importantTasks)) {
        localData.importantTasks.forEach(task => {
          taskMap.set(task.id, task);
        });
      }
      
      // 再添加云端任务（会覆盖同ID的本地任务）
      cloudData.importantTasks.forEach(task => {
        taskMap.set(task.id, task);
      });
      
      merged.importantTasks = Array.from(taskMap.values());
    }
    
    // 6. 合并 timeRecords
    if (cloudData.timeRecords && Array.isArray(cloudData.timeRecords)) {
      console.log('🔄 合并 timeRecords');
      const recordMap = new Map();
      
      if (localData.timeRecords && Array.isArray(localData.timeRecords)) {
        localData.timeRecords.forEach(record => {
          recordMap.set(record.id, record);
        });
      }
      
      cloudData.timeRecords.forEach(record => {
        recordMap.set(record.id, record);
      });
      
      merged.timeRecords = Array.from(recordMap.values());
    }
    
    // 7. 合并其他字段（totalWorkingHours, yearGoals, settings等）
    const simpleFields = ['totalWorkingHours', 'settings'];
    simpleFields.forEach(field => {
      if (cloudData[field] !== undefined) {
        console.log(`🔄 合并 ${field}`);
        merged[field] = cloudData[field]; // 云端数据优先
      }
    });
    
    // 特殊处理 yearGoals，确保是数组
    if (cloudData.yearGoals !== undefined) {
      console.log('🔄 合并 yearGoals');
      merged.yearGoals = Array.isArray(cloudData.yearGoals) ? cloudData.yearGoals : [];
    }
    
    console.log('✅ 合并完成，最终数据键:', Object.keys(merged));
    return merged;
  }

  // 同步数据（使用完整数据）
  async syncData() {
    try {
      // 确保已获取用户ID
      await this.getUserId();
      
      console.log('🔄 开始同步数据...用户ID:', this.userId);
      
      // 获取完整的本地数据（包含所有分散存储的数据）
      const localData = dataAPI.getAllData();
      console.log('📦 本地完整数据:', localData);
      
      // 尝试从云端获取数据
      try {
        console.log('☁️ 尝试从云端获取数据...');
        const cloudData = await this.downloadFromCloud();
        console.log('☁️ 云端数据:', cloudData);
        
        const mergedData = this.mergeData(localData, cloudData);
        console.log('🔀 合并后的数据:', mergedData);
        
        // 保存合并后的数据（使用 dataAPI.saveData 确保所有字段都正确保存）
        await dataAPI.saveData(mergedData);
        
        // 上传合并后的数据到云端
        console.log('⬆️ 上传合并后的数据到云端...');
        await this.uploadToCloud(mergedData);
        
        console.log('✅ 同步成功！数据已合并并上传');
        return { success: true, data: mergedData, source: 'merged' };
      } catch (error) {
        console.warn('⚠️ 云端数据获取失败，只上传本地数据:', error.message);
        
        // 如果云端数据获取失败（首次使用或网络问题），只上传本地数据
        console.log('⬆️ 上传本地数据到云端...');
        await this.uploadToCloud(localData);
        
        console.log('✅ 本地数据已上传到云端');
        return { success: true, data: localData, source: 'local' };
      }
    } catch (error) {
      console.error('❌ 同步完全失败:', error);
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
  const [dataVersion, setDataVersion] = useState(0); // 用于触发重新渲染

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

  // 启动轮询和监听数据变更
  useEffect(() => {
    if (!isOnline) {
      dataSyncService.stopPolling();
      return;
    }

    // 检查是否配置了 JSONBin API Key
    const hasApiKey = localStorage.getItem('jsonbin_api_key');
    if (!hasApiKey) {
      console.log('未配置 JSONBin API Key，跳过轮询');
      return;
    }

    // 添加数据变更监听器
    const removeListener = dataSyncService.addDataChangeListener((newData) => {
      console.log('检测到数据变更，触发重新渲染');
      setDataVersion(prev => prev + 1);
      // 触发全局事件，让其他组件知道数据已更新
      window.dispatchEvent(new CustomEvent('data-updated', { detail: newData }));
    });

    // 启动轮询（30秒检查一次，降低API调用频率）
    dataSyncService.startPolling(30000);

    return () => {
      dataSyncService.stopPolling();
      removeListener();
    };
  }, [isOnline]);

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
    needsSync: dataSyncService.needsSync(),
    dataVersion // 返回数据版本，用于触发依赖此hook的组件重新渲染
  };
};

// 数据操作API
export const dataAPI = {
  // 获取所有数据（包含所有localStorage中的数据）
  getAllData: () => {
    const baseData = dataSyncService.getLocalData();
    
    // 从localStorage中获取所有分散存储的数据
    const weeklyImportantTasks = localStorage.getItem('weeklyImportantTasks');
    if (weeklyImportantTasks) {
      try {
        baseData.weeklyImportantTasks = JSON.parse(weeklyImportantTasks);
      } catch (error) {
        console.warn('Failed to parse weeklyImportantTasks:', error);
      }
    }
    
    const quickTasks = localStorage.getItem('quickTasks');
    if (quickTasks) {
      try {
        baseData.quickTasks = JSON.parse(quickTasks);
      } catch (error) {
        console.warn('Failed to parse quickTasks:', error);
      }
    }
    
    const taskTimeRecords = localStorage.getItem('taskTimeRecords');
    if (taskTimeRecords) {
      try {
        baseData.taskTimeRecords = JSON.parse(taskTimeRecords);
      } catch (error) {
        console.warn('Failed to parse taskTimeRecords:', error);
      }
    }
    
    const totalWorkingHours = localStorage.getItem('totalWorkingHours');
    if (totalWorkingHours) {
      try {
        baseData.totalWorkingHours = parseFloat(totalWorkingHours);
      } catch (error) {
        console.warn('Failed to parse totalWorkingHours:', error);
      }
    }
    
    const yearGoals = localStorage.getItem('yearGoals');
    if (yearGoals) {
      try {
        const parsed = JSON.parse(yearGoals);
        // 确保是数组格式
        baseData.yearGoals = Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.warn('Failed to parse yearGoals:', error);
        baseData.yearGoals = [];
      }
    }
    
    console.log('getAllData - 完整数据:', baseData);
    return baseData;
  },

  // 保存数据（处理所有分散存储的数据）
  saveData: async (data) => {
    console.log('saveData - 保存数据:', data);
    
    // 分离所有分散存储的数据
    const { 
      weeklyImportantTasks, 
      quickTasks, 
      taskTimeRecords, 
      totalWorkingHours,
      yearGoals,
      ...baseData 
    } = data;
    
    // 保存分散的数据到独立的localStorage键
    if (weeklyImportantTasks !== undefined) {
      localStorage.setItem('weeklyImportantTasks', JSON.stringify(weeklyImportantTasks));
      console.log('已保存 weeklyImportantTasks:', weeklyImportantTasks);
    }
    
    if (quickTasks !== undefined) {
      localStorage.setItem('quickTasks', JSON.stringify(quickTasks));
      console.log('已保存 quickTasks:', quickTasks);
    }
    
    if (taskTimeRecords !== undefined) {
      localStorage.setItem('taskTimeRecords', JSON.stringify(taskTimeRecords));
      console.log('已保存 taskTimeRecords:', taskTimeRecords);
    }
    
    if (totalWorkingHours !== undefined) {
      localStorage.setItem('totalWorkingHours', totalWorkingHours.toString());
      console.log('已保存 totalWorkingHours:', totalWorkingHours);
    }
    
    if (yearGoals !== undefined) {
      // 确保保存的是数组格式
      const goalsArray = Array.isArray(yearGoals) ? yearGoals : [];
      localStorage.setItem('yearGoals', JSON.stringify(goalsArray));
      console.log('已保存 yearGoals:', goalsArray);
    }
    
    // 保存其他数据到 schedule_data
    dataSyncService.saveLocalData(baseData);
    console.log('已保存 schedule_data:', baseData);
    
    // 如果在线，尝试同步到云端（包含所有数据）
    if (navigator.onLine) {
      // 检查是否配置了 API Key
      const hasApiKey = localStorage.getItem('jsonbin_api_key');
      if (!hasApiKey) {
        console.log('⚠️ 未配置 JSONBin API Key，跳过云端同步');
        return;
      }
      
      // 确保已获取用户ID
      try {
        await dataSyncService.getUserId();
        console.log('🚀 触发后台云端同步...');
        // 上传完整数据（包含所有分散的数据）
        dataSyncService.uploadToCloud(data).then(() => {
          console.log('✅ 后台同步成功');
        }).catch(err => {
          console.warn('⚠️ 后台同步失败，将在下次轮询时重试:', err.message);
        });
      } catch (error) {
        console.warn('⚠️ 无法获取用户信息，跳过同步:', error);
      }
    } else {
      console.log('📴 离线状态，数据已保存到本地');
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
    
    // 如果在线，尝试同步到云端（包含所有数据）
    if (navigator.onLine) {
      const hasApiKey = localStorage.getItem('jsonbin_api_key');
      if (!hasApiKey) {
        console.log('⚠️ 未配置 JSONBin API Key，跳过云端同步');
        return;
      }
      
      try {
        await dataSyncService.getUserId();
        // 获取完整数据（包含所有分散存储的数据）
        const fullData = dataAPI.getAllData();
        console.log('🔄 保存周数据，同步完整数据到云端');
        dataSyncService.uploadToCloud(fullData).catch(err => {
          console.warn('⚠️ 后台同步失败，将在下次轮询时重试:', err.message);
        });
      } catch (error) {
        console.warn('⚠️ 无法获取用户信息，跳过同步:', error);
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
      const hasApiKey = localStorage.getItem('jsonbin_api_key');
      if (!hasApiKey) {
        console.log('⚠️ 未配置 JSONBin API Key，跳过云端同步');
        return;
      }
      
      try {
        await dataSyncService.getUserId();
        // 获取完整数据
        const fullData = dataAPI.getAllData();
        console.log('🔄 添加重要任务，同步完整数据到云端');
        dataSyncService.uploadToCloud(fullData).catch(err => {
          console.warn('⚠️ 后台同步失败，将在下次轮询时重试:', err.message);
        });
      } catch (error) {
        console.warn('⚠️ 无法获取用户信息，跳过同步:', error);
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
        const hasApiKey = localStorage.getItem('jsonbin_api_key');
        if (!hasApiKey) {
          console.log('⚠️ 未配置 JSONBin API Key，跳过云端同步');
          return;
        }
        
        try {
          await dataSyncService.getUserId();
          // 获取完整数据
          const fullData = dataAPI.getAllData();
          console.log('🔄 更新重要任务，同步完整数据到云端');
          dataSyncService.uploadToCloud(fullData).catch(err => {
            console.warn('⚠️ 后台同步失败，将在下次轮询时重试:', err.message);
          });
        } catch (error) {
          console.warn('⚠️ 无法获取用户信息，跳过同步:', error);
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
      const hasApiKey = localStorage.getItem('jsonbin_api_key');
      if (!hasApiKey) {
        console.log('⚠️ 未配置 JSONBin API Key，跳过云端同步');
        return;
      }
      
      try {
        await dataSyncService.getUserId();
        // 获取完整数据
        const fullData = dataAPI.getAllData();
        console.log('🔄 删除重要任务，同步完整数据到云端');
        dataSyncService.uploadToCloud(fullData).catch(err => {
          console.warn('⚠️ 后台同步失败，将在下次轮询时重试:', err.message);
        });
      } catch (error) {
        console.warn('⚠️ 无法获取用户信息，跳过同步:', error);
      }
    }
  }
};

export default {
  dataSyncService,
  useDataSync,
  dataAPI
};