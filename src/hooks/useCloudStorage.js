import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useLocalStorage } from './useLocalStorage';

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

  // If Supabase is configured, fetch from cloud
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setData(localData);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const { data: cloudData, error } = await supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
            console.error(`Error fetching ${tableName}:`, error);
            // Fallback to local data on error? Or keep empty? 
            // Let's stick to cloud data if we are in cloud mode, to avoid confusion.
            return;
        }

        if (cloudData) {
            setData(cloudData);
            // Sync cloud data back to local storage to keep cache fresh
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
        // Refresh data on any change
        fetchData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [tableName]); // Only run on mount or table change

  // Wrapper for setting data
  const updateData = async (newData) => {
    // Optimistic update for UI
    setData(newData);
    
    // If local mode, just update local storage
    if (!isSupabaseConfigured) {
      setLocalData(newData);
      return;
    }

    // If cloud mode, we need to handle Insert/Update/Delete based on diffs?
    // This is hard with a generic hook because we receive the "New Full List".
    // It's better to expose specific methods: add, remove.
    // But to keep compatibility with existing code which uses setList(newList), 
    // we might need to be clever or refactor the calling code.
    
    // STRATEGY: 
    // For this refactor, we will CHANGE the return signature of this hook to be:
    // { data, add, remove, update } instead of [data, setData]
    // But to minimize code changes in components, let's try to adapt.
    
    // Actually, "setData" in components is often used like: setMusic([...music, newItem])
    // If we want to sync with DB, we should insert the newItem to DB.
    
    console.warn("Direct setData not supported in Cloud Mode for bulk updates. Use specific add/remove functions.");
  };

  // To properly support the existing "setList" pattern in a Cloud environment is inefficient (delete all, insert all).
  // So we will provide helper functions that components should use instead of setList.
  
  const addItem = async (item) => {
    // Ensure created_at exists for both local and cloud
    const itemToSave = { 
        ...item, 
        created_at: item.created_at || new Date().toISOString() 
    };

    if (!isSupabaseConfigured) {
      setLocalData(prev => [itemToSave, ...prev]);
      setData(prev => [itemToSave, ...prev]);
      return;
    }

    // For cloud, we generally want the DB to generate IDs if they are serial integers.
    // We strip the ID from the item so Supabase generates a new valid ID (int/uuid).
    // This prevents "integer out of range" or "invalid input syntax for type uuid" errors.
    const { id, ...itemForCloud } = itemToSave;
    
    const { error } = await supabase.from(tableName).insert([itemForCloud]);
    if (error) {
        console.error("Error adding item:", error);
        alert("Failed to add to cloud: " + error.message);
    }
    // Realtime subscription will update the list
  };

  const deleteItem = async (id) => {
    // 1. Optimistic update (Memory State)
    // Use loose comparison (!=) to handle string/number mismatches (e.g. "123" vs 123)
    const newData = (data || []).filter(item => item.id != id);
    setData(newData);

    // 2. Always update Local Storage immediately (Force Local Delete)
    setLocalData(newData);

    if (!isSupabaseConfigured) return;

    // 3. Try Cloud Delete
    try {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Cloud delete failed (likely due to invalid ID mismatch or permission), but item was removed locally:', error);
          // We intentionally suppress the alert here. 
          // If the item had a bad ID (legacy data), it's now gone from UI/Local, which is what the user wants.
        }
    } catch (err) {
        console.error("Unexpected error during delete:", err);
    }
  };

  const updateItem = async (updatedItem) => {
    // Optimistic update: immediately update local state
    setData(prev => (prev || []).map(item => item.id === updatedItem.id ? updatedItem : item));

    if (!isSupabaseConfigured) {
      setLocalData(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
      return;
    }

    // Remove client-side only fields if necessary, or ensure DB schema matches
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
      // Note: Cloud persistence for full list reorder is not fully implemented 
      // without an explicit 'order' column in DB.
      // This will allow UI reordering but might reset on refresh in Cloud mode.
  };

  return { data, loading, addItem, deleteItem, updateItem, setAllItems, isCloud: isSupabaseConfigured };
};
