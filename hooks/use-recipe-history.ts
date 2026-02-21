import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useCallback, useEffect, useState } from 'react';
import { getDeviceId } from '@/lib/device-id';
import { db, storage } from '@/lib/firebase';
import { AnalysisResult } from '@/lib/claude';

export interface HistoryEntry {
  id: string;
  createdAt: string;
  thumbnailUri?: string;
  textDescription?: string;
  result: AnalysisResult;
}

export function useRecipeHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const deviceId = await getDeviceId();
      const q = query(
        collection(db, 'recipes'),
        where('deviceId', '==', deviceId)
      );
      const snapshot = await getDocs(q);
      const entries: HistoryEntry[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          createdAt: data.createdAt,
          textDescription: data.textDescription,
          thumbnailUri: data.thumbnailUri,
          result: data.result,
        };
      });
      const sorted = entries.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setHistory(sorted);
    } catch (err) {
      console.warn('[RecipeHistory] Failed to load from Firestore:', err);
    }
  }

  const addEntry = useCallback(async (entry: Omit<HistoryEntry, 'id' | 'createdAt'>) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    // Optimistically update UI with local URI
    setHistory((prev) => [newEntry, ...prev].slice(0, 50));

    try {
      const deviceId = await getDeviceId();
      let remoteThumbUrl: string | undefined;

      // Upload thumbnail to Firebase Storage if present
      if (newEntry.thumbnailUri) {
        try {
          const storageRef = ref(storage, `thumbnails/${deviceId}/${newEntry.id}.jpg`);
          const response = await fetch(newEntry.thumbnailUri);
          const blob = await response.blob();
          await uploadBytes(storageRef, blob);
          remoteThumbUrl = await getDownloadURL(storageRef);

          // Update local state with remote URL
          setHistory((prev) =>
            prev.map((e) =>
              e.id === newEntry.id ? { ...e, thumbnailUri: remoteThumbUrl } : e
            )
          );
        } catch (err) {
          console.warn('[RecipeHistory] Thumbnail upload failed:', err);
        }
      }

      const firestoreEntry = Object.fromEntries(
        Object.entries({
          id: newEntry.id,
          createdAt: newEntry.createdAt,
          textDescription: newEntry.textDescription,
          result: newEntry.result,
          deviceId,
          thumbnailUri: remoteThumbUrl,
        }).filter(([, v]) => v !== undefined)
      );
      await setDoc(doc(db, 'recipes', newEntry.id), firestoreEntry);
    } catch (err) {
      console.warn('[RecipeHistory] Firebase sync failed:', err);
    }

    return newEntry;
  }, []);

  const removeEntry = useCallback(async (id: string) => {
    setHistory((prev) => prev.filter((e) => e.id !== id));
    deleteDoc(doc(db, 'recipes', id))
      .catch((err) => console.warn('[RecipeHistory] Firebase delete failed:', err));
  }, []);

  const refresh = useCallback(() => {
    loadHistory();
  }, []);

  return { history, addEntry, removeEntry, refresh };
}
