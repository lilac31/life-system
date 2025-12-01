import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp, ChevronDown, Star, Cloud, CloudOff, AlertCircle, Settings, RefreshCw, Lightbulb } from 'lucide-react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import TimeSelect from './TimeSelect';
import Navigation from './Navigation';
import TimeEditModal from './TimeEditModal';
import DataManager from './DataManager';
import YearTimeline from './YearTimeline';
import DataRecovery from './DataRecovery';
import { useScheduleData } from '../hooks/useDataSync';

const WeekView = ({ tasks, onAddTask, onUpdateTask, currentView, onViewChange, onShowSyncSettings, onManualSync, isSyncingManually }) => {
  const { data, saveData, saveDataWithImmediateSync, getWeekData, saveWeekData, isOnline, syncStatus, manualSync, lastSync } = useScheduleData();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const syncError = null; // 暂时设为null，后续可以从syncStatus中获取
  const [weeklyImportantTasks, setWeeklyImportantTasks] = useState({});
  const [quickTasks, setQuickTasks] = useState({});
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverCell, setDragOverCell] = useState(null);
  const [dragOverTask, setDragOverTask] = useState(null); // 跟踪悬停在哪个任务上
  const [timeTrackingPopup, setTimeTrackingPopup] = useState(null);
  const [taskTimeRecords, setTaskTimeRecords] = useState({});
  const [taskActionPopup, setTaskActionPopup] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [okrData, setOkrData] = useState(null); // OKR数据
  
  // 时间编辑和颜色高亮相关
  const [isTimeEditModalOpen, setIsTimeEditModalOpen] = useState(false);
  const [totalWorkingHours, setTotalWorkingHours] = useState(40); // 默认40小时
  const [highlightedColor, setHighlightedColor] = useState(null);
  const [showDataRecovery, setShowDataRecovery] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  
  // 获取当前周的关键词
  const getCurrentWeekKey = () => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // 周一开始
    return format(weekStart, 'yyyy-MM-dd');
  };
  
  // 获取当前周的重要任务
  const getCurrentWeekImportantTasks = () => {
    const weekKey = getCurrentWeekKey();
    // 如果没有当前周的重要任务，创建默认任务
    if (!weeklyImportantTasks[weekKey] || weeklyImportantTasks[weekKey].length === 0) {
      return [
        { id: 'important-1', text: '' },
        { id: 'important-2', text: '' },
        { id: 'important-3', text: '' }
      ];
    }
    return weeklyImportantTasks[weekKey];
  };
  
  // 保存总工时并同步
  const saveTotalWorkingHours = (hours) => {
    setTotalWorkingHours(hours);
    localStorage.setItem('totalWorkingHours', hours.toString());
    
    // 触发云端同步
    saveWithSync('totalWorkingHours', hours);
  };

  // 处理数据导入
  const handleDataImport = (importedData) => {
    // 更新组件状态
    if (importedData.weeklyImportantTasks) {
      setWeeklyImportantTasks(importedData.weeklyImportantTasks);
    }
    if (importedData.quickTasks) {
      setQuickTasks(importedData.quickTasks);
    }
    if (importedData.totalWorkingHours) {
      setTotalWorkingHours(importedData.totalWorkingHours);
    }
  };

  // 获取颜色背景
  const getColorBackground = (color, completed = false) => {
    const colorMap = {
      red: completed ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.2)',      // M
      orange: completed ? 'rgba(249, 115, 22, 0.1)' : 'rgba(249, 115, 22, 0.2)', // T
      pink: completed ? 'rgba(236, 72, 153, 0.1)' : 'rgba(236, 72, 153, 0.2)',   // I
      green: completed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.2)',    // S
      purple: completed ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.2)', // C
      blue: completed ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.2)',   // E
      yellow: completed ? 'rgba(234, 179, 8, 0.1)' : 'rgba(234, 179, 8, 0.2)',   // X
      indigo: completed ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.2)',  // B
      tencent: completed ? 'rgba(0, 102, 255, 0.1)' : 'rgba(0, 102, 255, 0.2)',   // F
      cyan: completed ? 'rgba(6, 182, 212, 0.1)' : 'rgba(6, 182, 212, 0.2)'      // R
    };
    return colorMap[color] || 'transparent';
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // 周一开始
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  const timeSlots = [
    { id: 'morning', name: '早上', time: '06:00-12:00', color: 'bg-yellow-50 border-yellow-200' },
    { id: 'noon', name: '中午', time: '12:00-14:00', color: 'bg-orange-50 border-orange-200' },
    { id: 'afternoon', name: '下午', time: '14:00-18:00', color: 'bg-blue-50 border-blue-200' },
    { id: 'evening', name: '晚上', time: '18:00-24:00', color: 'bg-purple-50 border-purple-200' }
  ];

  // 初始化数据
  useEffect(() => {
    // 从本地存储加载数据
    const savedWeeklyImportantTasks = localStorage.getItem('weeklyImportantTasks');
    if (savedWeeklyImportantTasks) {
      try {
        setWeeklyImportantTasks(JSON.parse(savedWeeklyImportantTasks));
      } catch (e) {
        console.error('Failed to parse weeklyImportantTasks:', e);
      }
    }
    
    const savedQuickTasks = localStorage.getItem('quickTasks');
    if (savedQuickTasks) {
      try {
        setQuickTasks(JSON.parse(savedQuickTasks));
      } catch (e) {
        console.error('Failed to parse quickTasks:', e);
      }
    }
    
    const savedTaskTimeRecords = localStorage.getItem('taskTimeRecords');
    if (savedTaskTimeRecords) {
      try {
        setTaskTimeRecords(JSON.parse(savedTaskTimeRecords));
      } catch (e) {
        console.error('Failed to parse taskTimeRecords:', e);
      }
    }
    
    const savedTotalHours = localStorage.getItem('totalWorkingHours');
    if (savedTotalHours) {
      setTotalWorkingHours(parseInt(savedTotalHours, 10));
    }
    
    // 加载OKR数据
    const savedOkr = localStorage.getItem('okrData');
    if (savedOkr) {
      try {
        setOkrData(JSON.parse(savedOkr));
      } catch (e) {
        console.error('Failed to parse okrData:', e);
      }
    }
    
    setIsInitialized(true);
  }, []);
  
  // 初始化快速任务数据结构（如果没有从服务器或本地存储加载到数据）
  useEffect(() => {
    if (!isInitialized) return;
    
    const initQuickTasks = {};
    const currentQuickTasks = { ...quickTasks };
    
    weekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      
      // 如果没有这天的数据，创建空的结构
      if (!currentQuickTasks[dayKey]) {
        currentQuickTasks[dayKey] = {};
      }
      
      // 确保每个时间段都有数据
      timeSlots.forEach(slot => {
        if (!currentQuickTasks[dayKey][slot.id] || currentQuickTasks[dayKey][slot.id].length === 0) {
          currentQuickTasks[dayKey][slot.id] = [{
            id: `${dayKey}-${slot.id}-${Date.now()}-0`,
            text: '',
            time: '',
            color: '',
            completed: false,
            estimatedTime: 0, // 默认预期0小时，需要手动添加
            actualTime: 0, // 实际完成时间
            delayed: false,
            okr: null // OKR关联：{ objectiveId, keyResultId }
          }];
        }
      });
    });
    
    // 如果有变化，更新状态
    if (JSON.stringify(currentQuickTasks) !== JSON.stringify(quickTasks)) {
      setQuickTasks(currentQuickTasks);
    }
  }, [currentWeek, isInitialized, quickTasks]);

  // 处理ESC键关闭弹窗
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setTaskActionPopup(null);
        setTimeTrackingPopup(null);
        setShowSettingsMenu(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // 点击外部关闭设置菜单
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showSettingsMenu && !e.target.closest('.settings-menu-container')) {
        setShowSettingsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettingsMenu]);

  // 使用ref来跟踪鼠标是否在相关区域内
  const mouseTrackingRef = useRef(false);
  const closeTimeoutRef = useRef(null);
  const syncTimeoutRef = useRef(null);

  // 保存数据并触发同步的辅助函数
  const saveWithSync = (key, value) => {
    // 直接保存到 localStorage（立即生效）
    // 处理不同类型的值
    if (typeof value === 'object') {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, value.toString());
    }
    
    // 触发延迟同步（避免频繁调用）
    if (navigator.onLine) {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        console.log('🔄 延迟同步触发，收集最新数据并上传...');
        
        // 从 localStorage 获取最新数据（确保数据是最新的）
        const weeklyImportantTasksData = JSON.parse(localStorage.getItem('weeklyImportantTasks') || '{}');
        const quickTasksData = JSON.parse(localStorage.getItem('quickTasks') || '{}');
        const taskTimeRecordsData = JSON.parse(localStorage.getItem('taskTimeRecords') || '{}');
        const totalWorkingHoursData = parseFloat(localStorage.getItem('totalWorkingHours') || '40');
        const yearGoalsData = JSON.parse(localStorage.getItem('yearGoals') || '[]');
        
        const currentData = {
          weeklyImportantTasks: weeklyImportantTasksData,
          quickTasks: quickTasksData,
          taskTimeRecords: taskTimeRecordsData,
          weeks: data?.weeks || {},
          importantTasks: data?.importantTasks || [],
          totalWorkingHours: totalWorkingHoursData,
          yearGoals: yearGoalsData
        };
        
        console.log('📦 收集到的完整数据:', currentData);
        console.log('📊 数据统计:', {
          weeklyImportantTasks: Object.keys(weeklyImportantTasksData).length + ' 周',
          quickTasks: Object.keys(quickTasksData).length + ' 天',
          taskTimeRecords: Object.keys(taskTimeRecordsData).length + ' 条',
          totalWorkingHours: totalWorkingHoursData + ' 小时',
          yearGoals: Object.keys(yearGoalsData).length + ' 个目标'
        });
        
        // 直接调用 saveData，它会上传完整数据
        saveData(currentData, false); // false 表示不跳过同步
      }, 2000); // 2秒后同步（用户停止编辑后）
    }
  };

  const updateImportantTask = (index, text) => {
    const weekKey = getCurrentWeekKey();
    const currentTasks = getCurrentWeekImportantTasks();
    const newImportantTasks = currentTasks.map((task, i) => 
      i === index ? { ...task, text } : task
    );
    
    // 创建更新后的完整对象
    const updatedWeeklyTasks = {
      ...weeklyImportantTasks,
      [weekKey]: newImportantTasks
    };
    
    // 更新组件状态
    setWeeklyImportantTasks(updatedWeeklyTasks);
    
    // 保存到本地存储并触发同步
    saveWithSync('weeklyImportantTasks', updatedWeeklyTasks);
    
    console.log('💾 保存重要任务:', weekKey, newImportantTasks);
  };

  const updateQuickTask = (dayKey, slotId, taskIndex, field, value) => {
    const newQuickTasks = {
      ...quickTasks,
      [dayKey]: {
        ...quickTasks[dayKey],
        [slotId]: quickTasks[dayKey][slotId].map((task, i) => 
          i === taskIndex ? { ...task, [field]: value } : task
        )
      }
    };
    
    // 检查是否需要添加新行：如果是最后一行且有内容（时间或文本）
    const currentSlotTasks = newQuickTasks[dayKey][slotId];
    const isLastTask = taskIndex === currentSlotTasks.length - 1;
    const updatedTask = currentSlotTasks[taskIndex];
    const hasContent = updatedTask.text || updatedTask.time;
    
    if (isLastTask && hasContent) {
      // 添加新的空行
      newQuickTasks[dayKey][slotId] = [...currentSlotTasks, {
        id: `${dayKey}-${slotId}-${Date.now()}`,
        text: '',
        time: '',
        color: '',
        completed: false,
        estimatedTime: 0,
        actualTime: 0,
        delayed: false,
        okr: null
      }];
    }
    
    // 更新组件状态
    setQuickTasks(newQuickTasks);
    
    // 保存到本地存储并触发同步
    saveWithSync('quickTasks', newQuickTasks);
    
    console.log('💾 保存快速任务:', dayKey, slotId);
  };

  const deleteQuickTask = (dayKey, slotId, taskIndex) => {
    const currentTasks = quickTasks[dayKey][slotId];
    const filteredTasks = currentTasks.filter((_, i) => i !== taskIndex);
    
    // 确保至少有一个空行
    if (filteredTasks.length === 0 || filteredTasks.every(task => task.text || task.time)) {
      filteredTasks.push({
        id: `${dayKey}-${slotId}-${Date.now()}`,
        text: '',
        time: '',
        color: '',
        completed: false,
        estimatedTime: 0,
        actualTime: 0,
        delayed: false,
        okr: null
      });
    }
    
    const newQuickTasks = {
      ...quickTasks,
      [dayKey]: {
        ...quickTasks[dayKey],
        [slotId]: filteredTasks
      }
    };
    
    setQuickTasks(newQuickTasks);
    
    // 保存到本地存储并触发同步
    saveWithSync('quickTasks', newQuickTasks);
  };

  const toggleTaskComplete = (dayKey, slotId, taskIndex, event) => {
    const task = quickTasks[dayKey][slotId][taskIndex];
    const wasCompleted = task.completed;
    
    // 更新任务完成状态
    const newQuickTasks = {
      ...quickTasks,
      [dayKey]: {
        ...quickTasks[dayKey],
        [slotId]: quickTasks[dayKey][slotId].map((task, i) => 
          i === taskIndex ? { ...task, completed: !task.completed } : task
        )
      }
    };
    
    setQuickTasks(newQuickTasks);
    
    // 保存到本地存储并触发同步
    saveWithSync('quickTasks', newQuickTasks);

    // 如果任务从未完成变为完成，显示时间记录弹窗
    if (!wasCompleted && event) {
      const rect = event.target.getBoundingClientRect();
      // 根据时间段决定弹窗位置：晚上时段在上方，其他在下方
      const yOffset = slotId === 'evening' ? -35 : 25;
      setTimeTrackingPopup({
        taskId: task.id,
        x: rect.left - 10,
        y: rect.top + yOffset,
        dayKey,
        slotId: slotId,
        taskIndex: taskIndex,
        taskColor: task.color || 'green'
      });
    }
  };

  // 拖拽功能
  const handleDragStart = (e, dayKey, slotId, taskIndex) => {
    const task = quickTasks[dayKey][slotId][taskIndex];
    if (!task.text && !task.time) return; // 不允许拖拽空任务
    
    setDraggedTask({
      task,
      sourceDayKey: dayKey,
      sourceSlotId: slotId,
      sourceTaskIndex: taskIndex
    });
    // 设置为 'move' 而不是 'copy'
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.dropEffect = 'move';
    e.dataTransfer.setData('text/plain', ''); // 兼容性
    
    // 添加拖拽时的视觉反馈
    e.target.style.opacity = '0.5';
    
    // 禁用文本选择
    document.body.style.userSelect = 'none';
  };

  const handleDragEnd = (e) => {
    // 恢复拖拽元素的透明度
    e.target.style.opacity = '1';
    
    // 恢复文本选择
    document.body.style.userSelect = '';
    
    // 清理拖拽状态
    setDraggedTask(null);
    setDragOverCell(null);
    setDragOverTask(null);
  };

  const handleDragOver = (e, dayKey, slotId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCell(`${dayKey}-${slotId}`);
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e, targetDayKey, targetSlotId, targetTaskIndex = null) => {
    e.preventDefault();
    setDragOverCell(null);
    setDragOverTask(null);
    
    if (!draggedTask) return;
    
    const { task, sourceDayKey, sourceSlotId, sourceTaskIndex } = draggedTask;
    
    // 如果拖拽到同一格子
    if (sourceDayKey === targetDayKey && sourceSlotId === targetSlotId) {
      // 如果是拖到同一位置，不做任何操作
      if (targetTaskIndex === null || sourceTaskIndex === targetTaskIndex) {
        setDraggedTask(null);
        return;
      }
      
      // 同一格内重新排序
      const tasks = [...quickTasks[sourceDayKey][sourceSlotId]];
      const [movedTask] = tasks.splice(sourceTaskIndex, 1);
      const newIndex = targetTaskIndex > sourceTaskIndex ? targetTaskIndex - 1 : targetTaskIndex;
      tasks.splice(newIndex, 0, movedTask);
      
      const newQuickTasks = {
        ...quickTasks,
        [sourceDayKey]: {
          ...quickTasks[sourceDayKey],
          [sourceSlotId]: tasks
        }
      };
      
      setQuickTasks(newQuickTasks);
      saveWithSync('quickTasks', newQuickTasks);
      setDraggedTask(null);
      return;
    }
    
    // 跨格子移动
    // 创建新的任务对象，保持原有属性但更新ID
    const newTask = {
      ...task,
      id: `${targetDayKey}-${targetSlotId}-${Date.now()}`,
      completed: task.completed, // 保持原有的完成状态
      estimatedTime: task.estimatedTime || 0
    };
    
    // 从源位置删除任务 - 先保存原始任务ID用于过滤
    const originalTaskId = task.id;
    const sourceTasks = quickTasks[sourceDayKey][sourceSlotId].filter((t, i) => i !== sourceTaskIndex);
    
    // 确保源位置至少有一个空行
    if (sourceTasks.length === 0 || sourceTasks.every(t => t.text || t.time)) {
      sourceTasks.push({
        id: `${sourceDayKey}-${sourceSlotId}-${Date.now()}-empty`,
        text: '',
        time: '',
        color: '',
        completed: false,
        estimatedTime: 0
      });
    }
    
    // 确保目标位置有数据结构，并过滤掉可能存在的重复任务
    const targetTasks = (quickTasks[targetDayKey]?.[targetSlotId] || []).filter(t => t.id !== originalTaskId);
    
    // 如果指定了目标任务索引，插入到该位置；否则插入到最后一个非空任务后
    let insertIndex;
    if (targetTaskIndex !== null) {
      insertIndex = targetTaskIndex;
    } else {
      const lastNonEmptyIndex = targetTasks.findLastIndex(t => t.text || t.time);
      insertIndex = lastNonEmptyIndex >= 0 ? lastNonEmptyIndex + 1 : 0;
    }
    
    const newTargetTasks = [...targetTasks];
    newTargetTasks.splice(insertIndex, 0, newTask);
    
    // 更新状态
    const newQuickTasks = {
      ...quickTasks,
      [sourceDayKey]: {
        ...quickTasks[sourceDayKey],
        [sourceSlotId]: sourceTasks
      },
      [targetDayKey]: {
        ...quickTasks[targetDayKey],
        [targetSlotId]: newTargetTasks
      }
    };
    
    setQuickTasks(newQuickTasks);
    
    // 保存到本地存储并触发同步
    saveWithSync('quickTasks', newQuickTasks);
    
    setDraggedTask(null);
  };

  const addQuickTaskLine = (dayKey, slotId) => {
    const newQuickTasks = {
      ...quickTasks,
      [dayKey]: {
        ...quickTasks[dayKey],
        [slotId]: [...quickTasks[dayKey][slotId], {
          id: `${dayKey}-${slotId}-${Date.now()}`,
          text: '',
          time: '',
          color: '',
          completed: false,
          estimatedTime: 0,
          actualTime: 0,
          delayed: false,
          okr: null
        }]
      }
    };
    
    setQuickTasks(newQuickTasks);
    
    // 保存到本地存储并触发同步
    saveWithSync('quickTasks', newQuickTasks);
  };

  const getTasksForDayAndSlot = (day, slotId) => {
    return tasks.filter(task => {
      if (!isSameDay(new Date(task.date), day)) return false;
      
      const taskTime = task.time;
      if (!taskTime) return false;
      
      const hour = parseInt(taskTime.split(':')[0]);
      
      switch (slotId) {
        case 'morning': return hour >= 6 && hour < 12;
        case 'noon': return hour >= 12 && hour < 14;
        case 'afternoon': return hour >= 14 && hour < 18;
        case 'evening': return hour >= 18 || hour < 6;
        default: return false;
      }
    });
  };


  
  // 时间记录相关函数
  const recordTaskTime = (taskId, timeSpent) => {
    const newTaskTimeRecords = {
      ...taskTimeRecords,
      [taskId]: (taskTimeRecords[taskId] || 0) + timeSpent
    };
    setTaskTimeRecords(newTaskTimeRecords);
    
    // 同时更新任务的 actualTime 字段（将分钟转为小时）
    if (timeTrackingPopup) {
      const { dayKey, slotId, taskIndex } = timeTrackingPopup;
      const task = quickTasks[dayKey]?.[slotId]?.[taskIndex];
      if (task) {
        const currentActualTime = task.actualTime || 0;
        const newActualTime = currentActualTime + (timeSpent / 60); // 转换为小时
        updateQuickTask(dayKey, slotId, taskIndex, 'actualTime', newActualTime);
      }
    }
    
    setTimeTrackingPopup(null);
    
    // 保存时间记录到本地存储并触发同步
    saveWithSync('taskTimeRecords', newTaskTimeRecords);
  };

  // 清空任务时间记录
  const clearTaskTime = (taskId) => {
    const newTaskTimeRecords = {
      ...taskTimeRecords
    };
    delete newTaskTimeRecords[taskId];
    setTaskTimeRecords(newTaskTimeRecords);
    
    // 同时清空任务的 actualTime 字段
    if (timeTrackingPopup) {
      const { dayKey, slotId, taskIndex } = timeTrackingPopup;
      const task = quickTasks[dayKey]?.[slotId]?.[taskIndex];
      if (task) {
        updateQuickTask(dayKey, slotId, taskIndex, 'actualTime', 0);
      }
    }
    
    setTimeTrackingPopup(null);
    
    // 保存时间记录到本地存储并触发同步
    saveWithSync('taskTimeRecords', newTaskTimeRecords);
  };

  // 复制任务
  const copyTask = (dayKey, slotId, taskIndex) => {
    const task = quickTasks[dayKey][slotId][taskIndex];
    const copiedTask = {
      ...task,
      id: `${dayKey}-${slotId}-${Date.now()}-copy`,
      completed: false,
      estimatedTime: task.estimatedTime || 0,
      actualTime: 0,
      delayed: false
    };
    
    const newQuickTasks = {
      ...quickTasks,
      [dayKey]: {
        ...quickTasks[dayKey],
        [slotId]: [...quickTasks[dayKey][slotId], copiedTask]
      }
    };
    
    setQuickTasks(newQuickTasks);
    
    // 保存到本地存储并触发同步
    saveWithSync('quickTasks', newQuickTasks);
    
    setTaskActionPopup(null);
  };

  // 切换任务的 delay 状态
  const toggleTaskDelay = (dayKey, slotId, taskIndex) => {
    const task = quickTasks[dayKey][slotId][taskIndex];
    
    const newQuickTasks = {
      ...quickTasks,
      [dayKey]: {
        ...quickTasks[dayKey],
        [slotId]: quickTasks[dayKey][slotId].map((t, i) => 
          i === taskIndex ? { ...t, delayed: !t.delayed } : t
        )
      }
    };
    
    setQuickTasks(newQuickTasks);
    
    // 保存到本地存储并触发同步
    saveWithSync('quickTasks', newQuickTasks);
    
    setTaskActionPopup(null);
  };

  // 获取颜色对应的CSS类名
  const getColorClasses = (color) => {
    const colorMap = {
      red: { bg: 'bg-red-500', border: 'border-red-500', hover: 'hover:bg-red-50', text: 'text-red-500' },
      orange: { bg: 'bg-orange-500', border: 'border-orange-500', hover: 'hover:bg-orange-50', text: 'text-orange-500' },
      pink: { bg: 'bg-pink-500', border: 'border-pink-500', hover: 'hover:bg-pink-50', text: 'text-pink-500' },
      green: { bg: 'bg-green-500', border: 'border-green-500', hover: 'hover:bg-green-50', text: 'text-green-500' },
      purple: { bg: 'bg-purple-500', border: 'border-purple-500', hover: 'hover:bg-purple-50', text: 'text-purple-500' },
      blue: { bg: 'bg-blue-500', border: 'border-blue-500', hover: 'hover:bg-blue-50', text: 'text-blue-500' },
      yellow: { bg: 'bg-yellow-500', border: 'border-yellow-500', hover: 'hover:bg-yellow-50', text: 'text-yellow-500' },
      indigo: { bg: 'bg-indigo-500', border: 'border-indigo-500', hover: 'hover:bg-indigo-50', text: 'text-indigo-500' },
      tencent: { bg: 'bg-[#0066FF]', border: 'border-[#0066FF]', hover: 'hover:bg-[#f0f7ff]', text: 'text-[#0066FF]' },
      cyan: { bg: 'bg-cyan-500', border: 'border-cyan-500', hover: 'hover:bg-cyan-50', text: 'text-cyan-500' }
    };
    // 处理undefined、null或空字符串的情况
    if (!color || typeof color !== 'string') {
      return colorMap.green;
    }
    return colorMap[color] || colorMap.green;
  };

  const getTaskTimeRecord = (taskId) => {
    return taskTimeRecords[taskId] || 0;
  };

  const formatTimeRecord = (minutes) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`;
  };

  // 获取OKR显示文本
  const getOkrDisplayText = (okr) => {
    if (!okr || !okrData) return null;
    
    // 待思考
    if (okr.objectiveId === 'pending' && okr.keyResultId === 'pending') {
      return '💭 待思考';
    }
    
    // 查找对应的O和KR
    const objective = okrData.objectives?.find(o => o.id === okr.objectiveId);
    if (!objective) return null;
    
    const kr = objective.keyResults?.find(k => k.id === okr.keyResultId);
    if (!kr) return null;
    
    return `${objective.name} - ${kr.description || '未命名'}`;
  };

  // 计算本周时间统计
  const getWeekTimeStatistics = () => {
    const plannedColorStats = {}; // 计划时间（所有任务，包括已完成和未完成）
    const actualColorStats = {};  // 实际时间（仅已完成任务）
    
    weekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      timeSlots.forEach(slot => {
        const dayTasks = quickTasks[dayKey]?.[slot.id] || [];
        dayTasks.forEach(task => {
          if (task.color && (task.text || task.time)) { // 有颜色且有内容的任务
            // 所有任务都计入计划时间（使用预期时间，默认1小时）
            const estimatedHours = task.estimatedTime > 0 ? task.estimatedTime : 1;
            plannedColorStats[task.color] = (plannedColorStats[task.color] || 0) + estimatedHours;
            
            // 已完成任务才计入实际时间
            if (task.completed) {
              const recordedTime = getTaskTimeRecord(task.id);
              const timeInHours = recordedTime > 0 ? recordedTime / 60 : 0.5;
              actualColorStats[task.color] = (actualColorStats[task.color] || 0) + timeInHours;
            }
          }
        });
      });
    });

    // 按照颜色顺序返回数据
    const colorOrder = ['red', 'orange', 'pink', 'green', 'purple', 'blue', 'yellow', 'indigo', 'tencent', 'cyan'];
    const orderedPlannedStats = {};
    const orderedActualStats = {};
    
    colorOrder.forEach(color => {
      if (plannedColorStats[color]) {
        orderedPlannedStats[color] = plannedColorStats[color];
      }
      if (actualColorStats[color]) {
        orderedActualStats[color] = actualColorStats[color];
      }
    });

    return { 
      plannedColorStats: orderedPlannedStats, 
      actualColorStats: orderedActualStats, 
      totalWorkingHours 
    };
  };

  // 根据时间生成圆球标记
  const renderTimeCircles = (minutes, color = 'green') => {
    if (minutes <= 0) return null;
    
    const colorClasses = getColorClasses(color);
    const circles = [];
    let remainingMinutes = minutes;
    
    // 计算完整小时数（完整圆圈）
    const fullHours = Math.floor(remainingMinutes / 60);
    remainingMinutes = remainingMinutes % 60;
    
    // 添加完整圆圈
    for (let i = 0; i < fullHours; i++) {
      circles.push(
        <div key={`full-${i}`} className={`w-1.5 h-1.5 ${colorClasses.bg} rounded-full`}></div>
      );
    }
    
    // 添加半圆圈（30分钟）
    if (remainingMinutes >= 30) {
      circles.push(
        <div key="half" className={`w-1.5 h-1.5 border ${colorClasses.border} rounded-full relative`}>
          <div className={`absolute inset-0 ${colorClasses.bg} rounded-full`} style={{clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)'}}></div>
        </div>
      );
    }
    
    const totalCircles = circles.length;
    
    // 根据圆圈数量决定布局
    if (totalCircles <= 2) {
      // 1-2个圆圈：垂直居中排列
      return (
        <div className="flex flex-col items-center justify-center space-y-0.5 px-1" title={`${minutes}分钟`}>
          {circles}
        </div>
      );
    } else {
      // 3-4个圆圈：2x2四宫格布局
      const topRow = circles.slice(0, 2);
      const bottomRow = circles.slice(2, 4);
      
      return (
        <div className="flex flex-col items-center justify-center space-y-0.5 px-1" title={`${minutes}分钟`}>
          <div className="flex space-x-0.5">
            {topRow}
          </div>
          {bottomRow.length > 0 && (
            <div className="flex space-x-0.5">
              {bottomRow}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div 
      className="space-y-3"
      onClick={() => {
        setTaskActionPopup(null);
        setHighlightedColor(null);
      }}
    >
      {/* 数据恢复界面 */}
      {showDataRecovery && (
        <DataRecovery 
          onRecover={(data) => {
            handleDataImport(data);
            setShowDataRecovery(false);
          }}
          onClose={() => setShowDataRecovery(false)}
        />
      )}
      {/* 应用头部 */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center space-x-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">人生系统设计</h1>
            <p className="text-gray-500 text-sm">
              {format(weekStart, 'yyyy年MM月dd日', { locale: zhCN })} - {format(addDays(weekStart, 6), 'MM月dd日', { locale: zhCN })}
            </p>
          </div>
          
          {/* 导航栏 - 周视图/年视图 */}
          <Navigation currentView={currentView} onViewChange={onViewChange} />
        </div>
        
        {/* 同步状态和设置按钮 - 标题右侧 */}
        <div className="flex items-center space-x-2 relative settings-menu-container">
          {/* 同步状态指示器 */}
          <div className="flex items-center space-x-2">
            {isOnline ? (
              isSyncing ? (
                <div className="flex items-center space-x-1 text-blue-500">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-blue-500">同步中</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-emerald-600">
                  <Cloud className="w-4 h-4" />
                  <span className="text-xs text-emerald-600">
                    {lastSync ? `已同步 ${format(lastSync, 'HH:mm')}` : '已同步'}
                  </span>
                </div>
              )
            ) : (
              <div className="flex items-center space-x-1 text-gray-400">
                <CloudOff className="w-4 h-4" />
                <span className="text-xs text-gray-400">离线</span>
              </div>
            )}
            {syncError && (
              <div className="flex items-center space-x-1 text-red-500" title={syncError}>
                <AlertCircle className="w-4 h-4" />
              </div>
            )}
          </div>
          
          {/* 手动刷新同步按钮 */}
          {isOnline && onManualSync && (
            <button
              onClick={onManualSync}
              disabled={syncStatus === 'syncing' || isSyncingManually}
              className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
                syncStatus === 'syncing' || isSyncingManually ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="手动刷新同步数据"
            >
              <RefreshCw 
                className={`w-5 h-5 ${
                  syncStatus === 'syncing' || isSyncingManually 
                    ? 'animate-spin text-blue-500' 
                    : 'text-gray-600'
                }`}
              />
            </button>
          )}
          
          {/* 设置按钮 */}
          <button
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="设置"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
          
          {/* 思考本按钮 */}
          <button
            onClick={() => onViewChange('thinking')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="思考本"
          >
            <Lightbulb className="w-5 h-5 text-amber-500" />
          </button>
          
          {/* 设置菜单 */}
          {showSettingsMenu && (
            <div className="absolute right-0 top-10 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-[200px]">
              <button
                onClick={() => {
                  setCurrentWeek(new Date());
                  setShowSettingsMenu(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">本周</span>
              </button>
              
              <button
                onClick={() => {
                  setIsTimeEditModalOpen(true);
                  setShowSettingsMenu(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">设置工作时间</span>
              </button>
              
              <div className="border-t border-gray-200 my-2"></div>
              
              <button
                onClick={() => {
                  if (onShowSyncSettings) {
                    onShowSyncSettings();
                  }
                  setShowSettingsMenu(false);
                  setTimeTrackingPopup(null); // 关闭时间记录弹窗
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2"
              >
                <Cloud className="w-4 h-4 text-gray-600" />
                <span className="text-sm">同步设置</span>
              </button>
              
              <button
                onClick={() => {
                  setShowDataRecovery(true);
                  setShowSettingsMenu(false);
                  setTimeTrackingPopup(null); // 关闭时间记录弹窗
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                <span className="text-sm">数据管理</span>
              </button>
              
              <div className="px-4 py-2">
                <DataManager onImport={handleDataImport} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 年度目标时间轴 */}
      <YearTimeline />

      {/* 本周最重要的三件事 - 单行显示 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          {getCurrentWeekImportantTasks().map((task, index) => (
            <div key={task.id} className="flex-1">
              <div className="flex bg-white rounded border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all overflow-hidden">
                {/* TOP标签区域 */}
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1.5 text-xs font-bold flex items-center justify-center min-w-10">
                  TOP{index + 1}
                </div>
                {/* 输入区域 */}
                <input
                  type="text"
                  value={task.text}
                  onChange={(e) => updateImportantTask(index, e.target.value)}
                  className="flex-1 px-2 py-1.5 text-sm bg-transparent border-none focus:outline-none text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 周日程表格 */}
      <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full">
        {/* 主表格区域 */}
        <div className="flex-1 min-w-0 w-full">
          {/* 表头 - 星期 */}
          <div className="grid border-b border-gray-200" style={{gridTemplateColumns: '100px repeat(7, 1fr)'}}>
            <div className="p-2 bg-gray-50 font-medium text-gray-900 text-lg border-r border-gray-200 flex items-center justify-center h-full">
              {format(currentWeek, 'MM')}月
            </div>
            {weekDays.map((day, index) => {
              const isToday = isSameDay(day, new Date());
              const isWeekend = index === 5 || index === 6; // 周六、周日
              return (
                <div
                  key={day.toString()}
                  className={`p-2 text-center font-medium border-l border-gray-200 ${
                    isToday ? 'bg-blue-50 text-blue-600' : 
                    isWeekend ? 'bg-gray-50 text-gray-500' : 'bg-white text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-1 text-sm">
                    <span className={`text-lg font-bold ${isToday ? 'text-blue-600' : ''}`}>
                      {format(day, 'dd')}
                    </span>
                    <span className="text-gray-400 text-xs">·</span>
                    <span className="text-gray-500 text-xs">
                      {['一', '二', '三', '四', '五', '六', '日'][index]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 时间段行 */}
          {timeSlots.map((slot) => (
            <div key={slot.id} className="grid border-b border-gray-200 min-h-24" style={{gridTemplateColumns: '100px repeat(7, 1fr)'}}>
              {/* 时间段标题 */}
              <div className={`p-2 ${slot.color} border-r border-gray-200 flex flex-col justify-center items-center`}>
                <div className="font-medium text-gray-700 text-sm">{slot.name}</div>
              </div>

              {/* 每天的时间段 */}
              {weekDays.map((day, dayIndex) => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const dayTasks = getTasksForDayAndSlot(day, slot.id);
                const quickTasksForSlot = quickTasks[dayKey]?.[slot.id] || [];
                const isWeekend = dayIndex === 5 || dayIndex === 6; // 周六、周日

                return (
                  <div
                    key={`${dayKey}-${slot.id}`}
                    className={`p-2 border-l border-gray-200 space-y-1 min-h-24 overflow-hidden relative ${
                      isWeekend ? 'bg-gray-50' : ''
                    } ${
                      dragOverCell === `${dayKey}-${slot.id}` ? 'bg-blue-50 border-blue-300 border-2 border-dashed' : ''
                    } ${
                      draggedTask ? 'transition-all duration-200' : ''
                    } ${
                      draggedTask && dragOverCell !== `${dayKey}-${slot.id}` ? 'hover:bg-blue-50 hover:border-blue-200 hover:border-dashed' : ''
                    }`}
                    onDragOver={(e) => handleDragOver(e, dayKey, slot.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dayKey, slot.id)}
                  >
                    {/* 显示现有任务 */}
                    {dayTasks.map((task) => (
                      <div
                        key={task.id}
                        className="text-xs p-2 bg-blue-50 text-blue-700 rounded border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                        onClick={() => onUpdateTask(task.id, task)}
                      >
                        <div className="font-medium break-words overflow-hidden text-ellipsis" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>{task.title}</div>
                        {task.time && (
                          <div className="text-blue-600 mt-0.5">{task.time}</div>
                        )}
                      </div>
                    ))}

                    {/* 快速输入行 */}
                    {quickTasksForSlot.map((quickTask, index) => {
                      const hasContent = quickTask.text || quickTask.time;
                      
                      return (
                        <div 
                          key={quickTask.id} 
                          className={`flex items-center mb-1 group rounded p-1 ${hasContent ? 'cursor-move hover:shadow-sm hover:bg-gray-50' : ''} ${
                            highlightedColor && quickTask.color === highlightedColor 
                              ? `ring-2 ring-opacity-50 ${getColorClasses(highlightedColor).text.replace('text-', 'ring-')}` 
                              : ''
                          } ${
                            draggedTask && draggedTask.task.id === quickTask.id ? 'opacity-50' : ''
                          } ${
                            dragOverTask && dragOverTask.dayKey === dayKey && dragOverTask.slotId === slot.id && dragOverTask.taskIndex === index ? 'border-t-2 border-blue-500' : ''
                          }`}
                          title={hasContent ? '点击左侧图标拖拽任务' : ''}
                          onDragOver={(e) => {
                            if (draggedTask) {
                              e.preventDefault();
                              e.stopPropagation();
                              // 只在有内容或者是拖到空行（用于插入到最后）时显示高亮
                              setDragOverTask({ dayKey, slotId: slot.id, taskIndex: index });
                            }
                          }}
                          onDragLeave={(e) => {
                            e.stopPropagation();
                            setDragOverTask(null);
                          }}
                          onDrop={(e) => {
                            e.stopPropagation();
                            handleDrop(e, dayKey, slot.id, index);
                          }}
                          onContextMenu={(e) => {
                            if (hasContent) {
                              e.preventDefault(); // 阻止默认右键菜单
                              setTaskActionPopup({
                                taskId: quickTask.id,
                                x: e.clientX,
                                y: e.clientY,
                                dayKey,
                                slotId: slot.id,
                                taskIndex: index,
                                taskData: quickTask,
                                isDelayed: quickTask.delayed || false
                              });
                            }
                          }}
                          style={{
                            backgroundColor: quickTask.time && quickTask.color ? 
                              getColorBackground(
                                quickTask.color, 
                                highlightedColor && quickTask.color === highlightedColor ? false : quickTask.completed
                              ) : 'transparent',
                            position: 'relative',
                            zIndex: 0,
                            transition: 'all 0.2s ease',
                            border: quickTask.delayed ? '2px solid #9CA3AF' : 'none',
                            paddingTop: quickTask.delayed ? '2px' : '4px',
                            paddingBottom: quickTask.delayed ? '2px' : '4px'
                          }}
                        >
                        {/* 时间标签组 - 左上角显示 */}
                        {hasContent && (quickTask.estimatedTime > 0 || quickTask.actualTime > 0) && (
                          <div className="absolute top-0 left-0 flex items-center gap-0.5" style={{ zIndex: 1 }}>
                            {/* 预期时间标签 - 有透明度 */}
                            {quickTask.estimatedTime > 0 && (
                              <div 
                                className={`text-[8px] font-bold px-0.5 py-0.5 rounded-br ${
                                  quickTask.color ? getColorClasses(quickTask.color).bg : 'bg-gray-500'
                                } text-white leading-none opacity-60`}
                                style={{ 
                                  lineHeight: '0.8',
                                  minWidth: '14px',
                                  textAlign: 'center',
                                  fontSize: '7px'
                                }}
                                title={`预期时长: ${quickTask.estimatedTime}小时`}
                              >
                                {quickTask.estimatedTime}h
                              </div>
                            )}
                            
                            {/* 箭头 */}
                            {quickTask.estimatedTime > 0 && quickTask.actualTime > 0 && (
                              <span className="text-[7px] text-gray-400">→</span>
                            )}
                            
                            {/* 完成时间标签 - 无透明度 */}
                            {quickTask.actualTime > 0 && (
                              <div 
                                className={`text-[8px] font-bold px-0.5 py-0.5 rounded ${
                                  quickTask.color ? getColorClasses(quickTask.color).bg : 'bg-gray-500'
                                } text-white leading-none`}
                                style={{ 
                                  lineHeight: '0.8',
                                  minWidth: '14px',
                                  textAlign: 'center',
                                  fontSize: '7px'
                                }}
                                title={`实际完成时长: ${quickTask.actualTime}小时`}
                              >
                                {quickTask.actualTime}h
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* 拖拽手柄 - 只在有内容时显示 */}
                        {hasContent && (
                          <div 
                            className="flex-shrink-0 mr-0.5 cursor-move hover:bg-gray-200 rounded px-0.5"
                            draggable={true}
                            onDragStart={(e) => {
                              e.stopPropagation();
                              handleDragStart(e, dayKey, slot.id, index);
                            }}
                            onDragEnd={(e) => {
                              e.stopPropagation();
                              handleDragEnd(e);
                            }}
                            style={{ userSelect: 'none' }}
                            title="按住拖拽"
                          >
                            <span className="text-gray-400 text-xs" style={{ userSelect: 'none', pointerEvents: 'none' }}>⋮⋮</span>
                          </div>
                        )}
                        
                        {/* Checkbox - 只在有内容时显示 */}
                        {hasContent && (
                          <div className="relative mr-1 flex-shrink-0" onDragStart={(e) => e.preventDefault()}>
                            <input
                              type="checkbox"
                              checked={quickTask.completed || false}
                              onChange={(e) => {
                                e.stopPropagation();
                                setTaskActionPopup(null); // 关闭任务操作弹窗
                                toggleTaskComplete(dayKey, slot.id, index, e);
                              }}
                              onDragStart={(e) => e.preventDefault()}
                              onClick={(e) => {
                                // 点击时，如果任务已完成，显示时间记录弹窗
                                if (quickTask.completed) {
                                  e.stopPropagation();
                                  // 清除任何待关闭的定时器
                                  if (closeTimeoutRef.current) {
                                    clearTimeout(closeTimeoutRef.current);
                                    closeTimeoutRef.current = null;
                                  }
                                  mouseTrackingRef.current = true;
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setTimeTrackingPopup({
                                    taskId: quickTask.id,
                                    x: rect.left,
                                    y: rect.bottom + 2, // checkbox正下方，间隔2px
                                    dayKey,
                                    slotId: slot.id,
                                    taskIndex: index,
                                    taskColor: quickTask.color || 'green'
                                  });
                                }
                              }}
                              onMouseEnter={(e) => {
                                // 只有在任务已完成时，悬停才显示时间记录弹窗
                                if (quickTask.completed) {
                                  // 清除任何待关闭的定时器
                                  if (closeTimeoutRef.current) {
                                    clearTimeout(closeTimeoutRef.current);
                                    closeTimeoutRef.current = null;
                                  }
                                  mouseTrackingRef.current = true;
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setTimeTrackingPopup({
                                    taskId: quickTask.id,
                                    x: rect.left,
                                    y: rect.bottom + 2, // checkbox正下方，间隔2px
                                    dayKey,
                                    slotId: slot.id,
                                    taskIndex: index,
                                    taskColor: quickTask.color || 'green'
                                  });
                                }
                              }}
                              onMouseLeave={() => {
                                mouseTrackingRef.current = false;
                                // 延迟关闭弹窗，给用户时间移动到弹窗上
                                closeTimeoutRef.current = setTimeout(() => {
                                  if (!mouseTrackingRef.current) {
                                    setTimeTrackingPopup(null);
                                  }
                                }, 1000); // 增加延迟时间到1000ms（1秒）
                              }}
                              className={`w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer z-10 ${
                                quickTask.completed ? 'opacity-80' : ''
                              }`}
                              title={quickTask.completed ? "点击或悬停记录用时" : "点击完成任务"}
                            />
                          </div>
                        )}
                          
                          {/* 时间选择器区域 */}
                          <div className="flex-shrink-0" style={{ position: 'relative', zIndex: 8500 }} onDragStart={(e) => e.preventDefault()}>
                            <TimeSelect
                              value={quickTask.time}
                              color={quickTask.color}
                              completed={quickTask.completed}
                              estimatedTime={quickTask.estimatedTime}
                              slotId={slot.id}
                              onChange={(time) => updateQuickTask(dayKey, slot.id, index, 'time', time)}
                              onColorChange={(color) => updateQuickTask(dayKey, slot.id, index, 'color', color)}
                              onEstimatedTimeChange={(hours) => updateQuickTask(dayKey, slot.id, index, 'estimatedTime', hours)}
                              okrValue={quickTask.okr}
                              onOkrChange={(okr) => updateQuickTask(dayKey, slot.id, index, 'okr', okr)}
                            />
                          </div>
                          

                          {/* 分隔线 - 只在没有选择时间时显示 */}
                          {!quickTask.time && (
                            <div className={`w-px h-4 ml-1 mr-2 flex-shrink-0 ${
                              quickTask.completed ? 'bg-gray-300' : 'bg-gray-200'
                            }`}></div>
                          )}
                          
                          {/* 内容输入区域 */}
                          <div className={`flex-1 flex items-start overflow-hidden ${quickTask.completed ? 'opacity-60' : ''}`} onDragStart={(e) => e.preventDefault()}>
                            <textarea
                              ref={(el) => {
                                // 页面加载时自动调整高度
                                if (el && quickTask.text) {
                                  el.style.height = 'auto';
                                  el.style.height = `${el.scrollHeight}px`;
                                }
                              }}
                              value={quickTask.text}
                              onChange={(e) => {
                                updateQuickTask(dayKey, slot.id, index, 'text', e.target.value);
                              }}
                              className={`flex-1 w-full text-xs p-1 border-none focus:outline-none bg-transparent resize-none overflow-hidden break-words ${
                                (highlightedColor && quickTask.color === highlightedColor) 
                                  ? 'text-gray-900' 
                                  : (quickTask.completed ? 'line-through text-gray-500' : 'text-gray-900')
                              }`}
                              onClick={(e) => e.stopPropagation()}
                              onDragStart={(e) => e.preventDefault()}
                              rows={1}
                              style={{ minHeight: '20px', maxHeight: '60px', boxSizing: 'border-box' }}
                              onInput={(e) => {
                                // 自动调整高度
                                e.target.style.height = 'auto';
                                e.target.style.height = `${e.target.scrollHeight}px`;
                              }}
                            />
                          </div>
                          
                          {/* OKR信息显示 - 绝对定位贴底，不占空间 */}
                          {quickTask.okr && getOkrDisplayText(quickTask.okr) && (
                            <div className="absolute right-1 bottom-0.5 text-[8px] text-gray-400 leading-none truncate pointer-events-none" style={{ left: '87px' }}>
                              {getOkrDisplayText(quickTask.okr)}
                            </div>
                          )}
                          
                          {/* 时间标记 - 只在高亮且有明确时间记录时显示 */}
                          {highlightedColor && quickTask.color === highlightedColor && getTaskTimeRecord(quickTask.id) > 0 && (
                            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs font-medium text-gray-700 bg-white bg-opacity-80 px-1 rounded">
                              {getTaskTimeRecord(quickTask.id) >= 60 
                                ? `${(getTaskTimeRecord(quickTask.id) / 60).toFixed(getTaskTimeRecord(quickTask.id) % 60 === 0 ? 0 : 1)}h`
                                : `${getTaskTimeRecord(quickTask.id)}m`
                              }
                            </div>
                          )}
                          

                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        {/* 右侧周切换区域 */}
        <div className="w-8 border-l border-gray-200 flex flex-col">
          {/* 上半部分 - 上一周 */}
          <div 
            className="flex-1 bg-gray-50 hover:bg-blue-50 cursor-pointer flex items-center justify-center group transition-colors border-b border-gray-200"
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            title="上一周"
          >
            <ChevronUp className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
          </div>
          {/* 下半部分 - 下一周 */}
          <div 
            className="flex-1 bg-gray-50 hover:bg-blue-50 cursor-pointer flex items-center justify-center group transition-colors"
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            title="下一周"
          >
            <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
          </div>
        </div>
      </div>

      {/* 时间记录弹窗 */}
      {timeTrackingPopup && createPortal((() => {
        const colorClasses = getColorClasses(timeTrackingPopup.taskColor);
        
        // 确保弹窗位置在屏幕内
        const popupWidth = 240; // 增加宽度以容纳清空按钮
        const popupHeight = 100;
        const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
        const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
        const x = Math.max(10, Math.min(timeTrackingPopup.x, windowWidth - popupWidth - 10));
        const y = Math.max(10, Math.min(timeTrackingPopup.y, windowHeight - popupHeight - 10));
        
        return (
          <div
            className="time-tracking-popup fixed bg-white border border-gray-300 rounded shadow-xl p-2"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              zIndex: 8000
            }}
            onMouseEnter={() => {
              // 鼠标进入弹窗时，清除关闭定时器
              if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
                closeTimeoutRef.current = null;
              }
              mouseTrackingRef.current = true;
            }}
            onMouseLeave={() => {
              // 鼠标离开弹窗时，延迟关闭
              mouseTrackingRef.current = false;
              closeTimeoutRef.current = setTimeout(() => {
                if (!mouseTrackingRef.current) {
                  setTimeTrackingPopup(null);
                }
              }, 200);
            }}
          >
            <div className="flex space-x-1">
              {/* 30分钟 - 半个圆圈 */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (closeTimeoutRef.current) {
                    clearTimeout(closeTimeoutRef.current);
                    closeTimeoutRef.current = null;
                  }
                  recordTaskTime(timeTrackingPopup.taskId, 30);
                }}
                className={`flex items-center justify-center w-6 h-6 ${colorClasses.hover} rounded`}
                title="30分钟"
              >
                <div className={`w-3 h-3 border ${colorClasses.border} rounded-full relative`}>
                  <div className={`absolute inset-0 ${colorClasses.bg} rounded-full`} style={{clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)'}}></div>
                </div>
              </button>
              
              {/* 1小时 - 一个圆圈 */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (closeTimeoutRef.current) {
                    clearTimeout(closeTimeoutRef.current);
                    closeTimeoutRef.current = null;
                  }
                  recordTaskTime(timeTrackingPopup.taskId, 60);
                }}
                className={`flex items-center justify-center w-6 h-6 ${colorClasses.hover} rounded`}
                title="1小时"
              >
                <div className={`w-3 h-3 ${colorClasses.bg} rounded-full`}></div>
              </button>
              
              {/* 2小时 - 两个圆圈 */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (closeTimeoutRef.current) {
                    clearTimeout(closeTimeoutRef.current);
                    closeTimeoutRef.current = null;
                  }
                  recordTaskTime(timeTrackingPopup.taskId, 120);
                }}
                className={`flex items-center justify-center w-6 h-6 ${colorClasses.hover} rounded`}
                title="2小时"
              >
                <div className="flex space-x-0.5">
                  <div className={`w-2 h-2 ${colorClasses.bg} rounded-full`}></div>
                  <div className={`w-2 h-2 ${colorClasses.bg} rounded-full`}></div>
                </div>
              </button>
              
              {/* 3小时 - 三个圆圈 */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (closeTimeoutRef.current) {
                    clearTimeout(closeTimeoutRef.current);
                    closeTimeoutRef.current = null;
                  }
                  recordTaskTime(timeTrackingPopup.taskId, 180);
                }}
                className={`flex items-center justify-center w-6 h-6 ${colorClasses.hover} rounded`}
                title="3小时"
              >
                <div className="flex space-x-0.5">
                  <div className={`w-1.5 h-1.5 ${colorClasses.bg} rounded-full`}></div>
                  <div className={`w-1.5 h-1.5 ${colorClasses.bg} rounded-full`}></div>
                  <div className={`w-1.5 h-1.5 ${colorClasses.bg} rounded-full`}></div>
                </div>
              </button>
              
              {/* 清空按钮 - 只在有时间记录时显示 */}
              {getTaskTimeRecord(timeTrackingPopup.taskId) > 0 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (closeTimeoutRef.current) {
                      clearTimeout(closeTimeoutRef.current);
                      closeTimeoutRef.current = null;
                    }
                    clearTaskTime(timeTrackingPopup.taskId);
                  }}
                  className="flex items-center justify-center w-6 h-6 hover:bg-red-50 rounded border border-red-200"
                  title="清空时间记录"
                >
                  <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* 显示当前累计时间 */}
            {getTaskTimeRecord(timeTrackingPopup.taskId) > 0 && (
              <div className="mt-1 pt-1 border-t border-gray-200 text-xs text-gray-600 text-center">
                {formatTimeRecord(getTaskTimeRecord(timeTrackingPopup.taskId))}
              </div>
            )}
          </div>
        );
      })(), document.body)}

      {/* 任务操作弹窗 */}
      {taskActionPopup && (() => {
        // 计算弹窗位置，确保不超出屏幕边界
        const popupWidth = 180;
        const popupHeight = 60;
        const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
        const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
        const maxX = windowWidth - popupWidth;
        const maxY = windowHeight - popupHeight;
        const x = Math.min(taskActionPopup.x, maxX);
        const y = Math.min(taskActionPopup.y, maxY);
        
        return (
          <div
            className="fixed bg-white border border-gray-300 rounded shadow-xl p-2 z-50"
            style={{
              left: `${x}px`,
              top: `${y}px`
            }}
            onClick={(e) => e.stopPropagation()}
          >
          <div className="flex space-x-2">
            <button
              onClick={() => copyTask(taskActionPopup.dayKey, taskActionPopup.slotId, taskActionPopup.taskIndex)}
              className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors border border-blue-200"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>复制</span>
            </button>
            <button
              onClick={() => toggleTaskDelay(taskActionPopup.dayKey, taskActionPopup.slotId, taskActionPopup.taskIndex)}
              className={`flex items-center space-x-1 px-2 py-1 text-xs rounded hover:bg-gray-100 transition-colors border ${
                taskActionPopup.isDelayed 
                  ? 'bg-gray-50 text-gray-600 border-gray-400' 
                  : 'bg-yellow-50 text-yellow-600 border-yellow-200'
              }`}
              title={taskActionPopup.isDelayed ? '取消延迟标记' : '标记为延迟'}
            >
              <span>⏰</span>
              <span>Delay</span>
            </button>
            <button
              onClick={() => {
                deleteQuickTask(taskActionPopup.dayKey, taskActionPopup.slotId, taskActionPopup.taskIndex);
                setTaskActionPopup(null);
              }}
              className="flex items-center space-x-1 px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors border border-red-200"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>删除</span>
            </button>
          </div>
        </div>
        );
      })()}

      {/* 本周时间统计看板 */}
      {(() => {
        const { plannedColorStats, actualColorStats } = getWeekTimeStatistics();
        
        // 合并计划和实际时间，计算总时间
        const allColors = new Set([...Object.keys(plannedColorStats), ...Object.keys(actualColorStats)]);
        const totalPlannedHours = Object.values(plannedColorStats).reduce((sum, hours) => sum + hours, 0);
        const totalActualHours = Object.values(actualColorStats).reduce((sum, hours) => sum + hours, 0);
        
        const colorNames = {
          red: 'Meeting',
          orange: 'Think', 
          pink: 'Interview',
          green: 'Swimming',
          purple: 'Coach',
          blue: 'English',
          yellow: 'XinLi',
          indigo: 'Book',
          tencent: 'Free',
          cyan: 'Relax'
        };
        
        return (
          <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">本周时间分配</h3>
              <div 
                className="text-xs text-gray-600 cursor-pointer hover:text-blue-600 hover:underline"
                onClick={() => setIsTimeEditModalOpen(true)}
                title="点击修改总工作时间"
              >
                计划: {totalPlannedHours.toFixed(1)}h | 完成: {totalActualHours.toFixed(1)}h | 总计: {totalWorkingHours}h | 差距: {(totalPlannedHours - totalActualHours).toFixed(1)}h
              </div>
            </div>
            
            {/* 第一行：计划时间（所有任务） */}
            <div className="mb-2">
              <div className="text-xs text-gray-500 mb-1">计划时间（所有任务，按预期时长统计）</div>
              <div className="flex h-6 bg-gray-100 rounded overflow-hidden">
                {Array.from(allColors).map(color => {
                  const plannedHours = plannedColorStats[color] || 0;
                  if (plannedHours === 0) return null;
                  
                  const percentage = (plannedHours / totalWorkingHours) * 100;
                  const colorClasses = getColorClasses(color || 'gray');
                  
                  return (
                    <div
                      key={`planned-${color}`}
                      className={`relative flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${colorClasses.bg} opacity-60`}
                      style={{ width: `${percentage}%` }}
                      title={`${colorNames[color]}: 计划${plannedHours.toFixed(1)}h (${percentage.toFixed(1)}%)`}
                      onMouseEnter={() => setHighlightedColor(color)}
                      onMouseLeave={() => setHighlightedColor(null)}
                    >
                      <span className="relative z-10 whitespace-nowrap px-1 text-[10px]">
                        {percentage >= 10 ? `${colorNames[color]} ${percentage.toFixed(0)}% ${plannedHours.toFixed(1)}h` : 
                         percentage >= 6 ? `${percentage.toFixed(0)}% ${plannedHours.toFixed(1)}h` : 
                         percentage >= 3 ? `${percentage.toFixed(0)}%` : ''}
                      </span>
                    </div>
                  );
                })}
                {/* 剩余计划时间 */}
                {totalPlannedHours < totalWorkingHours && (
                  <div
                    className="bg-gray-200 flex items-center justify-center text-gray-500 text-[10px]"
                    style={{ width: `${((totalWorkingHours - totalPlannedHours) / totalWorkingHours) * 100}%` }}
                    title={`剩余计划: ${(totalWorkingHours - totalPlannedHours).toFixed(1)}小时`}
                  >
                    {((totalWorkingHours - totalPlannedHours) / totalWorkingHours) >= 0.05 ? `${((totalWorkingHours - totalPlannedHours) / totalWorkingHours * 100).toFixed(0)}%` : ''}
                  </div>
                )}
              </div>
            </div>
            
            {/* 第二行：实际完成时间（仅已完成任务） */}
            <div className="mb-2">
              <div className="text-xs text-gray-500 mb-1">实际完成时间（仅已完成任务，按实际记录）</div>
              <div className="flex h-6 bg-gray-100 rounded overflow-hidden">
                {Array.from(allColors).map(color => {
                  const actualHours = actualColorStats[color] || 0;
                  if (actualHours === 0) return null;
                  
                  const percentage = (actualHours / totalWorkingHours) * 100;
                  const colorClasses = getColorClasses(color || 'gray');
                  
                  return (
                    <div
                      key={`actual-${color}`}
                      className={`relative flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${colorClasses.bg}`}
                      style={{ width: `${percentage}%` }}
                      title={`${colorNames[color]}: 完成${actualHours.toFixed(1)}h (${percentage.toFixed(1)}%)`}
                      onMouseEnter={() => setHighlightedColor(color)}
                      onMouseLeave={() => setHighlightedColor(null)}
                    >
                      <span className="relative z-10 whitespace-nowrap px-1 text-[10px]">
                        {percentage >= 10 ? `${colorNames[color]} ${percentage.toFixed(0)}% ${actualHours.toFixed(1)}h` : 
                         percentage >= 6 ? `${percentage.toFixed(0)}% ${actualHours.toFixed(1)}h` : 
                         percentage >= 3 ? `${percentage.toFixed(0)}%` : ''}
                      </span>
                    </div>
                  );
                })}
                {/* 剩余实际时间 */}
                {totalActualHours < totalWorkingHours && (
                  <div
                    className="bg-gray-200 flex items-center justify-center text-gray-500 text-[10px]"
                    style={{ width: `${((totalWorkingHours - totalActualHours) / totalWorkingHours) * 100}%` }}
                    title={`剩余: ${(totalWorkingHours - totalActualHours).toFixed(1)}小时`}
                  >
                    {((totalWorkingHours - totalActualHours) / totalWorkingHours) >= 0.05 ? `${((totalWorkingHours - totalActualHours) / totalWorkingHours * 100).toFixed(0)}%` : ''}
                  </div>
                )}
              </div>
            </div>
            
            {/* 颜色图例 - 显示计划和实际时间（百分比+小时） */}
            <div className="flex flex-wrap gap-3 mt-3 text-xs">
              {Array.from(allColors).map(color => {
                const plannedHours = plannedColorStats[color] || 0;
                const actualHours = actualColorStats[color] || 0;
                const plannedPercentage = (plannedHours / totalWorkingHours) * 100;
                const actualPercentage = (actualHours / totalWorkingHours) * 100;
                const colorClasses = getColorClasses(color);
                
                return (
                  <div key={color} className="flex items-center space-x-1">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 ${colorClasses.bg} rounded`}></div>
                      <div className={`w-3 h-3 ${colorClasses.bg} opacity-40 rounded ml-0.5`}></div>
                    </div>
                    <span className="text-gray-700">
                      <span className={colorClasses.text}>{colorNames[color]}</span>: 
                      <span className={`${colorClasses.text} font-medium`}> 计划{plannedPercentage.toFixed(1)}%</span>
                      <span className="text-gray-500"> ({plannedHours.toFixed(1)}h)</span>
                      {actualHours > 0 && (
                        <>
                          <span className="text-gray-500"> → </span>
                          <span className={`${colorClasses.text} font-bold`}>完成{actualPercentage.toFixed(1)}%</span>
                          <span className="text-gray-500"> ({actualHours.toFixed(1)}h)</span>
                        </>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* 拖拽提示 */}
      {draggedTask && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm z-50 shadow-lg flex items-center space-x-2">
          <span>🚀</span>
          <span>正在移动任务: {draggedTask.task.text || draggedTask.task.time || '未命名任务'}</span>
          <span className="text-blue-100 text-xs">拖拽到目标时间段</span>
        </div>
      )}

      {/* 时间编辑弹窗 */}
      <TimeEditModal
        isOpen={isTimeEditModalOpen}
        onClose={() => setIsTimeEditModalOpen(false)}
        totalTime={totalWorkingHours}
        onSave={saveTotalWorkingHours}
      />
    </div>
  );
};

export default WeekView;