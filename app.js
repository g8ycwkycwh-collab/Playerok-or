const tg = window.Telegram?.WebApp;
if (tg) {
  try {
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#0a0a0f');
    tg.setBackgroundColor('#0a0a0f');
  } catch (e) {}
}

function getTelegramUser() {
  const user = tg?.initDataUnsafe?.user;
  if (user) {
    return {
      id: user.id,
      username: user.username || '',
      photoUrl: user.photo_url || null,
      fullName: [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Пользователь'
    };
  }
  return { id: 0, username: 'guest', photoUrl: null, fullName: 'Гость' };
}

const currentUser = getTelegramUser();
const STORAGE_KEY = 'playerok_balance_' + (currentUser.id || 'guest');
const defaultBalance = { rub: 0, usd: 0, stars: 0, ton: 0, deals: 0, success: 0, rating: 0 };

function loadBalance() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultBalance, ...JSON.parse(raw) };
  } catch (e) {}
  return { ...defaultBalance };
}
function saveBalance(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
let balance = loadBalance();

function fmtRub(n) { return n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽'; }
function fmtUsd(n) { return n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' $'; }
function fmtStars(n) { return n.toLocaleString('ru-RU') + ' ★'; }
function fmtTon(n) { return n.toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' TON'; }

function setAvatar(imgId, fbId, photo, name) {
  const img = document.getElementById(imgId);
  const fb = document.getElementById(fbId);
  if (!img || !fb) return;
  if (photo) {
    img.src = photo;
    img.style.display = 'block';
    fb.style.display = 'none';
    img.onerror = () => { img.style.display = 'none'; fb.style.display = 'block'; fb.textContent = (name || '?')[0].toUpperCase(); };
  } else {
    img.style.display = 'none';
    fb.style.display = 'block';
    fb.textContent = (name || '?')[0].toUpperCase();
  }
}

function renderUser() {
  const name = currentUser.fullName;
  const un = currentUser.username ? '@' + currentUser.username : ('ID: ' + currentUser.id);
  document.getElementById('home-name').textContent = name;
  document.getElementById('home-username').textContent = un;
  document.getElementById('profile-name').textContent = name;
  document.getElementById('profile-username').textContent = un;
  setAvatar('home-avatar-img', 'home-avatar-fallback', currentUser.photoUrl, name);
  setAvatar('profile-avatar-img', 'profile-avatar-fallback', currentUser.photoUrl, name);
}

function renderBalance() {
  document.getElementById('balance-rub').textContent = fmtRub(balance.rub);
  document.getElementById('balance-usd').textContent = fmtUsd(balance.usd);
  document.getElementById('balance-stars').textContent = fmtStars(balance.stars);
  document.getElementById('balance-ton').textContent = fmtTon(balance.ton);
  document.getElementById('stat-deals').textContent = balance.deals;
  document.getElementById('stat-success').textContent = balance.success;
  document.getElementById('stat-rating').textContent = Number(balance.rating).toFixed(1);
}

function switchScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const t = document.getElementById('screen-' + name);
  if (t) t.classList.add('active');
  if (name !== 'admin' && name !== 'support' && name !== 'history' && name !== 'reviews' && name !== 'rules' && name !== 'deposit' && name !== 'withdraw' && name !== 'newdeal') {
    const nav = document.querySelector(`.nav-item[data-screen="${name}"]`);
    if (nav) nav.classList.add('active');
  }
  document.getElementById('content').scrollTop = 0;
}

function showToast(text) {
  const toast = document.getElementById('toast');
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

// Nav
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const s = item.dataset.screen;
    if (s) switchScreen(s);
  });
});

// Tabs on home
document.querySelectorAll('.tabs .tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const go = tab.dataset.go;
    if (go) switchScreen(go);
  });
});

// Chips / deals tabs
document.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
  document.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
  c.classList.add('active');
}));
document.querySelectorAll('.deals-tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.deals-tab').forEach(x => x.classList.remove('active'));
  t.classList.add('active');
}));
document.querySelectorAll('.lang-btn').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.lang-btn').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
}));

// Admin via search /admin12
const ADMIN_CODE = '/admin12';
function checkAdmin(val) {
  if (val.trim() === ADMIN_CODE) {
    document.getElementById('main-search').value = '';
    openAdmin();
  }
}
document.getElementById('main-search').addEventListener('input', e => checkAdmin(e.target.value));
document.getElementById('main-search').addEventListener('keydown', e => {
  if (e.key === 'Enter') checkAdmin(e.target.value);
});

function openAdmin() {
  document.getElementById('admin-rub').value = balance.rub || '';
  document.getElementById('admin-usd').value = balance.usd || '';
  document.getElementById('admin-stars').value = balance.stars || '';
  document.getElementById('admin-ton').value = balance.ton || '';
  document.getElementById('admin-deals').value = balance.deals || '';
  document.getElementById('admin-success').value = balance.success || '';
  document.getElementById('admin-rating').value = balance.rating || '';
  switchScreen('admin');
  showToast('Админ-панель');
}

document.getElementById('admin-save').addEventListener('click', () => {
  balance.rub = parseFloat(document.getElementById('admin-rub').value) || 0;
  balance.usd = parseFloat(document.getElementById('admin-usd').value) || 0;
  balance.stars = parseInt(document.getElementById('admin-stars').value) || 0;
  balance.ton = parseFloat(document.getElementById('admin-ton').value) || 0;
  balance.deals = parseInt(document.getElementById('admin-deals').value) || 0;
  balance.success = parseInt(document.getElementById('admin-success').value) || 0;
  balance.rating = parseFloat(document.getElementById('admin-rating').value) || 0;
  saveBalance(balance);
  renderBalance();
  showToast('Баланс обновлён ✓');
  switchScreen('home');
});
document.getElementById('admin-reset').addEventListener('click', () => {
  balance = { ...defaultBalance };
  saveBalance(balance);
  renderBalance();
  showToast('Сброшено в 0');
});

// Buttons
document.getElementById('btn-deposit').addEventListener('click', () => switchScreen('deposit'));
document.getElementById('btn-withdraw').addEventListener('click', () => switchScreen('withdraw'));
document.getElementById('btn-promo').addEventListener('click', () => showToast('Halloween-акция!'));
document.getElementById('btn-bell').addEventListener('click', () => switchScreen('chats'));
document.getElementById('btn-filters').addEventListener('click', () => showToast('Фильтры'));
document.getElementById('btn-find').addEventListener('click', () => showToast('Поиск...'));
document.getElementById('btn-refresh-deals').addEventListener('click', () => showToast('Обновлено'));
document.getElementById('link-more').addEventListener('click', e => { e.preventDefault(); switchScreen('rules'); });
document.getElementById('btn-new-deal').addEventListener('click', () => switchScreen('newdeal'));
document.getElementById('btn-my-deals-create').addEventListener('click', () => switchScreen('deals'));
document.getElementById('btn-verify').addEventListener('click', () => showToast('Заявка на верификацию отправлена'));

document.querySelectorAll('.chat-item').forEach(item => {
  item.addEventListener('click', () => {
    if (item.dataset.chat === 'support') switchScreen('support');
    else showToast('Уведомлений пока нет');
  });
});
document.querySelectorAll('.service-item').forEach(item => {
  item.addEventListener('click', () => {
    const p = item.dataset.page;
    if (p) switchScreen(p);
  });
});

document.getElementById('btn-send-support').addEventListener('click', () => {
  const t = document.getElementById('support-text').value.trim();
  if (!t) return showToast('Напишите вопрос');
  document.getElementById('support-text').value = '';
  showToast('Сообщение отправлено в поддержку');
  switchScreen('chats');
});
document.getElementById('btn-deposit-go').addEventListener('click', () => {
  showToast('Напишите менеджеру @playerok012');
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.openTelegramLink('https://t.me/playerok012');
  } else {
    window.open('https://t.me/playerok012', '_blank');
  }
});
document.getElementById('btn-withdraw-go').addEventListener('click', () => {
  showToast('Напишите менеджеру @playerok012');
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.openTelegramLink('https://t.me/playerok012');
  } else {
    window.open('https://t.me/playerok012', '_blank');
  }
});
document.getElementById('btn-create-deal').addEventListener('click', () => {
  const title = document.getElementById('deal-title').value.trim();
  if (!title) return showToast('Укажите название');
  showToast('Передайте подарок менеджеру @playerok012');
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.openTelegramLink('https://t.me/playerok012');
  } else {
    window.open('https://t.me/playerok012', '_blank');
  }
});

renderUser();
renderBalance();
window.switchScreen = switchScreen;
window.showToast = showToast;
