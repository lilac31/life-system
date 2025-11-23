import React, { useState } from 'react';
import { Download, Upload, Copy, Check } from 'lucide-react';
import { dataAPI } from '../services/apiService';

const DataImportExport = ({ onClose }) => {
  const [exportData, setExportData] = useState('');
  const [importData, setImportData] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const handleExport = () => {
    const allData = dataAPI.getAllData();
    
    // 调试信息：显示所有数据的内容
    console.log('导出的完整数据:', allData);
    
    const jsonData = JSON.stringify(allData, null, 2);
    setExportData(jsonData);
    
    // 统计各类数据
    const stats = [];
    if (allData.weeklyImportantTasks) {
      const count = Object.keys(allData.weeklyImportantTasks).length;
      if (count > 0) stats.push(`${count}周重要任务`);
    }
    if (allData.quickTasks) {
      const count = Object.keys(allData.quickTasks).length;
      if (count > 0) stats.push(`${count}天快速任务`);
    }
    if (allData.taskTimeRecords) {
      const count = allData.taskTimeRecords.length;
      if (count > 0) stats.push(`${count}条时间记录`);
    }
    if (allData.weeks) {
      const count = Object.keys(allData.weeks).length;
      if (count > 0) stats.push(`${count}周数据`);
    }
    if (allData.importantTasks) {
      const count = allData.importantTasks.length;
      if (count > 0) stats.push(`${count}个重要任务`);
    }
    
    const statsText = stats.length > 0 ? `包含: ${stats.join('、')}。` : '当前没有数据。';
    setMessage(`✅ 数据已导出！${statsText}可以复制或下载。`);
  };

  const handleDownload = () => {
    const allData = dataAPI.getAllData();
    
    // 调试信息
    console.log('下载的完整数据:', allData);
    
    const jsonData = JSON.stringify(allData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-system-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // 统计数据
    const stats = [];
    if (allData.weeklyImportantTasks) {
      const count = Object.keys(allData.weeklyImportantTasks).length;
      if (count > 0) stats.push(`${count}周重要任务`);
    }
    if (allData.quickTasks) {
      const count = Object.keys(allData.quickTasks).length;
      if (count > 0) stats.push(`${count}天快速任务`);
    }
    if (allData.taskTimeRecords) {
      const count = allData.taskTimeRecords.length;
      if (count > 0) stats.push(`${count}条时间记录`);
    }
    
    const statsText = stats.length > 0 ? `包含: ${stats.join('、')}。` : '';
    setMessage(`✅ 数据已下载到本地！${statsText}`);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportData);
      setCopied(true);
      setMessage('✅ 数据已复制到剪贴板！');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      setMessage('❌ 复制失败，请手动选择复制');
    }
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importData);
      
      console.log('导入的数据:', data);
      
      // 验证数据格式（检查是否至少有一个数据字段）
      const hasData = data.weeks || 
                     data.importantTasks || 
                     data.quickTasks || 
                     data.weeklyImportantTasks ||
                     data.taskTimeRecords ||
                     data.yearGoals;
      
      if (!hasData) {
        throw new Error('无效的数据格式：没有找到任何有效数据');
      }

      // 保存数据（dataAPI.saveData会自动处理所有分散的数据）
      dataAPI.saveData(data);
      
      // 统计导入的数据
      const stats = [];
      if (data.weeklyImportantTasks) stats.push(`${Object.keys(data.weeklyImportantTasks).length}周重要任务`);
      if (data.quickTasks) stats.push(`${Object.keys(data.quickTasks).length}天快速任务`);
      if (data.taskTimeRecords) stats.push(`${data.taskTimeRecords.length}条时间记录`);
      if (data.weeks) stats.push(`${Object.keys(data.weeks).length}周数据`);
      
      const statsText = stats.length > 0 ? `\n包含: ${stats.join('、')}` : '';
      setMessage(`✅ 数据导入成功！${statsText}\n页面即将刷新...`);
      
      // 刷新页面以加载新数据
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage('❌ 导入失败：' + error.message);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImportData(event.target.result);
      setMessage('📄 文件已读取，点击"导入数据"完成导入');
    };
    reader.onerror = () => {
      setMessage('❌ 文件读取失败');
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">📦 数据导入/导出</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded ${
              message.includes('✅') ? 'bg-green-100 text-green-800' :
              message.includes('❌') ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {message}
            </div>
          )}

          {/* 导出部分 */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Download size={20} />
              导出数据
            </h3>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="flex-1 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  显示数据
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600 flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  下载文件
                </button>
              </div>

              {exportData && (
                <div className="relative">
                  <textarea
                    value={exportData}
                    readOnly
                    className="w-full h-40 p-3 border border-gray-300 rounded font-mono text-xs bg-gray-50"
                  />
                  <button
                    onClick={handleCopy}
                    className="absolute top-2 right-2 p-2 bg-white border border-gray-300 rounded hover:bg-gray-100 flex items-center gap-1"
                  >
                    {copied ? (
                      <>
                        <Check size={16} className="text-green-600" />
                        <span className="text-sm text-green-600">已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span className="text-sm">复制</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-3 p-3 bg-blue-50 rounded text-sm text-blue-800">
              💡 提示：导出的数据可以保存到文件或复制到其他浏览器使用
            </div>
          </div>

          {/* 导入部分 */}
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Upload size={20} />
              导入数据
            </h3>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex-1 py-2 px-4 bg-purple-500 text-white rounded hover:bg-purple-600 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload size={16} />
                  选择文件
                </label>
                <button
                  onClick={handleImport}
                  disabled={!importData}
                  className="flex-1 py-2 px-4 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Upload size={16} />
                  导入数据
                </button>
              </div>

              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="或粘贴 JSON 数据到这里..."
                className="w-full h-40 p-3 border border-gray-300 rounded font-mono text-xs"
              />
            </div>

            <div className="mt-3 p-3 bg-yellow-50 rounded text-sm text-yellow-800">
              ⚠️ 警告：导入数据会覆盖当前所有数据，建议先导出备份！
            </div>
          </div>

          {/* 使用说明 */}
          <div className="mt-6 p-4 bg-gray-50 rounded">
            <h4 className="font-semibold mb-2">📖 多端同步使用方法：</h4>
            <ol className="text-sm space-y-1 ml-4 list-decimal text-gray-700">
              <li>在<strong>设备A</strong>：点击"下载文件"或"复制"导出数据</li>
              <li>将文件/数据发送到<strong>设备B</strong>（微信、邮件、网盘等）</li>
              <li>在<strong>设备B</strong>：选择文件或粘贴数据，点击"导入"</li>
              <li>完成！数据已同步到设备B</li>
            </ol>
            <div className="mt-2 text-xs text-gray-500">
              💡 虽然不是自动同步，但完全免费、无限制、数据私有！
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataImportExport;
