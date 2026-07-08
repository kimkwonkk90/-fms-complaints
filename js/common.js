/* ================================================
   시설관리 하자/민원 관리 시스템 - 공통 JavaScript
   ================================================ */

'use strict';

// ── 상수 ──────────────────────────────────────────
const API_BASE = 'tables';
const TABLE = { COMPLAINTS: 'complaints', ADMINS: 'admins' };

const STATUS_MAP = {
  received:    { label: '접수',   icon: '📋', cls: 'badge-received'    },
  in_progress: { label: '처리중', icon: '🔧', cls: 'badge-in_progress' },
  completed:   { label: '완료',   icon: '✅', cls: 'badge-completed'   },
  rejected:    { label: '반려',   icon: '❌', cls: 'badge-rejected'    },
};

const TYPE_MAP = {
  defect:    { label: '하자', icon: '🔨', cls: 'badge-defect'    },
  complaint: { label: '민원', icon: '📢', cls: 'badge-complaint' },
};

const PRIORITY_MAP = {
  low:    { label: '낮음', icon: '🟢', cls: 'badge-low'    },
  medium: { label: '보통', icon: '🟡', cls: 'badge-medium' },
  high:   { label: '높음', icon: '🔴', cls: 'badge-high'   },
  urgent: { label: '긴급', icon: '🚨', cls: 'badge-urgent' },
};

const CATEGORIES = [
  '전기/통신', '설비/공조', '환경/청소', '누수/방수',
  '소방/안전', '엘리베이터', '주차/도로', '기타'
];

const STAFF_LIST = ['이엔지', '박청소', '최설비', '정전기', '한안전'];

// ── API 유틸 ──────────────────────────────────────
const api = {
  async get(table, params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/${table}${q ? '?' + q : ''}`);
    if (!res.ok) throw new Error(`GET ${table} failed: ${res.status}`);
    return res.json();
  },
  async getOne(table, id) {
    const res = await fetch(`${API_BASE}/${table}/${id}`);
    if (!res.ok) throw new Error(`GET ${table}/${id} failed: ${res.status}`);
    return res.json();
  },
  async post(table, body) {
    const res = await fetch(`${API_BASE}/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${table} failed: ${res.status}`);
    return res.json();
  },
  async patch(table, id, body) {
    const res = await fetch(`${API_BASE}/${table}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PATCH ${table}/${id} failed: ${res.status}`);
    return res.json();
  },
  async delete(table, id) {
    const res = await fetch(`${API_BASE}/${table}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`DELETE ${table}/${id} failed: ${res.status}`);
  },
};

// ── 토스트 알림 ────────────────────────────────────
const toast = (() => {
  let container;
  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  function show(title, msg = '', type = 'info', duration = 4000) {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        ${msg ? `<div class="toast-msg">${msg}</div>` : ''}
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;
    getContainer().appendChild(el);
    setTimeout(() => {
      el.classList.add('removing');
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  return {
    success: (t, m) => show(t, m, 'success'),
    error:   (t, m) => show(t, m, 'error'),
    warning: (t, m) => show(t, m, 'warning'),
    info:    (t, m) => show(t, m, 'info'),
  };
})();

// ── 모달 ──────────────────────────────────────────
function openModal(id)  {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('active');
    document.body.style.overflow = '';
  }
}

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
  if (e.target.dataset.closeModal) closeModal(e.target.dataset.closeModal);
});

// ── 배지 렌더 ──────────────────────────────────────
function statusBadge(status) {
  const s = STATUS_MAP[status] || { label: status, icon: '', cls: '' };
  return `<span class="badge ${s.cls}">${s.icon} ${s.label}</span>`;
}

function typeBadge(type) {
  const t = TYPE_MAP[type] || { label: type, icon: '', cls: '' };
  return `<span class="badge ${t.cls}">${t.icon} ${t.label}</span>`;
}

function priorityBadge(priority) {
  const p = PRIORITY_MAP[priority] || { label: priority, icon: '', cls: '' };
  return `<span class="badge ${p.cls}">${p.icon} ${p.label}</span>`;
}

// ── 날짜 포맷 ──────────────────────────────────────
function fmtDate(val) {
  if (!val) return '-';
  const d = new Date(typeof val === 'number' ? val : val);
  if (isNaN(d)) return '-';
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  return `${Y}.${M}.${D}`;
}

function fmtDateTime(val) {
  if (!val) return '-';
  const d = new Date(typeof val === 'number' ? val : val);
  if (isNaN(d)) return '-';
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${Y}.${M}.${D} ${h}:${m}`;
}

function fmtRelative(val) {
  if (!val) return '';
  const d = new Date(typeof val === 'number' ? val : val);
  if (isNaN(d)) return '';
  const diff = Date.now() - d.getTime();
  const min  = Math.floor(diff / 60000);
  const hour = Math.floor(diff / 3600000);
  const day  = Math.floor(diff / 86400000);
  if (min  < 1)  return '방금 전';
  if (min  < 60) return `${min}분 전`;
  if (hour < 24) return `${hour}시간 전`;
  if (day  < 7)  return `${day}일 전`;
  return fmtDate(val);
}

// ── 접수번호 생성 ──────────────────────────────────
function generateTicketNumber() {
  const now = new Date();
  const y   = now.getFullYear();
  const m   = String(now.getMonth() + 1).padStart(2, '0');
  const d   = String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `HC-${y}${m}${d}-${rand}`;
}

// ── 관리자 인증 ────────────────────────────────────
const auth = {
  key: 'fm_admin_session',

  login(adminData) {
    sessionStorage.setItem(this.key, JSON.stringify({
      id: adminData.id,
      name: adminData.name,
      username: adminData.username,
      role: adminData.role,
      department: adminData.department,
      loginAt: new Date().toISOString(),
    }));
  },

  logout() {
    sessionStorage.removeItem(this.key);
    window.location.href = 'admin-login.html';
  },

  getUser() {
    try {
      return JSON.parse(sessionStorage.getItem(this.key));
    } catch { return null; }
  },

  isLoggedIn() {
    return !!this.getUser();
  },

  require() {
    if (!this.isLoggedIn()) {
      window.location.href = 'admin-login.html';
      return null;
    }
    return this.getUser();
  },
};

// ── 페이지네이션 렌더 ──────────────────────────────
function renderPagination(container, total, page, limit, onPageChange) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = `<button ${page === 1 ? 'disabled' : ''} data-p="${page - 1}">‹</button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 || i === totalPages ||
      (i >= page - 2 && i <= page + 2)
    ) {
      html += `<button class="${i === page ? 'active' : ''}" data-p="${i}">${i}</button>`;
    } else if (i === page - 3 || i === page + 3) {
      html += `<button disabled>…</button>`;
    }
  }
  html += `<button ${page === totalPages ? 'disabled' : ''} data-p="${page + 1}">›</button>`;
  container.innerHTML = html;
  container.querySelectorAll('button[data-p]').forEach(btn => {
    btn.addEventListener('click', () => onPageChange(+btn.dataset.p));
  });
}

// ── 햄버거 메뉴 ────────────────────────────────────
function initHamburger() {
  const btn = document.querySelector('.hamburger');
  const nav = document.querySelector('.mobile-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => nav.classList.toggle('open'));
}

// ── 로딩 상태 ──────────────────────────────────────
function showLoading(container, msg = '불러오는 중...') {
  container.innerHTML = `
    <div class="loading-wrap">
      <div class="spinner"></div>
      <span>${msg}</span>
    </div>`;
}

function showEmpty(container, title = '데이터가 없습니다', desc = '') {
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">📭</div>
      <div class="empty-title">${title}</div>
      ${desc ? `<div class="empty-desc">${desc}</div>` : ''}
    </div>`;
}

// ── 폼 유효성 검사 ──────────────────────────────────
function validateForm(formEl) {
  let valid = true;
  formEl.querySelectorAll('[required]').forEach(el => {
    el.classList.remove('error');
    if (!el.value.trim()) {
      el.classList.add('error');
      valid = false;
    }
  });
  return valid;
}

// ── 파일 업로드 미리보기 ───────────────────────────
function initFileUpload(areaId, inputId, previewId) {
  const area    = document.getElementById(areaId);
  const input   = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!area || !input) return;

  let files = [];

  area.addEventListener('click', () => input.click());

  area.addEventListener('dragover', e => {
    e.preventDefault();
    area.classList.add('dragover');
  });
  area.addEventListener('dragleave', () => area.classList.remove('dragover'));
  area.addEventListener('drop', e => {
    e.preventDefault();
    area.classList.remove('dragover');
    addFiles(e.dataTransfer.files);
  });

  input.addEventListener('change', () => addFiles(input.files));

  function addFiles(newFiles) {
    Array.from(newFiles).forEach(f => {
      if (!f.type.startsWith('image/')) { toast.warning('이미지 파일만 업로드 가능합니다'); return; }
      if (f.size > 10 * 1024 * 1024)   { toast.warning('파일 크기는 10MB 이하여야 합니다');  return; }
      if (files.length >= 5)            { toast.warning('최대 5장까지 업로드 가능합니다');     return; }
      files.push(f);
    });
    renderPreview();
    input.value = '';
  }

  function renderPreview() {
    if (!preview) return;
    preview.innerHTML = '';
    files.forEach((f, i) => {
      const reader = new FileReader();
      reader.onload = ev => {
        const item = document.createElement('div');
        item.className = 'file-preview-item';
        item.innerHTML = `
          <img src="${ev.target.result}" alt="미리보기">
          <button class="remove-file" data-i="${i}">✕</button>`;
        preview.appendChild(item);
        item.querySelector('.remove-file').addEventListener('click', e => {
          e.stopPropagation();
          files.splice(+e.target.dataset.i, 1);
          renderPreview();
        });
      };
      reader.readAsDataURL(f);
    });
  }

  return { getFiles: () => files };
}

// ── DOMContentLoaded 공통 초기화 ──────────────────
document.addEventListener('DOMContentLoaded', () => {
  initHamburger();

  // 관리자 로그아웃 버튼
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('로그아웃 하시겠습니까?')) auth.logout();
    });
  }

  // 관리자 이름 표시
  const adminNameEl = document.getElementById('adminName');
  if (adminNameEl) {
    const user = auth.getUser();
    if (user) adminNameEl.textContent = user.name;
  }
});
