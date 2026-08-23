// --- FIREBASE КОНФИГУРАЦИЯ ---
const firebaseConfig = {
  apiKey: "AIzaSyCoAJBDeKokgo39QGfnnnT7Ivvnq0UTMYo",
  authDomain: "specmmusic.firebaseapp.com",
  projectId: "specmmusic",
  storageBucket: "specmmusic.firebasestorage.app",
  messagingSenderId: "688850567253",
  appId: "1:688850567253:web:5f67b9813f75fe071f54dc",
  measurementId: "G-ETB6DBSTKL"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

const EMAILJS_PUBLIC_KEY = "Ajz3yU0bBRNvGxBk9";
const SERVICE_ID = "service_k15ogbe";
const TEMPLATE_ID = "template_uvpxtrx";
const DEV_EMAIL = "dimonchikkll639@gmail.com";

// --- МЕДИАТЕКА ---
const playlist = [
  {
    title: "Море пока лето",
    artist: "Хабиб, VAVAN",
    cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBNSS79lZZ3OdcgkrhKLPf_hlxUB4zgNMMcMyGXvWrJg&s=10",
    src: "https://cdn.imageurlgenerator.com/uploads/922b1f7d-3ee9-49c5-94fe-f2673e2e9424.mp3"
  },
  {
    title: "Эвакуация",
    artist: "BADLUCK",
    cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkC5FpOb0Ddve9PX9QDgTMARCcs2HbT-yZeqJgq1nLzQ&s",
    src: "https://cdn.imageurlgenerator.com/uploads/c15eb267-1d4b-46e6-a0e4-2982e15a06b1.mp3"
  }, 
  {
    title: "Базовый Минимум", 
    artist: "Мия Бойка, SABI", 
    cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQth5WNRjA3zJ6OXUDW3ABWtbJJW-2LAP4Ft7GIEJJdXg&s=10", 
    src: "https://cdn.imageurlgenerator.com/uploads/d939a47b-ad81-4c2a-b80c-f6d008354dcd.mp3"
  },
  {
  title: "Малиновая лада",
  artist: "Gayazovs Brothers",
  cover: "https://cdn.imageurlgenerator.com/uploads/e266cf3a-eb67-4458-aada-04088b4c705c.jpg",
  src: "https://cdn.imageurlgenerator.com/uploads/c2958607-e48c-4e3d-a461-315474db71a1.mp3"
  }
];

// --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ---
let currentTrackIndex = 0;
let isPlaying = false;
let isAuthModeLogin = true;
let generatedVerifyCode = null;
let pendingUser = null;
let favorites = JSON.parse(localStorage.getItem('favorite_tracks')) || [];

// --- DOM ЭЛЕМЕНТЫ ---
let audio, cover, title, artist, currentTime, duration, progressBar, volumeBar;
let likeBtn, likeImg, prevBtn, playBtn, nextBtn, waveBtn;
let togglePlaylistBtn, toggleProfileBtn, playlistDrawer, profileDrawer, closePlaylistBtn, closeProfileBtn, trackList;
let authBlock, tabLoginBtn, tabRegisterBtn, authForm, authName, authEmail, authPassword, authSubmitBtn;
let verifyForm, verifyCodeInput, googleLoginBtn;
let userInfoBlock, userName, userEmail, userBadge, upgradeBtn, logoutBtn;
let customAlert, customAlertText, customAlertBtn;

// --- ИКОНКИ ДЛЯ КНОПКИ PLAY/PAUSE ---
const PLAY_ICON = "https://img.icons8.com/ios-filled/50/000000/play.png";
const PAUSE_ICON = "https://img.icons8.com/ios-filled/50/000000/pause.png";

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

function showAlert(text) {
  if (customAlertText && customAlert) {
    customAlertText.textContent = text;
    customAlert.classList.add('active');
  }
}

function closeAlert() {
  if (customAlert) customAlert.classList.remove('active');
}

// --- УПРАВЛЕНИЕ РОЛЯМИ И МОДАЛЬНОЕ ОКНО (DEV И DEV+) ---
function setUserSubscription(uid, newStatus) {
  db.collection('users').doc(uid).set({
    subscription: newStatus
  }, { merge: true })
  .then(() => {
    showAlert(`Статус успешно изменен на ${newStatus}`);
    loadAdminUserList();
  })
  .catch(err => showAlert("Ошибка обновления: " + err.message));
}

function openAdminModal() {
  let modal = document.getElementById('adminModal');

  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'adminModal';
    modal.style.cssText = `
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(5px);
      display: flex; justify-content: center; align-items: center;
      z-index: 1000; padding: 20px; box-sizing: border-box;
    `;

    modal.innerHTML = `
      <div style="
        background: #181818; width: 100%; max-width: 400px; max-height: 80vh;
        border-radius: 12px; padding: 20px; display: flex; flex-direction: column;
        border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3 style="margin: 0; font-size: 1.1rem; color: #fff;">Управление привилегиями</h3>
          <button id="closeAdminModal" style="background: none; border: none; color: #aaa; font-size: 1.5rem; cursor: pointer;">&times;</button>
        </div>
        <div id="adminUserList" style="overflow-y: auto; flex: 1; padding-right: 5px;">
          <p style="color: #888; font-size: 0.85rem;">Загрузка пользователей...</p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('closeAdminModal').addEventListener('click', () => {
      modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  modal.style.display = 'flex';
  loadAdminUserList();
}

function loadAdminUserList() {
  const container = document.getElementById('adminUserList');
  if (!container) return;

  db.collection('users').get().then(snapshot => {
    container.innerHTML = '';
    
    snapshot.forEach(doc => {
      const userData = doc.data();
      const userId = doc.id;
      const currentSub = userData.subscription || 'FREE';
      const email = userData.email || 'Без email';

      const userRow = document.createElement('div');
      userRow.style.cssText = "display: flex; flex-direction: column; gap: 6px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 0.85rem;";
      
      userRow.innerHTML = `
        <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #fff; font-weight: 600;">
          ${email}
        </div>
        <div style="display: flex; gap: 4px;">
          <button class="sub-btn" style="flex: 1; background: ${currentSub === 'FREE' ? '#1db954' : '#333'}; color: #fff; border: none; padding: 6px 2px; border-radius: 6px; cursor: pointer; font-size: 0.7rem; font-weight: bold;">FREE</button>
          <button class="sub-btn" style="flex: 1; background: ${currentSub === 'PREMIUM' ? '#ffb703' : '#333'}; color: ${currentSub === 'PREMIUM' ? '#000' : '#fff'}; border: none; padding: 6px 2px; border-radius: 6px; cursor: pointer; font-size: 0.7rem; font-weight: bold;">PREMIUM</button>
          <button class="sub-btn" style="flex: 1; background: ${currentSub === 'DEV+' ? '#e63946' : '#333'}; color: #fff; border: none; padding: 6px 2px; border-radius: 6px; cursor: pointer; font-size: 0.7rem; font-weight: bold;">DEV+</button>
        </div>
      `;

      const btns = userRow.querySelectorAll('.sub-btn');
      btns[0].addEventListener('click', () => setUserSubscription(userId, 'FREE'));
      btns[1].addEventListener('click', () => setUserSubscription(userId, 'PREMIUM'));
      btns[2].addEventListener('click', () => setUserSubscription(userId, 'DEV+'));

      container.appendChild(userRow);
    });
  }).catch(err => console.error("Ошибка загрузки юзеров:", err));
}

// --- РАЗДЕЛ "БЕЗОПАСНОСТЬ" (ДЛЯ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ) ---
function openSecurityModal() {
  const user = auth.currentUser;
  if (!user) {
    showAlert("Сначала войдите в аккаунт.");
    return;
  }

  let modal = document.getElementById('securityModal');

  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'securityModal';
    modal.style.cssText = `
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(5px);
      display: flex; justify-content: center; align-items: center;
      z-index: 1000; padding: 20px; box-sizing: border-box;
    `;

    modal.innerHTML = `
      <div style="
        background: #181818; width: 100%; max-width: 400px;
        border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 15px;
        border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 25px rgba(0,0,0,0.5); color: #fff;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 1.1rem;">🔒 Безопасность</h3>
          <button id="closeSecurityModal" style="background: none; border: none; color: #aaa; font-size: 1.5rem; cursor: pointer;">&times;</button>
        </div>

        <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; font-size: 0.85rem; display: flex; flex-direction: column; gap: 6px;">
          <div><strong>Email:</strong> <span id="secEmail"></span></div>
          <div><strong>Способ входа:</strong> <span id="secProvider"></span></div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button id="resetPasswordBtn" style="
            background: #2a2a2a; color: #fff; border: 1px solid rgba(255,255,255,0.2);
            padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.85rem; text-align: left;
            display: flex; justify-content: space-between; align-items: center;
          ">
            <span>🔑 Сменить пароль (через Email)</span>
            <span>→</span>
          </button>

          <button id="logoutAllBtn" style="
            background: rgba(230, 57, 70, 0.15); color: #e63946; border: 1px solid rgba(230, 57, 70, 0.3);
            padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.85rem; text-align: left;
            display: flex; justify-content: space-between; align-items: center;
          ">
            <span>🚪 Выйти из аккаунта</span>
            <span>→</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('closeSecurityModal').addEventListener('click', () => {
      modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });

    // Обработка кнопки смены пароля
    document.getElementById('resetPasswordBtn').addEventListener('click', () => {
      if (!user.email) {
        showAlert("К вашему аккаунту не привязана электронная почта.");
        return;
      }

      auth.sendPasswordResetEmail(user.email)
        .then(() => {
          showAlert(`Инструкция и ссылка для смены пароля отправлены на почту ${user.email}`);
        })
        .catch(err => {
          showAlert("Ошибка отправки: " + err.message);
        });
    });

    // Выход
    document.getElementById('logoutAllBtn').addEventListener('click', () => {
      modal.style.display = 'none';
      auth.signOut().then(() => showAlert("Вы вышли из аккаунта."));
    });
  }

  // Обновление данных в окне
  document.getElementById('secEmail').textContent = user.email || 'Не указан';
  const providerData = user.providerData[0];
  const providerName = providerData ? (providerData.providerId === 'google.com' ? 'Google Account' : 'Email/Пароль') : 'Email/Пароль';
  document.getElementById('secProvider').textContent = providerName;

  modal.style.display = 'flex';
}

// --- УПРАВЛЕНИЕ ПЛЕЕРОМ ---
function loadTrack(index) {
  if (index < 0 || index >= playlist.length) return;
  currentTrackIndex = index;
  const track = playlist[index];

  audio.src = track.src;
  audio.load();

  if (title) title.textContent = track.title;
  if (artist) artist.textContent = track.artist;
  if (cover) cover.src = track.cover;

  updateLikeStatus();
  renderPlaylist();
}

function playTrack() {
  audio.play().then(() => {
    isPlaying = true;
    const playImg = playBtn.querySelector('img');
    if (playImg) playImg.src = PAUSE_ICON;
  }).catch(err => {
    showAlert("Ошибка воспроизведения: " + err.message);
    isPlaying = false;
  });
}

function pauseTrack() {
  audio.pause();
  isPlaying = false;
  const playImg = playBtn.querySelector('img');
  if (playImg) playImg.src = PLAY_ICON;
}

function togglePlay() {
  if (!audio.src || audio.src === "" || audio.src === window.location.href) {
    loadTrack(currentTrackIndex);
  }
  if (isPlaying) pauseTrack();
  else playTrack();
}

function prevTrack() {
  currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
  loadTrack(currentTrackIndex);
  if (isPlaying) playTrack();
}

function nextTrack() {
  currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
  loadTrack(currentTrackIndex);
  if (isPlaying) playTrack();
}

// --- ЛАЙКИ ---
function updateLikeStatus() {
  if (!likeImg) return;
  if (favorites.includes(currentTrackIndex)) likeImg.classList.add('liked');
  else likeImg.classList.remove('liked');
}

function toggleLike() {
  const index = favorites.indexOf(currentTrackIndex);
  if (index === -1) favorites.push(currentTrackIndex);
  else favorites.splice(index, 1);
  localStorage.setItem('favorite_tracks', JSON.stringify(favorites));
  updateLikeStatus();
}

// --- ОТРИСОВКА ПЛЕЙЛИСТА ---
function renderPlaylist() {
  if (!trackList) return;
  trackList.innerHTML = '';

  playlist.forEach((track, index) => {
    const li = document.createElement('li');
    li.style.cssText = "padding: 12px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;";
    if (index === currentTrackIndex) {
      li.style.background = "rgba(29, 185, 84, 0.2)";
    }

    li.innerHTML = `
      <div>
        <div style="font-weight: 600; font-size: 0.95rem;">${track.title}</div>
        <div style="font-size: 0.8rem; color: #b3b3b3;">${track.artist}</div>
      </div>
      ${index === currentTrackIndex ? '<span style="color: #1db954;">▶</span>' : ''}
    `;

    li.addEventListener('click', () => {
      loadTrack(index);
      playTrack();
      playlistDrawer.classList.remove('open');
    });

    trackList.appendChild(li);
  });
}

// --- ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ПОЛЬЗОВАТЕЛЯ ---
function updateUIForUser(user) {
  let adminModalBtn = document.getElementById('adminModalBtn');
  let securityBtn = document.getElementById('securityBtn');

  if (user) {
    authBlock.style.display = 'none';
    userInfoBlock.style.display = 'flex';
    userName.textContent = user.displayName || user.email.split('@')[0];
    userEmail.textContent = user.email;

    // Кнопка раздела "Безопасность"
    if (!securityBtn) {
      securityBtn = document.createElement('button');
      securityBtn.id = 'securityBtn';
      securityBtn.textContent = '🔒 Безопасность';
      securityBtn.style.cssText = `
        width: 100%; margin-top: 10px; background: #2a2a2a; color: #fff;
        border: 1px solid rgba(255,255,255,0.1); padding: 10px; border-radius: 8px; font-weight: 600;
        cursor: pointer; font-size: 0.85rem; transition: background 0.2s;
      `;
      securityBtn.addEventListener('click', openSecurityModal);
      userInfoBlock.insertBefore(securityBtn, logoutBtn);
    }

    // Регистрация аккаунта в Firestore со статусом FREE
    const userRef = db.collection('users').doc(user.uid);
    userRef.get().then(doc => {
      if (!doc.exists) {
        userRef.set({
          email: user.email,
          name: user.displayName || user.email.split('@')[0],
          subscription: 'FREE'
        });
      }
    });

    // Отслеживание изменений статуса в реальном времени
    userRef.onSnapshot(doc => {
      const data = doc.data() || {};
      const subStatus = data.subscription || 'FREE';
      const isMainDev = user.email === DEV_EMAIL;
      const isDevPlus = subStatus === 'DEV+';

      if (isMainDev || isDevPlus) {
        userBadge.textContent = isMainDev ? "DEV" : "DEV+";
        userBadge.className = isMainDev ? "badge developer" : "badge devplus";
        upgradeBtn.style.display = 'none';

        // Создаем кнопку открытия окна привилегий
        if (!adminModalBtn) {
          adminModalBtn = document.createElement('button');
          adminModalBtn.id = 'adminModalBtn';
          adminModalBtn.textContent = '⚙️ Редактирование привилегий';
          adminModalBtn.style.cssText = `
            width: 100%; margin-top: 10px; background: #e63946; color: #fff;
            border: none; padding: 10px; border-radius: 8px; font-weight: 600;
            cursor: pointer; font-size: 0.85rem; transition: background 0.2s;
          `;
          adminModalBtn.addEventListener('click', openAdminModal);
          userInfoBlock.insertBefore(adminModalBtn, securityBtn);
        }
      } else {
        userBadge.textContent = subStatus;
        userBadge.className = subStatus === 'PREMIUM' ? "badge premium" : "badge";
        upgradeBtn.style.display = subStatus === 'PREMIUM' ? 'none' : 'block';
        if (adminModalBtn) adminModalBtn.remove();
      }
    });

  } else {
    authBlock.style.display = 'flex';
    userInfoBlock.style.display = 'none';
    verifyForm.style.display = 'none';
    authForm.style.display = 'flex';
    if (adminModalBtn) adminModalBtn.remove();
    if (securityBtn) securityBtn.remove();
  }
}

// --- ИНИЦИАЛИЗАЦИЯ ПОСЛЕ ЗАГРУЗКИ DOM ---
document.addEventListener('DOMContentLoaded', () => {
  if (window.emailjs) emailjs.init(EMAILJS_PUBLIC_KEY);

  // Нахождение всех элементов по HTML ID
  audio = document.getElementById('audio');
  cover = document.getElementById('cover');
  title = document.getElementById('title');
  artist = document.getElementById('artist');
  currentTime = document.getElementById('currentTime');
  duration = document.getElementById('duration');
  progressBar = document.getElementById('progressBar');
  volumeBar = document.getElementById('volumeBar');

  likeBtn = document.getElementById('likeBtn');
  likeImg = document.getElementById('likeImg');
  prevBtn = document.getElementById('prevBtn');
  playBtn = document.getElementById('playBtn');
  nextBtn = document.getElementById('nextBtn');
  waveBtn = document.getElementById('waveBtn');

  togglePlaylistBtn = document.getElementById('togglePlaylistBtn');
  toggleProfileBtn = document.getElementById('toggleProfileBtn');
  playlistDrawer = document.getElementById('playlistDrawer');
  profileDrawer = document.getElementById('profileDrawer');
  closePlaylistBtn = document.getElementById('closePlaylistBtn');
  closeProfileBtn = document.getElementById('closeProfileBtn');
  trackList = document.getElementById('trackList');

  authBlock = document.getElementById('authBlock');
  tabLoginBtn = document.getElementById('tabLoginBtn');
  tabRegisterBtn = document.getElementById('tabRegisterBtn');
  authForm = document.getElementById('authForm');
  authName = document.getElementById('authName');
  authEmail = document.getElementById('authEmail');
  authPassword = document.getElementById('authPassword');
  authSubmitBtn = document.getElementById('authSubmitBtn');

  verifyForm = document.getElementById('verifyForm');
  verifyCodeInput = document.getElementById('verifyCodeInput');
  googleLoginBtn = document.getElementById('google-login-btn');

  userInfoBlock = document.getElementById('userInfoBlock');
  userName = document.getElementById('userName');
  userEmail = document.getElementById('userEmail');
  userBadge = document.getElementById('userBadge');
  upgradeBtn = document.getElementById('upgradeBtn');
  logoutBtn = document.getElementById('logoutBtn');

  customAlert = document.getElementById('customAlert');
  customAlertText = document.getElementById('customAlertText');
  customAlertBtn = document.getElementById('customAlertBtn');

  // --- ШТОРКИ ---
  togglePlaylistBtn.addEventListener('click', () => playlistDrawer.classList.toggle('open'));
  toggleProfileBtn.addEventListener('click', () => profileDrawer.classList.toggle('open'));
  closePlaylistBtn.addEventListener('click', () => playlistDrawer.classList.remove('open'));
  closeProfileBtn.addEventListener('click', () => profileDrawer.classList.remove('open'));

  // --- УПРАВЛЕНИЕ ПЛЕЕРОМ ---
  playBtn.addEventListener('click', togglePlay);
  prevBtn.addEventListener('click', prevTrack);
  nextBtn.addEventListener('click', nextTrack);
  likeBtn.addEventListener('click', toggleLike);

  waveBtn.addEventListener('click', () => {
    const randomIndex = Math.floor(Math.random() * playlist.length);
    loadTrack(randomIndex);
    playTrack();
    showAlert(`Включена Моя Волна! Играет: ${playlist[randomIndex].title}`);
  });

  // --- СОБЫТИЯ АУДИО И ПОЛЗУНКИ ---
  audio.addEventListener('loadedmetadata', () => {
    duration.textContent = formatTime(audio.duration);
    progressBar.max = Math.floor(audio.duration);
  });

  audio.addEventListener('timeupdate', () => {
    currentTime.textContent = formatTime(audio.currentTime);
    progressBar.value = Math.floor(audio.currentTime);
  });

  audio.addEventListener('ended', nextTrack);

  progressBar.addEventListener('input', () => {
    audio.currentTime = progressBar.value;
  });

  volumeBar.addEventListener('input', () => {
    audio.volume = volumeBar.value / 100;
  });

  // --- КАСТОМНЫЙ ALERT ---
  customAlertBtn.addEventListener('click', closeAlert);
  customAlert.addEventListener('click', (e) => {
    if (e.target === customAlert) closeAlert();
  });

  // --- ВКЛАДКИ ВХОД / РЕГИСТРАЦИЯ ---
  tabLoginBtn.addEventListener('click', () => {
    isAuthModeLogin = true;
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
    authName.style.display = 'none';
    authName.required = false;
    authSubmitBtn.textContent = "Войти";
  });

  tabRegisterBtn.addEventListener('click', () => {
    isAuthModeLogin = false;
    tabRegisterBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    authName.style.display = 'block';
    authName.required = true;
    authSubmitBtn.textContent = "Зарегистрироваться";
  });

  // --- АВТОРИЗАЦИЯ FIREBASE & EMAILJS ---
  authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = authEmail.value;
    const password = authPassword.value;

    if (isAuthModeLogin) {
      auth.signInWithEmailAndPassword(email, password)
        .then(() => showAlert("Вы успешно вошли!"))
        .catch(err => showAlert("Ошибка входа: " + err.message));
    } else {
      generatedVerifyCode = Math.floor(1000 + Math.random() * 9000).toString();
      pendingUser = { email, password, name: authName.value };

      if (window.emailjs) {
        emailjs.send(SERVICE_ID, TEMPLATE_ID, {
          to_email: email,
          passcode: generatedVerifyCode
        }).then(() => {
          authForm.style.display = 'none';
          verifyForm.style.display = 'flex';
          showAlert("Код отправлен на вашу почту!");
        }).catch(err => {
          showAlert("Ошибка отправки кода: " + JSON.stringify(err));
        });
      } else {
        auth.createUserWithEmailAndPassword(email, password)
          .then(() => showAlert("Успешная регистрация!"))
          .catch(err => showAlert("Ошибка: " + err.message));
      }
    }
  });

  // ПОДТВЕРЖДЕНИЕ КОДА
  verifyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (verifyCodeInput.value === generatedVerifyCode && pendingUser) {
      auth.createUserWithEmailAndPassword(pendingUser.email, pendingUser.password)
        .then(res => {
          if (pendingUser.name) {
            res.user.updateProfile({ displayName: pendingUser.name });
          }
          showAlert("Почта подтверждена! Добро пожаловать.");
        })
        .catch(err => showAlert("Ошибка регистрации: " + err.message));
    } else {
      showAlert("Неверный код подтверждения!");
    }
  });

  // GOOGLE ВХОД
  googleLoginBtn.addEventListener('click', () => {
    auth.signInWithPopup(googleProvider)
      .then(() => showAlert("Вы вошли через Google!"))
      .catch(err => showAlert("Ошибка входа Google: " + err.message));
  });

  // ВЫХОД
  logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => showAlert("Вы вышли из аккаунта."));
  });

  // КНОПКА PREMIUM
  upgradeBtn.addEventListener('click', () => {
    showAlert("Оплата временно недоступна. Свяжитесь с разработчиком.");
  });

  // СЛУШАТЕЛЬ СОСТОЯНИЯ AUTH
  auth.onAuthStateChanged(user => updateUIForUser(user));

  // СТАРТОВАЯ ЗАГРУЗКА
  loadTrack(0);
});

