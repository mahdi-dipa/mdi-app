const messagesEl = document.getElementById('messages');
const form = document.getElementById('chatForm');
const input = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const providerSelect = document.getElementById('providerSelect');
const clearBtn = document.getElementById('clearBtn');
const logoutBtn = document.getElementById('logoutBtn');

// ---- بررسی سشن ----
(async function checkAuth() {
  const res = await fetch('/api/me');
  const data = await res.json();
  if (!data.authenticated) {
    window.location.href = '/login.html';
    return;
  }
  loadHistory();
})();

async function loadHistory() {
  const res = await fetch('/api/messages');
  if (!res.ok) return;
  const rows = await res.json();
  if (rows.length === 0) {
    addMessage('bot', 'سلام مهدی 👋 من دیپام. امروز چه فکری تو سرته؟');
    return;
  }
  rows.forEach(r => addMessage(r.role === 'user' ? 'user' : 'bot', r.content, r.created_at));
}

function addMessage(role, text, isoTime) {
  const wrap = document.createElement('div');
  wrap.className = `msg ${role}`;
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.textContent = text;
  const time = document.createElement('div');
  time.className = 'msg-time';
  const d = isoTime ? new Date(isoTime) : new Date();
  time.textContent = d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  wrap.appendChild(bubble);
  wrap.appendChild(time);
  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function showTyping() {
  const el = document.createElement('div');
  el.className = 'typing';
  el.id = 'typingIndicator';
  el.innerHTML = '<span></span><span></span><span></span>';
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}
function hideTyping() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  addMessage('user', text);
  input.value = '';
  sendBtn.disabled = true;
  showTyping();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, provider: providerSelect.value }),
    });
    const data = await res.json();
    hideTyping();

    if (!res.ok) {
      addMessage('bot', data.error || 'یه مشکلی پیش اومد.');
    } else {
      addMessage('bot', data.reply);
    }
  } catch (err) {
    hideTyping();
    addMessage('bot', 'اتصال به سرور برقرار نشد.');
  }

  sendBtn.disabled = false;
  input.focus();
});

clearBtn.addEventListener('click', async () => {
  if (!confirm('کل تاریخچهٔ گفتگو پاک بشه؟')) return;
  await fetch('/api/messages', { method: 'DELETE' });
  messagesEl.innerHTML = '';
  addMessage('bot', 'تاریخچه پاک شد. از اول شروع کنیم؟');
});

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/login.html';
});
