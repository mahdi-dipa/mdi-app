require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

const username = process.env.MDI_USERNAME;
const password = process.env.MDI_PASSWORD;

if (!username || !password) {
  console.error('❌ MDI_USERNAME و MDI_PASSWORD رو توی فایل .env تنظیم کن، بعد دوباره اجرا کن.');
  process.exit(1);
}

const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
const passwordHash = bcrypt.hashSync(password, 10);

if (existing) {
  db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(passwordHash, username);
  console.log(`✅ رمز کاربر «${username}» به‌روزرسانی شد.`);
} else {
  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, passwordHash);
  console.log(`✅ کاربر «${username}» ساخته شد.`);
}
