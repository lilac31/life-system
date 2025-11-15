import React, { useState, useEffect, useRef } from 'react';

const TimeSelect = ({ value, color, completed = false, onChange, onColorChange, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const colors = [
    { name: '红色', value: 'red', bg: 'bg-red-500', text: 'text-red-600', letter: 'M' },
    { name: '橙色', value: 'orange', bg: 'bg-orange-500', text: 'text-orange-600', letter: 'T' },
    { name: '粉色', value: 'pink', bg: 'bg-pink-500', text: 'text-pink-600', letter: 'I' },
    { name: '绿色', value: 'green', bg: 'bg-green-500', text: 'text-green-600', letter: 'R' },
    { name: '紫色', value: 'purple', bg: 'bg-purple-500', text: 'text-purple-600', letter: 'C' },
    { name: '蓝色', value: 'blue', bg: 'bg-blue-500', text: 'text-blue-600', letter: 'E' },
    { name: '黄色', value: 'yellow', bg: 'bg-yellow-500', text: 'text-yellow-600', letter: 'X' },
    { name: '靛蓝色', value: 'indigo', bg: 'bg-indigo-500', text: 'text-indigo-600', letter: 'B' },
    { name: '腾讯蓝', value: 'tencent', bg: 'bg-[#0066FF]', text: 'text-[#0066FF]', letter: 'F' }
  ];

  const currentColor = colors.find(c => c.value === color) || colors[0];

  // 生成15分钟间隔的时间选项，按正常时间顺序排列，但默认滚动到10:00
  const generateTimeOptions = () => {
    const times = [];
    
    // 按正常时间顺序：00:00-23:45
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeStr);
      }
    }
    
    return times;
  };

  const timeOptions = generateTimeOptions();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 当下拉菜单打开时，设置默认滚动位置到10:00
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      // 延迟确保DOM完全渲染
      const timer = setTimeout(() => {
        if (dropdownRef.current) {
          const tenAmButton = dropdownRef.current.querySelector('button[data-time="10:00"]');
          if (tenAmButton) {
            tenAmButton.scrollIntoView({ 
              behavior: 'instant', 
              block: 'center' 
            });
          } else {
            // 备用方案：直接计算位置
            const tenAmIndex = timeOptions.findIndex(time => time === '10:00');
            if (tenAmIndex !== -1) {
              const itemHeight = 28;
              dropdownRef.current.scrollTop = tenAmIndex * itemHeight - 80;
            }
          }
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, timeOptions]);

  const handleTimeSelect = (time) => {
    onChange(time);
    // 选择时间后自动关闭面板
    setTimeout(() => setIsOpen(false), 100);
  };

  const clearTime = () => {
    onChange('');
    onColorChange('');
    setIsOpen(false);
  };

  const handleColorSelect = (colorValue) => {
    onColorChange(colorValue);
    // 选择颜色不关闭面板，让用户可以继续选择时间
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-6 text-left text-xs px-1 py-0.5 hover:bg-gray-100 focus:outline-none transition-colors ${
          value ? 
            (color ? 
              (completed ? 
                `${currentColor.text} font-medium opacity-70 line-through` : 
                `${currentColor.text} font-medium`
              ) :
              (completed ? 
                'text-gray-600 font-bold opacity-70 line-through' : 
                'text-gray-900 font-bold'
              )
            ) : 
            (completed ? 'text-gray-500' : 'text-gray-400')
        }`}
        title={value ? `${value}` : '点击选择时间'}
      >
        {value || ''}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-[9999] flex"
          style={{
            top: buttonRef.current ? 
              Math.min(
                buttonRef.current.getBoundingClientRect().bottom + 4,
                window.innerHeight - 280
              ) : 'auto',
            left: buttonRef.current ? 
              Math.max(
                4,
                Math.min(
                  buttonRef.current.getBoundingClientRect().left,
                  window.innerWidth - 100
                )
              ) : 'auto'
          }}
        >
          {/* 颜色选择区域 */}
          <div className="w-20 p-2 border-r border-gray-200">
            <div className="text-xs text-gray-600 mb-1.5 text-center">颜色</div>
            <div className="flex flex-col gap-1.5 items-center">
              {colors.map((colorOption) => (
                <button
                  key={colorOption.value}
                  onClick={() => handleColorSelect(colorOption.value)}
                  className={`w-6 h-4 rounded-sm ${colorOption.bg} hover:scale-105 transition-transform flex items-center justify-center text-white text-xs font-bold ${
                    color === colorOption.value ? 'ring-1 ring-gray-400 ring-offset-0' : ''
                  }`}
                  title={`${colorOption.name} (${colorOption.letter})`}
                >
                  <span className="text-[10px] font-bold">{colorOption.letter}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* 时间选择区域 */}
          <div className="w-20 max-h-56 overflow-y-auto">
            <button
              onClick={clearTime}
              className="w-full text-left px-2 py-1 text-xs text-gray-400 hover:bg-gray-50 border-b border-gray-100"
            >
              清除
            </button>
            {timeOptions.map((time) => (
              <button
                key={time}
                data-time={time}
                onClick={() => handleTimeSelect(time)}
                className={`w-full text-left px-2 py-1 text-xs hover:bg-blue-50 transition-colors ${
                  value === time ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSelect;