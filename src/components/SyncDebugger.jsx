import React, { useState, useEffect } from 'react';
import { dataSyncService, dataAPI } from '../services/apiService';

const SyncDebugger = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cloudData, setCloudData] = useState(null);

  const loadDebugInfo = () => {
    const binId = localStorage.getItem('jsonbin_id');
    const info = {
      hasApiKey: !!localStorage.getItem('jsonbin_api_key'),
      userId: localStorage.getItem('user_id'),
      binId: binId,
      binIdValid: binId ? /^[a-f0-9]{24}$/i.test(binId) : false,
      binIdLength: binId ? binId.length : 0,
      lastSync: localStorage.getItem('last_sync'),
      lastCloudUpdate: localStorage.getItem('last_cloud_update'),
      syncStatus: localStorage.getItem('sync_status'),
      cloudSyncEnabled: localStorage.getItem('cloud_sync_enabled'),
      hasLocalData: !!localStorage.getItem('schedule_data'),
      localDataSize: localStorage.getItem('schedule_data')?.length || 0
    };
    setDebugInfo(info);
  };

  useEffect(() => {
    loadDebugInfo();
    const interval = setInterval(() => {
      loadDebugInfo();
    }, 5000); // 每5秒更新一次
    return () => clearInterval(interval);
  }, []);

  const testSync = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      console.log('=== 开始测试同步 ===');
      
      // 1. 检查 API Key
      const apiKey = localStorage.getItem('jsonbin_api_key');
      if (!apiKey) {
        setTestResult({ success: false, error: '未配置 JSONBin API Key' });
        setLoading(false);
        return;
      }
      console.log('✓ API Key 已配置');
      
      // 2. 获取用户ID
      const userId = await dataSyncService.getUserId();
      console.log('✓ 用户ID:', userId);
      
      // 3. 获取完整的本地数据
      const localData = dataAPI.getAllData();
      console.log('✓ 本地数据:', localData);
      
      // 4. 上传数据到云端
      console.log('开始上传数据到云端...');
      const uploadResult = await dataSyncService.uploadToCloud(localData);
      console.log('✓ 上传成功:', uploadResult.metadata.id);
      
      // 5. 下载数据验证
      console.log('开始下载数据验证...');
      const downloadData = await dataSyncService.downloadFromCloud();
      console.log('✓ 下载成功');
      
      setTestResult({
        success: true,
        userId,
        binId: uploadResult.metadata.id,
        uploadTime: uploadResult.metadata.createdAt,
        dataKeys: Object.keys(downloadData)
      });
      
      setCloudData(downloadData);
      loadDebugInfo();
      
    } catch (error) {
      console.error('测试失败:', error);
      setTestResult({
        success: false,
        error: error.message,
        stack: error.stack
      });
    }
    
    setLoading(false);
  };

  const testDownload = async () => {
    setLoading(true);
    try {
      console.log('=== 测试下载 ===');
      const data = await dataSyncService.downloadFromCloud();
      console.log('下载的数据:', data);
      setCloudData(data);
      setTestResult({
        success: true,
        action: 'download',
        message: '下载成功，查看下方云端数据'
      });
    } catch (error) {
      console.error('下载失败:', error);
      setTestResult({
        success: false,
        error: error.message
      });
    }
    setLoading(false);
  };

  const clearAll = () => {
    if (confirm('确定要清除所有本地数据吗？')) {
      localStorage.clear();
      loadDebugInfo();
      setTestResult(null);
      setCloudData(null);
      alert('已清除所有本地数据，请刷新页面');
    }
  };

  const clearBinId = () => {
    if (confirm('确定要清除 Bin ID 吗？下次同步将创建新的 Bin')) {
      localStorage.removeItem('jsonbin_id');
      localStorage.removeItem('user_id');
      loadDebugInfo();
      alert('已清除 Bin ID，下次同步将创建新 Bin');
    }
  };

  const getDataSummary = (data) => {
    if (!data) return null;
    
    return {
      weeklyImportantTasks: data.weeklyImportantTasks ? Object.keys(data.weeklyImportantTasks).length : 0,
      quickTasks: data.quickTasks ? Object.keys(data.quickTasks).length : 0,
      taskTimeRecords: data.taskTimeRecords ? Object.keys(data.taskTimeRecords || {}).length : 0,
      weeks: data.weeks ? Object.keys(data.weeks).length : 0,
      importantTasks: data.importantTasks ? data.importantTasks.length : 0,
      totalWorkingHours: data.totalWorkingHours || 0
    };
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white shadow-2xl rounded-lg p-4 border-2 border-purple-500 z-50 max-h-[80vh] overflow-auto">
      <h3 className="text-lg font-bold mb-3 text-purple-600">🔍 JSONBin 同步调试器</h3>
      
      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span>JSONBin API Key:</span>
          <span className={debugInfo.hasApiKey ? 'text-green-600' : 'text-red-600'}>
            {debugInfo.hasApiKey ? '✓ 已配置' : '✗ 未配置'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>用户ID:</span>
          <span className="text-xs truncate max-w-[200px]" title={debugInfo.userId}>
            {debugInfo.userId || '未设置'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Bin ID:</span>
          <span className="text-xs truncate max-w-[200px]" title={debugInfo.binId}>
            {debugInfo.binId ? (
              <>
                {debugInfo.binId}
                {debugInfo.binIdValid ? 
                  <span className="text-green-600 ml-1">✓</span> : 
                  <span className="text-red-600 ml-1">✗ 格式错误({debugInfo.binIdLength}字符)</span>
                }
              </>
            ) : '未创建'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>本地数据:</span>
          <span className={debugInfo.hasLocalData ? 'text-green-600' : 'text-red-600'}>
            {debugInfo.hasLocalData ? `✓ ${(debugInfo.localDataSize / 1024).toFixed(1)}KB` : '✗ 无数据'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>同步状态:</span>
          <span>{debugInfo.syncStatus || '未知'}</span>
        </div>
        <div className="flex justify-between">
          <span>最后同步:</span>
          <span className="text-xs">
            {debugInfo.lastSync ? new Date(debugInfo.lastSync).toLocaleTimeString() : '从未'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>云端更新:</span>
          <span className="text-xs">
            {debugInfo.lastCloudUpdate ? new Date(debugInfo.lastCloudUpdate).toLocaleTimeString() : '从未'}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <button
          onClick={testSync}
          disabled={loading}
          className="w-full py-2 px-4 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 text-sm"
        >
          {loading ? '测试中...' : '🧪 测试上传同步'}
        </button>
        <button
          onClick={testDownload}
          disabled={loading}
          className="w-full py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-sm"
        >
          {loading ? '下载中...' : '📥 测试下载'}
        </button>
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'E', shiftKey: true, ctrlKey: true }))}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          📦 导入/导出数据
        </button>
        <button
          onClick={clearBinId}
          className="w-full py-2 px-4 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
        >
          🔄 清除 Bin ID（重新创建）
        </button>
        <button
          onClick={clearAll}
          className="w-full py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
        >
          🗑️ 清除所有数据
        </button>
      </div>

      {testResult && (
        <div className={`p-3 rounded text-sm mb-3 ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="font-bold mb-2">
            {testResult.success ? '✅ 测试成功' : '❌ 测试失败'}
          </div>
          {testResult.success ? (
            <div className="space-y-1 text-xs">
              {testResult.action === 'download' ? (
                <div className="text-green-600">{testResult.message}</div>
              ) : (
                <>
                  <div>用户ID: {testResult.userId}</div>
                  <div>Bin ID: {testResult.binId}</div>
                  <div>上传时间: {new Date(testResult.uploadTime).toLocaleString()}</div>
                  <div>数据字段: {testResult.dataKeys?.join(', ')}</div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-1 text-xs">
              <div className="text-red-600 font-bold">{testResult.error}</div>
              {testResult.stack && (
                <pre className="bg-white p-2 rounded overflow-auto max-h-40 text-xs">
                  {testResult.stack}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {cloudData && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded text-sm">
          <div className="font-bold mb-2 text-purple-800">☁️ 云端数据摘要</div>
          <div className="space-y-1 text-xs">
            {(() => {
              const summary = getDataSummary(cloudData);
              return (
                <>
                  <div className="flex justify-between">
                    <span>周重要任务:</span>
                    <span className="font-semibold">{summary.weeklyImportantTasks} 周</span>
                  </div>
                  <div className="flex justify-between">
                    <span>快速任务:</span>
                    <span className="font-semibold">{summary.quickTasks} 天</span>
                  </div>
                  <div className="flex justify-between">
                    <span>时间记录:</span>
                    <span className="font-semibold">{summary.taskTimeRecords} 条</span>
                  </div>
                  <div className="flex justify-between">
                    <span>周数据:</span>
                    <span className="font-semibold">{summary.weeks} 周</span>
                  </div>
                  <div className="flex justify-between">
                    <span>重要任务:</span>
                    <span className="font-semibold">{summary.importantTasks} 个</span>
                  </div>
                  <div className="flex justify-between">
                    <span>总工作时间:</span>
                    <span className="font-semibold">{summary.totalWorkingHours}h</span>
                  </div>
                </>
              );
            })()}
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-purple-600 hover:text-purple-800">查看完整数据 JSON</summary>
            <pre className="bg-white p-2 rounded overflow-auto max-h-60 text-xs mt-2">
              {JSON.stringify(cloudData, null, 2)}
            </pre>
          </details>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500 border-t pt-2">
        <div>💡 提示：</div>
        <div>1. 先点击"测试上传同步"验证功能</div>
        <div>2. 在另一个浏览器用相同API Key测试</div>
        <div>3. 打开控制台查看详细日志</div>
      </div>
    </div>
  );
};

export default SyncDebugger;
