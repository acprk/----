import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Mail, Camera, Save, Loader2, Upload, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // 初始状态
  const [formData, setFormData] = useState({
    fullName: '',
    avatarUrl: '',
    bio: '',
  });

  // 监听 user 变化，同步数据
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.user_metadata?.full_name || '',
        avatarUrl: user.user_metadata?.avatar_url || '',
        bio: user.user_metadata?.bio || '',
      });
    }
  }, [user]);

  // 处理头像上传
  const handleAvatarUpload = async (event) => {
    try {
      if (!supabase) {
        throw new Error("Supabase client is not initialized.");
      }

      setUploading(true);
      setMessage({ type: '', text: '' });
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('请选择一张图片。');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 上传到 Supabase Storage
      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 获取公开链接
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      // 更新本地表单状态（此时还没保存到 User Metadata）
      setFormData(prev => ({ ...prev, avatarUrl: data.publicUrl }));
      setMessage({ type: 'success', text: '头像上传成功！别忘了点击下方的“保存更改”哦。' });
    } catch (error) {
      setMessage({ type: 'error', text: '上传失败: ' + error.message });
    } finally {
      setUploading(false);
    }
  };

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await updateProfile({
        full_name: formData.fullName,
        avatar_url: formData.avatarUrl,
        bio: formData.bio,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: '个人资料已更新！' });
      
      // 3秒后清除成功消息
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: '更新失败: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-fade-in">
      {/* 顶部标题区 */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-stone-800 tracking-tight flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-amber-500" />
          个人中心
        </h1>
        <p className="text-stone-500 mt-2 ml-11">打造属于你的独特数字身份。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 左侧：个人概览卡片 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden sticky top-8">
            {/* 背景图 */}
            <div className="h-32 bg-gradient-to-br from-stone-100 via-stone-200 to-stone-300"></div>
            
            <div className="px-6 pb-6 text-center -mt-12 relative">
              {/* 头像展示 */}
              <div className="relative inline-block group">
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white mx-auto">
                   <img 
                      src={formData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || user.email)}&background=random`} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                   />
                </div>
                {/* 悬浮上传按钮 */}
                <label className="absolute bottom-0 right-0 p-2 bg-stone-800 text-white rounded-full cursor-pointer hover:bg-stone-700 transition-all shadow-md transform translate-x-1/4 translate-y-1/4 group-hover:scale-110">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                </label>
              </div>

              <h2 className="text-xl font-bold text-stone-800 mt-4">{formData.fullName || '未设置昵称'}</h2>
              <p className="text-sm text-stone-400 flex items-center justify-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5" />
                {user.email}
              </p>

              {/* 装饰性徽章 */}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-100">
                  Pro Member
                </span>
                <span className="px-3 py-1 bg-stone-50 text-stone-600 text-xs font-medium rounded-full border border-stone-100">
                  Early Adopter
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：编辑表单 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8">
            <h3 className="text-lg font-bold text-stone-800 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-stone-400" />
              基本信息
            </h3>

            {/* 消息提示 */}
            {message.text && (
              <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm ${
                message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
              }`}>
                {message.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                <div>{message.text}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 昵称输入 */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  昵称 / Display Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-200 focus:bg-white transition-all text-stone-800 placeholder-stone-400"
                  placeholder="怎么称呼您？"
                />
              </div>

              {/* 个性签名 */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  关于我 / Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-200 focus:bg-white transition-all text-stone-800 placeholder-stone-400 min-h-[120px] resize-y"
                  placeholder="写几句话介绍一下自己，让大家更了解你..."
                />
                <p className="text-right text-xs text-stone-400 mt-2">
                  {formData.bio.length} / 500
                </p>
              </div>

              {/* 分割线 */}
              <div className="border-t border-stone-100 my-8"></div>

              {/* 保存按钮 */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative inline-flex items-center justify-center gap-2 px-8 py-3 bg-stone-900 text-white font-medium rounded-xl hover:bg-stone-800 focus:ring-4 focus:ring-stone-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      保存更改
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* 底部额外区域 (可选) */}
          <div className="mt-8 bg-stone-50 rounded-2xl border border-dashed border-stone-200 p-6 text-center">
            <p className="text-sm text-stone-500">
              想要修改密码或绑定其他账号？<br/>
              <span className="text-stone-400 text-xs">（此功能正在开发中，敬请期待）</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
