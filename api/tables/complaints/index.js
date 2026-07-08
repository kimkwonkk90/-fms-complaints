// GET  /tables/complaints        → 목록 { data: [...] }
// POST /tables/complaints        → 생성
import { listComplaints, createComplaint } from '../../../lib/store.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const data = await listComplaints();
      // 프론트엔드는 data.data 배열만 사용하고 정렬은 직접 한다.
      return res.status(200).json({ data, total: data.length });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const item = await createComplaint(body || {});
      return res.status(201).json(item);
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server Error', detail: String(e) });
  }
}
