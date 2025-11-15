import { useState, useEffect } from 'react';

// API服务 - 处理与腾讯云服务器的通信
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-tencent-cloud-api.com/api';

// 通用请求函数
const apiRequest = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // 获取存储的token
    const token = localStorage.getItem('schedule_token');
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
    };
    
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
    });
    
    // 处理401未授权错误
    if (response.status === 401) {
      localStorage.removeItem('schedule_token');
      window.location.href = '/login';
      return;
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// 认证相关API
export const authAPI = {
  // 登录
  login: async (credentials) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    if (data.token) {
      localStorage.setItem('schedule_token', data.token);
    }
    
    return data;
  },
  
  // 注册
  register: async (userData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },
  
  // 登出
  logout: () => {
    localStorage.removeItem('schedule_token');
  },
  
  // 检查认证状态
  checkAuth: async () => {
    try {
      return await apiRequest('/auth/me');
    } catch (error) {
      localStorage.removeItem('schedule_token');
      throw error;
    }
  }
};

// 日程数据相关API
export const scheduleAPI = {
  // 获取所有日程数据
  getAllData: async () => {
    return apiRequest('/schedule');
  },
  
  // 保存所有日程数据
  saveAllData: async (data) => {
    return apiRequest('/schedule', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  // 更新特定日期的任务
  updateDayTasks: async (date, tasks) => {
    return apiRequest(`/schedule/day/${date}`, {
      method: 'PUT',
      body: JSON.stringify({ tasks })
    });
  },
  
  // 更新重要任务
  updateImportantTasks: async (tasks) => {
    return apiRequest('/schedule/important', {
      method: 'PUT',
      body: JSON.stringify({ tasks })
    });
  },
  
  // 更新快速任务
  updateQuickTasks: async (weekKey, quickTasks) => {
    return apiRequest(`/schedule/quick/${weekKey}`, {
      method: 'PUT',
      body: JSON.stringify({ quickTasks })
    });
  },
  
  // 更新时间记录
  updateTimeRecords: async (timeRecords) => {
    return apiRequest('/schedule/time-records', {
      method: 'PUT',
      body: JSON.stringify({ timeRecords })
    });
  }
};

// 用户设置相关API
export const settingsAPI = {
  // 获取用户设置
  getSettings: async () => {
    return apiRequest('/settings');
  },
  
  // 保存用户设置
  saveSettings: async (settings) => {
    return apiRequest('/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
  }
};

// 自定义Hook用于API请求状态管理
export const useApi = (apiFunc, params = [], immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  
  const execute = async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunc(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'Something went wrong');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (immediate) {
      execute(...params);
    }
  }, params);
  
  return { data, loading, error, execute };
};

export default {
  authAPI,
  scheduleAPI,
  settingsAPI,
  useApi
};