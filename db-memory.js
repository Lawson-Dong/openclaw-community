// 内存数据库适配器 - 用于 Vercel 部署
// 注意：Vercel 是无服务器架构，不支持文件系统写入

let memoryDB = {
  users: [],
  skills: [],
  questions: [],
  comments: [],
  posts: [],
  wiki: [],
  follows: [],
  favorites: [],
  likes: []
};

// 初始化示例数据
function initData() {
  const bcrypt = require('bcryptjs');
  
  // 管理员
  memoryDB.users.push({
    id: 1,
    email: 'admin@openclaw.community',
    phone: null,
    password: bcrypt.hashSync('admin123', 10),
    username: '管理员',
    avatar: null,
    bio: 'OpenClaw Community 管理员',
    role: 'admin',
    followers: 0,
    following: 0,
    created_at: new Date().toISOString()
  });

  // Lawson
  memoryDB.users.push({
    id: 2,
    email: 'linxindong_0222@qq.com',
    phone: '13543290273',
    password: bcrypt.hashSync('123456', 10),
    username: 'Lawson',
    avatar: null,
    bio: 'OpenClaw爱好者 | 一人公司探索者',
    role: 'user',
    followers: 5,
    following: 3,
    created_at: new Date().toISOString()
  });

  // 示例技能
  memoryDB.skills = [
    {
      id: 1, user_id: 2, title: '小红书自动发布助手',
      description: '自动登录小红书网页版，实现图文内容的自动发布',
      content: '# 小红书自动发布助手\\n\\n## 功能特点\\n- 自动登录\\n- 图文上传\\n- 定时发布',
      tags: '小红书,自动化,社交媒体',
      category: 'web-automation',
      version: 'OpenClaw 1.0+',
      screenshots: '',
      rating: 4.8, rating_count: 12, likes: 45, favorites: 23,
      status: 'active', created_at: new Date().toISOString()
    },
    {
      id: 2, user_id: 2, title: '知乎问答自动回复',
      description: '自动监控知乎邀请回答，使用AI生成高质量回复',
      content: '# 知乎问答自动回复\\n\\n## 功能介绍\\n自动处理知乎问答互动',
      tags: '知乎,问答,AI写作',
      category: 'content', version: 'OpenClaw 1.0+',
      screenshots: '',
      rating: 4.5, rating_count: 8, likes: 32, favorites: 18,
      status: 'active', created_at: new Date().toISOString()
    },
    {
      id: 3, user_id: 2, title: '股票数据自动抓取分析',
      description: '自动抓取股票数据，生成技术分析报告',
      content: '# 股票数据抓取\\n\\n## 功能概述\\n自动化抓取和分析',
      tags: '股票,数据分析,金融',
      category: 'trading', version: 'OpenClaw 1.0+',
      screenshots: '',
      rating: 4.9, rating_count: 25, likes: 78, favorites: 45,
      status: 'active', created_at: new Date().toISOString()
    }
  ];

  // 示例问题
  memoryDB.questions = [
    {
      id: 1, user_id: 2, title: 'OpenClaw安装后无法启动浏览器怎么办？',
      content: '已经安装OpenClaw，但运行skill时提示浏览器无法启动',
      tags: '安装,报错,浏览器',
      views: 156, likes: 12, favorites: 8,
      status: 'active', created_at: new Date().toISOString()
    },
    {
      id: 2, user_id: 2, title: '如何编写自己的第一个Skill？',
      content: '想学习编写OpenClaw Skill，不知道从哪里开始',
      tags: '入门,教程,开发',
      views: 234, likes: 28, favorites: 45,
      status: 'active', created_at: new Date().toISOString()
    }
  ];

  // 示例Wiki
  memoryDB.wiki = [
    {
      id: 1, user_id: 2, title: 'OpenClaw',
      content: 'OpenClaw 是一个开源的AI Agent开发框架',
      slug: 'openclaw', category: 'tool', status: 'active',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    },
    {
      id: 2, user_id: 2, title: 'AI Agent',
      content: 'AI Agent是指能够感知环境、自主决策的智能系统',
      slug: 'ai-agent', category: 'concept', status: 'active',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    }
  ];

  // 示例帖子
  memoryDB.posts = [
    {
      id: 1, user_id: 2, title: '我用OpenClaw搭建了一人公司',
      content: '三个月前我还是上班族，现在有了稳定的副业收入',
      images: '', likes: 156, favorites: 89, views: 1234,
      status: 'active', created_at: new Date().toISOString()
    }
  ];
}

const db = {
  get users() { return memoryDB.users; },
  get skills() { return memoryDB.skills; },
  get questions() { return memoryDB.questions; },
  get comments() { return memoryDB.comments; },
  get posts() { return memoryDB.posts; },
  get wiki() { return memoryDB.wiki; },
  get follows() { return memoryDB.follows; },
  get favorites() { return memoryDB.favorites; },
  get likes() { return memoryDB.likes; },
  
  getNextId(arr) {
    return arr.length > 0 ? Math.max(...arr.map(i => i.id)) + 1 : 1;
  },
  
  save() {
    // 内存数据库无需保存，数据仅在运行时存在
    console.log('[MemoryDB] Changes saved to memory (Vercel compatible)');
  },
  
  load() {
    if (memoryDB.users.length === 0) {
      console.log('[MemoryDB] Initializing sample data...');
      initData();
    }
  }
};

module.exports = db;
