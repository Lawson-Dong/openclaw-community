
console.log('================ FORCED DEBUG START ================');
console.log('Current Node version:', process.version);


try {
  require('express');
  console.log('✅ express loaded');
} catch (e) {
  console.log('❌ express failed:', e.message);
}

const fs = require('fs');
['data', 'views', 'public', 'uploads'].forEach(dir => {
  try {
    if (fs.existsSync(dir)) {
      console.log(`✅ Directory '${dir}' exists`);
    } else {
      console.log(`❌ Directory '${dir}' MISSING`);
    }
  } catch (e) {
    console.log(`❌ Error checking '${dir}':`, e.message);
  }
});

console.log('================ FORCED DEBUG END ================');




const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const marked = require('marked');
const flash = require('connect-flash');

const app = express();
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10;
const IS_VERCEL = process.env.VERCEL === '1';


let db;
if (IS_VERCEL) {
  db = require('./db-memory');
} else {
  const DATA_DIR = path.join(__dirname, 'data');
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  
  db = {
    users: [], skills: [], questions: [], comments: [], posts: [], wiki: [],
    follows: [], favorites: [], likes: [],
    
    save() {
      fs.writeFileSync(path.join(DATA_DIR, 'db.json'), JSON.stringify({
        users: this.users, skills: this.skills, questions: this.questions,
        posts: this.posts, wiki: this.wiki, follows: this.follows,
        favorites: this.favorites, likes: this.likes
      }, null, 2));
    },
    
    load() {
      const dbPath = path.join(DATA_DIR, 'db.json');
      if (fs.existsSync(dbPath)) {
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        this.users = data.users || [];
        this.skills = data.skills || [];
        this.questions = data.questions || [];
        this.posts = data.posts || [];
        this.wiki = data.wiki || [];
        this.follows = data.follows || [];
        this.favorites = data.favorites || [];
        this.likes = data.likes || [];
      }
      this.initAdmin();
    },
    
    initAdmin() {
      if (!this.users.find(u => u.email === 'admin@openclaw.community')) {
        this.users.push({
          id: Date.now(), email: 'admin@openclaw.community', phone: null,
          password: bcrypt.hashSync('admin123', SALT_ROUNDS), username: '管理员',
          avatar: null, bio: 'OpenClaw Community 管理员', role: 'admin',
          followers: 0, following: 0, created_at: new Date().toISOString()
        });
        this.save();
      }
    },
    
    getNextId(arr) {
      return arr.length > 0 ? Math.max(...arr.map(i => i.id)) + 1 : 1;
    }
  };
}

db.load();

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// 中间件
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'openclaw-secret-key-2026',
  resave: false, saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

app.use(flash());
app.set('view engine', 'ejs');

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.flash = req.flash();
  next();
});

const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    req.flash('error', '请先登录');
    return res.redirect('/login');
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error', '无权访问');
    return res.redirect('/');
  }
  next();
};

// 首页
app.get('/', (req, res) => {
  const skills = db.skills.filter(s => s.status === 'active').slice(0, 6);
  const posts = db.posts.filter(p => p.status === 'active').slice(0, 6);
  const questions = db.questions.filter(q => q.status === 'active').slice(0, 6);
  res.render('index', { skills, posts, questions });
});

// 登录/注册
app.get('/login', (req, res) => { if (req.session.user) return res.redirect('/'); res.render('login'); });
app.get('/register', (req, res) => { if (req.session.user) return res.redirect('/'); res.render('register'); });

app.post('/register', (req, res) => {
  const { email, phone, password, username } = req.body;
  if (!email || !password || !username) {
    req.flash('error', '请填写必要信息');
    return res.redirect('/register');
  }
  if (db.users.find(u => u.email === email)) {
    req.flash('error', '邮箱已存在');
    return res.redirect('/register');
  }
  
  const user = {
    id: Date.now(), email, phone, username,
    password: bcrypt.hashSync(password, SALT_ROUNDS),
    avatar: null, bio: '', role: 'user', followers: 0, following: 0,
    created_at: new Date().toISOString()
  };
  db.users.push(user);
  db.save();
  req.flash('success', '注册成功，请登录');
  res.redirect('/login');
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find(u => u.email === email || u.phone === email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    req.flash('error', '邮箱/手机号或密码错误');
    return res.redirect('/login');
  }
  req.session.user = { id: user.id, email: user.email, username: user.username, avatar: user.avatar, role: user.role };
  res.redirect('/profile');
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

// 个人主页
app.get('/profile', requireAuth, (req, res) => {
  const user = db.users.find(u => u.id === req.session.user.id);
  const skills = db.skills.filter(s => s.user_id === user.id && s.status === 'active');
  const posts = db.posts.filter(p => p.user_id === user.id && p.status === 'active');
  const questions = db.questions.filter(q => q.user_id === user.id && q.status === 'active');
  res.render('profile', { user, skills, posts, questions });
});

// 技能目录
app.get('/skills', (req, res) => {
  const { category, search } = req.query;
  let skills = db.skills.filter(s => s.status === 'active');
  if (category) skills = skills.filter(s => s.category === category);
  if (search) skills = skills.filter(s => s.title.includes(search) || s.description.includes(search));
  res.render('skills/index', { skills, filters: req.query });
});

app.get('/skills/new', requireAuth, (req, res) => res.render('skills/new'));

app.post('/skills', requireAuth, upload.array('screenshots', 5), (req, res) => {
  const { title, description, content, tags, category, version } = req.body;
  const skill = {
    id: db.getNextId(db.skills), user_id: req.session.user.id, title, description, content,
    tags, category, version, screenshots: req.files ? req.files.map(f => f.filename).join(',') : '',
    rating: 0, rating_count: 0, likes: 0, favorites: 0, status: 'active',
    created_at: new Date().toISOString()
  };
  db.skills.push(skill);
  db.save();
  req.flash('success', '技能发布成功');
  res.redirect('/skills');
});

app.get('/skills/:id', (req, res) => {
  const skill = db.skills.find(s => s.id === parseInt(req.params.id));
  if (!skill) return res.status(404).send('技能不存在');
  skill.contentHtml = marked.parse(skill.content || '');
  const comments = db.comments.filter(c => c.target_type === 'skill' && c.target_id === skill.id && c.status === 'active');
  res.render('skills/show', { skill, comments });
});

// 问题求助
app.get('/questions', (req, res) => {
  const { sort = 'newest' } = req.query;
  let questions = db.questions.filter(q => q.status === 'active');
  questions = sort === 'hot' 
    ? questions.sort((a, b) => b.likes - a.likes || b.views - a.views)
    : questions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.render('questions/index', { questions, sort });
});

app.get('/questions/new', requireAuth, (req, res) => res.render('questions/new'));

app.post('/questions', requireAuth, (req, res) => {
  const { title, content, tags } = req.body;
  db.questions.push({
    id: db.getNextId(db.questions), user_id: req.session.user.id, title, content, tags,
    views: 0, likes: 0, favorites: 0, status: 'active', created_at: new Date().toISOString()
  });
  db.save();
  res.redirect('/questions');
});

app.get('/questions/:id', (req, res) => {
  const question = db.questions.find(q => q.id === parseInt(req.params.id));
  if (!question) return res.status(404).send('问题不存在');
  question.views++;
  question.contentHtml = marked.parse(question.content || '');
  const comments = db.comments.filter(c => c.target_type === 'question' && c.target_id === question.id && c.status === 'active');
  db.save();
  res.render('questions/show', { question, comments });
});

// 评论
app.post('/comments', requireAuth, (req, res) => {
  const { target_type, target_id, content } = req.body;
  db.comments.push({
    id: db.getNextId(db.comments), user_id: req.session.user.id, target_type, target_id: parseInt(target_id),
    content, likes: 0, status: 'active', created_at: new Date().toISOString()
  });
  db.save();
  res.json({ success: true });
});

// 创意分享
app.get('/posts', (req, res) => {
  const posts = db.posts.filter(p => p.status === 'active').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.render('posts/index', { posts });
});

app.get('/posts/new', requireAuth, (req, res) => res.render('posts/new'));

app.post('/posts', requireAuth, upload.array('images', 9), (req, res) => {
  const { title, content } = req.body;
  db.posts.push({
    id: db.getNextId(db.posts), user_id: req.session.user.id, title, content,
    images: req.files ? req.files.map(f => f.filename).join(',') : '',
    likes: 0, favorites: 0, views: 0, status: 'active', created_at: new Date().toISOString()
  });
  db.save();
  res.redirect('/posts');
});

app.get('/posts/:id', (req, res) => {
  const post = db.posts.find(p => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).send('帖子不存在');
  post.views++;
  post.contentHtml = marked.parse(post.content || '');
  const comments = db.comments.filter(c => c.target_type === 'post' && c.target_id === post.id && c.status === 'active');
  db.save();
  res.render('posts/show', { post, comments });
});

// Wiki
app.get('/wiki', (req, res) => {
  const entries = db.wiki.filter(w => w.status === 'active').sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
  res.render('wiki/index', { entries });
});

app.get('/wiki/new', requireAuth, (req, res) => res.render('wiki/new'));

app.post('/wiki', requireAuth, (req, res) => {
  const { title, content, category, slug } = req.body;
  if (db.wiki.find(w => w.slug === slug)) {
    req.flash('error', 'URL标识已存在');
    return res.redirect('/wiki/new');
  }
  db.wiki.push({
    id: db.getNextId(db.wiki), user_id: req.session.user.id, title, content, slug, category,
    status: 'pending', created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  });
  db.save();
  req.flash('success', 'Wiki条目已提交，等待审核');
  res.redirect('/wiki');
});

app.get('/wiki/:slug', (req, res) => {
  const entry = db.wiki.find(w => w.slug === req.params.slug && w.status === 'active');
  if (!entry) return res.status(404).send('词条不存在');
  entry.contentHtml = marked.parse(entry.content);
  res.render('wiki/show', { entry });
});

// 点赞/收藏/关注 (Toggle)
app.post('/like', requireAuth, (req, res) => {
  const { target_type, target_id } = req.body;
  const userId = req.session.user.id;
  const targetIdInt = parseInt(target_id);
  const idx = db.likes.findIndex(l => l.user_id === userId && l.target_type === target_type && l.target_id === targetIdInt);
  
  const arr = db[target_type + 's'];
  const item = arr.find(i => i.id === targetIdInt);
  
  if (idx === -1) {
    db.likes.push({ user_id: userId, target_type, target_id: targetIdInt, created_at: new Date().toISOString() });
    if (item) item.likes++;
    db.save();
    res.json({ success: true, action: 'liked', likes: item ? item.likes : 0 });
  } else {
    db.likes.splice(idx, 1);
    if (item) item.likes = Math.max(0, item.likes - 1);
    db.save();
    res.json({ success: true, action: 'unliked', likes: item ? item.likes : 0 });
  }
});

app.post('/favorite', requireAuth, (req, res) => {
  const { target_type, target_id } = req.body;
  const userId = req.session.user.id;
  const targetIdInt = parseInt(target_id);
  const idx = db.favorites.findIndex(f => f.user_id === userId && f.target_type === target_type && f.target_id === targetIdInt);
  
  const arr = db[target_type + 's'];
  const item = arr.find(i => i.id === targetIdInt);
  
  if (idx === -1) {
    db.favorites.push({ user_id: userId, target_type, target_id: targetIdInt, created_at: new Date().toISOString() });
    if (item) item.favorites++;
    db.save();
    res.json({ success: true, action: 'favorited', favorites: item ? item.favorites : 0 });
  } else {
    db.favorites.splice(idx, 1);
    if (item) item.favorites = Math.max(0, item.favorites - 1);
    db.save();
    res.json({ success: true, action: 'unfavorited', favorites: item ? item.favorites : 0 });
  }
});

app.post('/follow/:id', requireAuth, (req, res) => {
  const followerId = req.session.user.id;
  const followingId = parseInt(req.params.id);
  const idx = db.follows.findIndex(f => f.follower_id === followerId && f.following_id === followingId);
  
  const following = db.users.find(u => u.id === followingId);
  const follower = db.users.find(u => u.id === followerId);
  
  if (idx === -1) {
    db.follows.push({ follower_id: followerId, following_id: followingId, created_at: new Date().toISOString() });
    if (following) following.followers++;
    if (follower) follower.following++;
    db.save();
    res.json({ success: true, action: 'followed', followers: following ? following.followers : 0 });
  } else {
    db.follows.splice(idx, 1);
    if (following) following.followers = Math.max(0, following.followers - 1);
    if (follower) follower.following = Math.max(0, follower.following - 1);
    db.save();
    res.json({ success: true, action: 'unfollowed', followers: following ? following.followers : 0 });
  }
});

// 后台管理
app.get('/admin', requireAdmin, (req, res) => {
  const skills = db.skills.filter(s => s.status === 'active').slice(0, 10);
  const questions = db.questions.filter(q => q.status === 'active').slice(0, 10);
  const pendingWiki = db.wiki.filter(w => w.status === 'pending');
  res.render('admin/index', { skills, questions, pendingWiki });
});

app.get('/admin/users', requireAdmin, (req, res) => {
  res.render('admin/users', { users: db.users });
});

app.post('/admin/delete/:type/:id', requireAdmin, (req, res) => {
  const { type, id } = req.params;
  const arr = db[type + 's'];
  const item = arr.find(i => i.id === parseInt(id));
  if (item) { item.status = 'deleted'; db.save(); }
  res.json({ success: true });
});

app.post('/admin/wiki/:id/approve', requireAdmin, (req, res) => {
  const wiki = db.wiki.find(w => w.id === parseInt(req.params.id));
  if (wiki) { wiki.status = 'active'; db.save(); }
  res.json({ success: true });
});

app.post('/admin/user/:id/ban', requireAdmin, (req, res) => {
  const user = db.users.find(u => u.id === parseInt(req.params.id));
  if (user) { user.role = 'banned'; db.save(); }
  res.json({ success: true });
});

app.post('/admin/user/:id/unban', requireAdmin, (req, res) => {
  const user = db.users.find(u => u.id === parseInt(req.params.id));
  if (user) { user.role = 'user'; db.save(); }
  res.json({ success: true });
});

// 启动
if (!IS_VERCEL) {
  app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 OpenClaw Community 服务器已启动');
    console.log('='.repeat(50));
    console.log(`📍 本地访问: http://localhost:${PORT}`);
    console.log('='.repeat(50));
    console.log('👤 管理员: admin@openclaw.community / admin123');
    console.log('👤 Lawson: linxindong_0222@qq.com / 123456');
    console.log('='.repeat(50));
  });
}

module.exports = app;
