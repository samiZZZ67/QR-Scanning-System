import { useState, useEffect, useCallback, useRef } from 'react';
import { listManagerNotifications, listServiceNotifications } from '../api/notifications.js';
import { useRealtime } from './useRealtime.js';

const SOUND_KEY = 'admin_notification_sound';

/**
 * Manages real-time admin notifications (manager calls).
 * Tracks unread count client-side without needing a DB column.
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  // IDs that have been "seen" (panel was opened and they were visible)
  const [seenIds, setSeenIds] = useState(() => new Set());
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem(SOUND_KEY) !== 'false';
    } catch {
      return true;
    }
  });

  // Audio context for chime (Web Audio API — no external file needed)
  const audioCtxRef = useRef(null);

  function playChime() {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Audio API blocked or unavailable — silently ignore
    }
  }

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const [managerData, serviceData] = await Promise.all([
        listManagerNotifications().catch(() => []),
        listServiceNotifications().catch(() => [])
      ]);
      const list = [...(Array.isArray(managerData) ? managerData : []), ...(Array.isArray(serviceData) ? serviceData : [])];
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(list);
    } catch {
      // Non-critical — silently fail, bell stays empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleCreated = useCallback((notification) => {
    setNotifications((prev) => {
      const exists = prev.some((n) => n.id === notification.id);
      if (exists) return prev;
      return [notification, ...prev];
    });
    playChime();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled]);

  const handleResolved = useCallback((notification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? notification : n))
    );
  }, []);

  useRealtime({ role: 'admin' }, {
    'managerNotification.created': handleCreated,
    'managerNotification.resolved': handleResolved,
    'serviceNotification.created': handleCreated,
    'serviceNotification.resolved': handleResolved,
  });

  const unreadCount = notifications.filter((n) => !seenIds.has(n.id)).length;

  function markAllSeen() {
    setSeenIds(new Set(notifications.map((n) => n.id)));
  }

  function toggleSound() {
    setSoundEnabled((prev) => {
      const next = !prev;
      try { localStorage.setItem(SOUND_KEY, String(next)); } catch {}
      return next;
    });
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAllSeen,
    soundEnabled,
    toggleSound,
    refresh: fetchNotifications,
  };
}
