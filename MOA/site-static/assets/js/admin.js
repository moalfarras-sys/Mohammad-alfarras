(function initLegacyAdminPanel() {
  const STORAGE_KEYS = {
    auth: 'mf-admin-auth',
    videos: 'mf-admin-videos',
    dynamic: 'mf-admin-dynamic-content',
    theme: 'mf-admin-theme-tokens'
  };

  const DEFAULT_ADMIN = {
    email: 'mohammad.alfarras@gmail.com',
    password: '123123.Mmm'
  };

  const THEME_TOKEN_KEYS = [
    '--primary',
    '--secondary',
    '--accent',
    '--bg',
    '--surface',
    '--text',
    '--text-heading',
    '--text-muted',
    '--border'
  ];

  const body = document.body;
  const locale = body.dataset.locale || 'ar';
  const pathPrefix = body.dataset.prefix || '';

  const authPanel = document.getElementById('auth-panel');
  const dashboard = document.getElementById('dashboard');
  const authStatus = document.getElementById('auth-status');
  const panelStatus = document.getElementById('panel-status');
  const loginForm = document.getElementById('login-form');
  const logoutBtn = document.getElementById('logout');

  const videosArea = document.getElementById('videos-json');
  const dynamicArea = document.getElementById('dynamic-json');
  const themeGrid = document.getElementById('theme-grid');

  function t(arText, enText) {
    return locale === 'ar' ? arText : enText;
  }

  function setStatus(message, kind) {
    if (!panelStatus) return;
    panelStatus.textContent = message;
    panelStatus.style.color = kind === 'error' ? '#ff9b9b' : '#a8ffbf';
  }

  function setAuthStatus(message, kind) {
    if (!authStatus) return;
    authStatus.textContent = message;
    authStatus.style.color = kind === 'error' ? '#ff9b9b' : '#a8ffbf';
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  async function fetchJson(relativePath, fallback) {
    try {
      const response = await fetch(`${pathPrefix}${relativePath}`, { cache: 'no-cache' });
      if (!response.ok) return fallback;
      return await response.json();
    } catch (error) {
      return fallback;
    }
  }

  function isAuthenticated() {
    return localStorage.getItem(STORAGE_KEYS.auth) === '1';
  }

  function showDashboard() {
    authPanel.classList.add('hidden');
    dashboard.classList.remove('hidden');
  }

  function showLogin() {
    dashboard.classList.add('hidden');
    authPanel.classList.remove('hidden');
  }

  function buildThemeInputs(tokens) {
    if (!themeGrid) return;
    themeGrid.innerHTML = '';

    ['light', 'dark'].forEach((mode) => {
      const group = document.createElement('div');
      group.className = 'theme-group';
      group.innerHTML = `<h4>${mode === 'light' ? t('الوضع الفاتح', 'Light mode') : t('الوضع الداكن', 'Dark mode')}</h4>`;

      THEME_TOKEN_KEYS.forEach((tokenKey) => {
        const row = document.createElement('label');
        row.className = 'token-row';
        row.textContent = tokenKey;

        const input = document.createElement('input');
        input.type = 'text';
        input.dataset.mode = mode;
        input.dataset.token = tokenKey;
        input.placeholder = mode === 'light' ? '#ffffff' : '#0f172a';
        input.value = (tokens[mode] && tokens[mode][tokenKey]) || '';

        row.appendChild(input);
        group.appendChild(row);
      });

      themeGrid.appendChild(group);
    });
  }

  function collectThemeInputs() {
    const result = { light: {}, dark: {} };
    const inputs = themeGrid.querySelectorAll('input[data-mode][data-token]');

    inputs.forEach((input) => {
      const mode = input.dataset.mode;
      const key = input.dataset.token;
      const value = String(input.value || '').trim();
      if (!mode || !key || !value) return;
      result[mode][key] = value;
    });

    return result;
  }

  function wireTabs() {
    const tabs = document.querySelectorAll('.tab');
    const panels = document.querySelectorAll('.panel');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        tabs.forEach((el) => el.classList.toggle('active', el === tab));
        panels.forEach((panel) => panel.classList.toggle('active', panel.getAttribute('data-panel') === target));
      });
    });
  }

  async function loadDataToUI() {
    const sourceVideos = await fetchJson('data/videos.json', []);
    const sourceDynamic = await fetchJson('data/dynamic-content.json', {});

    const savedVideos = readJson(STORAGE_KEYS.videos, null);
    const savedDynamic = readJson(STORAGE_KEYS.dynamic, null);
    const savedTheme = readJson(STORAGE_KEYS.theme, { light: {}, dark: {} });

    videosArea.value = JSON.stringify(savedVideos || sourceVideos, null, 2);
    dynamicArea.value = JSON.stringify(savedDynamic || sourceDynamic, null, 2);
    buildThemeInputs(savedTheme || { light: {}, dark: {} });
  }

  function wireActions() {
    document.querySelectorAll('[data-save]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const scope = btn.getAttribute('data-save');
        try {
          if (scope === 'videos') {
            const parsed = JSON.parse(videosArea.value || '[]');
            if (!Array.isArray(parsed)) throw new Error(t('لازم تكون Array.', 'Value must be an array.'));
            localStorage.setItem(STORAGE_KEYS.videos, JSON.stringify(parsed));
          }

          if (scope === 'dynamic') {
            const parsed = JSON.parse(dynamicArea.value || '{}');
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
              throw new Error(t('لازم تكون Object.', 'Value must be an object.'));
            }
            localStorage.setItem(STORAGE_KEYS.dynamic, JSON.stringify(parsed));
          }

          if (scope === 'theme') {
            const themeTokens = collectThemeInputs();
            localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(themeTokens));
          }

          setStatus(t('تم الحفظ بنجاح. حدّث صفحات الموقع لمشاهدة التغيير.', 'Saved successfully. Refresh site pages to see changes.'), 'ok');
        } catch (error) {
          setStatus(error.message || t('فشل الحفظ.', 'Save failed.'), 'error');
        }
      });
    });

    document.querySelectorAll('[data-reset]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const scope = btn.getAttribute('data-reset');

        if (scope === 'videos') {
          localStorage.removeItem(STORAGE_KEYS.videos);
          const source = await fetchJson('data/videos.json', []);
          videosArea.value = JSON.stringify(source, null, 2);
        }

        if (scope === 'dynamic') {
          localStorage.removeItem(STORAGE_KEYS.dynamic);
          const source = await fetchJson('data/dynamic-content.json', {});
          dynamicArea.value = JSON.stringify(source, null, 2);
        }

        if (scope === 'theme') {
          localStorage.removeItem(STORAGE_KEYS.theme);
          buildThemeInputs({ light: {}, dark: {} });
        }

        setStatus(t('تم الرجوع للإعدادات الأصلية.', 'Reset to source values.'), 'ok');
      });
    });
  }

  function wireAuth() {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const email = (document.getElementById('admin-email').value || '').trim().toLowerCase();
      const password = document.getElementById('admin-password').value || '';

      if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
        localStorage.setItem(STORAGE_KEYS.auth, '1');
        setAuthStatus(t('تم تسجيل الدخول.', 'Signed in successfully.'), 'ok');
        showDashboard();
        await loadDataToUI();
      } else {
        setAuthStatus(t('بيانات الدخول غير صحيحة.', 'Invalid credentials.'), 'error');
      }
    });

    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEYS.auth);
      showLogin();
      setAuthStatus(t('تم تسجيل الخروج.', 'Signed out.'), 'ok');
    });
  }

  async function bootstrap() {
    wireAuth();
    wireTabs();
    wireActions();

    if (isAuthenticated()) {
      showDashboard();
      await loadDataToUI();
    } else {
      showLogin();
    }
  }

  bootstrap();
})();
