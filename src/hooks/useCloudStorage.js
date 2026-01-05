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
  // Always use local storage as a base/fallback
  const [localData, setLocalData] = useLocalStorage(localStorageKey, initialValue);
  const [data, setData] = useState(localData);
  const [loading, setLoading] = useState(true);
  
  // Get auth state
  const { user, isSupabaseConfigured } = useAuth();

  // If Supabase is configured, fetch from cloud
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setData(localData);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // If we have a user, RLS should handle filtering, but we can also be explicit if needed.
        // Usually .select('*') is enough if RLS is on.
        const { data: cloudData, error } = await supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
            console.error(`Error fetching ${tableName}:`, error);
            return;
        }

        if (cloudData) {
            setData(cloudData);
            setLocalData(cloudData);
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

    const { error } = await supabase.from(tableName).insert([itemForCloud]);
    if (error) {
        console.error("Error adding item:", error);
        alert("Failed to add to cloud: " + error.message);
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
