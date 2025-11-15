import React, { useState, useEffect } from 'react';

const TimeEditModal = ({ isOpen, onClose, totalTime, onSave }) => {
  const [hours, setHours] = useState(0);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      const h = Math.floor(totalTime);
      setHours(h);
      setInputValue(h.toString());
    }
  }, [isOpen, totalTime]);

  const handleSave = () => {
    const newHours = parseInt(inputValue, 10);
    if (!isNaN(newHours) && newHours > 0) {
      onSave(newHours);
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-80">
        <h3 className="text-lg font-medium text-gray-900 mb-4">修改每周工作时间</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            每周工作时间（小时）
          </label>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="1"
            max="168"
            placeholder="输入每周工作时间"
            autoFocus
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeEditModal;