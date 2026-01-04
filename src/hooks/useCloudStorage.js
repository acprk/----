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
            // Transform data if needed? Assuming structure is compatible.
            setData(cloudData);
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
    if (!isSupabaseConfigured) {
      setLocalData(prev => [item, ...prev]);
      setData(prev => [item, ...prev]);
      return;
    }

    // Remove 'id' if it's just a timestamp, let DB handle ID? 
    // Or keep ID for consistency. Supabase usually uses UUID or Serial.
    // Let's assume we pass the full item.
    
    // Ensure created_at exists
    const itemToSave = { ...item, created_at: new Date().toISOString() };
    
    const { error } = await supabase.from(tableName).insert([itemToSave]);
    if (error) {
        console.error("Error adding item:", error);
        alert("Failed to add to cloud: " + error.message);
    }
    // Realtime subscription will update the list
  };

  const deleteItem = async (idField, idValue) => {
     if (!isSupabaseConfigured) {
        setLocalData(prev => prev.filter(item => item[idField] !== idValue));
        setData(prev => prev.filter(item => item[idField] !== idValue));
        return;
     }

     const { error } = await supabase.from(tableName).delete().eq(idField, idValue);
     if (error) {
        console.error("Error deleting item:", error);
        alert("Failed to delete from cloud: " + error.message);
     }
  };

  return { 
    data, 
    loading, 
    addItem, 
    deleteItem, 
    isCloud: isSupabaseConfigured 
  };
};
