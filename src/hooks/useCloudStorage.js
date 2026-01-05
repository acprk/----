import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLocalStorage } from './useLocalStorage';
import { useAuth } from '../context/AuthContext';

/**
 * A hook that syncs data with Supabase if configured, otherwise falls back to LocalStorage.
 * 
 * @param {string} tableName - The Supabase table name
 * @param {string} localStorageKey - The LocalStorage key
 * @param {any} initialValue - Default value if nothing found
 * @returns {[any, Function]} - [data, setData]
 */
export const useCloudStorage = (tableName, localStorageKey, initialValue) => {
  const { user, isSupabaseConfigured } = useAuth();
  
  // Use a user-specific key for local storage to prevent data bleeding between users on the same device
  // when falling back to local storage or caching.
  const userSpecificKey = user ? `${localStorageKey}_${user.id}` : localStorageKey;

  // Always use local storage as a base/fallback
  const [localData, setLocalData] = useLocalStorage(userSpecificKey, initialValue);
  const [data, setData] = useState(localData);
  const [loading, setLoading] = useState(true);

  // If Supabase is configured, fetch from cloud
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setData(localData);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Construct query
        let query = supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false });
        
        // Explicitly filter by user_id to ensure isolation on the client side as well,
        // acting as a safeguard if RLS is not strictly configured.
        if (user) {
            query = query.eq('user_id', user.id);
        }

        const { data: cloudData, error } = await query;

        if (error) {
            console.error(`Error fetching ${tableName}:`, error);
            return;
        }

        if (cloudData) {
            setData(cloudData);
            // We don't necessarily want to overwrite localData with cloud data for offline cache 
            // if we are treating them separately, but for simple sync, this is okay.
            // However, be careful not to mix user data in local storage if multiple users login on same device.
            // ideally local storage key should include user id.
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel(tableName)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
        fetchData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [tableName, isSupabaseConfigured, user]); // Re-fetch if user changes

  const addItem = async (item) => {
    const itemToSave = { 
        ...item, 
        created_at: item.created_at || new Date().toISOString() 
    };

    // Optimistic Update: Update local state immediately for better UX
    // Even if cloud sync fails, user sees the item (saved in local storage with user isolation)
    setLocalData(prev => [itemToSave, ...prev]);
    setData(prev => [itemToSave, ...prev]);

    if (!isSupabaseConfigured) {
      return;
    }

    const { id, ...itemForCloud } = itemToSave;
    
    // Attach user_id if user is logged in
    if (user) {
        itemForCloud.user_id = user.id;
    }

    // Attempt 1: Try to insert with user_id (Preferred for isolation)
    let { error } = await supabase.from(tableName).insert([itemForCloud]);

    if (error) {
        console.error("Error adding item:", error);
        if (error.message?.includes('Could not find') && (error.message?.includes('user_id') || error.message?.includes('column'))) {
            alert(`【云同步警告】\n\n数据已保存到本地，但同步到云端失败。\n原因：Supabase 数据库表 '${tableName}' 缺少 'user_id' 字段。\n\n请联系管理员或在 Supabase 后台添加 'user_id' (uuid) 字段以启用多设备同步。`);
        } else {
            // Revert local change if it's a critical error (optional, but keeping it optimistic is usually better unless it's a validation error)
            // alert("同步到云端失败: " + error.message);
            console.warn("Sync failed, item is local only for now.");
        }
    }
  };

  const deleteItem = async (id) => {
    const newData = (data || []).filter(item => item.id != id);
    setData(newData);
    setLocalData(newData);

    if (!isSupabaseConfigured) return;

    try {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Cloud delete failed:', error);
        }
    } catch (err) {
        console.error("Unexpected error during delete:", err);
    }
  };

  const updateItem = async (updatedItem) => {
    setData(prev => (prev || []).map(item => item.id === updatedItem.id ? updatedItem : item));

    if (!isSupabaseConfigured) {
      setLocalData(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
      return;
    }

    const { error } = await supabase
      .from(tableName)
      .update(updatedItem)
      .eq('id', updatedItem.id);

    if (error) {
      console.error('Error updating item:', error);
      alert('更新失败，请刷新页面重试');
    }
  };

  const setAllItems = (newItems) => {
      setData(newItems);
      if (!isSupabaseConfigured) {
          setLocalData(newItems);
      }
  };

  return { data, loading, addItem, deleteItem, updateItem, setAllItems, isCloud: isSupabaseConfigured };
};
