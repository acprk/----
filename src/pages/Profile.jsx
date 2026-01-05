import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Camera, Save, Loader2, Upload } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    fullName: '',
    avatarUrl: '',
    website: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.user_metadata?.full_name || '',
        avatarUrl: user.user_metadata?.avatar_url || '',
        website: user.user_metadata?.website || '',
      });
    }
  }, [user]);

  const handleAvatarUpload = async (event) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      setFormData(prev => ({ ...prev, avatarUrl: data.publicUrl }));
      setMessage({ type: 'success', text: 'Image uploaded successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error uploading image: ' + error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const { error } = await updateProfile({
      full_name: formData.fullName,
      avatar_url: formData.avatarUrl,
      website: formData.website,
    });

    if (error) {
      setMessage({ type: 'error', text: 'Error updating profile: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800 tracking-tight flex items-center gap-3">
          <User className="w-8 h-8 text-stone-600" />
          账户管理 (Profile)
        </h1>
        <p className="text-stone-500 mt-2">管理您的个人信息和账户设置。</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        {/* Header / Cover */}
        <div className="h-32 bg-gradient-to-r from-stone-100 to-stone-200 relative">
            <div className="absolute -bottom-12 left-8">
                <div className="relative group">
                    <img 
                        src={formData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || user.email)}&background=random`} 
                        alt="Profile" 
                        className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover bg-white"
                    />
                </div>
            </div>
        </div>

        <div className="pt-16 px-8 pb-8">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-stone-800">{formData.fullName || 'User'}</h2>
                <div className="flex items-center gap-2 text-stone-500 text-sm mt-1">
                    <Mail className="w-4 h-4" />
                    {user.email}
                </div>
            </div>

            {message.text && (
                <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">昵称 (Nickname)</label>
                        <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                            className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all"
                            placeholder="Your Name"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">头像 (Avatar)</label>
                        <div className="space-y-3">
                            {/* Upload Button */}
                            <div className="flex items-center gap-3">
                                <label className="flex items-center justify-center gap-2 px-4 py-2 bg-stone-100 text-stone-700 rounded-lg cursor-pointer hover:bg-stone-200 transition-colors text-sm font-medium">
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    {uploading ? '上传中...' : '上传本地图片'}
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        disabled={uploading}
                                    />
                                </label>
                                <span className="text-xs text-stone-400">或</span>
                            </div>

                            {/* URL Input */}
                            <div className="relative">
                                <Camera className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                <input
                                    type="url"
                                    value={formData.avatarUrl}
                                    onChange={(e) => setFormData({...formData, avatarUrl: e.target.value})}
                                    className="w-full pl-9 pr-4 p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all text-sm"
                                    placeholder="https://example.com/avatar.jpg"
                                />
                            </div>
                            <p className="text-xs text-stone-400">支持本地上传或输入图片链接</p>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-stone-700 mb-2">个性签名 (Bio)</label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({...formData, bio: e.target.value})}
                            className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all min-h-[100px] resize-y"
                            placeholder="写一句话介绍你自己..."
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-stone-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2.5 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-all disabled:opacity-50 font-medium"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        保存更改
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
