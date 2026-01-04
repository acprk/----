import React, { useState } from 'react';
import { Music as MusicIcon, Play, Pause, Plus, X, Trash2, Search, ExternalLink, Cloud, CloudOff } from 'lucide-react';
import { useCloudStorage } from '../hooks/useCloudStorage';
import { useMusic } from '../context/MusicContext';

const Music = () => {
  const initialMusic = [
    {
      id: 1,
      title: "Love Story - Taylor Swift",
      link: "", 
      cover: "https://images.unsplash.com/photo-1595971294624-92b6457a4a8f?auto=format&fit=crop&q=80&w=500",
      addedAt: "2024-01-01"
    },
  ];

  const { data: musicList, addItem, deleteItem, isCloud } = useCloudStorage('music', 'musicList', initialMusic);
  const { currentSong, isPlaying, playSong, closePlayer } = useMusic();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
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
    playSong(item);
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
          deleteItem(id);
          if (currentSong?.id === id) {
              closePlayer();
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-24">
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
