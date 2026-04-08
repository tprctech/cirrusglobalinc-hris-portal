import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

interface PdfViewerProps {
  url: string;
}

export default function PdfViewer({ url }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    const loadPdf = async () => {
      try {
        const pdf = await pdfjsLib.getDocument(url).promise;
        if (cancelled) return;
        setNumPages(pdf.numPages);
        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          if (cancelled) return;
          const scale = 1.5;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.display = 'block';
          canvas.style.margin = '0 auto 12px auto';
          canvas.style.maxWidth = '100%';
          canvas.style.height = 'auto';
          container.appendChild(canvas);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise;
          }
        }
      } catch {
        if (!cancelled) setError(true);
      }
    };

    loadPdf();
    return () => { cancelled = true; };
  }, [url]);

  if (error) {
    return <div className="resource-preview-loading">Unable to load PDF preview</div>;
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        padding: '16px',
        overflow: 'auto',
        background: '#f5f5f5',
      }}
    >
      {numPages === 0 && (
        <div className="resource-preview-loading">Loading PDF...</div>
      )}
    </div>
  );
}
