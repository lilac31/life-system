import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Target, ChevronDown } from 'lucide-react';

const OKRSelect = ({ value, onChange, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [okrData, setOkrData] = useState(null);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // 加载OKR数据
  useEffect(() => {
    const savedOkr = localStorage.getItem('okrData');
    if (savedOkr) {
      try {
        const data = JSON.parse(savedOkr);
        setOkrData(data);
      } catch (e) {
        console.error('Failed to load OKR data:', e);
      }
    }
  }, []);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 计算下拉框位置
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // 下拉框高度约250px
      const dropdownHeight = 250;
      
      let top, left;
      
      if (spaceBelow >= dropdownHeight || spaceBelow > spaceAbove) {
        // 向下展开
        top = rect.bottom + 4;
      } else {
        // 向上展开
        top = rect.top - dropdownHeight - 4;
      }
      
      left = rect.left;
      
      // 确保不超出右侧边界
      if (left + 200 > window.innerWidth) {
        left = window.innerWidth - 200 - 10;
      }
      
      setDropdownPosition({ top, left });
    }
  }, [isOpen]);

  const handleToggle = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleSelect = (objectiveId, keyResultId) => {
    onChange({ objectiveId, keyResultId });
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setIsOpen(false);
  };

  // 获取选中的显示文本
  const getDisplayText = () => {
    if (!value || !okrData) return null;
    
    const objective = okrData.objectives?.find(o => o.id === value.objectiveId);
    if (!objective) return null;
    
    if (value.keyResultId === 'pending') {
      return { obj: objective, kr: null, text: '待思考' };
    }
    
    const keyResult = objective.keyResults?.find(kr => kr.id === value.keyResultId);
    return { obj: objective, kr: keyResult, text: keyResult?.description || objective.name };
  };

  const display = getDisplayText();

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`flex items-center space-x-1 px-2 py-1 text-xs rounded border transition-colors ${
          value 
            ? 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100' 
            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
        }`}
        title={display ? `${display.obj.name}${display.kr ? ` - ${display.kr.description}` : ' - 待思考'}` : '选择OKR目标'}
      >
        <Target size={12} />
        {display ? (
          <span className="max-w-[80px] truncate">
            {display.obj.name.substring(0, 1)}
            {display.kr && `-${display.kr.description.substring(0, 3)}`}
            {!display.kr && '-待'}
          </span>
        ) : (
          <span>OKR</span>
        )}
        <ChevronDown size={10} />
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: '200px',
            maxHeight: '250px',
            zIndex: 10001
          }}
        >
          {okrData && okrData.objectives && okrData.objectives.length > 0 ? (
            <div className="overflow-y-auto max-h-[250px]">
              {okrData.objectives.map((objective) => (
                <div key={objective.id} className="border-b border-gray-100 last:border-b-0">
                  {/* 目标标题 */}
                  <div
                    className="px-3 py-2 bg-gray-50 font-medium text-xs flex items-center space-x-2"
                    style={{ color: objective.color }}
                  >
                    <Target size={12} />
                    <span>{objective.name}</span>
                  </div>
                  
                  {/* 关键结果列表 */}
                  {objective.keyResults && objective.keyResults.length > 0 ? (
                    objective.keyResults.map((kr) => (
                      <button
                        key={kr.id}
                        onClick={() => handleSelect(objective.id, kr.id)}
                        className={`w-full text-left px-4 py-2 text-xs hover:bg-purple-50 transition-colors ${
                          value?.objectiveId === objective.id && value?.keyResultId === kr.id
                            ? 'bg-purple-100 text-purple-700 font-medium'
                            : 'text-gray-700'
                        }`}
                      >
                        <div className="truncate">{kr.description || '未命名KR'}</div>
                        {kr.target && (
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            目标: {kr.target}{kr.unit}
                          </div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-xs text-gray-400 italic">
                      暂无KR
                    </div>
                  )}
                  
                  {/* 待思考选项 */}
                  <button
                    onClick={() => handleSelect(objective.id, 'pending')}
                    className={`w-full text-left px-4 py-2 text-xs hover:bg-orange-50 transition-colors border-t border-gray-100 ${
                      value?.objectiveId === objective.id && value?.keyResultId === 'pending'
                        ? 'bg-orange-100 text-orange-700 font-medium'
                        : 'text-orange-600'
                    }`}
                  >
                    💭 待思考
                  </button>
                </div>
              ))}
              
              {/* 清除选择 */}
              {value && (
                <button
                  onClick={handleClear}
                  className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors border-t border-gray-200"
                >
                  ✕ 清除选择
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 text-xs text-gray-500 text-center">
              <p>暂无OKR数据</p>
              <p className="mt-1 text-[10px]">请先在OKR页面创建目标</p>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default OKRSelect;
