// GET    /tables/complaints/:id  → 단건 조회
// PATCH  /tables/complaints/:id  → 수정
// DELETE /tables/complaints/:id  → 삭제
import { getComplaint, updateComplaint, deleteComplaint } from '../../../lib/store.js';

export default async function handler(req, res) {
  const { id } = req.query;
  try {
    if (req.method === 'GET') {
      const item = await getComplaint(id);
      if (!item) return res.status(404).json({ error: 'Not Found' });
      return res.status(200).json(item);
    }

    if (req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const item = await updateComplaint(id, body || {});
      if (!item) return res.status(404).json({ error: 'Not Found' });
      return res.status(200).json(item);
    }

    if (req.method === 'DELETE') {
      await deleteComplaint(id);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, PATCH, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server Error', detail: String(e) });
  }
}
