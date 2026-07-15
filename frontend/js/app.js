// ElectVote Core Frontend Utilities and API Wrappers

const API_BASE = 'http://localhost:5000/api';

// --- JWT and Storage Helpers ---
export const getToken = () => localStorage.getItem('vote_token');
export const setToken = (token) => localStorage.setItem('vote_token', token);
export const removeToken = () => localStorage.removeItem('vote_token');

export const getUser = () => {
  const user = localStorage.getItem('vote_user');
  return user ? JSON.parse(user) : null;
};
export const setUser = (user) => localStorage.setItem('vote_user', JSON.stringify(user));
export const removeUser = () => localStorage.removeItem('vote_user');

// --- Network API Fetch Wrapper ---
export const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    ...options,
    headers
  };
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    
    // Auto handle authorization failures
    if (response.status === 401 || response.status === 403) {
      const path = window.location.pathname;
      if (!path.endsWith('index.html') && !path.endsWith('login.html') && !path.endsWith('register.html') && path !== '/') {
        removeToken();
        removeUser();
        window.location.href = 'login.html';
        return null;
      }
    }
    
    // Always try to parse JSON — even error responses
    try {
      return await response.json();
    } catch (jsonErr) {
      console.error(`API JSON parse error [${endpoint}]:`, jsonErr);
      return { success: false, message: `Server returned non-JSON response (status ${response.status})` };
    }
  } catch (networkError) {
    // This only fires on true network failures (no internet, CORS block, server down)
    console.error(`API Network Error [${endpoint}]:`, networkError.message);
    // Only show toast if it's not a redirect happening
    if (!networkError.message.includes('Failed to fetch')) {
      showToast(`Connection error: ${networkError.message}`, 'error');
    } else {
      showToast('Cannot connect to server. Make sure you opened the site via http://localhost:5000 — not from a file!', 'error');
    }
    return { success: false, message: networkError.message };
  }
};


// --- Custom Toast Notification helper ---
export const showToast = (message, type = 'info') => {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `custom-toast ${type}`;
  
  let iconClass = 'bi-info-circle-fill';
  if (type === 'success') iconClass = 'bi-check-circle-fill';
  if (type === 'error') iconClass = 'bi-exclamation-octagon-fill';
  if (type === 'warning') iconClass = 'bi-exclamation-triangle-fill';

  toast.innerHTML = `
    <i class="toast-icon bi ${iconClass}"></i>
    <span>${message}</span>
    <button class="toast-close">&times;</button>
  `;

  container.appendChild(toast);
  
  // Trigger entry animation
  setTimeout(() => toast.classList.add('show'), 50);

  // Dismiss timeout (4 seconds)
  const dismissTimeout = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);

  // Close click
  toast.querySelector('.toast-close').addEventListener('click', () => {
    clearTimeout(dismissTimeout);
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  });
};

// --- Theme Switcher Utility ---
export const initTheme = () => {
  const savedTheme = localStorage.getItem('vote_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    updateThemeIcon(toggleBtn, savedTheme);
    toggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('vote_theme', newTheme);
      updateThemeIcon(toggleBtn, newTheme);
    });
  }
};

const updateThemeIcon = (btn, theme) => {
  btn.innerHTML = theme === 'dark' 
    ? '<i class="bi bi-sun-fill"></i>' 
    : '<i class="bi bi-moon-fill"></i>';
};

// --- Global Header Navigation renderer ---
export const renderNavbar = () => {
  const container = document.querySelector('.navbar-container');
  if (!container) return;

  const user = getUser();
  const token = getToken();

  let rightNav = '';
  if (token && user) {
    rightNav = `
      <a href="dashboard.html" class="nav-link">Dashboard</a>
      <a href="profile.html" class="nav-link">Profile</a>
      <button class="btn btn-secondary btn-sm" id="logout-btn"><i class="bi bi-box-arrow-right"></i> Logout</button>
    `;
  } else {
    rightNav = `
      <a href="login.html" class="nav-link">Login</a>
      <a href="register.html" class="btn btn-primary btn-sm">Register</a>
    `;
  }

  container.innerHTML = `
    <a class="navbar-brand" href="index.html">
      <i class="bi bi-shield-check-fill"></i> ElectVote
    </a>
    <div class="navbar-links">
      <a href="index.html" class="nav-link">Home</a>
      ${rightNav}
      <button class="theme-toggle" id="theme-toggle" aria-label="Toggle Theme">
        <i class="bi bi-moon-fill"></i>
      </button>
    </div>
  `;

  // Re-bind theme button
  initTheme();

  // Bind logout action
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      removeToken();
      removeUser();
      showToast('Logged out successfully', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    });
  }
};

// Auto boot on script loads if DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initAccessibility();
  renderAccessibilityBar();
});

// --- Accessibility Mode ---
export const initAccessibility = () => {
  const scale    = parseFloat(localStorage.getItem('vote_fontScale') || '1');
  const contrast = localStorage.getItem('vote_contrast') || 'normal';
  document.documentElement.style.setProperty('--font-scale', scale);
  document.documentElement.setAttribute('data-contrast', contrast);
};

export const renderAccessibilityBar = () => {
  if (document.querySelector('.accessibility-bar')) return;
  const bar = document.createElement('div');
  bar.className = 'accessibility-bar';

  const contrast = localStorage.getItem('vote_contrast') || 'normal';
  const scale    = parseFloat(localStorage.getItem('vote_fontScale') || '1');

  bar.innerHTML = `
    <button class="accessibility-btn ${contrast === 'high' ? 'active' : ''}" id="a11y-contrast" title="Toggle High Contrast" aria-label="Toggle high contrast">
      <i class="bi bi-circle-half"></i>
    </button>
    <button class="accessibility-btn" id="a11y-font-up" title="Increase Font Size" aria-label="Increase font size">
      <i class="bi bi-type-h1"></i>
    </button>
    <button class="accessibility-btn" id="a11y-font-down" title="Decrease Font Size" aria-label="Decrease font size">
      <i class="bi bi-fonts"></i>
    </button>
  `;
  document.body.appendChild(bar);

  document.getElementById('a11y-contrast').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-contrast');
    const next = cur === 'high' ? 'normal' : 'high';
    document.documentElement.setAttribute('data-contrast', next);
    localStorage.setItem('vote_contrast', next);
    document.getElementById('a11y-contrast').classList.toggle('active', next === 'high');
  });

  document.getElementById('a11y-font-up').addEventListener('click', () => {
    const cur = parseFloat(localStorage.getItem('vote_fontScale') || '1');
    const next = Math.min(1.4, +(cur + 0.1).toFixed(1));
    document.documentElement.style.setProperty('--font-scale', next);
    localStorage.setItem('vote_fontScale', next);
  });

  document.getElementById('a11y-font-down').addEventListener('click', () => {
    const cur = parseFloat(localStorage.getItem('vote_fontScale') || '1');
    const next = Math.max(0.8, +(cur - 0.1).toFixed(1));
    document.documentElement.style.setProperty('--font-scale', next);
    localStorage.setItem('vote_fontScale', next);
  });
};

// --- Countdown Timer Utility ---
export const buildCountdown = (targetDateStr) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'countdown-timer';

  const update = () => {
    const diff = new Date(targetDateStr) - new Date();
    if (diff <= 0) { wrapper.innerHTML = `<span style="color:var(--error);font-weight:700;">Closed</span>`; return; }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    wrapper.innerHTML = [
      d > 0 ? `<div class="countdown-unit"><span class="num">${d}</span><span class="lbl">d</span></div>` : '',
      `<div class="countdown-unit"><span class="num">${String(h).padStart(2,'0')}</span><span class="lbl">h</span></div>`,
      `<div class="countdown-unit"><span class="num">${String(m).padStart(2,'0')}</span><span class="lbl">m</span></div>`,
      `<div class="countdown-unit"><span class="num">${String(s).padStart(2,'0')}</span><span class="lbl">s</span></div>`,
    ].join('<span style="color:var(--text-muted);align-self:center;font-size:1rem">:</span>');
  };
  update();
  setInterval(update, 1000);
  return wrapper;
};

// --- Election Timeline Builder ---
export const buildTimeline = (currentPhase) => {
  const phases = [
    { key: 'registration', label: 'Registration', icon: 'bi-person-plus' },
    { key: 'nomination',   label: 'Nomination',   icon: 'bi-file-earmark-person' },
    { key: 'campaign',     label: 'Campaign',     icon: 'bi-megaphone' },
    { key: 'voting',       label: 'Voting',       icon: 'bi-ballot' },
    { key: 'closed',       label: 'Closed',       icon: 'bi-lock' },
    { key: 'published',    label: 'Results',      icon: 'bi-bar-chart' },
  ];
  const phaseOrder = phases.map(p => p.key);
  const currentIdx = phaseOrder.indexOf(currentPhase);

  const tl = document.createElement('div');
  tl.className = 'election-timeline';

  phases.forEach((phase, idx) => {
    const step = document.createElement('div');
    step.className = 'timeline-step';
    if (idx < currentIdx)  step.classList.add('done');
    if (idx === currentIdx) step.classList.add('active');

    step.innerHTML = `
      <div class="timeline-dot"><i class="bi ${phase.icon}"></i></div>
      <div class="timeline-label">${phase.label}</div>
    `;
    tl.appendChild(step);
  });
  return tl;
};

// --- Relative Time Formatter ---
export const timeAgo = (dateStr) => {
  const diff = (new Date() - new Date(dateStr)) / 1000;
  if (diff < 60)   return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return new Date(dateStr).toLocaleDateString();
};

// --- Confetti Launcher ---
export const launchConfetti = (containerEl) => {
  const colors = ['#6366f1','#f59e0b','#10b981','#ec4899','#06b6d4','#8b5cf6'];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = `
      left: ${Math.random() * 100}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration: ${1.5 + Math.random() * 2}s;
      animation-delay: ${Math.random() * 0.8}s;
      width: ${6 + Math.random() * 6}px;
      height: ${6 + Math.random() * 6}px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
    `;
    containerEl.appendChild(piece);
    setTimeout(() => piece.remove(), 4000);
  }
};
