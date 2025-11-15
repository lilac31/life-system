import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, Download, Upload, FileText, Clock } from 'lucide-react';

const DataRecovery = ({ onRecover }) => {
  const [recoveryStatus, setRecoveryStatus] = useState('checking');
  const [availableData, setAvailableData] = useState({});
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkDataStatus();
  }, []);

  const checkDataStatus = () => {
    setRecoveryStatus('checking');
    
    // 检查localStorage中的数据
    const weeklyImportantTasks = localStorage.getItem('weeklyImportantTasks');
    const quickTasks = localStorage.getItem('quickTasks');
    const taskTimeRecords = localStorage.getItem('taskTimeRecords');
    const totalWorkingHours = localStorage.getItem('totalWorkingHours');
    const yearGoals = localStorage.getItem('yearGoals');

    const dataStatus = {
      weeklyImportantTasks: weeklyImportantTasks ? JSON.parse(weeklyImportantTasks) : null,
      quickTasks: quickTasks ? JSON.parse(quickTasks) : null,
      taskTimeRecords: taskTimeRecords ? JSON.parse(taskTimeRecords) : null,
      totalWorkingHours: totalWorkingHours ? parseInt(totalWorkingHours) : null,
      yearGoals: yearGoals ? JSON.parse(yearGoals) : null
    };

    setAvailableData(dataStatus);

    // 检查数据情况
    const hasWeeklyTasks = dataStatus.weeklyImportantTasks && Object.keys(dataStatus.weeklyImportantTasks).length > 0;
    const hasQuickTasks = dataStatus.quickTasks && Object.keys(dataStatus.quickTasks).length > 0;
    const hasTimeRecords = dataStatus.taskTimeRecords && Object.keys(dataStatus.taskTimeRecords).length > 0;
    const hasYearGoals = dataStatus.yearGoals && dataStatus.yearGoals.length > 0;

    if (hasWeeklyTasks || hasQuickTasks || hasTimeRecords || hasYearGoals) {
      setRecoveryStatus('found');
    } else {
      setRecoveryStatus('empty');
    }
  };

  const getDataSummary = () => {
    let summary = [];
    
    if (availableData.weeklyImportantTasks) {
      const weekCount = Object.keys(availableData.weeklyImportantTasks).length;
      if (weekCount > 0) {
        summary.push(`${weekCount}周的重要任务`);
      }
    }
    
    if (availableData.quickTasks) {
      const dayCount = Object.keys(availableData.quickTasks).length;
      let taskCount = 0;
      Object.values(availableData.quickTasks).forEach(dayTasks => {
        Object.values(dayTasks).forEach(slotTasks => {
          taskCount += slotTasks.filter(task => task.text || task.time).length;
        });
      });
      if (taskCount > 0) {
        summary.push(`${dayCount}天共${taskCount}个任务`);
      }
    }
    
    if (availableData.taskTimeRecords) {
      const recordCount = Object.keys(availableData.taskTimeRecords).length;
      if (recordCount > 0) {
        summary.push(`${recordCount}个时间记录`);
      }
    }
    
    if (availableData.yearGoals && availableData.yearGoals.length > 0) {
      summary.push(`${availableData.yearGoals.length}个年度目标`);
    }
    
    return summary;
  };

  const restoreFoundData = () => {
    try {
      if (onRecover) {
        onRecover(availableData);
      }
      alert('数据恢复成功！');
      window.location.reload();
    } catch (error) {
      console.error('恢复数据失败:', error);
      alert('恢复数据失败，请重试。');
    }
  };

  const clearAllData = () => {
    if (confirm('确定要清空所有数据重新开始吗？此操作不可恢复！')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const exportFoundData = () => {
    const exportData = {
      ...availableData,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `backup-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const handleFileImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            if (onRecover) {
              onRecover(data);
            }
            alert('数据导入成功！');
            window.location.reload();
          } catch (error) {
            alert('文件格式错误，请选择正确的备份文件');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-medium text-gray-900">数据管理中心</h3>
        </div>

        {recoveryStatus === 'checking' && (
          <div className="text-center py-4">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
            <p>正在扫描本地数据...</p>
          </div>
        )}

        {recoveryStatus === 'found' && (
          <div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-green-800">找到你的数据了！</h4>
              </div>
              <div className="text-sm text-green-700">
                <p className="mb-2">在本地存储中发现以下数据：</p>
                <ul className="list-disc list-inside space-y-1">
                  {getDataSummary().map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={restoreFoundData}
                className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2 font-medium"
              >
                <CheckCircle className="w-4 h-4" />
                <span>恢复我的数据</span>
              </button>

              <button
                onClick={exportFoundData}
                className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>先备份数据到文件</span>
              </button>

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {showDetails ? '隐藏' : '查看'}数据详情
              </button>

              {showDetails && (
                <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-2">
                  <div>
                    <strong>重要任务:</strong> {availableData.weeklyImportantTasks ? Object.keys(availableData.weeklyImportantTasks).length + '周' : '无'}
                  </div>
                  <div>
                    <strong>日常任务:</strong> {availableData.quickTasks ? Object.keys(availableData.quickTasks).length + '天' : '无'}
                  </div>
                  <div>
                    <strong>时间记录:</strong> {availableData.taskTimeRecords ? Object.keys(availableData.taskTimeRecords).length + '条' : '无'}
                  </div>
                  <div>
                    <strong>年度目标:</strong> {availableData.yearGoals ? availableData.yearGoals.length + '个' : '无'}
                  </div>
                  <div>
                    <strong>工作时间设置:</strong> {availableData.totalWorkingHours || 40}小时/周
                  </div>
                </div>
              )}

              <div className="border-t pt-3">
                <button
                  onClick={clearAllData}
                  className="w-full bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm"
                >
                  清空所有数据重新开始
                </button>
              </div>
            </div>
          </div>
        )}

        {recoveryStatus === 'empty' && (
          <div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h4 className="font-medium text-yellow-800">没有找到数据</h4>
              </div>
              <p className="text-sm text-yellow-700">
                本地存储中没有发现任何数据。如果你之前有数据，可能是因为：
              </p>
              <ul className="list-disc list-inside text-sm text-yellow-700 mt-2 space-y-1">
                <li>浏览器缓存被清理</li>
                <li>使用了隐私模式</li>
                <li>更换了浏览器或设备</li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h5 className="font-medium text-blue-800 mb-2">如果你有备份文件：</h5>
                <p className="text-sm text-blue-700 mb-2">
                  点击下面的"导入数据"按钮，选择之前导出的JSON文件
                </p>
                <button
                  onClick={handleFileImport}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>导入备份数据</span>
                </button>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                开始使用（创建新数据）
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataRecovery;