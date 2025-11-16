import { useState, useEffect } from 'react';
import { dataSyncService } from '../services/apiService';

export default function UserSettings({ onClose }) {
  const [userId, setUserId] = useState('');
  const [inputUserId, setInputUserId] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // 获取当前用户ID
    const currentUserId = localStorage.getItem('userId') || '';
    setUserId(currentUserId);
    setInputUserId(currentUserId);
  }, []);

  const handleSave = async () => {
    if (!inputUserId.trim()) {
      alert('请输入用户ID');
      return;
    }

    try {
      // 保存用户ID
      const newUserId = inputUserId.trim();
      localStorage.setItem('userId', newUserId);
      
      setUserId(newUserId);
      setIsEditing(false);
      
      // 重新初始化同步服务
      console.log('🔄 用户ID已更新，重新初始化同步服务...');
      const syncResult = await dataSyncService.reinitialize();
      
      if (syncResult) {
        alert('用户ID已保存！\n✅ 已从云端同步数据');
        // 刷新页面以应用新数据
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        alert('用户ID已保存！\n📭 未找到云端数据，将在下次保存时上传');
        // 刷新页面
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
      
    } catch (error) {
      console.error('保存用户ID失败:', error);
      
      // 检查是否是用户ID不匹配错误
      if (error.message.includes('User ID mismatch') || error.message.includes('用户ID不匹配')) {
        const confirmOverwrite = window.confirm(
          '⚠️ 云端数据与当前用户ID不匹配！\n\n' +
          '可能的原因：\n' +
          '1. 输入的用户ID有误\n' +
          '2. 云端存储了其他用户的数据\n\n' +
          '您可以选择：\n' +
          '✅ 点击"确定"：清除云端数据，使用当前用户ID重新开始\n' +
          '❌ 点击"取消"：重新输入正确的用户ID\n\n' +
          '注意：选择"确定"将覆盖云端数据，无法恢复！'
        );
        
        if (confirmOverwrite) {
          await handleForceOverwrite(newUserId);
        } else {
          setIsEditing(true);
        }
      } else {
        alert('保存失败：' + error.message);
      }
    }
  };

  const handleForceOverwrite = async (newUserId) => {
    try {
      // 清除云端Bin ID，强制创建新的数据
      localStorage.removeItem('jsonbin_id');
      
      // 重新初始化
      await dataSyncService.getUserId();
      
      // 上传当前本地数据
      const localData = {
        weeklyImportantTasks: JSON.parse(localStorage.getItem('weeklyImportantTasks') || '{}'),
        quickTasks: JSON.parse(localStorage.getItem('quickTasks') || '{}'),
        taskTimeRecords: JSON.parse(localStorage.getItem('taskTimeRecords') || '{}'),
        totalWorkingHours: parseFloat(localStorage.getItem('totalWorkingHours') || '40'),
        yearGoals: JSON.parse(localStorage.getItem('yearGoals') || '[]')
      };
      
      await dataSyncService.uploadToCloud(localData);
      
      alert('✅ 已清除云端数据并上传本地数据！\n\n用户ID: ' + newUserId);
      
      // 刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('强制覆盖失败:', error);
      alert('操作失败：' + error.message);
    }
  };

  const handleGenerate = () => {
    // 生成新的用户ID
    const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setInputUserId(newUserId);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">用户ID设置</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* 说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-semibold mb-2">💡 多端同步说明：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>在多台设备使用<strong>相同的用户ID</strong>即可同步数据</li>
              <li>请妥善保管您的用户ID</li>
              <li>建议将用户ID保存到备忘录或密码管理器</li>
            </ul>
          </div>

          {/* 用户ID不匹配提示 */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <p className="font-semibold mb-2">⚠️ 遇到"用户ID不匹配"错误？</p>
            <ol className="list-decimal list-inside space-y-1">
              <li><strong>检查用户ID</strong>：确保输入的ID完全正确（注意空格）</li>
              <li><strong>确认是否为新设备</strong>：如果是新设备同步，请使用旧设备的ID</li>
              <li><strong>如需重新开始</strong>：系统会询问是否覆盖云端数据</li>
            </ol>
          </div>

          {/* 当前用户ID */}
          {!isEditing ? (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                当前用户ID
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm">
                  {userId || '未设置'}
                </div>
                <button
                  onClick={handleCopy}
                  className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap"
                  disabled={!userId}
                >
                  {copied ? '已复制!' : '复制'}
                </button>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                修改用户ID
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                输入或生成用户ID
              </label>
              <input
                type="text"
                value={inputUserId}
                onChange={(e) => setInputUserId(e.target.value)}
                placeholder="输入您的用户ID"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleGenerate}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  生成新ID
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  保存
                </button>
                <button
                  onClick={() => {
                    setInputUserId(userId);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 使用步骤 */}
          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold text-gray-700 mb-2">📱 多端同步步骤：</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>
                <strong>首次使用</strong>：点击"生成新ID"创建您的专属ID
              </li>
              <li>
                <strong>复制ID</strong>：点击"复制"按钮保存到备忘录
              </li>
              <li>
                <strong>其他设备</strong>：打开本应用，点击"修改用户ID"
              </li>
              <li>
                <strong>粘贴ID</strong>：粘贴刚才复制的ID并保存
              </li>
              <li>
                <strong>完成</strong>：所有设备使用相同ID后即可自动同步
              </li>
            </ol>
          </div>

          {/* 警告 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
            ⚠️ <strong>注意</strong>：更换用户ID后，原有的云端数据将无法访问。建议首次设置后不要随意更改。
          </div>
        </div>
      </div>
    </div>
  );
}
