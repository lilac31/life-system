import React, { useState, useEffect } from 'react';
import { Bug, RefreshCw } from 'lucide-react';

const DataDebugger = () => {
  const [localStorageData, setLocalStorageData] = useState({});
  const [isOpen, setIsOpen] = useState(false);

  const refreshData = () => {
    const data = {};
    
    // 读取所有localStorage数据
    const keys = [
      'weeklyImportantTasks', 
      'quickTasks', 
      'schedule_data', 
      'taskTimeRecords', 
      'totalWorkingHours',
      'yearGoals'
    ];
    
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          data[key] = JSON.parse(value);
        } catch (e) {
          data[key] = value;
        }
      } else {
        data[key] = null;
      }
    });
    
    console.log('DataDebugger - localStorage数据:', data);
    setLocalStorageData(data);
  };

  useEffect(() => {
    refreshData();
    
    // 快捷键：Ctrl+Shift+B 切换显示
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'B') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 p-3 bg-yellow-500 text-white rounded-full shadow-lg hover:bg-yellow-600 z-50"
        title="数据调试器 (Ctrl+Shift+B)"
      >
        <Bug size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-2xl border-2 border-yellow-400 z-50 max-h-[600px] overflow-auto">
      <div className="sticky top-0 bg-yellow-500 text-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug size={20} />
          <h3 className="font-bold">数据调试器</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshData}
            className="p-1 hover:bg-yellow-600 rounded"
            title="刷新数据"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-xl hover:bg-yellow-600 rounded px-2"
          >
            ×
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* weeklyImportantTasks */}
        <div className="border rounded p-3">
          <h4 className="font-semibold text-sm mb-2 text-yellow-700">
            weeklyImportantTasks
            {localStorageData.weeklyImportantTasks && (
              <span className="ml-2 text-xs text-gray-500">
                ({Object.keys(localStorageData.weeklyImportantTasks).length} 周)
              </span>
            )}
          </h4>
          {localStorageData.weeklyImportantTasks ? (
            Object.keys(localStorageData.weeklyImportantTasks).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(localStorageData.weeklyImportantTasks).map(([weekKey, tasks]) => (
                  <div key={weekKey} className="bg-yellow-50 p-2 rounded text-xs">
                    <div className="font-semibold text-yellow-800 mb-1">{weekKey}</div>
                    {tasks.map((task, idx) => (
                      <div key={idx} className="text-gray-700">
                        TOP{idx + 1}: {task.text || <span className="text-gray-400 italic">空</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                ⚠️ 空对象 - 你还没有填写过重要任务
              </div>
            )
          ) : (
            <div className="text-xs text-gray-500">null</div>
          )}
        </div>

        {/* quickTasks */}
        <div className="border rounded p-3">
          <h4 className="font-semibold text-sm mb-2 text-blue-700">
            quickTasks
            {localStorageData.quickTasks && (
              <span className="ml-2 text-xs text-gray-500">
                ({Object.keys(localStorageData.quickTasks).length} 天)
              </span>
            )}
          </h4>
          {localStorageData.quickTasks ? (
            Object.keys(localStorageData.quickTasks).length > 0 ? (
              <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                包含 {Object.keys(localStorageData.quickTasks).length} 天的快速任务数据
              </div>
            ) : (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                ⚠️ 空对象
              </div>
            )
          ) : (
            <div className="text-xs text-gray-500">null</div>
          )}
        </div>

        {/* taskTimeRecords */}
        <div className="border rounded p-3">
          <h4 className="font-semibold text-sm mb-2 text-purple-700">
            taskTimeRecords
            {localStorageData.taskTimeRecords && Array.isArray(localStorageData.taskTimeRecords) && (
              <span className="ml-2 text-xs text-gray-500">
                ({localStorageData.taskTimeRecords.length} 条)
              </span>
            )}
          </h4>
          {localStorageData.taskTimeRecords ? (
            Array.isArray(localStorageData.taskTimeRecords) && localStorageData.taskTimeRecords.length > 0 ? (
              <div className="text-xs text-gray-600 bg-purple-50 p-2 rounded">
                包含 {localStorageData.taskTimeRecords.length} 条时间记录
              </div>
            ) : (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                ⚠️ 空数组
              </div>
            )
          ) : (
            <div className="text-xs text-gray-500">null</div>
          )}
        </div>

        {/* yearGoals */}
        <div className="border rounded p-3">
          <h4 className="font-semibold text-sm mb-2 text-indigo-700">
            yearGoals
            {localStorageData.yearGoals && (
              <span className="ml-2 text-xs text-gray-500">
                ({Object.keys(localStorageData.yearGoals).length} 项)
              </span>
            )}
          </h4>
          {localStorageData.yearGoals ? (
            Object.keys(localStorageData.yearGoals).length > 0 ? (
              <div className="text-xs text-gray-600 bg-indigo-50 p-2 rounded">
                包含年度目标数据
              </div>
            ) : (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                ⚠️ 空对象
              </div>
            )
          ) : (
            <div className="text-xs text-gray-500">null</div>
          )}
        </div>

        {/* schedule_data */}
        <div className="border rounded p-3">
          <h4 className="font-semibold text-sm mb-2 text-green-700">schedule_data</h4>
          {localStorageData.schedule_data ? (
            <div className="text-xs space-y-1">
              <div>weeks: {Object.keys(localStorageData.schedule_data.weeks || {}).length} 周</div>
              <div>importantTasks: {(localStorageData.schedule_data.importantTasks || []).length} 个</div>
              <div>timeRecords: {(localStorageData.schedule_data.timeRecords || []).length} 条</div>
            </div>
          ) : (
            <div className="text-xs text-gray-500">null</div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="pt-3 border-t space-y-2">
          <button
            onClick={() => {
              console.log('=== localStorage 完整数据 ===');
              console.log('weeklyImportantTasks:', localStorageData.weeklyImportantTasks);
              console.log('quickTasks:', localStorageData.quickTasks);
              console.log('taskTimeRecords:', localStorageData.taskTimeRecords);
              console.log('yearGoals:', localStorageData.yearGoals);
              console.log('schedule_data:', localStorageData.schedule_data);
              console.log('totalWorkingHours:', localStorageData.totalWorkingHours);
              alert('数据已输出到控制台（F12查看）');
            }}
            className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            📋 输出到控制台
          </button>
          
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            💡 提示：
            <ul className="mt-1 ml-3 list-disc space-y-1">
              <li>weeklyImportantTasks：在周视图填写TOP1/TOP2/TOP3</li>
              <li>quickTasks：在周视图的时间格子中添加任务</li>
              <li>taskTimeRecords：任务的时间追踪记录</li>
              <li>weeks：周数据（从schedule_data中）</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataDebugger;
