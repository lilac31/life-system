// 这是一个示例后端服务器，可以部署到腾讯云SCF或云服务器
// 使用Node.js + Express实现

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/schedule-app';

// 中间件
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// 连接到MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// 定义用户模型
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// 定义日程数据模型
const scheduleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weeklyImportantTasks: { type: Object, default: {} },
  quickTasks: { type: Object, default: {} },
  taskTimeRecords: { type: Object, default: {} },
  totalWorkingHours: { type: Number, default: 40 },
  lastUpdated: { type: Date, default: Date.now }
});

const Schedule = mongoose.model('Schedule', scheduleSchema);

// 身份验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// 路由

// 用户注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 检查用户是否已存在
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户
    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    // 创建用户的初始日程数据
    const schedule = new Schedule({
      userId: user._id,
      weeklyImportantTasks: {},
      quickTasks: {},
      taskTimeRecords: {},
      totalWorkingHours: 40
    });

    await schedule.save();

    // 生成JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 用户登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // 生成JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 获取用户信息
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 获取日程数据
app.get('/api/schedule', authenticateToken, async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ userId: req.user.userId });
    if (!schedule) {
      // 如果没有日程数据，创建默认数据
      const newSchedule = new Schedule({
        userId: req.user.userId,
        weeklyImportantTasks: {},
        quickTasks: {},
        taskTimeRecords: {},
        totalWorkingHours: 40
      });
      
      await newSchedule.save();
      return res.json(newSchedule);
    }
    
    res.json(schedule);
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 保存日程数据
app.post('/api/schedule', authenticateToken, async (req, res) => {
  try {
    const { weeklyImportantTasks, quickTasks, taskTimeRecords, totalWorkingHours } = req.body;
    
    const updateData = {
      lastUpdated: new Date()
    };
    
    if (weeklyImportantTasks !== undefined) {
      updateData.weeklyImportantTasks = weeklyImportantTasks;
    }
    
    if (quickTasks !== undefined) {
      updateData.quickTasks = quickTasks;
    }
    
    if (taskTimeRecords !== undefined) {
      updateData.taskTimeRecords = taskTimeRecords;
    }
    
    if (totalWorkingHours !== undefined) {
      updateData.totalWorkingHours = totalWorkingHours;
    }
    
    const schedule = await Schedule.findOneAndUpdate(
      { userId: req.user.userId },
      updateData,
      { new: true, upsert: true }
    );
    
    res.json({
      message: 'Schedule saved successfully',
      schedule
    });
  } catch (error) {
    console.error('Save schedule error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 更新重要任务
app.put('/api/schedule/important', authenticateToken, async (req, res) => {
  try {
    const { tasks } = req.body;
    
    const schedule = await Schedule.findOneAndUpdate(
      { userId: req.user.userId },
      { 
        importantTasks: tasks,
        lastUpdated: new Date()
      },
      { new: true }
    );
    
    res.json({
      message: 'Important tasks updated successfully',
      importantTasks: schedule.importantTasks
    });
  } catch (error) {
    console.error('Update important tasks error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 更新快速任务
app.put('/api/schedule/quick/:weekKey', authenticateToken, async (req, res) => {
  try {
    const { weekKey } = req.params;
    const { quickTasks } = req.body;
    
    const schedule = await Schedule.findOne({ userId: req.user.userId });
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    // 更新指定周的快速任务
    schedule.quickTasks[weekKey] = quickTasks[weekKey];
    schedule.lastUpdated = new Date();
    
    await schedule.save();
    
    res.json({
      message: 'Quick tasks updated successfully',
      quickTasks: schedule.quickTasks
    });
  } catch (error) {
    console.error('Update quick tasks error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 更新时间记录
app.put('/api/schedule/time-records', authenticateToken, async (req, res) => {
  try {
    const { timeRecords } = req.body;
    
    const schedule = await Schedule.findOneAndUpdate(
      { userId: req.user.userId },
      { 
        taskTimeRecords: timeRecords,
        lastUpdated: new Date()
      },
      { new: true }
    );
    
    res.json({
      message: 'Time records updated successfully',
      taskTimeRecords: schedule.taskTimeRecords
    });
  } catch (error) {
    console.error('Update time records error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 获取用户设置
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    // 这里可以实现用户设置的获取逻辑
    // 目前返回默认设置
    res.json({
      theme: 'light',
      notifications: true,
      workingHours: 8
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 保存用户设置
app.post('/api/settings', authenticateToken, async (req, res) => {
  try {
    // 这里可以实现用户设置的保存逻辑
    const settings = req.body;
    
    res.json({
      message: 'Settings saved successfully',
      settings
    });
  } catch (error) {
    console.error('Save settings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});