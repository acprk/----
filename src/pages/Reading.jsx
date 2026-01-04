import React, { useState, useMemo } from 'react';
import { Book, Star, Clock, Quote, Bookmark, Plus, X, Trash2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Edit3, Cloud, CloudOff } from 'lucide-react';
import { useCloudStorage } from '../hooks/useCloudStorage';
import AIAssistant from '../components/AIAssistant';
import MarkdownEditor from '../components/MarkdownEditor';

// Simple Calendar Component
const Calendar = ({ books }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Helper to check if a date has activity
  const hasActivity = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    // Also match simple formats like 2024/1/1 or 1/1/2024 if present
    return books.some(book => {
        if (!book.date) return false;
        // Simple normalized comparison
        const bookDate = new Date(book.date);
        return bookDate.getDate() === day && bookDate.getMonth() === month && bookDate.getFullYear() === year;
    });
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-8"></div>);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const active = hasActivity(i);
    days.push(
      <div key={i} className={`h-8 flex items-center justify-center text-xs rounded-full cursor-pointer transition-colors relative group
        ${active ? 'bg-amber-600 text-white font-bold' : 'text-stone-600 hover:bg-amber-100'}
      `}>
        {i}
        {active && (
           <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap bg-stone-800 text-white text-[10px] py-1 px-2 rounded z-20">
             有读书记录
           </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-sm border border-amber-100 shadow-sm font-sans">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-stone-800 flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-amber-600" />
          阅读日历
        </h3>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-1 hover:bg-stone-100 rounded text-stone-500"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-medium text-stone-600 w-24 text-center">{monthNames[month]} {year}</span>
          <button onClick={nextMonth} className="p-1 hover:bg-stone-100 rounded text-stone-500"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <div key={d} className="text-xs font-bold text-amber-900/40">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
    </div>
  );
};

const Reading = () => {
  const initialBooks = [
    {
      id: 1,
      title: "The Structure of Scientific Revolutions",
      author: "Thomas S. Kuhn",
      rating: 5,
      status: "Read",
      date: "2024-03-15",
      quote: "Normal science, the activity in which most scientists inevitably spend almost all their time, is predicated on the assumption that the scientific community knows what the world is like.",
      review: "A fundamental text for understanding how science progresses not just linearly, but through paradigm shifts. The concept of incommensurability is particularly striking when applied to modern AI developments.",
      notes: [] 
    },
    {
      id: 2,
      title: "Gödel, Escher, Bach",
      author: "Douglas Hofstadter",
      rating: 5,
      status: "Reading",
      progress: 45,
      date: "2024-01-10",
      quote: "Meaning lies as much in the mind of the reader as in the Haiku.",
      review: "Exploring the nature of consciousness through the lens of self-reference and formal systems. It is dense, playful, and incredibly rewarding.",
      notes: []
    },
    {
      id: 3,
      title: "Design Patterns",
      author: "Erich Gamma et al.",
      rating: 4,
      status: "Reference",
      date: "2023-11-20",
      quote: "Program to an interface, not an implementation.",
      review: "The classic Gang of Four book. While some patterns are now built into modern languages, the fundamental principles of object-oriented design remain crucial.",
      notes: []
    }
  ];

  const { data: books, addItem, deleteItem, updateItem, isCloud } = useCloudStorage('books', 'books', initialBooks);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [tempReview, setTempReview] = useState('');

  // Add Book State
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    status: 'Reading',
    rating: 0,
    progress: 0,
    quote: '',
    review: '',
    notes: []
  });

  const currentYear = new Date().getFullYear();
  const booksThisYear = (books || []).filter(b => {
      if (!b.date) return false;
      const d = new Date(b.date);
      return d.getFullYear() === currentYear;
  }).length;
  
  const readingBooks = (books || []).filter(b => b.status === 'Reading');

  const handleAddBook = (e) => {
    e.preventDefault();
    const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    addItem({ id: Date.now(), ...newBook, date: dateStr });
    setShowAddModal(false);
    setNewBook({ title: '', author: '', status: 'Reading', rating: 0, progress: 0, quote: '', review: '', notes: [] });
  };

  const handleDeleteBook = (id) => {
    if (window.confirm('确定要删除这本书的记录吗？')) {
      deleteItem(id);
    }
  };

  const openReviewModal = (book) => {
    setSelectedBook(book);
    setTempReview(book.review || '');
    setShowReviewModal(true);
  };

  const handleSaveReview = () => {
    if (selectedBook) {
        updateItem({ ...selectedBook, review: tempReview });
        setShowReviewModal(false);
        setSelectedBook(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-serif">
      <header className="border-b-2 border-amber-200/60 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-bold text-amber-950 tracking-tight">读书漫游 (Reading Roam)</h1>
          <p className="text-amber-800/70 mt-3 text-lg italic font-light">
            "A room without books is like a body without a soul."
          </p>
        </div>
        <div className="flex gap-4 items-center">
            <div className="hidden md:flex gap-4 text-amber-900/60 text-sm">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-900 text-lg">{booksThisYear}</span> 本年度
                </div>
                <div className="w-px h-4 bg-amber-300"></div>
                <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-900 text-lg">{(books || []).length}</span> 总笔记
                </div>
            </div>
            <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-700 text-white rounded hover:bg-amber-800 transition-colors shadow-sm font-sans"
            >
                <Plus className="w-4 h-4" />
                添加书籍
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-8">
          {books.map((book) => (
            <article key={book.id} className="bg-[#fdfbf7] p-8 rounded-sm shadow-sm border border-amber-100 relative overflow-hidden group hover:shadow-md transition-all duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              
              <button 
                onClick={() => handleDeleteBook(book.id)}
                className="absolute top-4 right-4 text-stone-300 hover:text-red-500 transition-colors z-20 opacity-0 group-hover:opacity-100"
                title="删除记录"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <div className="flex items-center gap-2 text-amber-600/80 text-xs font-bold uppercase tracking-wider mb-1 font-sans">
                    <Book className="w-3 h-3" />
                    <span>{book.status}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-stone-800 leading-tight group-hover:text-amber-900 transition-colors">
                    {book.title}
                  </h2>
                  <div className="text-stone-500 mt-1 font-style-italic">by {book.author}</div>
                </div>
                {book.rating > 0 && (
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < book.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`} />
                    ))}
                  </div>
                )}
              </div>

              {book.quote && (
                <blockquote className="my-6 pl-4 border-l-4 border-amber-200 italic text-stone-600 bg-amber-50/50 py-3 pr-4 rounded-r-sm">
                  <Quote className="w-4 h-4 text-amber-300 mb-1" />
                  "{book.quote}"
                </blockquote>
              )}

              <p className="text-stone-700 leading-relaxed text-lg line-clamp-3">
                {book.review}
              </p>

              <div className="mt-6 pt-6 border-t border-amber-100 flex justify-between items-center font-sans">
                <div className="text-xs text-stone-400 font-mono flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  {book.date}
                </div>
                <button 
                    onClick={() => openReviewModal(book)}
                    className="text-amber-700 text-sm font-medium hover:text-amber-900 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                >
                  完整书评/感想 <span className="text-lg leading-none">›</span>
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Sidebar */}
        <aside className="space-y-8">
          <Calendar books={books} />

          <div className="bg-white p-6 rounded-sm border border-amber-100 shadow-sm">
            <h3 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-amber-600" />
              正在阅读 (Currently Reading)
            </h3>
            <div className="space-y-4">
              {readingBooks.length === 0 ? (
                  <p className="text-stone-400 text-sm italic">暂无正在阅读的书籍</p>
              ) : (
                  readingBooks.map(book => (
                    <div key={book.id} className="flex gap-3">
                        <div className="w-16 h-24 bg-stone-200 rounded-sm shadow-inner flex items-center justify-center text-xs text-stone-400 text-center p-1 font-sans break-words overflow-hidden">
                        {book.title.slice(0, 10)}...
                        </div>
                        <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-stone-800 text-sm leading-tight truncate">{book.title}</h4>
                        <p className="text-stone-500 text-xs mt-1 truncate">{book.author}</p>
                        <div className="mt-3 w-full bg-stone-100 rounded-full h-1.5">
                            <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${book.progress || 0}%` }}></div>
                        </div>
                        <p className="text-xs text-amber-600 mt-1 text-right font-sans">{book.progress || 0}%</p>
                        </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          <div className="bg-amber-900 text-amber-50 p-6 rounded-sm">
            <h3 className="font-bold text-lg mb-2">每月挑战</h3>
            <p className="text-amber-200/80 text-sm mb-4">阅读 3 本 19 世纪的经典著作。</p>
            <div className="flex gap-2 mb-2 font-sans">
              <div className="w-8 h-8 rounded-full border border-amber-500/50 flex items-center justify-center bg-amber-800">1</div>
              <div className="w-8 h-8 rounded-full border border-amber-500/50 flex items-center justify-center text-amber-500/50">2</div>
              <div className="w-8 h-8 rounded-full border border-amber-500/50 flex items-center justify-center text-amber-500/50">3</div>
            </div>
            <p className="text-xs text-amber-400 mt-2 font-sans">1/3 完成</p>
          </div>
        </aside>
      </div>

       {/* Add Book Modal */}
       {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
                <div className="p-4 border-b border-amber-100 flex justify-between items-center bg-amber-50/50">
                    <h3 className="font-bold text-stone-800">记录新书</h3>
                    <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-stone-600">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleAddBook} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">书名</label>
                        <input 
                            required
                            type="text" 
                            className="w-full border border-stone-200 rounded p-2 text-sm focus:outline-none focus:border-amber-500"
                            value={newBook.title}
                            onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">作者</label>
                        <input 
                            required
                            type="text" 
                            className="w-full border border-stone-200 rounded p-2 text-sm focus:outline-none focus:border-amber-500"
                            value={newBook.author}
                            onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-xs font-bold text-stone-500 uppercase mb-1">状态</label>
                             <select 
                                className="w-full border border-stone-200 rounded p-2 text-sm focus:outline-none focus:border-amber-500"
                                value={newBook.status}
                                onChange={(e) => setNewBook({...newBook, status: e.target.value})}
                             >
                                 <option value="Reading">Reading</option>
                                 <option value="Read">Read</option>
                                 <option value="Reference">Reference</option>
                             </select>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-stone-500 uppercase mb-1">评分 (0-5)</label>
                             <input 
                                type="number" 
                                min="0" max="5"
                                className="w-full border border-stone-200 rounded p-2 text-sm focus:outline-none focus:border-amber-500"
                                value={newBook.rating}
                                onChange={(e) => setNewBook({...newBook, rating: parseInt(e.target.value)})}
                             />
                        </div>
                    </div>
                    {newBook.status === 'Reading' && (
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">阅读进度 (%)</label>
                            <input 
                                type="number"
                                min="0" max="100"
                                className="w-full border border-stone-200 rounded p-2 text-sm focus:outline-none focus:border-amber-500"
                                value={newBook.progress}
                                onChange={(e) => setNewBook({...newBook, progress: parseInt(e.target.value)})}
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">摘录 (Quote)</label>
                        <textarea 
                            rows="2"
                            className="w-full border border-stone-200 rounded p-2 text-sm focus:outline-none focus:border-amber-500 resize-none"
                            value={newBook.quote}
                            onChange={(e) => setNewBook({...newBook, quote: e.target.value})}
                        ></textarea>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">简评</label>
                        <textarea 
                            rows="3"
                            className="w-full border border-stone-200 rounded p-2 text-sm focus:outline-none focus:border-amber-500 resize-none"
                            value={newBook.review}
                            onChange={(e) => setNewBook({...newBook, review: e.target.value})}
                        ></textarea>
                    </div>
                    <button type="submit" className="w-full bg-amber-700 text-white py-2 rounded font-medium hover:bg-amber-800 transition-colors">
                        保存记录
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Review & Notes Modal */}
      {showReviewModal && selectedBook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col animate-fade-in">
                <div className="p-4 border-b border-amber-100 flex justify-between items-center bg-amber-50/50">
                    <div>
                        <h3 className="font-bold text-stone-800 text-lg">{selectedBook.title}</h3>
                        <p className="text-sm text-stone-500">by {selectedBook.author}</p>
                    </div>
                    <button onClick={() => setShowReviewModal(false)} className="text-stone-400 hover:text-stone-600">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="flex-1 p-6 overflow-y-auto flex flex-col">
                    <label className="block text-sm font-bold text-stone-500 uppercase mb-2 flex items-center gap-2">
                         <Edit3 className="w-4 h-4" />
                         编辑书评与笔记 (Markdown Supported)
                    </label>
                    <div className="flex-1 border border-stone-200 rounded-lg overflow-hidden">
                        <MarkdownEditor 
                            value={tempReview} 
                            onChange={setTempReview} 
                            placeholder="在此处撰写详细的书评、笔记或摘录... (支持 Markdown, Ctrl+V 粘贴图片)"
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-amber-100 bg-amber-50/50 flex justify-end gap-2">
                    <button 
                        onClick={() => setShowReviewModal(false)}
                        className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded"
                    >
                        取消
                    </button>
                    <button 
                        onClick={handleSaveReview}
                        className="px-4 py-2 bg-amber-700 text-white rounded hover:bg-amber-800 shadow-sm"
                    >
                        保存笔记
                    </button>
                </div>
            </div>
        </div>
      )}


    </div>
  );
};

export default Reading;
