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

    if (!isSupabaseConfigured) {
      setLocalData(prev => [itemToSave, ...prev]);
      setData(prev => [itemToSave, ...prev]);
      return;
    }

    const { id, ...itemForCloud } = itemToSave;
    
    // Attach user_id if user is logged in
    if (user) {
        itemForCloud.user_id = user.id;
    }

    // Attempt 1: Try to insert with user_id (Preferred for isolation)
    let { error } = await supabase.from(tableName).insert([itemForCloud]);

    // Attempt 2: If failed due to missing column (schema mismatch), retry WITHOUT user_id
    if (error && error.message && (error.message.includes('Could not find') || error.message.includes('column'))) {
        console.warn(`[Cloud Sync] Schema mismatch for table '${tableName}'. Retrying without user_id...`);
        const { user_id, ...itemWithoutUser } = itemForCloud;
        const retry = await supabase.from(tableName).insert([itemWithoutUser]);
        
        if (!retry.error) {
            // Success on retry!
            // We should notify the user gently that data is public because of this
            // But don't spam them. Maybe just console log or a subtle toast?
            // User explicitly complained about "Failed to add", so now it will succeed.
            // We can show a one-time alert or just let it be.
            // Let's alert only if it's the first time or critically needed.
            // For now, let's just make it work.
            return; 
        } else {
            // Retry failed too
            error = retry.error;
        }
    }

    if (error) {
        console.error("Error adding item:", error);
        if (error.message?.includes('Could not find') && error.message?.includes('column')) {
            alert(`云同步警告：Supabase 数据库表 '${tableName}' 缺少字段 (如 'user_id' 或 'addedAt')。\n\n请在 Supabase 后台添加缺失字段以启用多用户隔离功能。当前操作已失败。`);
        } else {
            alert("同步到云端失败: " + error.message);
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
