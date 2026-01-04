import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Code2, Lightbulb, Share2, Map, LogOut, Music, Menu, X } from 'lucide-react';
import GlobalMusicPlayer from './GlobalMusicPlayer';

const Layout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { path: '/reading', label: '读书漫游 (Reading)', icon: BookOpen, color: 'hover:text-amber-700' },
    { path: '/tech', label: '技术分享 (Tech)', icon: Code2, color: 'hover:text-blue-700' },
    { path: '/ideas', label: '论文灵感 (Ideas)', icon: Lightbulb, color: 'hover:text-indigo-700' },
    { path: '/music', label: '音乐收藏 (Music)', icon: Music, color: 'hover:text-rose-700' },
    { path: '/resources', label: '资源分享 (Resources)', icon: Share2, color: 'hover:text-emerald-700' },
    { path: '/travel', label: '旅游见闻 (Travel)', icon: Map, color: 'hover:text-orange-700' },
  ];

  return (
    <div className="flex min-h-screen bg-stone-50 font-serif">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-64 bg-white border-r border-stone-200 fixed h-full z-50 flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="p-8 border-b border-stone-100 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">我的空间</h1>
            <p className="text-xs text-stone-500 mt-2">Rational & Academic</p>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-stone-400 hover:text-stone-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-stone-100 text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:bg-stone-50 ' + item.color
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-stone-400 hover:text-red-600 hover:bg-red-50 w-full rounded-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header (Visible only on small screens) */}
      <header className="md:hidden fixed top-0 w-full bg-white border-b border-stone-200 z-20 px-4 py-3 flex justify-between items-center shadow-sm">
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-stone-600 p-1">
            <Menu className="w-6 h-6" />
        </button>
        <span className="font-bold text-stone-900">My Space</span>
        <div className="w-8"></div> {/* Spacer for centering */}
      </header>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-12 pt-20 md:pt-12 overflow-y-auto w-full">
        <div className="max-w-4xl mx-auto">
           <Outlet />
        </div>
        
        {/* Mobile Navigation Hint (Optional, can be removed if menu is obvious) */}
        {/* This helps users realize there is a menu if they miss the hamburger icon */}
      </main>

      <GlobalMusicPlayer />
    </div>
  );
};

export default Layout;
