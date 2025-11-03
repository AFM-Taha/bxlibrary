import dbConnect from '../../../../../lib/mongodb';
import Book from '../../../../../models/Book';
import { withAdminAuth } from '../../../../../lib/auth';
import { getDownloadUrl } from '../../../../../utils/googleDrive';

export default withAdminAuth(async function handler(req, res, user) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    await dbConnect();

    const book = await Book.findById(id).lean();
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    if (!book.driveFileId && !book.driveUrl) {
      return res.status(400).json({ error: 'No Google Drive file set for this book' });
    }

    const fileId = book.driveFileId;
    if (!fileId) {
      return res.status(400).json({ error: 'Missing driveFileId; please set Google Drive file ID' });
    }

    // Try public download first
    try {
      const downloadUrl = getDownloadUrl(fileId);
      const resp = await fetch(downloadUrl);
      if (!resp.ok) throw new Error('Failed public PDF download');
      const arrayBuffer = await resp.arrayBuffer();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).send(Buffer.from(arrayBuffer));
      return;
    } catch (e) {
      // Fallback to Drive API stream
      try {
        const { getFileStream } = await import('../../../../../utils/googleDrive');
        const stream = await getFileStream(fileId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Cache-Control', 'no-store');
        stream.pipe(res);
        return;
      } catch (err) {
        console.error('SmartBook PDF stream fallback failed', err);
        return res.status(502).json({ error: 'Failed to fetch PDF from Drive' });
      }
    }
  } catch (err) {
    console.error('SmartBook PDF API error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});