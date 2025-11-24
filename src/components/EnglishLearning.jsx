import React, { useState } from 'react';
import { BookOpen, PenTool, Headphones, Layers, ChevronRight, Volume2, Check, X } from 'lucide-react';

const EnglishLearning = ({ onBack }) => {
  const [activeModule, setActiveModule] = useState('writing'); // reading, vocabulary, writing, listening
  const [currentPhase, setCurrentPhase] = useState(1); // 1: 启动期, 2: 爬坡期, 3: 流利期

  // 模块配置
  const modules = [
    { id: 'reading', name: '阅读区', icon: BookOpen, color: 'bg-blue-500' },
    { id: 'vocabulary', name: '单词区', icon: Layers, color: 'bg-green-500' },
    { id: 'writing', name: '造句写作区', icon: PenTool, color: 'bg-purple-500' },
    { id: 'listening', name: '听力区', icon: Headphones, color: 'bg-orange-500' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      {/* 头部 */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🧩 LegoLingua (积木英语)
            </h1>
            <p className="text-gray-600">像搭积木一样，自然而然说出长难句</p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            返回
          </button>
        </div>

        {/* 学习阶段指示器 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            {[
              { phase: 1, name: '启动期', desc: '高频词组 + 简单句结构' },
              { phase: 2, name: '爬坡期', desc: '句子扩展 + 时态/语态' },
              { phase: 3, name: '流利期', desc: '长难句逻辑 + 场景交流' }
            ].map((item, index) => (
              <React.Fragment key={item.phase}>
                <div
                  onClick={() => setCurrentPhase(item.phase)}
                  className={`flex-1 cursor-pointer p-3 rounded-lg transition-all ${
                    currentPhase === item.phase
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="text-sm font-semibold">{item.name}</div>
                  <div className={`text-xs mt-1 ${currentPhase === item.phase ? 'text-white/90' : 'text-gray-500'}`}>
                    {item.desc}
                  </div>
                </div>
                {index < 2 && (
                  <ChevronRight className="w-5 h-5 text-gray-400 mx-2 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 模块导航 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`p-4 rounded-lg shadow-sm transition-all ${
                  activeModule === module.id
                    ? `${module.color} text-white shadow-lg scale-105`
                    : 'bg-white text-gray-700 hover:shadow-md hover:scale-102'
                }`}
              >
                <Icon className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-medium">{module.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto">
        {activeModule === 'writing' && <SentenceBuilding phase={currentPhase} />}
        {activeModule === 'reading' && <ReadingZone />}
        {activeModule === 'vocabulary' && <VocabularyZone />}
        {activeModule === 'listening' && <ListeningZone />}
      </div>
    </div>
  );
};

// 造句写作区 - 句法积木 (Syntax Legos)
const SentenceBuilding = ({ phase }) => {
  // 句子模板库
  const sentenceTemplates = [
    {
      subject: 'I', verb: 'eat',
      steps: [
        { key: 'object', prompt: '吃什么？', suggestions: ['an apple', 'breakfast', 'lunch', 'a sandwich', 'pizza'], color: 'text-green-600', bgColor: 'bg-green-100' },
        { key: 'place', prompt: '在哪里吃？', suggestions: ['in the kitchen', 'at home', 'in the restaurant', 'at school', 'in the office'], color: 'text-blue-600', bgColor: 'bg-blue-100' },
        { key: 'time', prompt: '什么时候？', suggestions: ['every morning', 'at noon', 'in the evening', 'after work', 'on weekends'], color: 'text-purple-600', bgColor: 'bg-purple-100' },
        { key: 'with', prompt: '和谁一起？', suggestions: ['with my mom', 'with my friends', 'with my family', 'alone', 'with colleagues'], color: 'text-orange-600', bgColor: 'bg-orange-100' }
      ]
    },
    {
      subject: 'I', verb: 'work',
      steps: [
        { key: 'place', prompt: '在哪里工作？', suggestions: ['in the office', 'at home', 'in a coffee shop', 'remotely', 'at the company'], color: 'text-blue-600', bgColor: 'bg-blue-100' },
        { key: 'time', prompt: '什么时候？', suggestions: ['from 9 to 5', 'in the morning', 'every weekday', 'full-time', 'part-time'], color: 'text-purple-600', bgColor: 'bg-purple-100' },
        { key: 'object', prompt: '做什么工作？', suggestions: ['on AI projects', 'as a developer', 'with my team', 'on product design', 'as an engineer'], color: 'text-green-600', bgColor: 'bg-green-100' },
        { key: 'with', prompt: '和谁一起？', suggestions: ['with my colleagues', 'with a team', 'independently', 'with clients', 'with partners'], color: 'text-orange-600', bgColor: 'bg-orange-100' }
      ]
    },
    {
      subject: 'I', verb: 'learn',
      steps: [
        { key: 'object', prompt: '学什么？', suggestions: ['English', 'programming', 'AI technology', 'new skills', 'data science'], color: 'text-green-600', bgColor: 'bg-green-100' },
        { key: 'place', prompt: '在哪里学？', suggestions: ['online', 'at school', 'at home', 'in the library', 'from courses'], color: 'text-blue-600', bgColor: 'bg-blue-100' },
        { key: 'time', prompt: '什么时候？', suggestions: ['every day', 'in the evening', 'on weekends', 'after work', 'in my free time'], color: 'text-purple-600', bgColor: 'bg-purple-100' },
        { key: 'method', prompt: '怎么学？', suggestions: ['by practicing', 'by reading', 'through projects', 'with AI tools', 'step by step'], color: 'text-orange-600', bgColor: 'bg-orange-100' }
      ]
    },
    {
      subject: 'I', verb: 'build',
      steps: [
        { key: 'object', prompt: '构建什么？', suggestions: ['AI products', 'web applications', 'mobile apps', 'software tools', 'learning systems'], color: 'text-green-600', bgColor: 'bg-green-100' },
        { key: 'purpose', prompt: '为了什么？', suggestions: ['for users', 'to solve problems', 'for learning', 'for my company', 'to help people'], color: 'text-purple-600', bgColor: 'bg-purple-100' },
        { key: 'method', prompt: '用什么方式？', suggestions: ['with modern tech', 'using AI', 'step by step', 'with best practices', 'collaboratively'], color: 'text-blue-600', bgColor: 'bg-blue-100' },
        { key: 'time', prompt: '什么时候？', suggestions: ['in my free time', 'at work', 'on weekends', 'every day', 'during projects'], color: 'text-orange-600', bgColor: 'bg-orange-100' }
      ]
    },
    {
      subject: 'I', verb: 'read',
      steps: [
        { key: 'object', prompt: '读什么？', suggestions: ['tech articles', 'AI news', 'technical blogs', 'research papers', 'product updates'], color: 'text-green-600', bgColor: 'bg-green-100' },
        { key: 'place', prompt: '在哪里读？', suggestions: ['online', 'on my phone', 'at home', 'during commute', 'in the office'], color: 'text-blue-600', bgColor: 'bg-blue-100' },
        { key: 'time', prompt: '什么时候？', suggestions: ['every morning', 'before work', 'in the evening', 'daily', 'on weekends'], color: 'text-purple-600', bgColor: 'bg-purple-100' },
        { key: 'purpose', prompt: '为什么读？', suggestions: ['to stay updated', 'to learn new things', 'for my work', 'to improve skills', 'out of interest'], color: 'text-orange-600', bgColor: 'bg-orange-100' }
      ]
    }
  ];

  const [currentTemplate, setCurrentTemplate] = useState(sentenceTemplates[0]);
  const [sentence, setSentence] = useState({ subject: currentTemplate.subject, verb: currentTemplate.verb });
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const steps = currentTemplate.steps;

  const buildSentence = () => {
    let result = sentence.subject + ' ' + sentence.verb;
    steps.forEach(step => {
      if (sentence[step.key]) {
        result += ' ' + sentence[step.key];
      }
    });
    return result + '.';
  };

  const handleAddPart = (value) => {
    const step = steps[currentStep];
    setSentence({ ...sentence, [step.key]: value });
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsComplete(true);
    }
  };

  const reset = () => {
    // 随机选择一个新的句子模板
    const randomIndex = Math.floor(Math.random() * sentenceTemplates.length);
    const newTemplate = sentenceTemplates[randomIndex];
    setCurrentTemplate(newTemplate);
    setSentence({ subject: newTemplate.subject, verb: newTemplate.verb });
    setCurrentStep(0);
    setIsComplete(false);
  };

  const changeSentence = () => {
    // 换一个不同的句子模板
    let newTemplate;
    do {
      const randomIndex = Math.floor(Math.random() * sentenceTemplates.length);
      newTemplate = sentenceTemplates[randomIndex];
    } while (newTemplate.verb === currentTemplate.verb && sentenceTemplates.length > 1);
    
    setCurrentTemplate(newTemplate);
    setSentence({ subject: newTemplate.subject, verb: newTemplate.verb });
    setCurrentStep(0);
    setIsComplete(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🧱 句法积木 (Syntax Legos)</h2>
          <p className="text-gray-600">通过添加积木，逐步构建完整的句子</p>
        </div>
        <button
          onClick={changeSentence}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          换个句子
        </button>
      </div>

      {/* 句子构建区 */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-8 mb-8">
        <div className="flex flex-wrap items-center gap-2 text-2xl font-medium mb-4">
          <span className="px-4 py-2 bg-red-100 text-red-600 rounded-lg">{sentence.subject}</span>
          <span className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg">{sentence.verb}</span>
          {steps.map((step, index) => (
            sentence[step.key] && (
              <span key={step.key} className={`px-4 py-2 ${step.bgColor} ${step.color} rounded-lg`}>
                {sentence[step.key]}
              </span>
            )
          ))}
          <span className="text-gray-600">.</span>
        </div>

        <div className="text-center py-4 bg-white rounded-lg shadow-sm">
          <p className="text-xl text-gray-700 mb-2">{buildSentence()}</p>
          <button className="text-blue-500 hover:text-blue-600 flex items-center gap-1 mx-auto">
            <Volume2 className="w-4 h-4" />
            <span className="text-sm">朗读句子</span>
          </button>
        </div>
      </div>

      {/* 添加积木区 */}
      {!isComplete && currentStep < steps.length && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg font-semibold text-gray-700">{steps[currentStep].prompt}</span>
            <span className="text-sm text-gray-500">(第 {currentStep + 1}/{steps.length} 步)</span>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {steps[currentStep].suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleAddPart(suggestion)}
                className={`p-3 ${steps[currentStep].bgColor} ${steps[currentStep].color} rounded-lg hover:shadow-md transition-all hover:scale-105 text-sm font-medium`}
              >
                {suggestion}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <input
              type="text"
              placeholder="或者输入自定义内容..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value) {
                  handleAddPart(e.target.value);
                  e.target.value = '';
                }
              }}
            />
          </div>
        </div>
      )}

      {/* 完成提示 */}
      {isComplete && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">太棒了！你完成了一个完整的句子！</h3>
              <p className="text-gray-600">继续练习，让长句子变得更自然</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              再来一个句子
            </button>
            <button className="px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              保存到练习记录
            </button>
          </div>
        </div>
      )}

      {/* 进度条 */}
      <div className="flex items-center gap-2">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`flex-1 h-2 rounded-full transition-all ${
              index <= currentStep ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// 阅读区 - 魔力透镜
const ReadingZone = () => {
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // AI新闻源配置
  const newsSources = [
    { name: 'The Verge AI', url: 'https://www.theverge.com/ai-artificial-intelligence' },
    { name: 'AI News', url: 'https://www.artificialintelligence-news.com/' },
    { name: 'Wired AI', url: 'https://www.wired.com/tag/artificial-intelligence/' }
  ];

  // 模拟文章数据（实际应该从API获取）
  const mockArticles = [
    {
      id: 1,
      title: 'OpenAI Launches GPT-4 Turbo with Vision Capabilities',
      source: 'The Verge AI',
      date: '2024-01-15',
      excerpt: 'OpenAI has announced GPT-4 Turbo, a more powerful version of its language model that can now process images and understand visual context...',
      keywords: ['GPT-4', 'language model', 'vision capabilities', 'AI technology', 'OpenAI'],
      keyPhrases: ['process images', 'visual context', 'more powerful version', 'announced today'],
      difficulty: 'intermediate',
      content: `OpenAI has announced GPT-4 Turbo, a more powerful version of its language model that can now process images and understand visual context. The new model represents a significant advancement in AI technology, combining text and image understanding in ways that were previously impossible.

The company demonstrated several impressive capabilities during the launch event. GPT-4 Turbo can analyze photographs, understand diagrams, and even help users with complex visual tasks like debugging code from screenshots or explaining memes.

This breakthrough opens up new possibilities for AI applications across various industries, from healthcare to education and beyond.`
    },
    {
      id: 2,
      title: 'Google DeepMind Achieves Breakthrough in Protein Folding',
      source: 'Wired AI',
      date: '2024-01-14',
      excerpt: 'Researchers at Google DeepMind have made a significant breakthrough in predicting protein structures, potentially revolutionizing drug discovery...',
      keywords: ['DeepMind', 'protein folding', 'drug discovery', 'breakthrough', 'research'],
      keyPhrases: ['significant breakthrough', 'predicting structures', 'revolutionizing drug discovery', 'made possible by'],
      difficulty: 'advanced',
      content: `Researchers at Google DeepMind have made a significant breakthrough in predicting protein structures, potentially revolutionizing drug discovery and our understanding of diseases.

The AI system can now predict the 3D structure of proteins with unprecedented accuracy, a task that previously took years of laboratory work. This advancement could accelerate the development of new medicines and treatments.

Scientists around the world are celebrating this achievement as one of the most important AI applications in healthcare to date.`
    },
    {
      id: 3,
      title: 'Meta Introduces New AI Assistant for Virtual Reality',
      source: 'AI News',
      date: '2024-01-13',
      excerpt: 'Meta has unveiled an AI-powered assistant designed specifically for virtual reality environments, making VR experiences more interactive and intuitive...',
      keywords: ['Meta', 'AI assistant', 'virtual reality', 'VR', 'interactive'],
      keyPhrases: ['AI-powered assistant', 'virtual reality environments', 'more interactive', 'designed specifically for'],
      difficulty: 'beginner',
      content: `Meta has unveiled an AI-powered assistant designed specifically for virtual reality environments, making VR experiences more interactive and intuitive.

The assistant can understand natural language commands and help users navigate virtual spaces, create content, and collaborate with others in real-time. It represents Meta's vision for the future of social interaction in the metaverse.

Early testers have praised the system for its responsiveness and ability to understand context within virtual environments.`
    }
  ];

  const loadTodayArticles = () => {
    setIsLoading(true);
    // 模拟API调用延迟
    setTimeout(() => {
      setArticles(mockArticles);
      setIsLoading(false);
    }, 1000);
  };

  const highlightKeywords = (text, keywords, keyPhrases) => {
    let highlightedText = text;
    
    // 高亮关键短语（优先级更高）
    keyPhrases.forEach(phrase => {
      const regex = new RegExp(`(${phrase})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-purple-200 px-1 rounded">$1</mark>');
    });
    
    // 高亮关键词
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded font-semibold">$1</mark>');
    });
    
    return highlightedText;
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      beginner: 'bg-green-100 text-green-700',
      intermediate: 'bg-blue-100 text-blue-700',
      advanced: 'bg-purple-100 text-purple-700'
    };
    return colors[difficulty] || colors.beginner;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">📖 魔力透镜阅读</h2>
          <p className="text-gray-600">从AI领域文章中学习关键词汇和短语</p>
        </div>
        <button
          onClick={loadTodayArticles}
          disabled={isLoading}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              加载中...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              获取今日文章
            </>
          )}
        </button>
      </div>

      {/* 新闻源说明 */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="text-sm text-blue-900 font-medium mb-2">📰 新闻源：</div>
        <div className="flex flex-wrap gap-2">
          {newsSources.map((source, index) => (
            <span key={index} className="px-3 py-1 bg-white text-blue-700 rounded-full text-xs">
              {source.name}
            </span>
          ))}
        </div>
      </div>

      {/* 文章列表 */}
      {!selectedArticle && articles.length > 0 && (
        <div className="grid gap-4">
          {articles.map((article) => (
            <div
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className="p-6 border border-gray-200 rounded-lg hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-blue-600">
                    {article.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{article.source}</span>
                    <span>•</span>
                    <span>{article.date}</span>
                    <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(article.difficulty)}`}>
                      {article.difficulty}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 mb-3">{article.excerpt}</p>
              <div className="flex flex-wrap gap-2">
                {article.keywords.slice(0, 5).map((keyword, index) => (
                  <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 文章详情 */}
      {selectedArticle && (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedArticle(null)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回文章列表
          </button>

          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">{selectedArticle.title}</h3>
            <div className="flex items-center gap-3 text-sm text-gray-500 mb-6">
              <span>{selectedArticle.source}</span>
              <span>•</span>
              <span>{selectedArticle.date}</span>
              <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(selectedArticle.difficulty)}`}>
                {selectedArticle.difficulty}
              </span>
            </div>

            {/* 关键词和短语图例 */}
            <div className="flex gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-200 rounded"></div>
                <span className="text-sm text-gray-700">关键词</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-200 rounded"></div>
                <span className="text-sm text-gray-700">关键短语</span>
              </div>
            </div>

            {/* 文章内容（带高亮） */}
            <div 
              className="prose prose-lg max-w-none leading-relaxed text-gray-800"
              dangerouslySetInnerHTML={{ 
                __html: highlightKeywords(
                  selectedArticle.content.split('\n\n').map(p => `<p class="mb-4">${p}</p>`).join(''),
                  selectedArticle.keywords,
                  selectedArticle.keyPhrases
                )
              }}
            />

            {/* 词汇表 */}
            <div className="mt-8 p-6 bg-gradient-to-r from-yellow-50 to-purple-50 rounded-lg">
              <h4 className="text-lg font-bold text-gray-900 mb-4">📚 本文词汇表</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-2">关键词 (Keywords):</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.keywords.map((keyword, index) => (
                      <span key={index} className="px-3 py-1 bg-yellow-200 text-yellow-900 rounded font-medium text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-2">关键短语 (Key Phrases):</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.keyPhrases.map((phrase, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-200 text-purple-900 rounded font-medium text-sm">
                        {phrase}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 空状态 */}
      {articles.length === 0 && !isLoading && (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">点击"获取今日文章"开始阅读</p>
        </div>
      )}
    </div>
  );
};

// 单词区 - 胶囊词块
const VocabularyZone = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">💊 胶囊词块</h2>
      <p className="text-gray-600 mb-6">即将上线...</p>
      <div className="bg-gray-50 rounded-lg p-12 text-center">
        <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">高频词组功能开发中</p>
      </div>
    </div>
  );
};

// 听力区 - AI影子伴侣
const ListeningZone = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">🎧 AI影子伴侣</h2>
      <p className="text-gray-600 mb-6">即将上线...</p>
      <div className="bg-gray-50 rounded-lg p-12 text-center">
        <Headphones className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">对话练习功能开发中</p>
      </div>
    </div>
  );
};

export default EnglishLearning;
