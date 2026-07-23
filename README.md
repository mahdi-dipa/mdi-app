# MDI — قصر + درب مخفی (MVP قدم ۱ و ۲)

## راه‌اندازی محلی

```bash
npm install
cp .env.example .env
```

سپس `.env` رو باز کن و پر کن:
- `MDI_USERNAME` و `MDI_PASSWORD` → مشخصات ورود مهدی
- `SESSION_SECRET` → یه رشتهٔ رندوم طولانی
- حداقل یکی از کلیدهای API (`GEMINI_API_KEY` رایگانه، پیشنهاد می‌شه اول همون رو بزاری)

بعد کاربر رو بساز:
```bash
npm run seed
```

و سرور رو بالا بیار:
```bash
npm start
```

برو به `http://localhost:3000` — می‌فرسته‌ت به `/login.html`.

## استقرار (Deploy) روی Railway
1. این پوشه رو به یه ریپوی گیت‌هاب پوش کن
2. توی Railway، «New Project → Deploy from GitHub»
3. متغیرهای همون `.env` رو توی تب Variables اضافه کن (به‌جز چیزی که `.env.example` نداره)
4. Railway خودش `npm install` و `npm start` رو اجرا می‌کنه
5. بعد از اولین دیپلوی، یه‌بار از Railway Shell یا لوکال، `npm run seed` رو بزن تا کاربر ساخته بشه (چون دیتابیس SQLite روی دیسک پایدار Railway ذخیره می‌شه، این کار فقط یه‌بار لازمه)

## ساختار فعلی
```
mdi-app/
  server.js         → روت‌های Express (لاگین، چت، سرو استاتیک)
  db.js             → اسکیمای SQLite (users, messages, و ideas برای بعد)
  ai-providers.js   → اتصال به OpenAI/Anthropic/Gemini/DeepSeek با پرامپت دیپا
  seed-user.js      → ساخت/آپدیت کاربر مجاز از روی .env
  public/
    login.html/css/js   → درب مخفی
    chat.html/css/js    → قصر
```

## قدم بعدی
جدول `ideas` توی `db.js` از الان آماده‌ست. وقتی خواستی بریم سراغ «باغ جرقه‌ها»، فقط کافیه:
- روت‌های `/api/ideas` (GET/POST/PATCH/DELETE) به `server.js` اضافه بشه
- صفحهٔ `garden.html` با همین تم ساخته بشه
