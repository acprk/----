import React, { useState } from 'react';
import { Download, ExternalLink, File, FileCode, Database, Archive, HardDrive, Plus, X, Youtube, Link as LinkIcon, Trash2, Music, Film, Wrench, FileText, Edit3, Cloud, CloudOff, Globe, Search, Link2, BookOpen, Library } from 'lucide-react';
import { Rnd } from 'react-rnd';
import { useCloudStorage } from '../hooks/useCloudStorage';
import MarkdownEditor from '../components/MarkdownEditor';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sortable Item Component ---
const SortableResourceItem = ({ resource, onDelete, onPlay, categoryColor, typeIcon, getYoutubeId }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: resource.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : 'auto',
    opacity: isDragging ? 0.5 : 1,
    position: 'relative', 
    touchAction: 'none', // Required for PointerSensor to work smoothly on touch devices
  };

  const youtubeId = getYoutubeId(resource.link);

  return (
    <div 
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        {...listeners}
        className="group relative bg-white p-4 rounded-xl border border-stone-100 shadow-sm hover:shadow-md hover:border-stone-200 transition-all flex gap-4 animate-fade-in-up cursor-grab active:cursor-grabbing"
    >
        {/* Delete Button - Stop Propagation to prevent drag start on click */}
        <button 
        onClick={(e) => onDelete(resource.id, e)}
        onPointerDown={(e) => e.stopPropagation()} 
        className="absolute top-2 right-2 p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-20"
        >
            <Trash2 className="w-4 h-4" />
        </button>

        {/* Thumbnail/Icon */}
        <div className="shrink-0">
            {youtubeId ? (
                <div 
                    className="w-32 h-20 rounded-lg overflow-hidden bg-black relative shadow-sm group-hover:shadow-md transition-all cursor-pointer"
                    onClick={(e) => {
                        // Prevent drag when clicking to play
                        // Actually, listeners are on the parent div. 
                        // If we want to allow clicking, we usually don't need to stop propagation unless it conflicts.
                        // But for dragging, clicking the thumbnail might be interpreted as drag start.
                        // We'll let it be. If user drags, it drags. If click, it plays.
                        onPlay(youtubeId);
                    }}
                    onPointerDown={(e) => e.stopPropagation()} // Stop drag when interacting with thumbnail to play
                >
                    <img 
                        src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`} 
                        alt={resource.title}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                            <Youtube className="w-4 h-4 text-white fill-current" />
                        </div>
                    </div>
                </div>
            ) : (
                <div className={`w-12 h-12 rounded-lg ${categoryColor} bg-opacity-10 flex items-center justify-center`}>
                    {typeIcon}
                </div>
            )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 py-1">
            <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-stone-800 truncate pr-6 group-hover:text-amber-600 transition-colors select-none">{resource.title}</h3>
                {resource.type === 'YouTube' && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-bold select-none">VIDEO</span>}
            </div>
            <p className="text-sm text-stone-500 line-clamp-2 mb-2 select-none">{resource.description}</p>
            <a 
                href={resource.link} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-stone-400 hover:text-stone-700 transition-colors z-20 relative"
                onPointerDown={(e) => e.stopPropagation()} // Stop drag on link click
            >
                <ExternalLink className="w-3 h-3" />
                {resource.type === 'YouTube' ? 'Watch Now' : 'Visit / Download'}
            </a>
        </div>
    </div>
  );
};


const Resources = () => {
  const [showModal, setShowModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [linkExtractText, setLinkExtractText] = useState('');
  const [extractedLinks, setExtractedLinks] = useState([]);
  const [editingResource, setEditingResource] = useState(null);
  const [activeCategory, setActiveCategory] = useState('Papers'); // Default active

  // Categories Configuration
  const categories = [
    { 
        id: 'Papers', 
        name: 'Papers', 
        displayName: '论文 List', 
        icon: FileText, 
        color: 'bg-emerald-50 text-emerald-600',
        borderColor: 'border-emerald-200',
        gradient: 'from-emerald-50 to-white'
    },
    { 
        id: 'Music', 
        name: 'Music', 
        displayName: '音乐分享', 
        icon: Music, 
        color: 'bg-amber-50 text-amber-600',
        borderColor: 'border-amber-200',
        gradient: 'from-amber-50 to-white'
    },
    { 
        id: 'Movies', 
        name: 'Movies', 
        displayName: '电影分享', 
        icon: Film, 
        color: 'bg-blue-50 text-blue-600',
        borderColor: 'border-blue-200',
        gradient: 'from-blue-50 to-white'
    },
    { 
        id: 'Tools', 
        name: 'Tools', 
        displayName: '工具分享', 
        icon: Wrench, 
        color: 'bg-purple-50 text-purple-600',
        borderColor: 'border-purple-200',
        gradient: 'from-purple-50 to-white'
    },
  ];

  // Initial Data
  const initialResources = [
    {
      id: 1,
      title: "Attention Is All You Need",
      type: "PDF",
      category: "Papers",
      description: "Transformer 架构的开山之作。",
      link: "#"
    },
    {
      id: 2,
      title: "Hans Zimmer - Interstellar OST",
      type: "Music",
      category: "Music",
      description: "星际穿越原声带，工作学习时的最佳背景音乐。",
      link: "https://www.youtube.com/watch?v=IDsCtDRV2uA" // Example
    },
    {
      id: 3,
      title: "Inception (盗梦空间)",
      type: "Movie",
      category: "Movies",
      description: "诺兰导演的经典科幻电影，关于梦境与潜意识。",
      link: "#"
    },
    {
      id: 4,
      title: "Cursor IDE",
      type: "Tool",
      category: "Tools",
      description: "基于 VS Code 的 AI 编程编辑器，极大提高效率。",
      link: "#"
    },
    {
      id: 5,
      title: "Deep Residual Learning",
      type: "PDF",
      category: "Papers",
      description: "ResNet 论文，深度学习的里程碑。",
      link: "#"
    },
     {
      id: 6,
      title: "Lofi Girl - chill beats",
      type: "Music",
      category: "Music",
      description: "放松、学习用的 Lofi 音乐直播。",
      link: "https://www.youtube.com/watch?v=jfKfPfyJRdk"
    }
  ];

  const { data: resources, addItem, deleteItem, updateItem, setAllItems, isCloud } = useCloudStorage('resources', 'resources', initialResources);
  const [playingVideo, setPlayingVideo] = useState(null); // Video ID to play
  
  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
        // We are reordering the global list based on the move
        const oldIndex = (resources || []).findIndex((item) => item.id === active.id);
        const newIndex = (resources || []).findIndex((item) => item.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
            const newResources = arrayMove(resources, oldIndex, newIndex);
            setAllItems(newResources);
        }
    }
  };

  const openExternalSearch = (platform, query) => {
    let url = '';
    const q = encodeURIComponent(query);
    switch(platform) {
        case 'google': url = `https://www.google.com/search?q=${q}`; break;
        case 'github': url = `https://github.com/search?q=${q}`; break;
        case 'stackoverflow': url = `https://stackoverflow.com/search?q=${q}`; break;
        case 'arxiv': url = `https://arxiv.org/search/?query=${q}&searchtype=all`; break;
        case 'juejin': url = `https://juejin.cn/search?query=${q}`; break;
        case 'zhihu': url = `https://www.zhihu.com/search?type=content&q=${q}`; break;
        case 'bilibili': url = `https://search.bilibili.com/all?keyword=${q}`; break;
        default: return;
    }
    window.open(url, '_blank');
  };

  const handleExtractLinks = () => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = linkExtractText.match(urlRegex);
    setExtractedLinks(matches || []);
  };

  const importSearchResult = (item) => {
    let category = 'Tools';
    if (item.source === 'ArXiv') category = 'Papers';
    if (item.source === 'GitHub') category = 'Tools';
    if (item.source === 'Wikipedia') category = 'Tools';
    if (item.source === 'Google Books') category = 'Papers';
    
    const resourceToAdd = {
      id: Date.now(),
      title: item.title,
      link: item.link,
      description: item.description || item.title,
      category: category,
      type: 'Link',
      content: `Imported from ${item.source}\n\n${item.meta}\n\n${item.link}`
    };
    
    addItem(resourceToAdd);
    // Optional: Show a toast or feedback
    alert(`Added "${item.title}" to Resources!`);
  };

  // Form State
  const [newResource, setNewResource] = useState({
    title: '',
    link: '',
    description: '',
    content: '',
    category: 'Papers',
    type: 'Link'
  });

  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getBilibiliId = (url) => {
      if (!url) return null;
      const regExp = /BV([a-zA-Z0-9]+)/;
      const match = url.match(regExp);
      return match ? `BV${match[1]}` : null;
  };

  const handleAddResource = (e) => {
    e.preventDefault();
    const youtubeId = getYoutubeId(newResource.link);
    const bilibiliId = getBilibiliId(newResource.link);
    
    let type = 'Link';
    if (youtubeId) type = 'YouTube';
    else if (bilibiliId) type = 'Bilibili';
    else if (newResource.category === 'Papers') type = 'PDF';
    else if (newResource.category === 'Music') type = 'Music';
    else if (newResource.category === 'Movies') type = 'Movie';
    else if (newResource.category === 'Tools') type = 'Tool';

    const resourceToAdd = {
      id: Date.now(),
      ...newResource,
      type,
    };

    addItem(resourceToAdd);
    setShowModal(false);
    setNewResource({ title: '', link: '', description: '', category: 'Papers', type: 'Link' });
  };

  const handleDeleteResource = (id, e) => {
      e.stopPropagation(); // Prevent triggering hover/click on parent
      if (window.confirm('确定要删除这个资源吗？')) {
          deleteItem(id);
      }
  };

  const handleUpdateResource = (e) => {
      e.preventDefault();
      const youtubeId = getYoutubeId(editingResource.link);
      const bilibiliId = getBilibiliId(editingResource.link);

      let type = 'Link';
      if (youtubeId) type = 'YouTube';
      else if (bilibiliId) type = 'Bilibili';
      else if (editingResource.category === 'Papers') type = 'PDF';
      else if (editingResource.category === 'Music') type = 'Music';
      else if (editingResource.category === 'Movies') type = 'Movie';
      else if (editingResource.category === 'Tools') type = 'Tool';

      const updatedResource = {
          ...editingResource,
          type
      };

      updateItem(updatedResource);
      setEditingResource(null);
  };

  const getTypeIcon = (type) => {
    switch(type) {
        case 'PDF': return <FileText className="w-5 h-5" />;
        case 'Music': return <Music className="w-5 h-5" />;
        case 'Movie': return <Film className="w-5 h-5" />;
        case 'Tool': return <Wrench className="w-5 h-5" />;
        case 'YouTube': return <Youtube className="w-5 h-5" />;
        default: return <LinkIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col animate-fade-in">
      <header className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 tracking-tight flex items-center gap-3">
             资源分享 (Resource Share)
             {isCloud ? (
                <span className="inline-flex items-center gap-1 text-green-600 text-xs px-2 py-0.5 bg-green-100 rounded-full font-normal">
                    <Cloud size={10} /> Sync
                </span>
            ) : (
                <span className="inline-flex items-center gap-1 text-orange-600 text-xs px-2 py-0.5 bg-orange-100 rounded-full font-normal">
                    <CloudOff size={10} /> Local
                </span>
            )}
          </h1>
          <p className="text-stone-500 mt-1">
            <span className="mr-4">📚 论文</span>
            <span className="mr-4">🎵 音乐</span>
            <span className="mr-4">🎬 电影</span>
            <span>🛠️ 工具</span>
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-md hover:bg-stone-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          添加资源
        </button>
      </header>

      {/* Expanding Accordion Layout */}
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
      <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.name;
          const catResources = (resources || []).filter(r => r.category === cat.name);

          return (
            <div 
              key={cat.id}
              onMouseEnter={() => setActiveCategory(cat.name)}
              className={`
                relative rounded-2xl border transition-all duration-500 ease-in-out overflow-hidden flex flex-col
                ${isActive ? 'flex-[3] shadow-lg ' + cat.borderColor : 'flex-1 bg-stone-50 border-stone-200 hover:bg-stone-100 cursor-pointer'}
              `}
            >
              {/* Category Header / Strip Label */}
              <div className={`
                p-6 flex items-center gap-4 border-b
                ${isActive ? `bg-gradient-to-r ${cat.gradient} ${cat.borderColor}` : 'border-transparent justify-center h-full flex-col'}
              `}>
                <div className={`p-3 rounded-xl transition-all duration-500 ${cat.color} ${isActive ? '' : 'scale-125'}`}>
                  <cat.icon className="w-6 h-6" />
                </div>
                <h2 className={`font-bold text-xl text-stone-700 whitespace-nowrap transition-all duration-300 ${isActive ? '' : '[writing-mode:vertical-rl] mt-4 tracking-widest'}`}>
                  {cat.displayName}
                </h2>
                {isActive && <span className="text-xs font-mono text-stone-400 ml-auto">{catResources.length} items</span>}
              </div>

              {/* Content List (Only visible when active) */}
              <div className={`flex-1 overflow-y-auto p-4 space-y-3 bg-white/50 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 hidden'}`}>
                {catResources.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-stone-400">
                    <cat.icon className="w-12 h-12 mb-2 opacity-20" />
                    <p>暂无资源</p>
                  </div>
                ) : (
                  <SortableContext 
                    items={catResources.map(r => r.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {catResources.map(res => (
                        <SortableResourceItem 
                            key={res.id} 
                            resource={res} 
                            onDelete={handleDeleteResource}
                            onPlay={setPlayingVideo}
                            categoryColor={cat.color}
                            typeIcon={getTypeIcon(res.type)}
                            getYoutubeId={getYoutubeId}
                        />
                    ))}
                  </SortableContext>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </DndContext>

      {/* Search & Link Extractor Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-fade-in border border-stone-200 h-[80vh] flex flex-col">
                <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/50 shrink-0">
                    <h3 className="font-bold text-stone-800 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-500" />
                        全网资源搜索 (Built-in Search)
                    </h3>
                    <button onClick={() => setShowSearchModal(false)} className="text-stone-400 hover:text-stone-600">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Tabs & Search Bar */}
                    <div className="p-4 border-b border-stone-100 bg-white">
                         {/* Platform Tabs */}
                         <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                            {[
                                { id: 'github', name: 'GitHub', icon: FileCode, color: 'text-stone-800' },
                                { id: 'stackoverflow', name: 'StackOverflow', icon: Database, color: 'text-orange-600' },
                                { id: 'arxiv', name: 'ArXiv (Papers)', icon: FileText, color: 'text-red-600' },
                            ].map(platform => (
                                <button
                                    key={platform.id}
                                    onClick={() => {
                                        setActiveSearchPlatform(platform.id);
                                        if(searchQuery) handleInternalSearch(platform.id, searchQuery);
                                    }}
                                    className={`
                                        flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border
                                        ${activeSearchPlatform === platform.id 
                                            ? 'bg-stone-800 text-white border-stone-800' 
                                            : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
                                        }
                                    `}
                                >
                                    <platform.icon className="w-3 h-3" />
                                    {platform.name}
                                </button>
                            ))}
                         </div>

                         {/* Search Input */}
                         <div className="relative flex gap-2">
                             <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                <input 
                                    type="text" 
                                    placeholder={`Search on ${activeSearchPlatform}...`}
                                    className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if(e.key === 'Enter') handleInternalSearch(activeSearchPlatform, searchQuery);
                                    }}
                                />
                             </div>
                             <button 
                                onClick={() => handleInternalSearch(activeSearchPlatform, searchQuery)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                                disabled={isSearching}
                             >
                                {isSearching ? 'Searching...' : 'Search'}
                             </button>
                         </div>
                    </div>

                    {/* Results Area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-stone-50/30">
                        {searchResults.length === 0 && !isSearching && (
                            <div className="text-center py-12 text-stone-400">
                                <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">输入关键词并按回车搜索</p>
                                <div className="mt-8 pt-8 border-t border-stone-100 max-w-md mx-auto">
                                    <p className="text-xs font-bold text-stone-500 uppercase mb-3">外部链接 (External Links)</p>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        <button onClick={() => openExternalSearch('google', searchQuery)} className="text-xs px-2 py-1 bg-white border border-stone-200 rounded text-stone-500 hover:text-blue-600">Google</button>
                                        <button onClick={() => openExternalSearch('bilibili', searchQuery)} className="text-xs px-2 py-1 bg-white border border-stone-200 rounded text-stone-500 hover:text-pink-600">Bilibili</button>
                                        <button onClick={() => openExternalSearch('zhihu', searchQuery)} className="text-xs px-2 py-1 bg-white border border-stone-200 rounded text-stone-500 hover:text-blue-600">Zhihu</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isSearching && (
                            <div className="space-y-3">
                                {[1,2,3].map(i => (
                                    <div key={i} className="h-24 bg-white rounded-xl border border-stone-100 animate-pulse"></div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-3">
                            {searchResults.map((item) => (
                                <div key={item.id} className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-stone-800 text-sm mb-1 truncate" dangerouslySetInnerHTML={{__html: item.title}}></h4>
                                            <p className="text-xs text-stone-500 line-clamp-2 mb-2">{item.description}</p>
                                            <div className="flex items-center gap-3 text-[10px] text-stone-400 font-mono">
                                                <span className="px-1.5 py-0.5 bg-stone-100 rounded text-stone-600">{item.source}</span>
                                                <span>{item.meta}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 shrink-0">
                                            <a 
                                                href={item.link} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Open Link"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                            <button 
                                                onClick={() => importSearchResult(item)}
                                                className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                title="Import to Resources"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Link Extractor (Collapsed/Small) */}
                    <div className="p-3 border-t border-stone-100 bg-stone-50 text-center">
                        <button 
                            onClick={() => {
                                const text = prompt("Paste text to extract links:");
                                if(text) {
                                    setLinkExtractText(text);
                                    handleExtractLinks(); // This needs to be slightly adjusted to work with new state or just use the prompt text
                                    // Actually, let's keep it simple: Just a button to toggle the old extractor if needed, or just leave it out as search is main focus now.
                                    // Let's implement a simple extractor here.
                                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                                    const matches = text.match(urlRegex);
                                    if (matches) {
                                        if(confirm(`Found ${matches.length} links. Add them all?`)) {
                                            matches.forEach(link => {
                                                 addItem({
                                                    id: Date.now() + Math.random(),
                                                    title: 'Extracted Link',
                                                    link: link,
                                                    category: 'Tools',
                                                    type: 'Link',
                                                    description: 'Extracted from text'
                                                 });
                                            });
                                        }
                                    } else {
                                        alert("No links found.");
                                    }
                                }
                            }}
                            className="text-xs font-bold text-stone-500 hover:text-stone-800 flex items-center justify-center gap-2"
                        >
                            <Link2 className="w-3 h-3" />
                            Need to extract links from text? Click here
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-fade-in h-[90vh] flex flex-col">
                <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50 shrink-0">
                    <h3 className="font-bold text-stone-800">添加新资源</h3>
                    <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleAddResource} className="p-6 space-y-4 overflow-y-auto flex-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">标题</label>
                            <input 
                                required
                                type="text" 
                                className="w-full border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all"
                                placeholder="资源名称..."
                                value={newResource.title}
                                onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">链接 (URL)</label>
                            <input 
                                required
                                type="url" 
                                className="w-full border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all"
                                placeholder="https://..."
                                value={newResource.link}
                                onChange={(e) => setNewResource({...newResource, link: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">分类</label>
                        <div className="grid grid-cols-4 gap-2">
                            {categories.map(c => (
                                <button
                                    key={c.name}
                                    type="button"
                                    onClick={() => setNewResource({...newResource, category: c.name})}
                                    className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-2 transition-all justify-center
                                        ${newResource.category === c.name 
                                            ? `${c.color} border-current bg-opacity-10` 
                                            : 'border-stone-200 text-stone-500 hover:border-stone-300'
                                        }
                                    `}
                                >
                                    <c.icon className="w-3 h-3" />
                                    {c.displayName}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">简要描述</label>
                        <textarea 
                            required
                            rows="2"
                            className="w-full border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 resize-none transition-all"
                            placeholder="简要描述..."
                            value={newResource.description}
                            onChange={(e) => setNewResource({...newResource, description: e.target.value})}
                        ></textarea>
                    </div>
                    <div className="flex-1 min-h-[300px] flex flex-col">
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">详细笔记 (Markdown)</label>
                        <div className="flex-1 border border-stone-200 rounded-lg overflow-hidden">
                             <MarkdownEditor 
                                value={newResource.content} 
                                onChange={(val) => setNewResource({...newResource, content: val})} 
                                placeholder="在此处记录详细笔记..."
                                minHeight="h-full"
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-stone-800 text-white py-2.5 rounded-lg font-bold hover:bg-stone-700 transition-all transform active:scale-95 shrink-0">
                        确认添加
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Edit Resource Modal */}
      {editingResource && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-fade-in h-[90vh] flex flex-col">
                <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50 shrink-0">
                    <h3 className="font-bold text-stone-800">编辑资源</h3>
                    <button onClick={() => setEditingResource(null)} className="text-stone-400 hover:text-stone-600">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleUpdateResource} className="p-6 space-y-4 overflow-y-auto flex-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">标题</label>
                            <input 
                                required
                                type="text" 
                                className="w-full border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all"
                                value={editingResource.title}
                                onChange={(e) => setEditingResource({...editingResource, title: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">链接 (URL)</label>
                            <input 
                                required
                                type="url" 
                                className="w-full border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all"
                                value={editingResource.link}
                                onChange={(e) => setEditingResource({...editingResource, link: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">分类</label>
                        <div className="grid grid-cols-4 gap-2">
                            {categories.map(c => (
                                <button
                                    key={c.name}
                                    type="button"
                                    onClick={() => setEditingResource({...editingResource, category: c.name})}
                                    className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-2 transition-all justify-center
                                        ${editingResource.category === c.name 
                                            ? `${c.color} border-current bg-opacity-10` 
                                            : 'border-stone-200 text-stone-500 hover:border-stone-300'
                                        }
                                    `}
                                >
                                    <c.icon className="w-3 h-3" />
                                    {c.displayName}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">简要描述</label>
                        <textarea 
                            required
                            rows="2"
                            className="w-full border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 resize-none transition-all"
                            value={editingResource.description}
                            onChange={(e) => setEditingResource({...editingResource, description: e.target.value})}
                        ></textarea>
                    </div>
                    <div className="flex-1 min-h-[300px] flex flex-col">
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">详细笔记 (Markdown)</label>
                        <div className="flex-1 border border-stone-200 rounded-lg overflow-hidden">
                             <MarkdownEditor 
                                value={editingResource.content || ''} 
                                onChange={(val) => setEditingResource({...editingResource, content: val})} 
                                placeholder="在此处记录详细笔记..."
                                minHeight="h-full"
                             />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-stone-800 text-white py-2.5 rounded-lg font-bold hover:bg-stone-700 transition-all transform active:scale-95 shrink-0">
                        保存更改
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Video Player Modal - Draggable & Resizable */}
      {playingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
             {/* Backdrop - Click to close */}
             <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity" 
                onClick={() => setPlayingVideo(null)}
             ></div>

             <Rnd
                default={{
                    x: typeof window !== 'undefined' ? (window.innerWidth - 800) / 2 : 100,
                    y: typeof window !== 'undefined' ? (window.innerHeight - 500) / 2 : 100,
                    width: 800,
                    height: 480,
                }}
                minWidth={320}
                minHeight={200}
                bounds="window"
                className="pointer-events-auto z-50 bg-black rounded-xl overflow-hidden shadow-2xl border border-stone-800 flex flex-col"
                dragHandleClassName="drag-handle"
             >
                {/* Drag Handle / Header */}
                <div className="drag-handle h-10 bg-stone-900/90 backdrop-blur flex items-center justify-between px-4 cursor-move border-b border-stone-800 shrink-0 group">
                    <div className="flex items-center gap-2 text-stone-400">
                        <Youtube size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Video Player</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-stone-600 text-[10px] uppercase font-mono hidden group-hover:block">
                            Drag to move • Resize edges
                        </div>
                        <button 
                            onClick={() => setPlayingVideo(null)}
                            className="text-stone-400 hover:text-white transition-colors bg-stone-800 hover:bg-red-600 rounded-full p-1"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* Video Content */}
                <div className="flex-1 relative bg-black w-full h-full">
                    <iframe 
                        width="100%" 
                        height="100%" 
                        src={`https://www.youtube.com/embed/${playingVideo}?autoplay=1`} 
                        title="YouTube video player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                    ></iframe>
                    {/* Overlay to prevent iframe capturing mouse events while resizing (optional, but Rnd handles resize handles outside usually) */}
                </div>
             </Rnd>
        </div>
      )}
    </div>
  );
};

export default Resources;
