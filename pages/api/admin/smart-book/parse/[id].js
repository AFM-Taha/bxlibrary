import dbConnect from '../../../../../lib/mongodb';
import Book from '../../../../../models/Book';
import SmartBookContent from '../../../../../models/SmartBookContent';
import { withAdminAuth } from '../../../../../lib/auth';
import { getDownloadUrl } from '../../../../../utils/googleDrive';

export default withAdminAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    await dbConnect();

    const book = await Book.findById(id);
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

    // Download PDF bytes via public download URL
    let pdfData;
    try {
      const downloadUrl = getDownloadUrl(fileId);
      const resp = await fetch(downloadUrl);
      if (!resp.ok) throw new Error('Failed to fetch PDF');
      const arrayBuffer = await resp.arrayBuffer();
      pdfData = new Uint8Array(arrayBuffer);
    } catch (e) {
      // Fallback to Drive API stream if public download fails
      try {
        const { getFileStream } = await import('../../../../../utils/googleDrive');
        const stream = await getFileStream(fileId);
        pdfData = await new Promise((resolve, reject) => {
          const chunks = [];
          let total = 0;
          stream.on('data', (d) => {
            const u8 = new Uint8Array(d.buffer, d.byteOffset, d.byteLength);
            chunks.push(u8);
            total += u8.byteLength;
          });
          stream.on('end', () => {
            const merged = new Uint8Array(total);
            let offset = 0;
            for (const c of chunks) {
              merged.set(c, offset);
              offset += c.byteLength;
            }
            resolve(merged);
          });
          stream.on('error', (err) => reject(err));
        });
      } catch (err) {
        console.error('Drive stream fallback failed', err);
        throw e;
      }
    }

    // Parse PDF to pages using pdfjs-dist (server-side)
    const pdfjsModule = await import('pdfjs-dist/legacy/build/pdf.js');
    console.log('SmartBook parse: pdfData type', pdfData && pdfData.constructor && pdfData.constructor.name, 'isBuffer?', typeof Buffer !== 'undefined' && Buffer.isBuffer(pdfData));
    const originalBuffer = global.Buffer;
    let pagesCount = 0;
    try {
      // Temporarily hide Buffer so pdf.js won't misclassify Uint8Array
      global.Buffer = undefined;
      const loadingTask = pdfjsModule.getDocument({ data: pdfData, disableWorker: true });
      const pdfDoc = await loadingTask.promise;

      const pages = [];
      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const text = textContent.items.map((item) => item.str).join(' ');
        pages.push({ pageNumber: pageNum, text });
      }

      // Upsert SmartBookContent
      const existing = await SmartBookContent.findOne({ book: id });
      if (existing) {
        existing.pages = pages;
        existing.status = 'parsed';
        existing.lastEditedBy = req.user?._id;
        existing.lastEditedAt = new Date();
        await existing.save();
      } else {
        await SmartBookContent.create({
          book: id,
          status: 'parsed',
          pages,
          lastEditedBy: req.user?._id,
          lastEditedAt: new Date(),
        });
      }
      pagesCount = pages.length;
    } finally {
      global.Buffer = originalBuffer;
    }

    return res.status(200).json({ success: true, pagesCount });
  } catch (err) {
    console.error('Smart Book parse error', err);
    return res.status(500).json({ error: 'Failed to parse PDF' });
  }
});