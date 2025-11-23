// 预设的高质量书籍和电影推荐
export const defaultBooks = [
  {
    id: 'book_1',
    title: '思考，快与慢',
    author: '丹尼尔·卡尼曼',
    category: '心理学',
    status: 'planned',
    priority: 'A',
    summary: '理解你的大脑如何工作，颠覆对决策的认知',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'book_2',
    title: '人类简史',
    author: '尤瓦尔·赫拉利',
    category: '历史',
    status: 'planned',
    priority: 'A',
    summary: '关于人类历史的宏大叙事，刷新世界观',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'book_3',
    title: '穷查理宝典',
    author: '查理·芒格',
    category: '思维',
    status: 'planned',
    priority: 'A',
    summary: '学习跨学科的多元思维模型',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'book_4',
    title: '乡土中国',
    author: '费孝通',
    category: '社会学',
    status: 'planned',
    priority: 'B',
    summary: '理解中国传统社会结构与人情世故的基石',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'book_5',
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    category: '文学',
    status: 'planned',
    priority: 'B',
    summary: '体验极致的文学魅力和孤独的永恒主题',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'book_6',
    title: '万历十五年',
    author: '黄仁宇',
    category: '历史',
    status: 'planned',
    priority: 'B',
    summary: '"大历史观"下看明朝的缩影，理解中国',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'book_7',
    title: '哲学家们都干了些什么',
    author: '林欣浩',
    category: '哲学',
    status: 'planned',
    priority: 'B',
    summary: '轻松有趣的西方哲学入门',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'book_8',
    title: '活着',
    author: '余华',
    category: '文学',
    status: 'planned',
    priority: 'B',
    summary: '在苦难中理解生命的韧性与意义',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const defaultMovies = [
  {
    id: 'movie_1',
    title: '肖申克的救赎',
    director: '弗兰克·德拉邦特',
    genre: '剧情',
    status: 'planned',
    summary: '关于希望、自由与体制化的终极寓言',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'movie_2',
    title: '辛德勒的名单',
    director: '史蒂文·斯皮尔伯格',
    genre: '历史/剧情',
    status: 'planned',
    summary: '在黑暗中见证人性的光辉，反思历史',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'movie_3',
    title: '楚门的世界',
    director: '彼得·威尔',
    genre: '科幻/剧情',
    status: 'planned',
    summary: '对媒体、真实与自由的超前探讨',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'movie_4',
    title: '一一',
    director: '杨德昌',
    genre: '剧情',
    status: 'planned',
    summary: '一部"全方位"的家庭史诗，道尽人生百味',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'movie_5',
    title: '海上钢琴师',
    director: '朱塞佩·托纳多雷',
    genre: '剧情/音乐',
    status: 'planned',
    summary: '关于选择、孤独与精神家园的哲思',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'movie_6',
    title: '阿甘正传',
    director: '罗伯特·泽米吉斯',
    genre: '剧情',
    status: 'planned',
    summary: '用单纯视角穿越美国现代史，诠释"美国精神"',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'movie_7',
    title: '辩护人',
    director: '杨宇硕',
    genre: '剧情',
    status: 'planned',
    summary: '基于真实事件，看个人对抗强权的勇气',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'movie_8',
    title: '布达佩斯大饭店',
    director: '韦斯·安德森',
    genre: '喜剧/剧情',
    status: 'planned',
    summary: '极致的对称美学与色彩构图，视觉享受',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// 获取默认数据的函数
export const getDefaultGrowthPlanData = () => ({
  books: defaultBooks,
  movies: defaultMovies
});