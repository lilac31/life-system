import React, { useState } from 'react';
import { Search, Filter, Calendar, Clock, Edit3, Trash2, CheckCircle, Circle } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import ViewHeader from './ViewHeader';

const TaskList = ({ tasks, onUpdateTask, onDeleteTask, onToggleComplete, currentView, onViewChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'completed' && task.completed) ||
                         (filterStatus === 'pending' && !task.completed);
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || task.category === filterCategory;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'work': return 'bg-blue-500';
      case 'personal': return 'bg-green-500';
      case 'health': return 'bg-red-500';
      case 'study': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '-';
    }
  };

  const getCategoryText = (category) => {
    switch (category) {
      case 'work': return '工作';
      case 'personal': return '个人';
      case 'health': return '健康';
      case 'study': return '学习';
      default: return '其他';
    }
  };

  return (
    <div className="space-y-6">
      <ViewHeader 
        currentView={currentView}
        onViewChange={onViewChange}
        title="个人日程管理"
        subtitle={`共 ${tasks.length} 个任务，已完成 ${tasks.filter(t => t.completed).length} 个`}
      />

      {/* 搜索和筛选 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索任务..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input"
          >
            <option value="all">所有状态</option>
            <option value="pending">待完成</option>
            <option value="completed">已完成</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="input"
          >
            <option value="all">所有优先级</option>
            <option value="high">高优先级</option>
            <option value="medium">中优先级</option>
            <option value="low">低优先级</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input"
          >
            <option value="all">所有分类</option>
            <option value="work">工作</option>
            <option value="personal">个人</option>
            <option value="health">健康</option>
            <option value="study">学习</option>
          </select>
        </div>
      </div>

      {/* 任务列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到任务</h3>
            <p className="text-gray-500">尝试调整搜索条件或添加新任务</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  task.completed ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  <button
                    onClick={() => onToggleComplete(task.id)}
                    className="mt-1 text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    {task.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`text-lg font-medium ${
                          task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className={`mt-1 text-sm ${
                            task.completed ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {task.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => onUpdateTask(task.id, task)}
                          className="btn-ghost text-gray-400 hover:text-blue-500"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="btn-ghost text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 mt-3">
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(task.date), 'MM月dd日', { locale: zhCN })}</span>
                      </div>

                      {task.time && (
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{task.time}</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-1">
                        <div className={`w-3 h-3 rounded-full ${getCategoryColor(task.category)}`}></div>
                        <span className="text-sm text-gray-600">{getCategoryText(task.category)}</span>
                      </div>

                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                        {getPriorityText(task.priority)}优先级
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;