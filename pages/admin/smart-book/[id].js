import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { toast } from 'react-hot-toast';

function PageEditor({ page, onChange }) {
  const [text, setText] = useState(page.text || '');
  useEffect(() => { setText(page.text || ''); }, [page.pageNumber]);
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Page {page.pageNumber}</h3>
      </div>
      <textarea
        className="w-full h-48 p-3 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        value={text}
        onChange={(e) => { setText(e.target.value); onChange(page.pageNumber, e.target.value); }}
      />
    </div>
  );
}

function SmartBookEditor() {
  const router = useRouter();
  const { id } = router.query;
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchContent = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/smart-book/${id}`);
        if (res.status === 200) {
          const data = await res.json();
          setPages(data.pages || []);
          setLoading(false);
        } else {
          // No content yet: parse client-side and save
          setLoading(false);
          setParsing(true);
          try {
            const pdfResp = await fetch(`/api/admin/smart-book/pdf/${id}`);
            if (!pdfResp.ok) throw new Error('Failed to fetch PDF');
            const arrayBuffer = await pdfResp.arrayBuffer();
            const pdfData = new Uint8Array(arrayBuffer);

            const pdfjsModule = await import('pdfjs-dist/build/pdf');
            // Explicitly set workerSrc to CDN to avoid bundler worker path issues
            pdfjsModule.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            const loadingTask = pdfjsModule.getDocument({ data: pdfData });
            const pdfDoc = await loadingTask.promise;

            const parsedPages = [];
            for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
              const page = await pdfDoc.getPage(pageNum);
              const textContent = await page.getTextContent();
              const text = textContent.items.map((item) => item.str).join(' ');
              parsedPages.push({ pageNumber: pageNum, text });
            }

            const saveRes = await fetch(`/api/admin/smart-book/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pages: parsedPages })
            });
            if (!saveRes.ok) throw new Error('Failed to save parsed pages');
            setPages(parsedPages);
            toast.success('Parsed PDF successfully');
          } catch (err) {
            console.error('Client-side parse error', err);
            toast.error('Failed to parse PDF');
          }
          setParsing(false);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
        setParsing(false);
        toast.error('Error loading Smart Book content');
      }
    };
    fetchContent();
  }, [id]);

  const handlePageChange = (pageNumber, text) => {
    setPages((prev) => prev.map((p) => (p.pageNumber === pageNumber ? { ...p, text } : p)));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/smart-book/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages }),
      });
      if (res.ok) {
        toast.success('✅ Saved successfully');
      } else {
        toast.error('Failed to save');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving content');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Smart Book Editor</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/admin/books')}
              className="px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            >Back</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-2 rounded-md bg-green-600 text-white disabled:opacity-50"
            >{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>

        {(loading || parsing) && (
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200 mb-4">
            <span className="animate-spin inline-block w-5 h-5 border-2 border-t-transparent border-gray-500 rounded-full" />
            <span>{loading ? 'Loading content…' : 'Parsing PDF…'}</span>
          </div>
        )}

        {!loading && pages && pages.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Scroll and edit pages below. Changes are saved when you click Save.</p>
            {pages.map((page) => (
              <PageEditor key={page.pageNumber} page={page} onChange={handlePageChange} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SmartBookEditorPage() {
  return (
    <ProtectedRoute requireAdmin>
      <SmartBookEditor />
    </ProtectedRoute>
  );
}