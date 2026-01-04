import React, { useState } from 'react';
import { Music as MusicIcon, Play, Pause, Plus, X, Trash2, Disc, Search, ExternalLink, Cloud, CloudOff } from 'lucide-react';
import { useCloudStorage } from '../hooks/useCloudStorage';

const Music = () => {
  const initialMusic = [
    {
      id: 1,
      title: "Love Story - Taylor Swift",
      link: "", 
      cover: "https://images.unsplash.com/photo-1595971294624-92b6457a4a8f?auto=format&fit=crop&q=80&w=500",
      addedAt: "2024-01-01"
    },
    // ... (Keep existing initial items if needed, or remove them to rely on Cloud)
    // For cloud migration, better to start clean or rely on what's in useCloudStorage logic
  ];

  const { data: musicList, loading, addItem, deleteItem, isCloud } = useCloudStorage('music', 'musicList', initialMusic);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [newMusic, setNewMusic] = useState({
      title: '',
      link: '',
      cover: ''
  });

  // Safe check for musicList to be an array
  const safeMusicList = Array.isArray(musicList) ? musicList : [];

  const filteredMusic = safeMusicList.filter(item => {
      const query = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(query);
  }).sort((a, b) => new Date(b.addedAt || b.created_at) - new Date(a.addedAt || a.created_at));

  const handlePlay = (item) => {
    if (currentSong?.id === item.id && isPlaying) {
      setIsPlaying(false);
    } else {
      setCurrentSong(item);
      setIsPlaying(true);
    }
  };

  const handleAddMusic = (e) => {
      e.preventDefault();
      if (!newMusic.title.trim()) return;

      const newItem = {
          id: Date.now(), // Local temp ID, DB will generate real ID usually
          title: newMusic.title,
          link: newMusic.link,
          cover: newMusic.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=500', // Default cover
          // created_at will be added by useCloudStorage
      };

      addItem(newItem);
      setShowAddModal(false);
      setNewMusic({ title: '', link: '', cover: '' });
  };

  const handleDeleteMusic = (id) => {
      if(window.confirm('确定要删除这首音乐吗？')) {
          deleteItem('id', id);
          if (currentSong?.id === id) {
              setCurrentSong(null);
              setIsPlaying(false);
          }
      }
  };

  return (
    <div className="space-y-8 animate-fade-in bg-slate-50/50 min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-rose-100">
        <div>
          <h1 className="text-3xl font-bold text-rose-950 flex items-center gap-3">
            <MusicIcon className="w-8 h-8 text-rose-600" />
            音乐收藏 (Music Collection)
          </h1>
          <p className="text-rose-900/60 mt-2 text-sm font-medium flex items-center gap-2">
            我的个人音乐库，随时随地享受旋律。
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
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
             <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input 
                   type="text" 
                   placeholder="搜索音乐..." 
                   className="pl-9 pr-4 py-2.5 bg-white border border-rose-100 rounded-md text-sm focus:outline-none focus:border-rose-500 w-full md:w-64 shadow-sm"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white text-sm font-medium rounded-md hover:bg-rose-700 shadow-md shadow-rose-200 transition-all hover:-translate-y-0.5 justify-center"
            >
              <Plus className="w-4 h-4" />
              添加音乐 (Add Music)
            </button>
        </div>
      </header>

      {/* Music Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredMusic.map(item => (
          <div key={item.id} className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-rose-100 relative">
             <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMusic(item.id);
                    }}
                    className="p-1.5 bg-white/90 backdrop-blur rounded-full text-stone-500 hover:text-red-600 shadow-sm"
                    title="删除"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
             </div>

            <div className="aspect-square overflow-hidden relative group cursor-pointer" onClick={() => handlePlay(item)}>
              <img 
                src={item.cover} 
                alt={item.title}
                className={`w-full h-full object-cover transition-transform duration-700 ${currentSong?.id === item.id && isPlaying ? 'scale-110' : 'group-hover:scale-110'}`}
              />
              <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${currentSong?.id === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                 <button className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                    {currentSong?.id === item.id && isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                 </button>
              </div>
            </div>
            
            <div className="p-4">
                <h3 className="font-bold text-stone-800 text-sm leading-tight truncate mb-1" title={item.title}>{item.title}</h3>
                <div className="flex justify-between items-center mt-2">
                     <span className="text-xs text-stone-400 font-mono">{new Date(item.addedAt || item.created_at).toLocaleDateString()}</span>
                     {item.link && (
                         <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-rose-500 hover:text-rose-600" onClick={(e) => e.stopPropagation()}>
                             <ExternalLink size={14} />
                         </a>
                     )}
                </div>
            </div>
          </div>
        ))}
        
        {filteredMusic.length === 0 && (
            <div className="col-span-full text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-50 text-rose-300 rounded-full mb-4">
                    <MusicIcon className="w-8 h-8" />
                </div>
                <p className="text-rose-900/60 font-medium">没有找到相关音乐，快去添加吧！</p>
            </div>
        )}
      </div>

      {/* Music Player Bar (Fixed Bottom) */}
      {currentSong && (
        <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-white border-t border-stone-200 p-4 shadow-lg z-40 flex flex-col md:flex-row items-center justify-between animate-slide-up gap-4">
            {/* Player Logic */}
            {(() => {
                const isBilibili = currentSong.link && (currentSong.link.includes('bilibili.com') || currentSong.link.startsWith('BV'));
                // Robust YouTube detection
                const getYouTubeId = (url) => {
                    if (!url) return null;
                    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                    const match = url.match(regExp);
                    return (match && match[2].length === 11) ? match[2] : null;
                };
                const youtubeId = getYouTubeId(currentSong.link);
                
                if (isBilibili) {
                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                            {/* Backdrop - Click to close */}
                            <div 
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity" 
                                onClick={() => {
                                    setCurrentSong(null);
                                    setIsPlaying(false);
                                }}
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
                                className="pointer-events-auto z-50 bg-black rounded-xl overflow-hidden shadow-2xl border border-rose-200 flex flex-col"
                                dragHandleClassName="drag-handle"
                            >
                                {/* Drag Handle / Header */}
                                <div className="drag-handle h-10 bg-rose-950/90 backdrop-blur flex items-center justify-between px-4 cursor-move border-b border-rose-900 shrink-0 group">
                                    <div className="flex items-center gap-2 text-rose-100">
                                        <MusicIcon size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Bilibili Player</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-rose-300/60 text-[10px] uppercase font-mono hidden group-hover:block">
                                            Drag to move • Resize edges
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setCurrentSong(null);
                                                setIsPlaying(false);
                                            }}
                                            className="text-rose-200 hover:text-white transition-colors bg-rose-800 hover:bg-red-600 rounded-full p-1"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Video Content */}
                                <div className="flex-1 relative bg-black w-full h-full">
                                    <iframe 
                                        src={`//player.bilibili.com/player.html?bvid=${currentSong.link.match(/BV[a-zA-Z0-9]+/)?.[0] || ''}&high_quality=1&danmaku=0`} 
                                        className="absolute inset-0 w-full h-full"
                                        scrolling="no" 
                                        border="0" 
                                        frameBorder="0" 
                                        framespacing="0" 
                                        allowFullScreen={true}
                                    ></iframe>
                                </div>
                            </Rnd>
                        </div>
                    );
                } else if (youtubeId) {
                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                            {/* Backdrop - Click to close */}
                            <div 
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity" 
                                onClick={() => {
                                    setCurrentSong(null);
                                    setIsPlaying(false);
                                }}
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
                                className="pointer-events-auto z-50 bg-black rounded-xl overflow-hidden shadow-2xl border border-rose-200 flex flex-col"
                                dragHandleClassName="drag-handle"
                            >
                                {/* Drag Handle / Header */}
                                <div className="drag-handle h-10 bg-rose-950/90 backdrop-blur flex items-center justify-between px-4 cursor-move border-b border-rose-900 shrink-0 group">
                                    <div className="flex items-center gap-2 text-rose-100">
                                        <Youtube size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">YouTube Player</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-rose-300/60 text-[10px] uppercase font-mono hidden group-hover:block">
                                            Drag to move • Resize edges
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setCurrentSong(null);
                                                setIsPlaying(false);
                                            }}
                                            className="text-rose-200 hover:text-white transition-colors bg-rose-800 hover:bg-red-600 rounded-full p-1"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Video Content */}
                                <div className="flex-1 relative bg-black w-full h-full">
                                    <iframe 
                                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                                        className="absolute inset-0 w-full h-full"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            </Rnd>
                        </div>
                    );
                } else {
                    // Standard Audio Player
                    return (
                        <>
                            <div className="flex items-center gap-4">
                                <img src={currentSong.cover} alt="Album Art" className="w-12 h-12 rounded object-cover shadow-sm" />
                                <div>
                                    <h4 className="font-bold text-stone-800 text-sm">{currentSong.title}</h4>
                                    <p className="text-xs text-stone-500">正在播放</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                                <button className="text-stone-400 hover:text-stone-600">
                                    <Disc className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-sm"
                                >
                                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-1" />}
                                </button>
                                <div className="w-48 h-1 bg-stone-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-rose-400 w-1/3 animate-pulse"></div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <button onClick={() => {
                                    setCurrentSong(null);
                                    setIsPlaying(false);
                                }} className="text-stone-400 hover:text-stone-600">
                                    <X size={20} />
                                </button>
                            </div>
                        </>
                    );
                }
            })()}
        </div>
      )}

      {/* Add Music Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in border border-rose-100">
                <div className="p-4 border-b border-rose-100 flex justify-between items-center bg-rose-50/50">
                    <h3 className="font-bold text-rose-900">添加音乐</h3>
                    <button onClick={() => setShowAddModal(false)} className="text-rose-400 hover:text-rose-600">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleAddMusic} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-rose-900/60 uppercase mb-1">音乐标题</label>
                        <input 
                            required
                            type="text" 
                            className="w-full border border-rose-200 rounded p-2 text-sm focus:outline-none focus:border-rose-500"
                            placeholder="Song Title"
                            value={newMusic.title}
                            onChange={(e) => setNewMusic({...newMusic, title: e.target.value})}
                        />
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-rose-900/60 uppercase mb-1">链接 (Bilibili / YouTube / Audio URL)</label>
                         <input 
                            type="text" 
                            className="w-full border border-rose-200 rounded p-2 text-sm focus:outline-none focus:border-rose-500"
                            placeholder="https://www.bilibili.com/video/... or https://youtu.be/..."
                            value={newMusic.link}
                            onChange={(e) => setNewMusic({...newMusic, link: e.target.value})}
                        />
                        <p className="text-[10px] text-stone-400 mt-1">支持 Bilibili/YouTube 视频链接或直接音频链接</p>
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-rose-900/60 uppercase mb-1">封面图片 URL (可选)</label>
                         <input 
                            type="text" 
                            className="w-full border border-rose-200 rounded p-2 text-sm focus:outline-none focus:border-rose-500"
                            placeholder="https://..."
                            value={newMusic.cover}
                            onChange={(e) => setNewMusic({...newMusic, cover: e.target.value})}
                        />
                    </div>
                    <button 
                        type="submit"
                        className="w-full py-2.5 bg-rose-600 text-white rounded-md font-bold hover:bg-rose-700 transition-colors shadow-md shadow-rose-200"
                    >
                        添加
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Music;
