import React, { useState, useEffect } from 'react';

const PsychologyStudy = ({ onBack }) => {
  const [currentDay, setCurrentDay] = useState(0);
  const [flippedCards, setFlippedCards] = useState({});
  const [quizFeedback, setQuizFeedback] = useState('');

  // 学习数据配置
  const studyData = [
    {
      day: 1,
      title: "Day 1: 大脑说明书 & 社会八卦",
      tags: ["基础心理学", "社会心理学"],
      intro: "今天主要搞懂你的大脑是怎么转的，以及为什么人多了容易变傻。",
      flashcards: [
        { front: "额叶", back: "额头动（管运动、语言、计划）。理工男CPU。" },
        { front: "枕叶", back: "枕头看（管视觉）。睡觉枕着后脑勺做梦。" },
        { front: "刻板印象", back: "觉得戴眼镜的都是学霸，纹身的都是坏人。" },
        { front: "首因效应", back: "第一印象定生死（针对陌生人）。" },
        { front: "归因偏差", back: "我成功是因为我牛，我失败是因为运气差。" }
      ],
      tasks: [
        "下载题库APP，刷基础心理学单选100道",
        "刷社会心理学单选100道",
        "记住口诀：额动、顶感、枕看、颞听"
      ],
      quiz: {
        question: "如果一个人看不见东西了，但是眼睛结构完好，可能是大脑哪个部位受损？",
        options: ["额叶", "顶叶", "枕叶", "颞叶"],
        answer: 2,
        explanation: "解析：枕叶负责视觉（枕头看）。"
      }
    },
    {
      day: 2,
      title: "Day 2: 从生到死 & 谁有病",
      tags: ["发展心理学", "变态心理学"],
      intro: "搞懂皮亚杰的小孩怎么想，搞懂正常人和精神病的区别。",
      flashcards: [
        { front: "皮亚杰：感知运动阶段", back: "0-2岁，只会吃手，客体永久性（看不见不代表消失）。" },
        { front: "皮亚杰：前运算阶段", back: "2-7岁，自我中心，觉得月亮跟着自己走。" },
        { front: "郭念锋三原则", back: "1.主客观统一 2.内在协调 3.人格相对稳定。违背了就是有病。" },
        { front: "一般心理问题", back: "近期发生、原因明确、不影响逻辑、没泛化（就事论事）。" }
      ],
      tasks: [
        "重点攻克皮亚杰四个阶段（必考）",
        "区分一般心理问题 vs 严重心理问题",
        "刷题：发展+变态各80道"
      ],
      quiz: {
        question: "某人失恋了，痛苦了一周，还能正常上班，只是心情不好。这属于？",
        options: ["精神分裂", "严重心理问题", "一般心理问题", "神经症"],
        answer: 2,
        explanation: "解析：时间短（一周），社会功能未受损（能上班），属于一般心理问题。"
      }
    },
    {
      day: 3,
      title: "Day 3: 给灵魂打分 (最难的一天)",
      tags: ["心理测量学"],
      intro: "硬骨头。搞懂信度效度，背下几个公式。",
      flashcards: [
        { front: "信度", back: "尺子准不准（多次测量结果一致性）。" },
        { front: "效度", back: "尺子是不是在测身高（有效性）。" },
        { front: "比率智商公式", back: "IQ = (MA/CA) × 100 (心理年龄/实际年龄)" },
        { front: "MMPI", back: "明尼苏达，测精神病的，566题，用T分数。" }
      ],
      tasks: [
        "死记硬背：MMPI, EPQ, SCL-90, WAIS 分别测什么",
        "背诵标准分公式 Z = (X-X̄)/SD",
        "不要深究统计学原理，会套公式就行"
      ],
      quiz: {
        question: "一个8岁的孩子，测出来心理年龄是10岁，他的比率智商是多少？",
        options: ["80", "100", "120", "125"],
        answer: 3,
        explanation: "解析：10 / 8 * 100 = 1.25 * 100 = 125。"
      }
    },
    {
      day: 4,
      title: "Day 4: 好好说话的艺术",
      tags: ["咨询技能"],
      intro: "怎么聊天才能治病？记住：少说话，多点头。",
      flashcards: [
        { front: "共情", back: "穿上对方的鞋走路（感同身受，不是同情）。" },
        { front: "阻抗", back: "迟到、沉默、讲废话 = 潜意识不想治。" },
        { front: "移情", back: "把咨询师当成他爹/初恋。" },
        { front: "价值中立", back: "别批判小三，别批判出轨，别教人做人。" }
      ],
      tasks: [
        "阅读案例分析题的常见套路",
        "记住：不求助者不理",
        "刷技能类题目100道"
      ],
      quiz: {
        question: "求助者说：\"我恨死我爸了！\"咨询师说：\"你恨你父亲，是因为他以前打过你吗？\"这属于什么技术？",
        options: ["倾听", "具体化", "内容反应", "情感反应"],
        answer: 1,
        explanation: "解析：咨询师在询问具体原因，让问题更清晰，属于具体化技术。"
      }
    },
    {
      day: 5,
      title: "Day 5: 职业道德 (送分题)",
      tags: ["伦理"],
      intro: "有些红线绝对不能踩，踩了就吊销执照。",
      flashcards: [
        { front: "保密例外", back: "杀人、自杀、虐待儿童/老人、法律规定。除此之外打死不说。" },
        { front: "双重关系", back: "不能和来访者谈恋爱、做生意。咨询结束3年内也不行。" },
        { front: "专业胜任力", back: "不会治的病别瞎治，赶紧转诊。" }
      ],
      tasks: [
        "浏览《伦理守则》",
        "做50道伦理题，争取全对",
        "复习前几天的错题"
      ],
      quiz: {
        question: "来访者告诉咨询师他计划今晚去杀掉邻居，咨询师应该？",
        options: ["继续保密", "劝他别去", "打破保密，报警并通知受害人", "和他讨论杀人的坏处"],
        answer: 2,
        explanation: "解析：涉及重大生命安全（杀人），属于保密例外，必须报警。"
      }
    },
    {
      day: 6,
      title: "Day 6: 全真模拟",
      tags: ["模拟考"],
      intro: "今天不学新知识，只做题。查漏补缺。",
      flashcards: [
        { front: "心态", back: "60分万岁，多一分浪费。" },
        { front: "策略", back: "多选题少选有分，多选错选0分。不确定的少选！" }
      ],
      tasks: [
        "找一套完整真题，严格按时间做一遍",
        "只分析错题，把错题知识点抄下来",
        "早点睡觉"
      ],
      quiz: {
        question: "多选题策略：如果一个多选题答案是ABC，你只选了AB，得分吗？",
        options: ["不得分", "得满分", "得部分分", "倒扣分"],
        answer: 2,
        explanation: "解析：现在的考试规则通常是少选得部分分，选错不得分。所以不确定的选项不要选。"
      }
    },
    {
      day: 7,
      title: "Day 7: 考前磨枪",
      tags: ["冲刺"],
      intro: "最后一天，背背数字，调整呼吸。",
      flashcards: [
        { front: "SAS/SDS", back: "焦虑/抑郁自评量表，分界值50/53。" },
        { front: "韦氏智力", back: "平均数10，标准差3（分测验）；平均数100，标准差15（总智商）。" }
      ],
      tasks: [
        "背诵Day 6整理的错题点",
        "不要再做难题怪题了",
        "准备好准考证、身份证"
      ],
      quiz: {
        question: "祝你考试顺利！",
        options: ["必过", "稳过", "高分过", "全都要"],
        answer: 3,
        explanation: "解析：心态稳住，你已经准备好了！"
      }
    }
  ];

  const currentData = studyData[currentDay];

  const switchDay = (index) => {
    setCurrentDay(index);
    setFlippedCards({});
    setQuizFeedback('');
  };

  const toggleCard = (cardIndex) => {
    setFlippedCards(prev => ({
      ...prev,
      [cardIndex]: !prev[cardIndex]
    }));
  };

  const checkAnswer = (selected, correct, explanation) => {
    if (selected === correct) {
      setQuizFeedback(`✅ 回答正确！ ${explanation}`);
    } else {
      setQuizFeedback(`❌ 答错了。 ${explanation}`);
    }
  };

  return (
    <div style={{
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      backgroundColor: '#f4f7f6',
      color: '#333',
      minHeight: '100vh',
      lineHeight: '1.6'
    }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #4a90e2, #357abd)',
        color: 'white',
        padding: '2rem 1rem',
        textAlign: 'center',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <button
          onClick={onBack}
          style={{
            position: 'absolute',
            left: '20px',
            top: '20px',
            padding: '8px 16px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← 返回
        </button>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>🧠 心理咨询师 7天极限突击</h1>
        <p style={{ opacity: 0.9, fontSize: '0.9rem', marginTop: '5px' }}>
          拒绝枯燥，人话学习，一周通关
        </p>
      </header>

      <div style={{ maxWidth: '800px', margin: '20px auto', padding: '0 15px' }}>
        {/* 导航 */}
        <div style={{
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          paddingBottom: '10px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'inline-flex', gap: '10px' }}>
            {studyData.map((data, index) => (
              <button
                key={index}
                onClick={() => switchDay(index)}
                style={{
                  background: currentDay === index ? '#4a90e2' : 'white',
                  color: currentDay === index ? 'white' : '#666',
                  border: currentDay === index ? '1px solid #4a90e2' : '1px solid #ddd',
                  padding: '10px 20px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transform: currentDay === index ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: currentDay === index ? '0 2px 5px rgba(74, 144, 226, 0.4)' : 'none',
                  transition: 'all 0.3s'
                }}
              >
                Day {data.day}
              </button>
            ))}
          </div>
        </div>

        {/* 主内容 */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '25px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
          marginBottom: '20px',
          animation: 'fadeIn 0.5s ease'
        }}>
          <h2 style={{
            color: '#4a90e2',
            borderBottom: '2px solid #f0f0f0',
            paddingBottom: '10px'
          }}>
            {currentData.title}
          </h2>
          
          <div style={{ marginBottom: '15px' }}>
            {currentData.tags.map((tag, i) => (
              <span key={i} style={{
                display: 'inline-block',
                background: '#e1ecf4',
                color: '#39739d',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.8rem',
                marginRight: '5px'
              }}>
                {tag}
              </span>
            ))}
          </div>

          <p style={{ marginTop: '15px', fontSize: '1.1rem' }}>
            {currentData.intro}
          </p>

          {/* 核心概念卡片 */}
          <h3>💡 核心概念 (人话版)</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '15px',
            margin: '20px 0'
          }}>
            {currentData.flashcards.map((card, index) => (
              <div
                key={index}
                onClick={() => toggleCard(index)}
                style={{
                  background: flippedCards[index] ? '#50e3c2' : '#fff',
                  color: flippedCards[index] ? '#004d40' : '#333',
                  border: `2px solid ${flippedCards[index] ? '#50e3c2' : '#50e3c2'}`,
                  borderRadius: '10px',
                  padding: '15px',
                  cursor: 'pointer',
                  minHeight: '100px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  transition: 'all 0.3s'
                }}
              >
                {!flippedCards[index] ? (
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                      {card.front}
                    </div>
                    <small style={{ fontSize: '0.75rem', color: '#666' }}>
                      (点击查看人话)
                    </small>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.95rem' }}>
                    {card.back}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 任务清单 */}
          <h3>📋 今日任务</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {currentData.tasks.map((task, index) => (
              <li key={index} style={{
                background: '#f9f9f9',
                margin: '5px 0',
                padding: '10px',
                borderLeft: '4px solid #4a90e2',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{ marginRight: '10px' }}>✅</span>
                {task}
              </li>
            ))}
          </ul>

          {/* 每日测验 */}
          <div style={{
            background: '#fff8e1',
            border: '1px solid #ffe082',
            padding: '15px',
            borderRadius: '10px',
            marginTop: '20px'
          }}>
            <h3>📝 每日一测</h3>
            <p>{currentData.quiz.question}</p>
            <div>
              {currentData.quiz.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => checkAnswer(index, currentData.quiz.answer, currentData.quiz.explanation)}
                  style={{
                    display: 'block',
                    width: '100%',
                    margin: '5px 0',
                    padding: '10px',
                    border: '1px solid #ddd',
                    background: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderRadius: '5px'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f0f0f0'}
                  onMouseLeave={(e) => e.target.style.background = 'white'}
                >
                  {option}
                </button>
              ))}
            </div>
            {quizFeedback && (
              <div style={{
                marginTop: '10px',
                fontWeight: 'bold',
                color: quizFeedback.startsWith('✅') ? 'green' : 'red'
              }}>
                {quizFeedback}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PsychologyStudy;
