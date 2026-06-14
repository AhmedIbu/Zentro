import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
// SDK 54 moved the classic download API (createDownloadResumable, cacheDirectory)
// to the /legacy entry point. Using it keeps our download pipeline unchanged.
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';

import { requestDownload, fetchHistory, buildFileUrl } from '../api/zentro';
import { detectPlatform } from '../utils/platform';
import { sanitizeName } from '../utils/format';

const QueueContext = createContext(null);

let counter = 0;
const newId = () => `q_${Date.now()}_${counter++}`;

// status: queued | processing | downloading | saved | error
function QueueProvider({ children }) {
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const processingRef = useRef(false);

  const updateItem = useCallback((id, patch) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const enqueue = useCallback((url, quality) => {
    const item = {
      id: newId(),
      url: url.trim(),
      quality,
      platform: detectPlatform(url),
      title: null,
      status: 'queued',
      progress: 0,
      fileSize: 0,
      mime: null,
      savedTo: null,
      localUri: null,
      error: null,
      createdAt: Date.now(),
    };
    setItems((prev) => [item, ...prev]);
    return item.id;
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const clearFinished = useCallback(() => {
    setItems((prev) => prev.filter((it) => it.status !== 'saved'));
  }, []);

  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await fetchHistory(60);
      setHistory(data);
    } catch (err) {
      // Non-fatal — history just stays empty/old.
      // eslint-disable-next-line no-console
      console.warn('[Zentro] history refresh failed:', err.message);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const ensureMediaPermission = useCallback(async () => {
    // writeOnly:false => request full read+write so createAssetAsync works.
    const current = await MediaLibrary.getPermissionsAsync(false);
    if (current.granted) return true;
    if (!current.canAskAgain) return false; // user must enable in Settings
    const req = await MediaLibrary.requestPermissionsAsync(false);
    return req.granted;
  }, []);

  const processItem = useCallback(
    async (item) => {
      try {
        updateItem(item.id, { status: 'processing', progress: 0, error: null });

        // 1) Ask backend to fetch the media via yt-dlp.
        const meta = await requestDownload(item.url, item.quality);
        updateItem(item.id, {
          status: 'downloading',
          title: meta.title,
          platform: meta.platform || item.platform,
          fileSize: meta.fileSize || 0,
          mime: meta.mime || null,
        });

        // 2) Stream the file to the device with a progress callback.
        const remoteUrl = buildFileUrl(meta.downloadUrl);
        const safeName = sanitizeName(meta.fileName || `${meta.title || 'zentro'}.mp4`);
        const localUri = FileSystem.cacheDirectory + safeName;

        const resumable = FileSystem.createDownloadResumable(
          remoteUrl,
          localUri,
          {},
          (p) => {
            const total = p.totalBytesExpectedToWrite;
            const pct = total > 0 ? p.totalBytesWritten / total : 0;
            updateItem(item.id, { progress: pct });
          }
        );

        const result = await resumable.downloadAsync();
        const uri = result?.uri || localUri;

        // 3) Save to the right place.
        const mime = meta.mime || '';
        const isCameraRoll = mime.startsWith('video') || mime.startsWith('image');

        if (isCameraRoll) {
          const granted = await ensureMediaPermission();
          if (!granted) {
            throw new Error('Photos access is off — enable it in Settings › Expo Go › Photos');
          }
          // createAssetAsync is more reliable than saveToLibraryAsync on iOS;
          // fall back to saveToLibraryAsync, then keep the file for sharing.
          try {
            await MediaLibrary.createAssetAsync(uri);
            updateItem(item.id, { status: 'saved', progress: 1, savedTo: 'Camera Roll', localUri: uri });
          } catch (saveErr) {
            try {
              await MediaLibrary.saveToLibraryAsync(uri);
              updateItem(item.id, { status: 'saved', progress: 1, savedTo: 'Camera Roll', localUri: uri });
            } catch (saveErr2) {
              // Couldn't reach the Camera Roll — still give the user the file.
              console.warn('[Zentro] camera roll save failed:', saveErr2.message);
              updateItem(item.id, {
                status: 'saved',
                progress: 1,
                savedTo: 'Files',
                localUri: uri,
              });
            }
          }
        } else {
          // Audio (mp3) — iOS Photos can't hold audio, so offer share/save.
          updateItem(item.id, { status: 'saved', progress: 1, savedTo: 'Files', localUri: uri });
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        refreshHistory();
      } catch (err) {
        updateItem(item.id, { status: 'error', error: err.message || 'Download failed' });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    },
    [updateItem, ensureMediaPermission, refreshHistory]
  );

  const shareItem = useCallback(async (item) => {
    if (!item.localUri) return;
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) await Sharing.shareAsync(item.localUri);
  }, []);

  // Sequential queue runner — process one item at a time (kind to the free
  // Render instance) whenever there's a queued item and nothing is running.
  useEffect(() => {
    if (processingRef.current) return;
    const next = items.find((it) => it.status === 'queued');
    if (!next) return;

    processingRef.current = true;
    processItem(next).finally(() => {
      processingRef.current = false;
      // Trigger a re-check for the next queued item.
      setItems((prev) => [...prev]);
    });
  }, [items, processItem]);

  const value = {
    items,
    history,
    historyLoading,
    enqueue,
    removeItem,
    clearFinished,
    refreshHistory,
    shareItem,
    activeCount: items.filter((it) => it.status !== 'saved' && it.status !== 'error').length,
  };

  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
}

function useQueue() {
  const ctx = useContext(QueueContext);
  if (!ctx) throw new Error('useQueue must be used within QueueProvider');
  return ctx;
}

export { QueueProvider, useQueue };
