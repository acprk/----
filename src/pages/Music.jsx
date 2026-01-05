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
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [networkResults, setNetworkResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
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
          // Use YouTube thumb, or a nice abstract gradient/pattern if empty. Not the ugly DJ photo.
          cover: newMusic.cover || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop', 
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

  const [searchMode, setSearchMode] = useState('song'); // 'song' | 'album'

  const handleNetworkSearch = async (query) => {
      if (!query.trim()) return;
      setIsSearching(true);
      try {
          const entity = searchMode === 'album' ? 'album' : 'song';
          const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=${entity}&limit=20`);
          const data = await response.json();
          setNetworkResults(data.results || []);
      } catch (error) {
          console.error("Search failed:", error);
          alert("搜索失败，请检查网络连接");
      } finally {
          setIsSearching(false);
      }
  };

  const handleImportMusic = (result) => {
      // If it's an album, we might want to fetch tracks, but for now let's just import the album representative or the song.
      // Actually, if searchMode is 'album', result is a collection. 
      // User probably wants to add the whole album? Or just see it?
      // For simplicity in this version, we treat everything as a "Music Item".
      // But let's handle the "addedAt" error first by removing it.
      
      const title = result.collectionName || `${result.trackName} - ${result.artistName}`;
      const cover = result.artworkUrl100?.replace('100x100bb', '600x600bb');
      
      const newItem = {
          id: Date.now(),
          title: title,
          link: result.previewUrl || '', // It might be empty for albums
          cover: cover,
          // REMOVED addedAt to fix schema mismatch error
      };
      
      addItem(newItem);
      setShowSearchModal(false);
      setNetworkResults([]);
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
            <div className="flex gap-2">
                <button 
                    onClick={() => setShowSearchModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white text-rose-600 border border-rose-200 text-sm font-medium rounded-md hover:bg-rose-50 shadow-sm transition-all"
                >
                    <Search className="w-4 h-4" />
                    联网搜索
                </button>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white text-sm font-medium rounded-md hover:bg-rose-700 shadow-md shadow-rose-200 transition-all hover:-translate-y-0.5 justify-center"
                >
                    <Plus className="w-4 h-4" />
                    添加音乐
                </button>
            </div>
        </div>
      </header>

      {/* Music Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-24">
        {filteredMusic.map(item => {
          const getYoutubeId = (url) => {
             const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
             const match = url ? url.match(regExp) : null;
             return (match && match[2].length === 11) ? match[2] : null;
          };
          const youtubeId = getYoutubeId(item.link);
          return (
            <div key={item.id} className="group relative bg-white p-4 rounded-xl border border-stone-100 shadow-sm hover:shadow-md hover:border-stone-200 transition-all flex gap-4 animate-fade-in-up" onClick={() => handlePlay(item)}>
               {/* Delete Button */}
               <button 
                  onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMusic(item.id);
                  }}
                  className="absolute top-2 right-2 p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg md:opacity-0 md:group-hover:opacity-100 transition-all z-10"
                  title="删除"
              >
                  <Trash2 className="w-4 h-4" />
              </button>

              {/* Thumbnail/Icon */}
              <div className="shrink-0">
                   {youtubeId ? (
                      <div 
                          className="w-32 h-20 rounded-lg overflow-hidden bg-black relative shadow-sm group-hover:shadow-md transition-all cursor-pointer"
                      >
                          <img 
                              src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`} 
                              alt={item.title}
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          />
                          <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${currentSong?.id === item.id && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                              <div className="w-8 h-8 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                                  {currentSong?.id === item.id && isPlaying ? <Pause className="w-4 h-4 text-white fill-current" /> : <Play className="w-4 h-4 text-white fill-current ml-0.5" />}
                              </div>
                          </div>
                      </div>
                   ) : (
                      <div className={`w-20 h-20 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-100 transition-colors`}>
                          {currentSong?.id === item.id && isPlaying ? <Pause className="w-8 h-8" /> : <MusicIcon className="w-8 h-8" />}
                      </div>
                   )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-stone-800 truncate pr-6 group-hover:text-rose-600 transition-colors text-base">{item.title}</h3>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                       <span className="text-xs text-stone-400 font-mono">{new Date(item.addedAt || item.created_at).toLocaleDateString()}</span>
                       {item.link && (
                           <div className="flex items-center gap-2">
                               <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:text-rose-600" onClick={(e) => e.stopPropagation()} title="Open Link">
                                   <ExternalLink size={14} />
                               </a>
                               {/* Quick helper to search full version if link is empty or looks like a preview */}
                               {(!item.link || item.link.includes('apple.com')) && (
                                   <a 
                                     href={`https://www.youtube.com/results?search_query=${encodeURIComponent(item.title)}`} 
                                     target="_blank" 
                                     rel="noopener noreferrer" 
                                     className="text-red-500 hover:text-red-700 text-[10px] font-bold border border-red-100 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1"
                                     onClick={(e) => e.stopPropagation()}
                                   >
                                     <Play size={8} /> Find Full
                                   </a>
                               )}
                           </div>
                       )}
                       {!item.link && (
                            <a 
                                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(item.title)}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-red-500 hover:text-red-700 text-[10px] font-bold border border-red-100 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Play size={8} /> Find Full
                            </a>
                       )}
                  </div>
              </div>
            </div>
          );
        })}
        
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

      {/* Network Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in border border-rose-100 flex flex-col max-h-[85vh]">
                <div className="p-4 border-b border-rose-100 flex justify-between items-center bg-rose-50/50 shrink-0">
                    <h3 className="font-bold text-rose-900 flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        联网搜索音乐 (iTunes API)
                    </h3>
                    <button onClick={() => { setShowSearchModal(false); setNetworkResults([]); }} className="text-rose-400 hover:text-rose-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4 border-b border-rose-50 shrink-0">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <input 
                            autoFocus
                            type="text" 
                            placeholder="输入歌曲名、艺人或专辑..." 
                            className="pl-9 pr-24 py-3 bg-slate-50 border border-rose-100 rounded-lg text-sm focus:outline-none focus:border-rose-500 w-full shadow-inner"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleNetworkSearch(e.target.value);
                            }}
                        />
                        <button 
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded hover:bg-rose-700 transition-colors"
                            onClick={(e) => handleNetworkSearch(e.target.previousSibling.value)}
                            disabled={isSearching}
                        >
                            {isSearching ? '搜索中...' : '搜索'}
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/30">
                    {networkResults.length === 0 && !isSearching && (
                        <div className="text-center py-12 text-slate-400">
                            <MusicIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p>输入关键词开始搜索全球音乐库</p>
                        </div>
                    )}
                    {networkResults.map((result) => (
                        <div key={result.trackId} className="flex items-center gap-4 p-3 bg-white border border-rose-50 rounded-xl hover:shadow-md hover:border-rose-200 transition-all group">
                            <img 
                                src={result.artworkUrl100} 
                                alt={result.trackName} 
                                className="w-16 h-16 rounded-lg object-cover shadow-sm"
                            />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-800 truncate">{result.trackName || result.collectionName}</h4>
                                <p className="text-xs text-slate-500 truncate">{result.artistName} • {result.collectionName}</p>
                                {result.previewUrl && (
                                    <audio controls src={result.previewUrl} className="mt-2 h-6 w-full max-w-[200px] opacity-60 hover:opacity-100 transition-opacity" />
                                )}
                                {!result.previewUrl && (
                                    <p className="text-[10px] text-orange-500 mt-2 flex items-center gap-1">
                                        <ExternalLink size={10} /> 无预览 (Metadata Only)
                                    </p>
                                )}
                            </div>
                            <button 
                                onClick={() => handleImportMusic(result)}
                                className="px-4 py-2 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg hover:bg-rose-600 hover:text-white transition-colors shrink-0 flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" />
                                导入
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Music;