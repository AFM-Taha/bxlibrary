import dbConnect from '../../../../lib/mongodb';
import SmartBookContent from '../../../../models/SmartBookContent';
import Book from '../../../../models/Book';
import { withAdminAuth } from '../../../../lib/auth';

export default withAdminAuth(async function handler(req, res) {
  const { id } = req.query;

  try {
    await dbConnect();
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (req.method === 'GET') {
      const content = await SmartBookContent.findOne({ book: id });
      if (!content) {
        return res.status(204).end();
      }
      return res.status(200).json({
        status: content.status,
        pages: content.pages,
        lastEditedAt: content.lastEditedAt,
        lastEditedBy: content.lastEditedBy,
      });
    }

    if (req.method === 'PUT') {
      const { pages } = req.body;
      if (!Array.isArray(pages)) {
        return res.status(400).json({ error: 'Invalid payload: pages array required' });
      }
      // Normalize payload: ensure pageNumber and text
      const normalized = pages.map((p) => ({
        pageNumber: Number(p.pageNumber),
        text: typeof p.text === 'string' ? p.text : '',
        updatedBy: req.user?._id,
        updatedAt: new Date(),
      }));

      const content = await SmartBookContent.findOneAndUpdate(
        { book: id },
        {
          $set: {
            pages: normalized,
            status: 'parsed',
            lastEditedBy: req.user?._id,
            lastEditedAt: new Date(),
          },
        },
        { new: true, upsert: true }
      );

      return res.status(200).json({ success: true, pagesCount: content.pages.length });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Smart Book content API error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});