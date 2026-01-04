import React, { useState } from 'react';
import { Lightbulb, FileText, FlaskConical, PenTool, Plus, X, Trash2, BookOpen, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useLocalStorage } from '../hooks/useLocalStorage';
import MarkdownEditor from '../components/MarkdownEditor';

const Ideas = () => {
  const initialIdeas = [
    {
      id: 1,
      title: "结构化数据的生成式模型",
      description: "研究扩散模型是否能有效地增强具有复杂依赖关系的表格数据，比 GAN 更好地保留统计特性。",
      content: "# 实验笔记\n\n目前尝试了 DDPM 模型在 Adult 数据集上的表现。\n\n$$ L_t = \\mathbb{E}_{x_0, \\epsilon} [||\\epsilon - \\epsilon_\\theta(\\sqrt{\\bar{\\alpha}_t}x_0 + \\sqrt{1-\\bar{\\alpha}_t}\\epsilon, t)||^2] $$\n\n需要进一步调整超参数。",
      references: "- Ho, J., Jain, A., & Abbeel, P. (2020). Denoising diffusion probabilistic models.\n- Song, J., Meng, C., & Ermon, S. (2020). Denoising diffusion implicit models.",
      stage: "Literature Review",
      tags: ["AI", "GenModels"],
      date: "2024-06-01",
      priority: "High"
    },
    {
      id: 2,
      title: "边缘网络中的分布式共识优化",
      description: "提出一种基于信誉投票系统的轻量级共识机制，适用于资源受限的边缘设备。",
      content: "# 算法设计\n\n基于 Raft 协议的改进版。\n\n1. 选举阶段\n2. 日志复制\n3. 安全性验证",
      references: "- Ongaro, D., & Ousterhout, J. (2014). In search of an understandable consensus algorithm.",
      stage: "Ideation",
      tags: ["Systems", "Edge Computing"],
      date: "2024-05-20",
      priority: "Medium"
    },
    {
      id: 3,
      title: "法律文档的语义搜索",
      description: "在法律语料库上微调 Transformer 模型，以提高判例法优先级的检索准确性。",
      content: "",
      references: "",
      stage: "Experiment",
      tags: ["NLP", "LegalTech"],
      date: "2024-04-15",
      priority: "Low"
    },
    {
      id: 4,
      title: "医学影像的自监督学习",
      description: "探索对比学习技术，减少检测 X 光片异常时对标记数据的需求。",
      content: "",
      references: "",
      stage: "Writing",
      tags: ["CV", "Medical AI"],
      date: "2024-02-10",
      priority: "High"
    }
  ];

  const [ideas, setIdeas] = useLocalStorage('ideas', initialIdeas);
  const [showModal, setShowModal] = useState(false);
  const [viewingIdea, setViewingIdea] = useState(null);
  const [newIdea, setNewIdea] = useState({
    title: '',
    description: '',
    content: '',
    references: '',
    stage: 'Ideation',
    tags: '',
    priority: 'Medium'
  });

  const getStageIcon = (stage) => {
    switch (stage) {
      case 'Ideation': return <Lightbulb className="w-4 h-4" />;
      case 'Literature Review': return <FileText className="w-4 h-4" />;
      case 'Experiment': return <FlaskConical className="w-4 h-4" />;
      case 'Writing': return <PenTool className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getStageName = (stage) => {
      const map = {
          'Ideation': '灵感构思 (Ideation)',
          'Literature Review': '文献调研 (Literature)',
          'Experiment': '实验验证 (Experiment)',
          'Writing': '论文撰写 (Writing)'
      };
      return map[stage] || stage;
  };

  const handleAddIdea = (e) => {
      e.preventDefault();
      const tagsArray = newIdea.tags.split(',').map(t => t.trim()).filter(t => t);
      setIdeas([{
          id: Date.now(),
          ...newIdea,
          tags: tagsArray,
          date: new Date().toLocaleDateString()
      }, ...ideas]);
      setShowModal(false);
      setNewIdea({ title: '', description: '', content: '', references: '', stage: 'Ideation', tags: '', priority: 'Medium' });
  };

  const handleDeleteIdea = (id) => {
      if (window.confirm('确定要删除这个想法吗？')) {
          setIdeas(ideas.filter(idea => idea.id !== id));
      }
  };

  const [searchQuery, setSearchQuery] = useState('');

  const filteredIdeas = ideas.filter(idea => {
    const query = searchQuery.toLowerCase();
    return (
        (idea.title && idea.title.toLowerCase().includes(query)) ||
        (idea.description && idea.description.toLowerCase().includes(query)) ||
        (idea.content && idea.content.toLowerCase().includes(query)) ||
        (Array.isArray(idea.tags) && idea.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-8 animate-fade-in bg-slate-50/50 min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-indigo-100">
        <div>
          <h1 className="text-3xl font-bold text-indigo-950 flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-indigo-600" />
            论文灵感 (Paper Ideas)
          </h1>
          <p className="text-indigo-900/60 mt-2 text-sm font-medium">记录研究方向、假设和实验进度。</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input 
                   type="text" 
                   placeholder="搜索灵感..." 
                   className="pl-9 pr-4 py-2.5 bg-white border border-indigo-100 rounded-md text-sm focus:outline-none focus:border-indigo-500 w-full md:w-64 shadow-sm"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <button 
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 justify-center"
            >
              <Plus className="w-4 h-4" />
              新想法 (New Idea)
            </button>
        </div>
      </header>

      {/* Timeline View */}
      <div className="relative max-w-4xl mx-auto py-8">
          {/* Vertical Line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-indigo-200 transform -translate-x-1/2"></div>
          
          <div className="space-y-12">
            {filteredIdeas.map((idea, index) => (
                <div key={idea.id} className={`relative flex flex-col md:flex-row gap-8 items-center ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                    {/* Date/Status Badge on the timeline */}
                    <div className="absolute left-8 md:left-1/2 w-4 h-4 bg-white border-4 border-indigo-500 rounded-full transform -translate-x-1/2 z-10"></div>
                    
                    {/* Content Card */}
                    <div className="w-full md:w-1/2 pl-16 md:pl-0">
                        <div 
                            className={`bg-white p-6 rounded-xl shadow-sm border border-indigo-50 hover:border-indigo-300 transition-all cursor-pointer group relative hover:shadow-md ${index % 2 === 0 ? 'md:mr-8' : 'md:ml-8'}`}
                            onClick={() => setViewingIdea(idea)}
                        >
                             <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteIdea(idea.id);
                                }}
                                className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 z-10"
                                title="删除想法"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-mono text-indigo-400 bg-indigo-50 px-2 py-1 rounded">
                                    {idea.date}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${idea.priority === 'High' ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'}`}>
                                    {idea.priority}
                                </span>
                                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full border border-indigo-100 flex items-center gap-1">
                                    {getStageIcon(idea.stage)}
                                    {idea.stage}
                                </span>
                            </div>

                            <h3 className="font-bold text-lg text-slate-800 mb-2 group-hover:text-indigo-600 leading-snug">
                                {idea.title}
                            </h3>
                            
                            <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                                {idea.description}
                            </p>

                            <div className="flex flex-wrap gap-1.5">
                                {idea.tags.map(tag => (
                                <span key={tag} className="text-[10px] bg-slate-50 text-slate-500 px-2 py-1 rounded border border-slate-100">
                                    #{tag}
                                </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Empty space for the other side */}
                    <div className="hidden md:block w-1/2"></div>
                </div>
            ))}
            
            {filteredIdeas.length === 0 && (
                <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-50 text-indigo-300 rounded-full mb-4">
                        <Search className="w-8 h-8" />
                    </div>
                    <p className="text-indigo-900/60 font-medium">没有找到相关的灵感笔记</p>
                </div>
            )}
          </div>
      </div>

      {/* Add Idea Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden animate-fade-in border border-indigo-100 max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-indigo-100 flex justify-between items-center bg-indigo-50/50 shrink-0">
                    <h3 className="font-bold text-indigo-900">新研究想法</h3>
                    <button onClick={() => setShowModal(false)} className="text-indigo-400 hover:text-indigo-600">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleAddIdea} className="p-6 space-y-4 overflow-y-auto flex-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-indigo-900/60 uppercase mb-1">标题</label>
                            <input 
                                required
                                type="text" 
                                className="w-full border border-indigo-200 rounded p-2 text-sm focus:outline-none focus:border-indigo-500"
                                value={newIdea.title}
                                onChange={(e) => setNewIdea({...newIdea, title: e.target.value})}
                            />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-indigo-900/60 uppercase mb-1">阶段 & 优先级</label>
                             <div className="flex gap-2">
                                <select 
                                    className="w-1/2 border border-indigo-200 rounded p-2 text-sm focus:outline-none focus:border-indigo-500"
                                    value={newIdea.stage}
                                    onChange={(e) => setNewIdea({...newIdea, stage: e.target.value})}
                                >
                                    <option value="Ideation">Ideation</option>
                                    <option value="Literature Review">Literature Review</option>
                                    <option value="Experiment">Experiment</option>
                                    <option value="Writing">Writing</option>
                                </select>
                                <select 
                                    className="w-1/2 border border-indigo-200 rounded p-2 text-sm focus:outline-none focus:border-indigo-500"
                                    value={newIdea.priority}
                                    onChange={(e) => setNewIdea({...newIdea, priority: e.target.value})}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                             </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-indigo-900/60 uppercase mb-1">简要描述</label>
                        <textarea 
                            required
                            rows="2"
                            className="w-full border border-indigo-200 rounded p-2 text-sm focus:outline-none focus:border-indigo-500 resize-none"
                            value={newIdea.description}
                            onChange={(e) => setNewIdea({...newIdea, description: e.target.value})}
                        ></textarea>
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-indigo-900/60 uppercase mb-1">详细笔记 (支持 Markdown & Math)</label>
                         <MarkdownEditor 
                            value={newIdea.content} 
                            onChange={(val) => setNewIdea({...newIdea, content: val})} 
                            placeholder="实验记录、公式推导、思路..."
                            minHeight="min-h-[300px]"
                         />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-indigo-900/60 uppercase mb-1">参考文献</label>
                         <textarea 
                            rows="3"
                            className="w-full border border-indigo-200 rounded p-2 text-sm focus:outline-none focus:border-indigo-500 resize-none font-mono"
                            placeholder="- Author. (Year). Title."
                            value={newIdea.references}
                            onChange={(e) => setNewIdea({...newIdea, references: e.target.value})}
                        ></textarea>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-indigo-900/60 uppercase mb-1">标签 (逗号分隔)</label>
                        <input 
                            type="text" 
                            className="w-full border border-indigo-200 rounded p-2 text-sm focus:outline-none focus:border-indigo-500"
                            placeholder="AI, NLP, System"
                            value={newIdea.tags}
                            onChange={(e) => setNewIdea({...newIdea, tags: e.target.value})}
                        />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded font-medium hover:bg-indigo-700 transition-colors">
                        创建想法
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* View/Edit Idea Modal */}
      {viewingIdea && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden animate-fade-in border border-indigo-100 h-[90vh] flex flex-col">
                <div className="p-4 border-b border-indigo-100 flex justify-between items-center bg-indigo-50/50 shrink-0">
                    <div className="flex items-center gap-2">
                        {getStageIcon(viewingIdea.stage)}
                        <h3 className="font-bold text-indigo-900 text-lg">编辑: {viewingIdea.title}</h3>
                    </div>
                    <button onClick={() => setViewingIdea(null)} className="text-indigo-400 hover:text-indigo-600">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1 bg-white space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-xs font-bold text-indigo-900/60 uppercase mb-1">阶段</label>
                             <select 
                                className="w-full border border-indigo-200 rounded p-2 text-sm focus:outline-none focus:border-indigo-500"
                                value={viewingIdea.stage}
                                onChange={(e) => setViewingIdea({...viewingIdea, stage: e.target.value})}
                            >
                                <option value="Ideation">Ideation</option>
                                <option value="Literature Review">Literature Review</option>
                                <option value="Experiment">Experiment</option>
                                <option value="Writing">Writing</option>
                            </select>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-indigo-900/60 uppercase mb-1">优先级</label>
                             <select 
                                className="w-full border border-indigo-200 rounded p-2 text-sm focus:outline-none focus:border-indigo-500"
                                value={viewingIdea.priority}
                                onChange={(e) => setViewingIdea({...viewingIdea, priority: e.target.value})}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                     </div>

                    <div>
                        <label className="block text-xs font-bold text-indigo-900/60 uppercase mb-1">简要描述</label>
                        <textarea 
                            rows="2"
                            className="w-full border border-indigo-200 rounded p-2 text-sm focus:outline-none focus:border-indigo-500 resize-none"
                            value={viewingIdea.description}
                            onChange={(e) => setViewingIdea({...viewingIdea, description: e.target.value})}
                        ></textarea>
                    </div>

                    <div className="flex-1 flex flex-col min-h-[400px]">
                        <label className="block text-xs font-bold text-indigo-900/60 uppercase mb-1">详细笔记 (Markdown)</label>
                        <div className="flex-1 border border-indigo-200 rounded overflow-hidden">
                             <MarkdownEditor 
                                value={viewingIdea.content || ''}
                                onChange={(val) => setViewingIdea({...viewingIdea, content: val})}
                                placeholder="在此处编辑详细笔记..."
                                minHeight="h-full"
                             />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-indigo-900/60 uppercase mb-1 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" /> 参考文献
                        </label>
                         <textarea 
                            rows="4"
                            className="w-full border border-indigo-200 rounded p-2 text-sm focus:outline-none focus:border-indigo-500 resize-none font-mono"
                            value={viewingIdea.references}
                            onChange={(e) => setViewingIdea({...viewingIdea, references: e.target.value})}
                        ></textarea>
                    </div>
                </div>

                <div className="p-4 border-t border-indigo-100 bg-indigo-50/30 shrink-0 flex justify-end gap-2">
                    <button 
                        onClick={() => setViewingIdea(null)}
                        className="px-4 py-2 text-indigo-400 hover:text-indigo-600 font-medium"
                    >
                        取消
                    </button>
                    <button 
                        onClick={() => {
                            setIdeas(ideas.map(i => i.id === viewingIdea.id ? viewingIdea : i));
                            setViewingIdea(null);
                        }}
                        className="px-6 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        保存更改
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Ideas;
