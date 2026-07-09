// =====================================================================
// /api/notify  —  신규 민원/하자 접수 알림메일 발송 (Vercel Serverless Function)
// Supabase 트리거(pg_net)가 신규 INSERT 시 이 엔드포인트를 호출하면,
// 회사 SMTP 로 관리자에게 알림 메일을 보냅니다.
//
// 필요한 Vercel 환경변수 (Project Settings > Environment Variables):
//   SMTP_HOST       예: smtp.mail-server.kr
//   SMTP_PORT       예: 465
//   SMTP_USER       SMTP 로그인 메일주소
//   SMTP_PASS       SMTP 비밀번호
//   SMTP_FROM       (선택) 보내는사람. 미설정 시 SMTP_USER 사용
//   NOTIFY_TO       수신 메일주소
//   WEBHOOK_SECRET  Supabase 트리거와 공유하는 비밀값
// =====================================================================
import nodemailer from 'nodemailer';

const LABELS = {
  ticket_number: '접수번호', created_at: '접수일시', status: '처리상태',
  type: '접수유형', category: '분류', title: '제목', description: '상세내용',
  location: '위치', floor: '층', department: '부서',
  submitter_name: '접수자명', submitter_contact: '연락처', submitter_unit: '소속',
  priority: '우선순위'
};
const STATUS_KR = { received: '접수완료', in_progress: '처리중', completed: '완료', rejected: '반려' };
const TYPE_KR = { defect: '하자', complaint: '민원' };
const PRIORITY_KR = { low: '낮음', medium: '보통', high: '높음', urgent: '긴급' };

function esc(s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  // 공유 비밀값 검증 (외부에서 임의로 호출 못 하도록)
  if (!process.env.WEBHOOK_SECRET || req.headers['x-webhook-secret'] !== process.env.WEBHOOK_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const record = body.record || {};

  const title = record.title || '(제목 미입력)';

  let rowsHtml = '';
  Object.keys(LABELS).forEach(function (k) {
    let v = record[k];
    if (v === null || v === undefined || v === '') return;
    if (k === 'status') v = STATUS_KR[v] || v;
    if (k === 'type') v = TYPE_KR[v] || v;
    if (k === 'priority') v = PRIORITY_KR[v] || v;
    if (k === 'created_at') { try { v = new Date(Number(v)).toLocaleString('ko-KR'); } catch (e) {} }
    rowsHtml += '<tr><td style="padding:7px 12px;background:#f7f7f9;font-weight:600;border:1px solid #ececf0;white-space:nowrap;color:#444">'
      + esc(LABELS[k]) + '</td><td style="padding:7px 12px;border:1px solid #ececf0;color:#222">' + esc(v) + '</td></tr>';
  });

  const html =
    '<div style="font-family:\'Apple SD Gothic Neo\',\'Malgun Gothic\',sans-serif;max-width:640px;margin:0 auto">'
    + '<div style="background:#16213e;color:#fff;padding:20px 24px;border-radius:10px 10px 0 0">'
    + '<div style="font-size:12px;letter-spacing:2px;opacity:.7">FMS 시설관리</div>'
    + '<div style="font-size:18px;font-weight:700;margin-top:4px">새 ' + (TYPE_KR[record.type] || '민원') + ' 접수가 등록되었습니다</div>'
    + '</div>'
    + '<div style="border:1px solid #ececf0;border-top:none;padding:20px 24px;border-radius:0 0 10px 10px">'
    + '<div style="font-size:16px;font-weight:700;margin-bottom:12px;color:#16213e">' + esc(title) + '</div>'
    + '<table style="border-collapse:collapse;width:100%;font-size:13px">' + rowsHtml + '</table>'
    + '<p style="margin-top:18px;font-size:13px;color:#666">관리자 페이지에서 처리 현황을 확인하세요.</p>'
    + '</div></div>';

  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: port,
    secure: port === 465,            // 465 → SSL, 587 → STARTTLS
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.NOTIFY_TO || process.env.SMTP_USER,
      subject: '[FMS 시설관리] 새 ' + (TYPE_KR[record.type] || '민원') + ' 접수 — ' + title,
      html: html
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[notify] 메일 발송 실패:', e && e.message);
    res.status(500).json({ error: 'send failed', detail: String((e && e.message) || e) });
  }
};
