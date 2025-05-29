"use client";
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import dynamic from 'next/dynamic';

const PdfViewer = dynamic(() => import('./PdfViewer'), { ssr: false });


export default function Home() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [thinkingTime, setThinkingTime] = useState(0);
  const [pdfList, setPdfList] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const thinkingInterval = useRef(null);
  const welcomeMessages = [
    { sender: 'bot', text: 'Hi! Upload your PDFs and ask me anything about them.' },
    { sender: 'bot', text: 'Hello! Ready to chat about your PDFs. Just upload and ask.' },
    { sender: 'bot', text: 'Welcome! Drop your PDF files and start asking questions.' },
    { sender: 'bot', text: 'Greetings! Upload a PDF and I\'ll help you find answers.' }
  ];
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Welcome! Drop your PDF files and start asking questions.' }
  ]);
  const [pdfReferences, setPdfReferences] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const chatEndRef = useRef(null);
  const responseBoxRef = useRef(null);

  const fetchPdfList = async () => {
    try {
      const res = await fetch('http://localhost:8000/list_pdfs');
      const data = await res.json();
      setPdfList(data.pdfs || []);
    } catch (error) {
      console.error("Failed to fetch PDF list:", error);
      setPdfList([]); // Set to empty list on error
    }
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (loading) {
      setThinkingTime(0);
      thinkingInterval.current = setInterval(() => {
        setThinkingTime((t) => t + 1);  
      }, 1000);
    } else {
      clearInterval(thinkingInterval.current);
    }
    return () => clearInterval(thinkingInterval.current);
  }, [loading]);

  useEffect(() => {
    fetchPdfList();
  }, []); // Empty dependency array to run only on mount

  // Ensure selectedPdf is reset if the list changes and the current selection is missing
  useEffect(() => {
    if (selectedPdf && !pdfList.includes(selectedPdf)) {
      setSelectedPdf(null);
      setNumPages(null);
      setPageNumber(1);
    }
  }, [pdfList]);

  const handleUpload = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleAsk = async () => {
    if (!question) return;
    setLoading(true);
    setThinkingTime(0);
    setResponse("");
    setPdfReferences([]);
    setMessages((msgs) => [...msgs, { sender: 'user', text: question }]);
    setQuestion('');
    const start = Date.now();
    try {
      const res = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          pdf_name: selectedPdf,
          page_number: pageNumber
        }),
      });
      const data = await res.json();
      const elapsed = ((Date.now() - start) / 1000).toFixed(2);
      setResponse(data.answer || '💀 No answer found.');
      setPdfReferences(data.pdf_references || []);
      setMessages((msgs) => [...msgs, { sender: 'bot', text: data.answer || 'No answer found.', responseTime: elapsed }]);
    } catch (err) {
      setResponse('❌ error querying backend');
      setPdfReferences([]);
      setMessages((msgs) => [...msgs, { sender: 'bot', text: '❌ error querying the backend.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFiles = async () => {
    if (files.length === 0) return;
    setLoading(true);
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    try {
      const res = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setMessages((msgs) => [...msgs, { sender: 'bot', text: data.message || 'Files uploaded successfully.' }]);
      setFiles([]);
      await fetchPdfList(); // Refresh PDF list
    } catch (err) {
      setMessages((msgs) => [...msgs, { sender: 'bot', text: '❌ error uploading files.' }]);
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop handlers
  const handleDrop = (e) => {
    e.preventDefault();
    setFiles(Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf'));
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // PDF viewer handlers
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };
  const goToPrevPage = () => setPageNumber(p => Math.max(1, p - 1));
  const goToNextPage = () => setPageNumber(p => Math.min(numPages, p + 1));

  return (
    <div className="min-h-screen bg-color-1 text-color-5 flex">
      {/* Left: Chat Bar */}
      <div className="w-110 bg-slate-200 border-r border-color-2 flex flex-col h-screen">
        <div className="flex-1 overflow-y-auto p-6">
          <h1 className="text-2xl font-bold mb-4">PDF Chatbot</h1>
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg px-4 py-2 max-w-[80%] shadow ${msg.sender === 'user' ? 'bg-color-0 text-color-5' : 'bg-color-7 text-color-5 border border-color-2'}`}>
                  {msg.sender === 'bot' && msg.responseTime && (
                    <div className="text-xs text-color-2 mb-1">⏱️ {msg.responseTime}s</div> /* Changed text-gray-400 to text-color-2 */
                  )}
                  {msg.sender === 'bot' ? (
                    <ReactMarkdown
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-4 mb-2 text-color-3" {...props} />, 
                        h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-3 mb-2 text-color-1" {...props} />, 
                        h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-2 mb-1 text-color-2" {...props} />, 
                        strong: ({ node, ...props }) => (<strong className="text-color-0 font-semibold" {...props} />),
                        em: ({ node, ...props }) => (<em className="italic text-color-2" {...props} />),
                        ol: ({ node, ...props }) => (<ol className="list-decimal pl-6 my-2" {...props} />),
                        ul: ({ node, ...props }) => (<ul className="list-disc pl-6 my-2" {...props} />),
                        li: ({ node, ...props }) => (<li className="mb-1 pl-1" {...props} />),
                        p: ({ node, ...props }) => (<p className="mb-3" {...props} />),
                        code: ({node, inline, className, children, ...props}) =>
                          inline ? (
                            <code className="bg-color-4 text-color-0 px-1 rounded" {...props}>{children}</code>
                          ) : (
                            <pre className="bg-color-4 text-color-0 p-3 rounded mb-3 overflow-x-auto"><code {...props}>{children}</code></pre>
                          ),
                        blockquote: ({node, ...props}) => (
                          <blockquote className="border-l-4 border-color-0 pl-4 italic text-color-2 my-2" {...props} />
                        ),
                        hr: () => <hr className="my-4 border-color-4" />, 
                        a: ({node, ...props}) => <a className="text-color-0 underline" target="_blank" rel="noopener noreferrer" {...props} />, 
                        img: ({node, ...props}) => <img className="max-w-full rounded-lg my-2" {...props} />, 
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg px-4 py-2 bg-color-1 text-color-5 flex items-center gap-2 shadow border border-color-2">
                  <span className="animate-pulse">
                    {(() => {
                      const texts = [
                        "Thinking",
                        "Cooking up an answer...",
                        "Consulting the PDF oracles...",
                        "Summoning knowledge...",
                        "Crunching numbers (and maybe snacks)...",
                        "Reading at the speed of light...",
                        "Making sense of academic hieroglyphs...",
                        "Decoding PDF runes...",
                        "Trying not to hallucinate...",
                        "Loading wisdom...",
                        "Pretending to be a human...",
                        "Googling (just kidding, I can't)",
                        "Sharpening my digital pencil...",
                        "Bribing the LLM for a good answer...",
                        "Staring at the PDF until it blinks..."
                      ];
                      // Change every 7 seconds
                      return texts[Math.floor(thinkingTime / 7) % texts.length];
                    })()}
                  </span>
                  <span className="ml-3 text-xs text-color-2">{thinkingTime}s</span>
                </div>
              </div>
            )}
            {/* Add a dummy div to anchor scroll-to-bottom */}
            <div ref={chatEndRef} />
          </div>
        </div>
        <div className="p-4 border-t border-color-2 flex gap-2"> {/* Changed border-gray-200 to border-color-2 */}
          <input
            type="text"
            className="flex-1 bg-white text-color-5 p-3 rounded-lg border border-color-2 focus:border-color-0 focus:ring-2 focus:ring-color-0/30 outline-none shadow-inner placeholder:text-color-2" /* bg-gray-50->bg-white, text-gray-900->text-color-5, border-gray-300->border-color-2, focus:border-blue-400->focus:border-color-0, focus:ring-blue-100->focus:ring-color-0/30, placeholder:text-gray-400->placeholder:text-color-2 */
            placeholder="Type your question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAsk(); }}
            disabled={loading}
          />
          <button
            onClick={handleAsk}
            disabled={loading || !question}
            className="bg-color-3 hover:bg-color-4 text-color-0 px-5 py-2 rounded-lg font-bold shadow disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-color-3/50" /* bg-blue-500->bg-color-3, hover:bg-blue-600->hover:bg-color-4, text-white->text-color-0, focus:ring-blue-200->focus:ring-color-3/50 */
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </div>
      {/* Right: PDF Viewer & File List */}
      <div className="flex-1 flex flex-col h-screen">
        <div className="flex border-b border-color-2 bg-slate-200 p-4 items-center gap-4"> {/* Changed border-gray-200 to border-color-2 */}
          <div className="flex gap-2 overflow-x-auto">
            {pdfList.map((pdf, idx) => (
              <button
                key={pdf}
                onClick={() => { setSelectedPdf(pdf); setPageNumber(1); }}
                className={`px-4 py-2 rounded border text-sm font-medium transition ${selectedPdf === pdf ? 'bg-color-0 border-color-0 text-color-5' : 'bg-white border-color-2 text-color-3 hover:bg-color-1'}`} /* Selected: bg-blue-100 border-blue-400 text-blue-900 -> bg-color-0 border-color-0 text-color-5. Not selected: bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 -> bg-white border-color-2 text-color-3 hover:bg-color-1 */
              >
                {pdf}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowUpload(v => !v)}
            className="ml-auto bg-color-3 hover:bg-color-4 text-color-0 px-4 py-2 rounded shadow font-bold" /* bg-blue-500->bg-color-3, hover:bg-blue-600->hover:bg-color-4, text-white->text-color-0 */
          >
            {showUpload ? 'Close PDF Upload' : 'Upload PDFs'}
          </button>
        </div>
        {/* PDF Upload Drawer (reuse existing) */}
        {showUpload && (
          <div className="absolute top-0 right-0 w-full max-w-md h-full bg-white border-l border-color-2 shadow-2xl z-30 flex flex-col items-center p-8 animate-slide-left"> {/* Changed border-gray-200 to border-color-2 */}
            <div className="w-full flex justify-end mb-2">
              <button
                onClick={() => setShowUpload(false)}
                className="text-color-0 hover:text-color-1 text-lg font-bold px-3 py-1 rounded-full focus:outline-none focus:ring-2 focus:ring-color-0/40 transition-all"
                aria-label="Close PDF Dump"
              >
                ✕
              </button>
            </div>
            <h2 className="text-2xl font-extrabold text-color-0 mb-4 tracking-tight animate-slide-down">PDF Dump Area</h2>
            <div
              className="w-full h-40 border-2 border-dashed border-color-0 rounded-xl flex flex-col items-center justify-center text-color-2 mb-4 cursor-pointer hover:border-color-1 transition-all bg-color-5 animate-fade-in"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <span className="mb-2">Drag & drop PDFs here</span>
              <input
                type="file"
                accept="application/pdf"
                multiple
                onChange={handleUpload}
                className="hidden"
                id="pdf-upload-input"
              />
              <label htmlFor="pdf-upload-input" className="text-xs text-color-0 underline cursor-pointer">or select files</label>
            </div>
            {files.length > 0 && (
              <div className="w-full mb-4 animate-fade-in">
                <div className="text-sm text-color-2 mb-1">Selected PDFs:</div>
                <ul className="list-disc list-inside text-color-1 max-h-24 overflow-y-auto custom-scrollbar">
                  {files.map((file, idx) => (
                    <li key={idx}>{file.name}</li>
                  ))}
                </ul>
                <button
                  onClick={() => setFiles([])}
                  className="mt-2 text-xs text-color-0 hover:underline"
                  type="button"
                >
                  Clear selection
                </button>
              </div>
            )}
            <button
              onClick={handleUploadFiles}
              disabled={loading || files.length === 0}
              className="w-full bg-color-1 hover:bg-color-2 transition-all py-2 rounded-lg font-bold shadow-lg disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-color-0/40 text-color-0 border border-color-5"
            >
              {loading ? 'Uploading...' : 'Upload PDFs'}
            </button>
          </div>
        )}
        {/* PDF Viewer */}
        <div className="flex-1 flex flex-col items-center justify-center bg-color-1 overflow-y-auto relative"> {/* Added relative positioning for potential future absolute children if needed, though fixed positioning doesn't require it */}
          {selectedPdf ? (
            <>
              {/* PDFViewer container to help it expand */}
              <div className="w-full h-full flex items-start justify-center">
                <PdfViewer fileUrl={`http://localhost:8000/pdf/${selectedPdf}`} pageNumber={pageNumber} setNumPages={setNumPages} />
              </div>
              {/* Floating Page Navigation Controls */}
              <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-95 p-3 rounded-lg shadow-2xl flex items-center gap-3 z-50 border border-color-2">
                <button 
                  onClick={goToPrevPage} 
                  disabled={pageNumber <= 1} 
                  className="px-4 py-2 rounded bg-color-3 hover:bg-color-4 text-color-0 font-semibold disabled:opacity-60 transition-colors text-sm"
                >
                  Prev
                </button>
                <span className="text-color-5 font-medium text-sm px-2">
                  Page {pageNumber} of {numPages || '?'}
                </span>
                <button 
                  onClick={goToNextPage} 
                  disabled={pageNumber >= numPages && numPages !== null}  // Ensure numPages is not null before disabling
                  className="px-4 py-2 rounded bg-color-3 hover:bg-color-4 text-color-0 font-semibold disabled:opacity-60 transition-colors text-sm"
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <div className="text-color-2 text-lg">Select a PDF to view</div>
          )}
        </div>
      </div>
      {/* Custom Animations & Color Theme */}
      {/* Removed <style jsx global> block. All styles are now in globals.css */}
    </div>
  );
}
