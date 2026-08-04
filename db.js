// =====================================================================
// db.js — Supabase 어댑터
// 기존 페이지들의 fetch('tables/complaints...') 호출을 가로채 Supabase
// REST(PostgREST)로 변환합니다. 응답을 기존 코드가 기대하는 형태
// ({ data: [...] } 목록 / 단일 객체)로 돌려주므로 각 페이지의 기존
// 로직(정렬·필터·렌더)은 그대로 동작합니다.
//
// 각 HTML <head> 의 로드 순서(반드시 지킬 것):
//   1) https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2
//   2) supabase-config.js
//   3) db.js  (이 파일)
// =====================================================================
(function () {
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY ||
      window.SUPABASE_URL.indexOf('YOUR-PROJECT') !== -1) {
    console.error('[db.js] supabase-config.js 의 SUPABASE_URL / SUPABASE_ANON_KEY 를 실제 값으로 설정하세요.');
    return;
  }
  if (!window.supabase || !window.supabase.createClient) {
    console.error('[db.js] supabase-js 가 로드되지 않았습니다. CDN <script> 가 db.js 보다 먼저 있는지 확인하세요.');
    return;
  }

  var BASE = window.SUPABASE_URL.replace(/\/+$/, '');
  var ANON = window.SUPABASE_ANON_KEY;
  var REST = BASE + '/rest/v1/';

  // 공식 클라이언트 — 로그인/세션 관리(관리자 Auth) + 테이블 REST 에 사용
  var sb = window.supabase.createClient(BASE, ANON, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  window.sbClient = sb;

  // Storage 전용 클라이언트 — self-hosted 인스턴스, 사진 업로드/조회에만 사용(auth/db 사용 안 함)
  var sbStorage = null;
  if (window.STORAGE_URL && window.STORAGE_ANON_KEY) {
    sbStorage = window.supabase.createClient(window.STORAGE_URL, window.STORAGE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }

  // 세션이 있으면 사용자 토큰(관리자), 없으면 anon key(공개 사용자)
  function authHeaders() {
    return sb.auth.getSession().then(function (r) {
      var token = ANON;
      if (r && r.data && r.data.session && r.data.session.access_token) {
        token = r.data.session.access_token;
      }
      return {
        apikey: ANON,
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      };
    });
  }

  function now() { return new Date().getTime(); }

  // body(JSON 문자열)에 타임스탬프 등을 주입해 다시 문자열로 반환
  function withFields(rawBody, extra) {
    var obj = {};
    if (rawBody) {
      try { obj = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody; }
      catch (e) { obj = {}; }
    }
    for (var k in extra) { if (extra[k] !== undefined) obj[k] = extra[k]; }
    return JSON.stringify(obj);
  }

  var origFetch = window.fetch.bind(window);

  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url);
    // 'tables/...' 또는 '/tables/...' 둘 다 가로챈다
    if (typeof url === 'string' && /^\/?tables\//.test(url)) {
      return tablesFetch(url.replace(/^\//, ''), init || {});
    }
    return origFetch(input, init);
  };

  function jsonResponse(body, status) {
    return new Response(JSON.stringify(body), {
      status: status || 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async function tablesFetch(url, init) {
    var method = (init.method || 'GET').toUpperCase();
    var parts = url.slice('tables/'.length).split('?');
    var pathPart = parts[0];
    var query = parts[1] || '';
    var segs = pathPart.split('/');
    var table = segs[0];
    var id = segs[1] ? decodeURIComponent(segs[1]) : null;
    var headers = await authHeaders();

    try {
      if (method === 'GET') {
        var endpoint;
        if (id) {
          endpoint = REST + table + '?id=eq.' + encodeURIComponent(id) + '&select=*';
        } else {
          var params = new URLSearchParams(query);
          var limit = params.get('limit') || '1000';
          endpoint = REST + table + '?select=*&order=created_at.desc&limit=' + limit;
        }
        var res = await origFetch(endpoint, { headers: headers });
        var arr = res.ok ? await res.json() : [];
        if (!Array.isArray(arr)) arr = [];
        var body = id ? (arr[0] || null) : { data: arr, total: arr.length };
        return jsonResponse(body, res.ok ? 200 : res.status);
      }

      if (method === 'POST') {
        var insertBody = withFields(init.body, { created_at: now(), updated_at: now() });
        return origFetch(REST + table, {
          method: 'POST',
          headers: Object.assign({}, headers, { Prefer: 'return=minimal' }),
          body: insertBody
        });
      }

      if (method === 'PATCH') {
        var patchBody = withFields(init.body, { updated_at: now() });
        return origFetch(REST + table + '?id=eq.' + encodeURIComponent(id), {
          method: 'PATCH',
          headers: Object.assign({}, headers, { Prefer: 'return=minimal' }),
          body: patchBody
        });
      }

      if (method === 'DELETE') {
        return origFetch(REST + table + '?id=eq.' + encodeURIComponent(id), {
          method: 'DELETE',
          headers: Object.assign({}, headers, { Prefer: 'return=minimal' })
        });
      }
    } catch (e) {
      console.error('[db.js] 요청 실패:', e);
      return jsonResponse({ data: [] }, 500);
    }

    return origFetch(url, init);
  }

  // ── 사진 업로드 헬퍼 ────────────────────────────────────────────────
  // File 객체 배열 → self-hosted Storage 업로드 → 공개 URL 배열 반환.
  // 사용처: submit.html 의 폼 제출, admin-detail.html 의 처리결과 사진.
  // 실패한 파일은 건너뛰고 경고를 남긴다.
  // 이 버킷은 다른 프로젝트와 공유하므로 'complaint-photos/' 로 경로를 구분한다.
  window.uploadPhotos = async function (files) {
    // STORAGE_URL 미설정 시 기존 클라우드 Supabase 클라이언트/버킷으로 대체
    var client = sbStorage || sb;
    var bucket = sbStorage ? (window.STORAGE_BUCKET || 'storage') : (window.SUPABASE_PHOTO_BUCKET || 'complaint-photos');
    var prefix = sbStorage ? 'complaint-photos/' : '';
    var urls = [];
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var ext = (file.name && file.name.split('.').pop()) || 'jpg';
      var rand = Math.random().toString(36).slice(2, 10);
      var path = prefix + new Date().getFullYear() + '/' + now() + '-' + i + '-' + rand + '.' + ext;
      var up = await client.storage.from(bucket).upload(path, file, {
        cacheControl: '3600', upsert: false, contentType: file.type || 'image/jpeg'
      });
      if (up.error) { console.error('[db.js] 사진 업로드 실패:', up.error); continue; }
      var pub = client.storage.from(bucket).getPublicUrl(up.data.path);
      urls.push(pub.data.publicUrl);
    }
    return urls;
  };
})();
