import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { 
  Eye, Edit3, Image as ImageIcon, Upload, FileText, 
  Bold, Italic, Strikethrough, Code, Quote, Link, List, ListOrdered, 
  Heading1, Heading2, Heading3, Columns, Table, Minus, Download, 
  ChevronDown, FileJson, FileType, Check
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const MarkdownEditor = ({ value, onChange, placeholder, minHeight = "min-h-[400px]" }) => {
  const [viewMode, setViewMode] = useState('edit'); // 'edit', 'preview', 'split'
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showHeadingsMenu, setShowHeadingsMenu] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const previewRef = useRef(null);
  const exportMenuRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const insertText = (before, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = value || '';
    const selection = text.substring(start, end);
    
    const newText = text.substring(0, start) + before + selection + after + text.substring(end);
    onChange(newText);
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    let hasImage = false;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        hasImage = true;
        const file = item.getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target.result;
          // Insert image markdown with base64 data
          const imageMarkdown = `![Pasted Image](${base64})`;
          insertText(imageMarkdown);
        };
        reader.readAsDataURL(file);
      }
    }
    // If no image was handled, let default paste happen (text)
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const newText = value ? value + '\n\n' + text : text;
      onChange(newText);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExport = async (type) => {
    setShowExportMenu(false);
    const filename = `document-${new Date().toISOString().slice(0, 10)}`;

    if (type === 'md') {
      const blob = new Blob([value], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (type === 'html') {
      // Basic HTML wrapper
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${filename}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; color: #333; line-height: 1.6; }
            img { max-width: 100%; height: auto; border-radius: 8px; }
            pre { background: #f5f5f5; padding: 1rem; border-radius: 8px; overflow-x: auto; }
            code { font-family: monospace; background: #f5f5f5; padding: 0.2em 0.4em; border-radius: 4px; }
            blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 1rem; color: #666; }
            table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
            th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
            th { background: #f9f9f9; }
          </style>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css">
        </head>
        <body>
          <div id="content">
            <!-- Content will be rendered by the viewer usually, but here we just export the raw markdown for now or we could use a parser library server side. 
                 Since we are client side, we can't easily get the HTML string from ReactMarkdown without rendering it. 
                 Trick: clone the preview div content. -->
          </div>
          <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
          <script>
            document.getElementById('content').innerHTML = marked.parse(${JSON.stringify(value)});
          </script>
        </body>
        </html>
      `;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.html`;
      a.click();
    } else if (type === 'pdf') {
      // Temporarily show preview to capture it if not visible
      const wasPreview = viewMode === 'preview';
      if (viewMode === 'edit') setViewMode('preview');
      
      // Wait for render
      setTimeout(async () => {
        const element = document.querySelector('.prose-preview');
        if (!element) return;

        try {
          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false
          });
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
          
          // Calculate height to fit width (a4 width)
          const imgProps = pdf.getImageProperties(imgData);
          const pdfImgHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          // If long content, we might need multiple pages, but simple version for now:
          // Just fit width and let height flow (may cut off) or use auto-paging logic which is complex.
          // For now, let's just add image. If it's too long, jspdf needs split.
          // Simple approach: One long page or just fit on one page? 
          // Let's do standard A4 fit width.
          
          let heightLeft = pdfImgHeight;
          let position = 0;
          let pageHeight = pdf.internal.pageSize.height;

          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfImgHeight);
          heightLeft -= pageHeight;

          while (heightLeft >= 0) {
            position = heightLeft - pdfImgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfImgHeight);
            heightLeft -= pageHeight;
          }

          pdf.save(`${filename}.pdf`);
        } catch (err) {
          console.error("PDF Export failed", err);
          alert("PDF导出失败，建议使用浏览器打印功能(Ctrl+P)");
        } finally {
          if (!wasPreview) setViewMode(viewMode);
        }
      }, 500);
    }
  };

  const ToolbarButton = ({ icon: Icon, onClick, title, active }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-1.5 rounded-md transition-all ${
        active 
          ? 'bg-stone-200 text-stone-900' 
          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
      }`}
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="flex flex-col h-full border border-stone-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all hover:shadow-md">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-stone-100 sticky top-0 z-20">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {/* Headings */}
          <div className="relative">
            <ToolbarButton 
              icon={Heading1} 
              title="Headings" 
              onClick={() => setShowHeadingsMenu(!showHeadingsMenu)}
              active={showHeadingsMenu}
            />
            {showHeadingsMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-xl p-1 flex flex-col gap-1 min-w-[120px] animate-fade-in z-30">
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-stone-50 rounded text-stone-700" onClick={() => { insertText('# '); setShowHeadingsMenu(false); }}>
                  <Heading1 className="w-4 h-4" /> Heading 1
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-stone-50 rounded text-stone-700" onClick={() => { insertText('## '); setShowHeadingsMenu(false); }}>
                  <Heading2 className="w-4 h-4" /> Heading 2
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-stone-50 rounded text-stone-700" onClick={() => { insertText('### '); setShowHeadingsMenu(false); }}>
                  <Heading3 className="w-4 h-4" /> Heading 3
                </button>
              </div>
            )}
            {showHeadingsMenu && <div className="fixed inset-0 z-20" onClick={() => setShowHeadingsMenu(false)}></div>}
          </div>
          
          <div className="w-px h-4 bg-stone-200 mx-1"></div>
          
          <ToolbarButton icon={Bold} title="Bold (Ctrl+B)" onClick={() => insertText('**', '**')} />
          <ToolbarButton icon={Italic} title="Italic (Ctrl+I)" onClick={() => insertText('*', '*')} />
          <ToolbarButton icon={Strikethrough} title="Strikethrough" onClick={() => insertText('~~', '~~')} />
          
          <div className="w-px h-4 bg-stone-200 mx-1"></div>
          
          <ToolbarButton icon={Quote} title="Quote" onClick={() => insertText('> ')} />
          <ToolbarButton icon={Code} title="Code Block" onClick={() => insertText('```\n', '\n```')} />
          <ToolbarButton icon={Link} title="Link" onClick={() => insertText('[', '](url)')} />
          <ToolbarButton icon={ImageIcon} title="Image" onClick={() => insertText('![alt](', ')')} />
          <ToolbarButton icon={Table} title="Table" onClick={() => insertText('| Header | Header |\n| --- | --- |\n| Cell | Cell |')} />
          
          <div className="w-px h-4 bg-stone-200 mx-1"></div>

          <ToolbarButton icon={List} title="Bullet List" onClick={() => insertText('- ')} />
          <ToolbarButton icon={ListOrdered} title="Ordered List" onClick={() => insertText('1. ')} />
          <ToolbarButton icon={Minus} title="Horizontal Rule" onClick={() => insertText('\n---\n')} />
        </div>

        <div className="flex items-center gap-2 pl-4 border-l border-stone-200 ml-2">
           {/* View Modes */}
           <div className="flex bg-stone-100 p-0.5 rounded-lg">
              <button 
                onClick={() => setViewMode('edit')}
                className={`p-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'edit' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                title="Edit Mode"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setViewMode('split')}
                className={`p-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'split' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                title="Split View"
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="sr-only">Split</span>
              </button>
              <button 
                onClick={() => setViewMode('preview')}
                className={`p-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'preview' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                title="Preview Mode"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
           </div>

           {/* Export / Import Menu */}
           <div className="relative" ref={exportMenuRef}>
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1 px-2 py-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export
                <ChevronDown className="w-3 h-3" />
              </button>

              {showExportMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-stone-100 rounded-xl shadow-xl overflow-hidden animate-fade-in z-50">
                  <div className="p-1">
                    <button 
                      onClick={() => handleExport('md')}
                      className="flex items-center gap-3 w-full px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 rounded-lg transition-colors text-left"
                    >
                      <FileText className="w-4 h-4 text-emerald-500" />
                      Markdown (.md)
                    </button>
                    <button 
                      onClick={() => handleExport('html')}
                      className="flex items-center gap-3 w-full px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 rounded-lg transition-colors text-left"
                    >
                      <FileType className="w-4 h-4 text-orange-500" />
                      HTML (.html)
                    </button>
                    <button 
                      onClick={() => handleExport('pdf')}
                      className="flex items-center gap-3 w-full px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 rounded-lg transition-colors text-left"
                    >
                      <FileJson className="w-4 h-4 text-red-500" />
                      PDF (.pdf)
                    </button>
                    <div className="h-px bg-stone-100 my-1"></div>
                    <button 
                      onClick={handleImportClick}
                      className="flex items-center gap-3 w-full px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 rounded-lg transition-colors text-left"
                    >
                      <Upload className="w-4 h-4 text-blue-500" />
                      Import File
                    </button>
                  </div>
                </div>
              )}
           </div>
           
           <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".md,.txt" 
              className="hidden" 
            />
        </div>
      </div>

      {/* Editor Area */}
      <div className={`relative flex-1 bg-stone-50/30 ${minHeight} flex overflow-hidden`}>
        {/* Edit Pane */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`h-full flex flex-col ${viewMode === 'split' ? 'w-1/2 border-r border-stone-200' : 'w-full'}`}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onPaste={handlePaste}
              placeholder={placeholder || "Start writing... (Markdown supported)"}
              className="w-full h-full p-6 text-sm font-mono leading-relaxed resize-none bg-transparent focus:outline-none text-stone-800 placeholder:text-stone-300"
              spellCheck="false"
            />
          </div>
        )}

        {/* Preview Pane */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`h-full overflow-y-auto bg-white ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
             <div className="p-8 prose prose-stone prose-sm max-w-none prose-preview">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    img: ({node, ...props}) => (
                      <img {...props} className="rounded-xl shadow-sm max-h-96 mx-auto my-4" alt={props.alt || ''} />
                    ),
                    table: ({node, ...props}) => (
                      <div className="overflow-x-auto my-4 border border-stone-200 rounded-lg">
                        <table {...props} className="w-full text-sm text-left" />
                      </div>
                    ),
                    th: ({node, ...props}) => (
                      <th {...props} className="bg-stone-50 px-4 py-2 font-bold border-b border-stone-200" />
                    ),
                    td: ({node, ...props}) => (
                      <td {...props} className="px-4 py-2 border-b border-stone-100" />
                    ),
                    code: ({node, inline, className, children, ...props}) => {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline ? (
                        <pre className="bg-stone-900 text-stone-50 p-4 rounded-lg overflow-x-auto my-4 text-xs font-mono">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      ) : (
                        <code className="bg-stone-100 text-stone-800 px-1.5 py-0.5 rounded font-mono text-xs" {...props}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {value || '*Nothing to preview*'}
                </ReactMarkdown>
             </div>
          </div>
        )}
      </div>
      
      {/* Footer Info */}
      <div className="px-4 py-2 bg-white border-t border-stone-100 text-[10px] text-stone-400 font-mono flex justify-between items-center">
        <div className="flex gap-4">
           <span>{value ? value.length : 0} characters</span>
           <span>{value ? value.split(/\s+/).filter(Boolean).length : 0} words</span>
        </div>
        <div className="flex gap-2">
           <span>Markdown Supported</span>
           <span>•</span>
           <span>Ctrl+V to Paste Image</span>
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;