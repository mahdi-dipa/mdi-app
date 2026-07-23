const form = document.getElementById('loginForm');
const errorMsg = document.getElementById('errorMsg');
const submitBtn = document.getElementById('submitBtn');

// اگه از قبل سشن معتبر داره، مستقیم بره به چت
(async function checkExistingSession() {
  try {
    const res = await fetch('/api/me');
    const data = await res.json();
    if (data.authenticated) window.location.href = '/chat.html';
  } catch (_) {}
})();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.hidden = true;
  submitBtn.disabled = true;
  submitBtn.textContent = 'در حال ورود…';

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      errorMsg.textContent = data.error || 'ورود ناموفق بود.';
      errorMsg.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'ورود به قصر';
      return;
    }

    window.location.href = '/chat.html';
  } catch (err) {
    errorMsg.textContent = 'اتصال به سرور برقرار نشد.';
    errorMsg.hidden = false;
    submitBtn.disabled = false;
    submitBtn.textContent = 'ورود به قصر';
  }
});
