import React, { useState, useEffect, useRef } from 'react';
import { dataAPI } from '../services/apiService';

const PersonalDashboard = ({ onBack }) => {
  // 初始化默认数据结构
  const getDefaultData = () => ({
    // 核心指标
    internalValue: 0,
    lastMonthValue: 0,
    transferability: 0,
    freedomScore: 0,
    
    // 技能雷达(可迁移的元能力)
    skills: {
      current: [5, 5, 5, 5, 5, 5],
      previous: [3, 3, 3, 3, 3, 3],
      labels: ['数据洞察', '向上管理', '抗压韧性', '系统思维', '高效协作', '持续学习']
    },
    
    // 成就银行
    achievements: [],
    
    // 成长动能(每月数据点)
    growthMomentum: [],
    
    // 第二曲线实验室
    secondCurve: {
      projects: [
        { name: 'B计划', current: 0, target: 1000, unit: '小时', color: '#F59E0B' },
        { name: 'Fuck You Money', current: 0, target: 12, unit: '个月生活费', color: '#10B981' },
        { name: '人脉资产', current: 0, target: 100, unit: '弱关系', color: '#3B82F6' }
      ]
    },
    
    // 元数据
    metadata: {
      initialized: false,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }
  });

  const [data, setData] = useState(getDefaultData());
  const [newAchievementText, setNewAchievementText] = useState('');
  const [newAchievementCategory, setNewAchievementCategory] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentGuideStep, setCurrentGuideStep] = useState(0);
  const [showDailyReminder, setShowDailyReminder] = useState(false);
  
  const radarChartRef = useRef(null);
  const growthChartRef = useRef(null);
  const radarChartInstance = useRef(null);
  const growthChartInstance = useRef(null);

  // 加载数据
  useEffect(() => {
    loadData();
    checkDailyReminder();
  }, []);

  const loadData = () => {
    try {
      const saved = localStorage.getItem('meInc_dashboard');
      if (saved) {
        const parsed = JSON.parse(saved);
        setData(parsed);
        
        // 如果是首次使用,显示引导
        if (!parsed.metadata.initialized) {
          setShowOnboarding(true);
        }
      } else {
        // 首次使用
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const saveData = (newData) => {
    const updated = {
      ...newData,
      metadata: {
        ...newData.metadata,
        lastUpdated: new Date().toISOString()
      }
    };
    
    setData(updated);
    localStorage.setItem('meInc_dashboard', JSON.stringify(updated));
    
    // 集成到life-system的云同步
    try {
      const allData = dataAPI.getAllData();
      allData.meIncDashboard = updated;
      dataAPI.saveData(allData);
    } catch (error) {
      console.warn('云同步失败:', error);
    }
  };

  // 检查每日提醒
  const checkDailyReminder = () => {
    const lastReminder = localStorage.getItem('meInc_lastReminder');
    const today = new Date().toDateString();
    
    if (lastReminder !== today) {
      // 设置随机时间在16:00-18:00之间显示提醒
      const now = new Date();
      const reminderTime = new Date();
      reminderTime.setHours(16 + Math.random() * 2, Math.random() * 60, 0);
      
      if (now > reminderTime) {
        setShowDailyReminder(true);
        localStorage.setItem('meInc_lastReminder', today);
      }
    }
  };

  // 添加成就(STAR法则)
  const addAchievement = () => {
    if (!newAchievementText.trim()) return;
    
    const achievement = {
      id: Date.now(),
      text: newAchievementText,
      category: newAchievementCategory || '资产增值',
      date: new Date().toISOString(),
      energyType: '充能', // 充能/消耗
      skills: [] // 关联的技能标签
    };
    
    const newData = {
      ...data,
      achievements: [achievement, ...data.achievements],
      internalValue: data.internalValue + 5,
      growthMomentum: updateGrowthMomentum(data.growthMomentum, 2)
    };
    
    saveData(newData);
    setNewAchievementText('');
    setNewAchievementCategory('');
    
    // 刷新图表
    if (growthChartInstance.current) {
      const chartData = getGrowthChartData();
      growthChartInstance.current.data.datasets[0].data = chartData;
      growthChartInstance.current.update();
    }
  };

  // 更新成长动能数据
  const updateGrowthMomentum = (currentData, increment) => {
    const thisMonth = new Date().toISOString().substring(0, 7);
    const updated = [...currentData];
    
    const monthIndex = updated.findIndex(d => d.month === thisMonth);
    if (monthIndex >= 0) {
      updated[monthIndex].value += increment;
    } else {
      updated.push({ month: thisMonth, value: 60 + increment });
    }
    
    // 只保留最近6个月
    return updated.slice(-6);
  };

  // 获取成长图表数据
  const getGrowthChartData = () => {
    if (!data.growthMomentum || data.growthMomentum.length === 0) {
      return [60, 62, 65, 68, 70, 72];
    }
    return data.growthMomentum.map(d => d.value);
  };

  // 获取月份标签
  const getMonthLabels = () => {
    if (!data.growthMomentum || data.growthMomentum.length === 0) {
      const months = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${d.getMonth() + 1}月`);
      }
      return months;
    }
    return data.growthMomentum.map(d => {
      const month = parseInt(d.month.split('-')[1]);
      return `${month}月`;
    });
  };

  // 初始化图表
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.async = true;
    script.onload = () => {
      initCharts();
    };
    document.body.appendChild(script);

    return () => {
      if (radarChartInstance.current) radarChartInstance.current.destroy();
      if (growthChartInstance.current) growthChartInstance.current.destroy();
      try {
        document.body.removeChild(script);
      } catch (e) {}
    };
  }, []);

  // 当数据加载完成后更新图表
  useEffect(() => {
    if (window.Chart && radarChartRef.current && !radarChartInstance.current) {
      initCharts();
    }
  }, [data]);

  const initCharts = () => {
    if (!window.Chart) return;

    // 雷达图
    if (radarChartRef.current && !radarChartInstance.current) {
      radarChartInstance.current = new window.Chart(radarChartRef.current, {
        type: 'radar',
        data: {
          labels: data.skills.labels,
          datasets: [{
            label: '现在',
            data: data.skills.current,
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderColor: '#10B981',
            pointBackgroundColor: '#10B981',
            borderWidth: 2
          }, {
            label: '3个月前',
            data: data.skills.previous,
            backgroundColor: 'rgba(148, 163, 184, 0.1)',
            borderColor: '#64748B',
            pointBackgroundColor: '#64748B',
            borderWidth: 1,
            borderDash: [5, 5]
          }]
        },
        options: {
          scales: {
            r: {
              angleLines: { color: '#334155' },
              grid: { color: '#334155' },
              pointLabels: { color: '#F1F5F9', font: { size: 11 } },
              ticks: { display: false, max: 10 }
            }
          },
          plugins: { legend: { display: false } }
        }
      });
    }

    // 折线图
    if (growthChartRef.current && !growthChartInstance.current) {
      growthChartInstance.current = new window.Chart(growthChartRef.current, {
        type: 'line',
        data: {
          labels: getMonthLabels(),
          datasets: [{
            label: '个人成长动能',
            data: getGrowthChartData(),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { grid: { display: false }, ticks: { color: '#94A3B8' } },
            y: { grid: { color: '#334155' }, ticks: { color: '#94A3B8' }, min: 50, max: 100 }
          },
          plugins: { legend: { display: false } }
        }
      });
    }
  };

  // 计算技能迁移率
  const calculateTransferability = () => {
    const avg = data.skills.current.reduce((a, b) => a + b, 0) / data.skills.current.length;
    return Math.round((avg / 10) * 100);
  };

  // 计算转身自由度
  const calculateFreedomScore = () => {
    const projects = data.secondCurve.projects;
    const progress = projects.map(p => p.current / p.target);
    const avg = progress.reduce((a, b) => a + b, 0) / progress.length;
    return (avg * 10).toFixed(1);
  };

  // 引导流程步骤
  const onboardingSteps = [
    {
      title: '欢迎来到 Me, Inc.',
      content: '这不是一个简单的网页,而是你的"个人成长运营系统"。\n\n接下来30秒,我们一起完成初始化设置。'
    },
    {
      title: '步骤1: 定义你的核心能力',
      content: '点击"核心优势雷达"下方的"编辑技能",修改6个维度为你真正的可迁移能力。\n\n❌ 不要填: Excel熟练、听话、加班\n✅ 应该填: 数据洞察、向上管理、抗压韧性'
    },
    {
      title: '步骤2: 设定第二曲线',
      content: '点击"第二曲线实验室"中的"编辑目标",设定你的B计划。\n\n问自己: 如果明天被裁员,我靠什么吃饭?'
    },
    {
      title: '开始使用!',
      content: '每天下班前5分钟,记录一个"小胜利":\n\n今天做的所有烂事里,哪一件让我学到了东西,或者可以写进简历里?\n\n这就是你的"资产"。'
    }
  ];

  // 完成引导
  const completeOnboarding = () => {
    const newData = {
      ...data,
      metadata: {
        ...data.metadata,
        initialized: true
      }
    };
    saveData(newData);
    setShowOnboarding(false);
  };

  return (
    <div style={{ 
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      backgroundColor: '#0F172A',
      color: '#F1F5F9',
      padding: '20px',
      minHeight: '100vh'
    }}>
      {/* 引导弹窗 */}
      {showOnboarding && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1E293B',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '500px',
            border: '1px solid #334155'
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#10B981' }}>
              {onboardingSteps[currentGuideStep].title}
            </h2>
            <p style={{ 
              fontSize: '1rem', 
              lineHeight: '1.6', 
              whiteSpace: 'pre-line',
              color: '#F1F5F9',
              marginBottom: '30px'
            }}>
              {onboardingSteps[currentGuideStep].content}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              {currentGuideStep > 0 && (
                <button
                  onClick={() => setCurrentGuideStep(prev => prev - 1)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#334155',
                    color: '#F1F5F9',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  上一步
                </button>
              )}
              {currentGuideStep < onboardingSteps.length - 1 ? (
                <button
                  onClick={() => setCurrentGuideStep(prev => prev + 1)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#10B981',
                    color: '#0F172A',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  下一步
                </button>
              ) : (
                <button
                  onClick={completeOnboarding}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#10B981',
                    color: '#0F172A',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  开始使用!
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 每日提醒 */}
      {showDailyReminder && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#F59E0B',
          color: '#0F172A',
          padding: '20px',
          borderRadius: '12px',
          maxWidth: '300px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 999
        }}>
          <div style={{ fontWeight: '600', marginBottom: '10px' }}>💡 每日反思时间</div>
          <div style={{ fontSize: '0.9rem', marginBottom: '15px' }}>
            今天做的事情,如果离开这家公司,还有价值吗?
          </div>
          <button
            onClick={() => setShowDailyReminder(false)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#0F172A',
              color: '#F59E0B',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            已记录
          </button>
        </div>
      )}

      {/* 返回按钮 */}
      <button
        onClick={onBack}
        style={{
          marginBottom: '20px',
          padding: '8px 16px',
          backgroundColor: '#1E293B',
          color: '#F1F5F9',
          border: '1px solid #334155',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        ← 返回
      </button>

      {/* 顶部导航 */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '20px',
        borderBottom: '1px solid #334155',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
          Me, <span style={{ color: '#10B981' }}>Inc.</span>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontStyle: 'italic' }}>
          "建立内在记分牌,随时拥有转身的勇气"
        </div>
        <button
          onClick={() => setShowOnboarding(true)}
          style={{
            padding: '6px 12px',
            backgroundColor: '#334155',
            color: '#F1F5F9',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          📖 使用指南
        </button>
      </header>

      {/* 核心指标 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '25px'
      }}>
        <div style={{
          backgroundColor: '#1E293B',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #334155'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '8px' }}>
            内在估值 (非工资资产)
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10B981', marginBottom: '5px' }}>
            {data.internalValue}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            每记录一次成就 +5 分
          </div>
        </div>

        <div style={{
          backgroundColor: '#1E293B',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #334155'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '8px' }}>
            技能迁移率
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3B82F6', marginBottom: '5px' }}>
            {calculateTransferability()}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            基于6维能力评分
          </div>
        </div>

        <div style={{
          backgroundColor: '#1E293B',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #334155'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '8px' }}>
            转身自由度
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#F59E0B', marginBottom: '5px' }}>
            {calculateFreedomScore()}<span style={{ fontSize: '1rem' }}>/10</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            第二曲线储备进度
          </div>
        </div>
      </div>

      {/* 主体仪表盘 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth > 1024 ? '1fr 1.5fr 1fr' : '1fr',
        gap: '20px'
      }}>
        
        {/* 左侧:优势模型 */}
        <div style={{
          backgroundColor: '#1E293B',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #334155'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <div style={{ fontSize: '1rem', fontWeight: '600' }}>核心优势雷达</div>
          </div>
          <div style={{ position: 'relative', height: '220px', width: '100%' }}>
            <canvas ref={radarChartRef}></canvas>
          </div>
          <div style={{
            marginTop: '15px',
            fontSize: '0.75rem',
            color: '#94A3B8',
            textAlign: 'center'
          }}>
            <span style={{ color: '#10B981' }}>● 现在</span> vs <span style={{ color: '#64748B' }}>● 3个月前</span>
          </div>
          <div style={{ marginTop: '15px', fontSize: '0.8rem', color: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.1)', padding: '12px', borderRadius: '8px' }}>
            💡 每季度更新一次评分,看到自己的成长曲线
          </div>
        </div>

        {/* 中间:成就银行 */}
        <div style={{
          backgroundColor: '#1E293B',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <div style={{ fontSize: '1rem', fontWeight: '600' }}>成长动能 & 成就银行</div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
              共 {data.achievements.length} 条资产
            </div>
          </div>
          <div style={{ position: 'relative', height: '160px', width: '100%', marginBottom: '15px' }}>
            <canvas ref={growthChartRef}></canvas>
          </div>
          
          {/* 成就列表 */}
          <div style={{
            flexGrow: 1,
            overflowY: 'auto',
            maxHeight: '250px',
            marginBottom: '15px'
          }}>
            {data.achievements.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#94A3B8',
                fontSize: '0.9rem'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📝</div>
                <div>还没有记录成就</div>
                <div style={{ fontSize: '0.8rem', marginTop: '5px' }}>
                  每天下班前5分钟,记录一个"小胜利"
                </div>
              </div>
            ) : (
              data.achievements.map((achievement, index) => (
                <div key={achievement.id || index} style={{
                  background: 'rgba(255,255,255,0.03)',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  borderLeft: '3px solid #10B981',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ marginBottom: '5px' }}>{achievement.text}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#10B981'
                    }}>
                      #{achievement.category}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#64748B' }}>
                      {new Date(achievement.date).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* STAR法则提示 */}
          <div style={{
            backgroundColor: 'rgba(59,130,246,0.1)',
            padding: '10px',
            borderRadius: '6px',
            marginBottom: '12px',
            fontSize: '0.75rem',
            color: '#3B82F6'
          }}>
            <strong>STAR法则:</strong> 情境-任务-行动-结果
          </div>

          {/* 添加成就 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newAchievementCategory}
                onChange={(e) => setNewAchievementCategory(e.target.value)}
                placeholder="类别(如:项目管理)"
                style={{
                  flex: '0 0 120px',
                  background: '#0F172A',
                  border: '1px solid #334155',
                  color: 'white',
                  padding: '8px',
                  borderRadius: '6px',
                  outline: 'none',
                  fontSize: '0.85rem'
                }}
              />
              <input
                type="text"
                value={newAchievementText}
                onChange={(e) => setNewAchievementText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addAchievement()}
                placeholder="今天有什么小胜利?(STAR法则)"
                style={{
                  flex: 1,
                  background: '#0F172A',
                  border: '1px solid #334155',
                  color: 'white',
                  padding: '8px',
                  borderRadius: '6px',
                  outline: 'none',
                  fontSize: '0.85rem'
                }}
              />
            </div>
            <button
              onClick={addAchievement}
              style={{
                background: '#10B981',
                color: '#0F172A',
                border: 'none',
                padding: '10px',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              💰 存入成就银行
            </button>
          </div>
        </div>

        {/* 右侧:第二曲线 */}
        <div style={{
          backgroundColor: '#1E293B',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <div style={{ fontSize: '1rem', fontWeight: '600' }}>第二曲线实验室</div>
          </div>
          
          {/* 进度条组 */}
          {data.secondCurve.projects.map((project, index) => (
            <div key={index} style={{ marginBottom: '18px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                marginBottom: '6px'
              }}>
                <span>{project.name}</span>
                <span style={{ color: project.color }}>
                  {project.current} / {project.target} {project.unit}
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#334155',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min((project.current / project.target) * 100, 100)}%`,
                  height: '100%',
                  backgroundColor: project.color,
                  borderRadius: '4px',
                  transition: 'width 0.5s ease-in-out'
                }}></div>
              </div>
            </div>
          ))}

          <div style={{
            marginTop: 'auto',
            padding: '15px',
            background: 'rgba(245, 158, 11, 0.1)',
            borderRadius: '8px',
            fontSize: '0.8rem',
            color: '#F59E0B'
          }}>
            <strong>🎯 使用SOP:</strong><br />
            <div style={{ marginTop: '8px', fontSize: '0.75rem', lineHeight: '1.4' }}>
              每周五: 更新进度条<br />
              每月末: 复盘雷达图<br />
              每季度: 计算内在估值增长
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PersonalDashboard;
