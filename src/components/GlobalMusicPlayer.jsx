import React from 'react';
import { Music as MusicIcon, Play, Pause, X, Disc, Youtube } from 'lucide-react';
import { Rnd } from 'react-rnd';
import { useMusic } from '../context/MusicContext';

const GlobalMusicPlayer = () => {
  const { currentSong, isPlaying, setIsPlaying, closePlayer } = useMusic();

  if (!currentSong) return null;

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            {/* Backdrop - Click to close? Maybe not global, user wants to navigate. */}
            {/* We remove backdrop so user can interact with other pages while video plays */}
            {/* But we need a way to close it easily. The X button on player is enough. */}
            
            <Rnd
                default={{
                    x: typeof window !== 'undefined' ? (window.innerWidth - 800) / 2 : 20,
                    y: typeof window !== 'undefined' ? (window.innerHeight - 500) / 2 : 20,
                    width: 800,
                    height: 480,
                }}
                minWidth={320}
                minHeight={200}
                bounds="window"
                className="pointer-events-auto z-[100] bg-black rounded-xl overflow-hidden shadow-2xl border border-rose-200 flex flex-col"
                dragHandleClassName="drag-handle"
            >
                {/* Drag Handle / Header */}
                <div className="drag-handle h-10 bg-rose-950/90 backdrop-blur flex items-center justify-between px-4 cursor-move border-b border-rose-900 shrink-0 group">
                    <div className="flex items-center gap-2 text-rose-100">
                        <MusicIcon size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Bilibili Player (Global)</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-rose-300/60 text-[10px] uppercase font-mono hidden group-hover:block">
                            Drag to move • Resize edges
                        </div>
                        <button 
                            onClick={closePlayer}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            <Rnd
                default={{
                    x: typeof window !== 'undefined' ? (window.innerWidth - 800) / 2 : 20,
                    y: typeof window !== 'undefined' ? (window.innerHeight - 500) / 2 : 20,
                    width: 800,
                    height: 480,
                }}
                minWidth={320}
                minHeight={200}
                bounds="window"
                className="pointer-events-auto z-[100] bg-black rounded-xl overflow-hidden shadow-2xl border border-rose-200 flex flex-col"
                dragHandleClassName="drag-handle"
            >
                {/* Drag Handle / Header */}
                <div className="drag-handle h-10 bg-rose-950/90 backdrop-blur flex items-center justify-between px-4 cursor-move border-b border-rose-900 shrink-0 group">
                    <div className="flex items-center gap-2 text-rose-100">
                        <Youtube size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">YouTube Player (Global)</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-rose-300/60 text-[10px] uppercase font-mono hidden group-hover:block">
                            Drag to move • Resize edges
                        </div>
                        <button 
                            onClick={closePlayer}
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
    // Standard Audio Player (Fixed Bottom)
    return (
        <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-white border-t border-stone-200 p-4 shadow-lg z-40 flex flex-col md:flex-row items-center justify-between animate-slide-up gap-4">
            <div className="flex items-center gap-4">
                <img src={currentSong.cover} alt="Album Art" className="w-12 h-12 rounded object-cover shadow-sm" />
                <div>
                    <h4 className="font-bold text-stone-800 text-sm">{currentSong.title}</h4>
                    <p className="text-xs text-stone-500">正在播放 (Global)</p>
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
                    <div className={`h-full bg-rose-400 w-1/3 ${isPlaying ? 'animate-pulse' : ''}`}></div>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <button onClick={closePlayer} className="text-stone-400 hover:text-stone-600">
                    <X size={20} />
                </button>
            </div>
        </div>
    );
  }
};

export default GlobalMusicPlayer;
