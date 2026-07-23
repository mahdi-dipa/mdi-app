require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { getReply } = require('./ai-providers');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // ۷ روز
      sameSite: 'lax',
      // secure: true فقط پشت HTTPS فعال بشه (Railway/Vercel این رو خودکار فراهم می‌کنن)
      secure: process.env.NODE_ENV === 'production',
    },
  })
);

// ---------- Middleware احراز هویت ----------
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.status(401).json({ error: 'unauthorized' });
}

// ---------- روت‌های احراز هویت (درب مخفی) ----------
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'نام کاربری و رمز عبور لازمه' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباهه' });
  }

  req.session.userId = user.id;
  req.session.username = user.username;
  res.json({ ok: true, username: user.username });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/me', (req, res) => {
  if (req.session && req.session.userId) {
    return res.json({ authenticated: true, username: req.session.username });
  }
  res.json({ authenticated: false });
});

// ---------- روت‌های چت (قصر) ----------
app.get('/api/messages', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT id, role, content, provider, created_at FROM messages ORDER BY id ASC').all();
  res.json(rows);
});

app.post('/api/chat', requireAuth, async (req, res) => {
  const { message, provider, model } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'پیام خالیه' });
  }
  const chosenProvider = provider || 'gemini';

  // پیام کاربر رو ذخیره کن
  db.prepare('INSERT INTO messages (role, content, provider) VALUES (?, ?, ?)').run('user', message, chosenProvider);

  // کل تاریخچه رو برای context به AI بده (آخرین ۲۰ پیام کافیه)
  const history = db
    .prepare('SELECT role, content FROM messages ORDER BY id DESC LIMIT 20')
    .all()
    .reverse();

  try {
    const reply = await getReply(chosenProvider, history, model);
    db.prepare('INSERT INTO messages (role, content, provider) VALUES (?, ?, ?)').run('assistant', reply, chosenProvider);
    res.json({ reply });
  } catch (err) {
    console.error('AI provider error:', err.message);
    res.status(502).json({ error: 'اتصال به هوش مصنوعی ناموفق بود. بعداً دوباره امتحان کن.' });
  }
});

app.delete('/api/messages', requireAuth, (req, res) => {
  db.prepare('DELETE FROM messages').run();
  res.json({ ok: true });
});

// ---------- سرو فایل‌های استاتیک ----------
// صفحه‌ی لاگین همیشه در دسترسه
app.use('/login.html', express.static(path.join(__dirname, 'public', 'login.html')));
app.use('/login.css', express.static(path.join(__dirname, 'public', 'login.css')));
app.use('/login.js', express.static(path.join(__dirname, 'public', 'login.js')));

// chat.html فقط با سشن معتبر قابل مشاهده‌ست
app.get('/chat.html', (req, res) => {
  if (!req.session || !req.session.userId) return res.redirect('/login.html');
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

// هر مسیر ناشناخته → اگه لاگین بود چت، وگرنه صفحه‌ی لاگین
app.get('*', (req, res) => {
  if (req.session && req.session.userId) return res.redirect('/chat.html');
  res.redirect('/login.html');
});

app.listen(PORT, () => {
  console.log(`✅ MDI روی پورت ${PORT} در حال اجراست`);
});
