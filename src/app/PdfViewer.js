'use client';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';


// Automatically pulls from node_modules so you don't need to mess with public/
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;


// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.js`;

// pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';


export default function PdfViewer({ fileUrl, pageNumber, setNumPages }) {
  return (
    <Document
      file={fileUrl}
      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
      loading={<div className="text-gray-400">Loading PDF...</div>}
      error={<div className="text-red-500">Failed to load PDF 😩</div>}
    >
      <Page pageNumber={pageNumber} width={1000} />
    </Document>
  );
}
