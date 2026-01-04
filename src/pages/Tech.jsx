import React, { useState } from 'react';
import { Terminal, Cpu, Database, Globe, Plus, X, Trash2, FileText, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useCloudStorage } from '../hooks/useCloudStorage';
import MarkdownEditor from '../components/MarkdownEditor';

const Tech = () => {
  const initialArticles = [
    {
      id: 1,
      title: "优化 React 服务端组件",
      summary: "理解 Hydration 边界并最小化下一代 Web 应用的包体积。",
      content: "# 优化 React 服务端组件\n\nReact Server Components (RSC) 允许我们在服务器上渲染组件...",
      tags: ["React", "Performance", "Web"],
      date: "2024-05-12",
      iconName: "Globe"
    },
    {
      id: 2,
      title: "神经网络的数学原理",
      summary: "在高维曲面上可视化反向传播和梯度下降。",
      content: "# 神经网络的数学原理\n\n反向传播算法的核心是链式法则：\n\n$$ \\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial y} \\cdot \\frac{\\partial y}{\\partial w} $$",
      tags: ["AI", "Math", "Python"],
      date: "2024-04-28",
      iconName: "Cpu"
    },
    {
      id: 3,
      title: "PostgreSQL 索引策略",
      summary: "何时在复杂查询优化中使用 B-Tree、GIN 和 GiST 索引。",
      content: "# PostgreSQL 索引策略\n\n## B-Tree vs GIN\n\n- **B-Tree**: 适合范围查询\n- **GIN**: 适合全文检索和 JSONB",
      tags: ["Database", "SQL", "Backend"],
      date: "2024-04-10",
      iconName: "Database"
    },
    {
      id: 4,
      title: "提升生产力的 Vim 键位",
      summary: "掌握文本对象操作和宏，以思维的速度编辑代码。",
      content: "# Vim 技巧\n\n使用 `ciw` (Change Inner Word) 快速修改单词。",
      tags: ["Tools", "Vim", "Workflow"],
      date: "2024-03-22",
      iconName: "Terminal"
    }
  ];

  const { data: articles, addItem, deleteItem, updateItem } = useCloudStorage('tech_articles', 'articles', initialArticles);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewingArticle, setViewingArticle] = useState(null);
  
  const filteredArticles = (articles || []).filter(article => {
      const query = searchQuery.toLowerCase();
      return (
          (article.title && article.title.toLowerCase().includes(query)) ||
          (article.summary && article.summary.toLowerCase().includes(query)) ||
          (Array.isArray(article.tags) && article.tags.some(tag => tag.toLowerCase().includes(query)))
      );
  });

  const [newArticle, setNewArticle] = useState({
    title: '',
    summary: '',
    content: '',
    tags: '',
    iconName: 'Terminal'
  });

  const getIcon = (iconName) => {
      const icons = { Terminal, Cpu, Database, Globe };
      const Icon = icons[iconName] || Terminal;
      return <Icon className="w-6 h-6" />;
  };

  const handleAddArticle = (e) => {
      e.preventDefault();
      const tagsArray = newArticle.tags.split(',').map(t => t.trim()).filter(t => t);
      addItem({
          id: Date.now(),
          ...newArticle,
          tags: tagsArray,
          date: new Date().toLocaleDateString()
      });
      setShowModal(false);
      setNewArticle({ title: '', summary: '', content: '', tags: '', iconName: 'Terminal' });
  };

  const handleDeleteArticle = (id) => {
      if (window.confirm('确定要删除这篇文章吗？')) {
          deleteItem(id);
      }
  };

  return (
    <div className="space-y-10 animate-fade-in font-mono text-slate-800">
      <header className="border-b border-slate-200 pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Terminal className="w-5 h-5" />
            <span className="text-sm font-bold tracking-wider">~/tech-share</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">技术分享 (Tech Share)</h1>
          <p className="text-slate-500 mt-2 max-w-xl flex items-center gap-2">
            探索软件架构、算法和开发者工具。
            {isCloud ? (
                <span className="inline-flex items-center gap-1 text-green-600 text-xs px-2 py-0.5 bg-green-100 rounded-full">
                    <Cloud size={10} /> Cloud Sync Active
                </span>
            ) : (
                <span className="inline-flex items-center gap-1 text-orange-600 text-xs px-2 py-0.5 bg-orange-100 rounded-full" title="Connect to Supabase for Cloud Sync">
                    <CloudOff size={10} /> Local Mode
                </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 items-center">
           <div className="relative mr-4">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input 
                   type="text" 
                   placeholder="搜索笔记..." 
                   className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-xs focus:outline-none focus:border-blue-500 w-48 transition-all focus:w-64"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                />
           </div>
           <button 
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition-colors shadow-sm text-xs font-bold"
           >
                <Plus className="w-4 h-4" />
                NEW NOTE
           </button>
        </div>
      </header>



      {/* Grid Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredArticles.map((article) => (
          <article 
            key={article.id} 
            className="bg-white p-6 rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group relative flex flex-col cursor-pointer"
            onClick={() => setViewingArticle(article)}
          >
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteArticle(article.id);
                }}
                className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 z-10"
                title="删除文章"
            >
                <Trash2 className="w-4 h-4" />
            </button>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-slate-50 rounded-md text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                {getIcon(article.iconName)}
              </div>
              <span className="text-xs text-slate-400">{article.date}</span>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
              {article.title}
            </h3>
            <p className="text-slate-600 text-sm mb-4 line-clamp-2">
              {article.summary}
            </p>
            
            <div className="flex flex-wrap gap-2 mt-auto">
              {article.tags.map(tag => (
                <span key={tag} className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  #{tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
      
      {/* Code Snippet Decoration */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 font-mono text-xs text-slate-500 overflow-hidden">
        <div className="flex gap-2 mb-3 border-b border-slate-200 pb-2">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <div className="w-3 h-3 rounded-full bg-amber-400"></div>
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
        <pre>
          <span className="text-purple-600">function</span> <span className="text-blue-600">explore</span>() {'{'}
          {'\n  '} <span className="text-purple-600">return</span> <span className="text-green-600">"Keep learning, keep building."</span>;
          {'\n}'}
        </pre>
      </div>

       {/* Add Article Modal */}
       {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden animate-fade-in border border-slate-200 max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
                    <h3 className="font-bold text-slate-800">New Post</h3>
                    <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleAddArticle} className="p-6 space-y-4 overflow-y-auto flex-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">标题</label>
                            <input 
                                required
                                type="text" 
                                className="w-full border border-slate-200 rounded p-2 text-sm focus:outline-none focus:border-blue-500 bg-slate-50"
                                value={newArticle.title}
                                onChange={(e) => setNewArticle({...newArticle, title: e.target.value})}
                            />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">图标</label>
                             <select 
                                className="w-full border border-slate-200 rounded p-2 text-sm focus:outline-none focus:border-blue-500 bg-slate-50"
                                value={newArticle.iconName}
                                onChange={(e) => setNewArticle({...newArticle, iconName: e.target.value})}
                             >
                                 <option value="Terminal">Terminal</option>
                                 <option value="Cpu">Cpu</option>
                                 <option value="Database">Database</option>
                                 <option value="Globe">Globe</option>
                             </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">摘要</label>
                        <textarea 
                            required
                            rows="2"
                            className="w-full border border-slate-200 rounded p-2 text-sm focus:outline-none focus:border-blue-500 bg-slate-50 resize-none"
                            value={newArticle.summary}
                            onChange={(e) => setNewArticle({...newArticle, summary: e.target.value})}
                        ></textarea>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">标签 (逗号分隔)</label>
                        <input 
                            type="text" 
                            className="w-full border border-slate-200 rounded p-2 text-sm focus:outline-none focus:border-blue-500 bg-slate-50"
                            placeholder="React, AI, Systems"
                            value={newArticle.tags}
                            onChange={(e) => setNewArticle({...newArticle, tags: e.target.value})}
                        />
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">内容 (支持 Markdown & Math)</label>
                         <MarkdownEditor 
                            value={newArticle.content} 
                            onChange={(val) => setNewArticle({...newArticle, content: val})} 
                            placeholder="开始编写技术分享..."
                            minHeight="min-h-[400px]"
                         />
                    </div>
                    <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded font-bold hover:bg-slate-700 transition-colors">
                        PUBLISH
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* View/Edit Article Modal */}
      {viewingArticle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden animate-fade-in border border-slate-200 h-[90vh] flex flex-col">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
                    <div className="flex items-center gap-2">
                        {viewingArticle.iconName && getIcon(viewingArticle.iconName)}
                        <h3 className="font-bold text-slate-800 text-lg">{viewingArticle.title}</h3>
                    </div>
                    <button onClick={() => setViewingArticle(null)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col p-0">
                     <MarkdownEditor 
                        value={viewingArticle.content || viewingArticle.summary || ''}
                        onChange={(val) => setViewingArticle({...viewingArticle, content: val})}
                        placeholder="在此处编辑技术文章..."
                        minHeight="h-full"
                     />
                </div>
                <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0 flex justify-between items-center">
                    <div className="flex gap-2">
                        {viewingArticle.tags && viewingArticle.tags.map(tag => (
                            <span key={tag} className="text-xs text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded">
                                #{tag}
                            </span>
                        ))}
                    </div>
                    <button 
                        onClick={() => {
                            updateItem(viewingArticle);
                            setViewingArticle(null);
                        }}
                        className="px-6 py-2 bg-slate-800 text-white rounded font-bold hover:bg-slate-700 transition-colors shadow-sm"
                    >
                        Save & Close
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Tech;
