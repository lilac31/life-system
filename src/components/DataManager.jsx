import React, { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { format } from 'date-fns';

const DataManager = ({ onImport, className = "" }) => {
  const fileInputRef = useRef(null);

  // 导出数据功能
  const exportData = () => {
    // 从localStorage获取所有数据
    const weeklyImportantTasks = JSON.parse(localStorage.getItem('weeklyImportantTasks') || '{}');
    const quickTasks = JSON.parse(localStorage.getItem('quickTasks') || '{}');
    const taskTimeRecords = JSON.parse(localStorage.getItem('taskTimeRecords') || '{}');
    const totalWorkingHours = localStorage.getItem('totalWorkingHours') || '40';
    
    const exportData = {
      weeklyImportantTasks,
      quickTasks,
      taskTimeRecords,
      totalWorkingHours: parseInt(totalWorkingHours, 10),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `life-system-data-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 清理URL对象
    URL.revokeObjectURL(link.href);
  };

  // 导入数据功能
  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // 验证数据格式
        if (!importedData.version) {
          alert('无效的数据文件格式');
          return;
        }
        
        // 保存到localStorage
        if (importedData.weeklyImportantTasks) {
          localStorage.setItem('weeklyImportantTasks', JSON.stringify(importedData.weeklyImportantTasks));
        }
        if (importedData.quickTasks) {
          localStorage.setItem('quickTasks', JSON.stringify(importedData.quickTasks));
        }
        if (importedData.taskTimeRecords) {
          localStorage.setItem('taskTimeRecords', JSON.stringify(importedData.taskTimeRecords));
        }
        if (importedData.totalWorkingHours) {
          localStorage.setItem('totalWorkingHours', importedData.totalWorkingHours.toString());
        }
        
        // 通知父组件数据已导入
        if (onImport) {
          onImport(importedData);
        }
        
        alert('数据导入成功！页面将刷新以加载新数据。');
        window.location.reload();
        
      } catch (error) {
        console.error('导入数据失败:', error);
        alert('导入数据失败，请检查文件格式是否正确');
      }
    };
    
    reader.readAsText(file);
    
    // 清空input值，允许重复选择同一文件
    event.target.value = '';
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={exportData}
        className="btn-secondary text-xs px-2 py-0.5 flex items-center space-x-1"
        title="导出数据"
      >
        <Download className="w-3 h-3" />
        <span>导出</span>
      </button>
      
      <button
        onClick={handleImportClick}
        className="btn-secondary text-xs px-2 py-0.5 flex items-center space-x-1"
        title="导入数据"
      >
        <Upload className="w-3 h-3" />
        <span>导入</span>
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={importData}
        className="hidden"
      />
    </div>
  );
};

export default DataManager;