import { useState, useEffect } from 'react';
import { Check, AlertCircle, Key, Cloud } from 'lucide-react';
import { dataSyncService } from '../services/apiService';

export default function SyncSettings({ onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [isApiKeyVerified, setIsApiKeyVerified] = useState(false);
  const [apiKeyError, setApiKeyError] = useState('');
  const [isVerifyingApiKey, setIsVerifyingApiKey] = useState(false);
  const [autoUserId, setAutoUserId] = useState('');
  const [binId, setBinId] = useState('');

  useEffect(() => {
    const savedApiKey = localStorage.getItem('jsonbin_api_key');
    const savedUserId = localStorage.getItem('user_id');
    const savedBinId = localStorage.getItem('jsonbin_id');
    
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setIsApiKeyVerified(true);
    }
    
    if (savedUserId) {
      setAutoUserId(savedUserId);
    }
    
    if (savedBinId) {
      setBinId(savedBinId);
    }
  }, []);

  const handleVerifyApiKey = async () => {
    if (!apiKey.trim()) {
      setApiKeyError('请输入 JSONBin API Key');
      return;
    }

    setIsVerifyingApiKey(true);
    setApiKeyError('');

    try {
      // 验证 API Key
      const testPayload = { test: true, timestamp: new Date().toISOString() };
      
      const response = await fetch('https://api.jsonbin.io/v3/b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': apiKey
        },
        body: JSON.stringify(testPayload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'API Key 无效');
      }

      const result = await response.json();
      
      // 清理测试 bin
      try {
        await fetch(`https://api.jsonbin.io/v3/b/${result.metadata.id}`, {
          method: 'DELETE',
          headers: { 'X-Master-Key': apiKey }
        });
      } catch (err) {
        console.warn('清理测试 Bin 失败（可忽略）');
      }

      // 保存 API Key
      localStorage.setItem('jsonbin_api_key', apiKey);
      localStorage.setItem('sync_provider', 'jsonbin');
      
      // 自动生成用户ID
      const generatedUserId = await dataSyncService.generateUserIdFromApiKey(apiKey);
      localStorage.setItem('user_id', generatedUserId);
      setAutoUserId(generatedUserId);
      
      setIsApiKeyVerified(true);
      
      // 初始化同步服务
      try {
        await dataSyncService.reinitialize();
        alert('✅ 配置成功！\n\n系统将自动同步数据到云端。');
      } catch (error) {
        if (error.message.includes('No cloud data found')) {
          alert('✅ 配置成功！\n\n将在下次保存时自动上传数据。');
        } else {
          throw error;
        }
      }
      
      // 刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (err) {
      setApiKeyError(err.message || '验证失败');
    } finally {
      setIsVerifyingApiKey(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-4 rounded-t-xl">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Cloud size={28} />
            多端同步设置
          </h2>
          <p className="text-purple-100 text-sm mt-1">一个 API Key，所有设备自动同步</p>
        </div>

        <div className="p-6 space-y-6">
          {/* 说明 */}
          {!isApiKeyVerified && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-3">
                <strong>🚀 三步启用多端同步：</strong>
              </p>
              <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                <li>访问 <a href="https://jsonbin.io" target="_blank" rel="noopener noreferrer" className="underline font-medium">JSONBin.io</a> 注册账号（免费）</li>
                <li>创建 API Key（选择 Master Key 权限）</li>
                <li>粘贴到下方输入框并验证</li>
              </ol>
              <p className="text-xs text-blue-700 mt-3 border-t border-blue-200 pt-3">
                💡 <strong>多设备同步：</strong>在所有设备上输入相同的 API Key 即可自动同步数据
              </p>
            </div>
          )}

          {/* API Key 输入 */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Key size={16} className="text-purple-500" />
              JSONBin API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="粘贴你的 Master API Key"
              disabled={isApiKeyVerified}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none font-mono text-sm ${
                apiKeyError ? 'border-red-500 focus:ring-red-500' : 
                isApiKeyVerified ? 'border-green-500 bg-green-50 text-green-700' : 
                'border-gray-300 focus:ring-purple-500'
              }`}
            />
            {apiKeyError && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} />
                {apiKeyError}
              </p>
            )}
            {isApiKeyVerified && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <Check size={14} />
                API Key 已验证 ✅
              </p>
            )}
          </div>

          {/* 验证按钮 */}
          {!isApiKeyVerified ? (
            <button
              onClick={handleVerifyApiKey}
              disabled={isVerifyingApiKey}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all disabled:opacity-50 font-semibold"
            >
              {isVerifyingApiKey ? '验证中...' : '验证并启用同步'}
            </button>
          ) : (
            <div className="space-y-4">
              {/* 状态显示 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">用户ID:</span>
                  <span className="font-mono text-green-700 text-xs">{autoUserId}</span>
                </div>
                {binId && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Bin ID:</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(binId);
                          alert('✅ Bin ID 已复制！\n\n在其他设备上打开控制台，运行：\nlocalStorage.setItem("jsonbin_id", "' + binId + '");\n然后刷新页面即可同步。');
                        }}
                        className="font-mono text-green-700 text-xs hover:text-green-900 hover:underline cursor-pointer"
                        title="点击复制 Bin ID"
                      >
                        {binId.substring(0, 12)}... 📋
                      </button>
                    </div>
                    <div className="pt-2 border-t border-green-200">
                      <p className="text-xs text-green-700 mb-2">
                        ✅ 多端同步已启用！
                      </p>
                      <details className="text-xs text-gray-600">
                        <summary className="cursor-pointer hover:text-gray-800 font-medium">
                          💡 如何在其他设备同步？
                        </summary>
                        <div className="mt-2 p-2 bg-white rounded border border-green-200">
                          <p className="font-medium mb-1">方法一：自动查找（推荐）</p>
                          <p className="mb-2">在其他设备输入相同的 API Key，系统会自动查找并连接到此 Bin。</p>
                          <p className="font-medium mb-1">方法二：手动设置</p>
                          <p>1. 点击 Bin ID 复制</p>
                          <p>2. 在其他设备的浏览器控制台运行复制的代码</p>
                          <p>3. 刷新页面</p>
                        </div>
                      </details>
                    </div>
                  </>
                )}
                {!binId && (
                  <div className="pt-2 border-t border-green-200">
                    <p className="text-xs text-amber-700">
                      ⏳ 等待首次保存创建云端存储...
                    </p>
                  </div>
                )}
              </div>

              {/* 更换 API Key */}
              <button
                onClick={() => {
                  if (confirm('更换 API Key 将清除当前同步配置，确定继续？')) {
                    setIsApiKeyVerified(false);
                    setApiKey('');
                    setAutoUserId('');
                    setBinId('');
                    localStorage.removeItem('jsonbin_api_key');
                    localStorage.removeItem('user_id');
                    localStorage.removeItem('jsonbin_id');
                  }
                }}
                className="w-full text-sm text-red-600 hover:text-red-700 hover:underline"
              >
                更换 API Key
              </button>
            </div>
          )}

          {/* 底部按钮 */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
              {isApiKeyVerified ? '关闭' : '稍后设置'}
            </button>
            {isApiKeyVerified && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all font-semibold"
              >
                完成 🎉
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
