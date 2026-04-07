/**
 * useNotifications — Road Trip Planner
 *
 * Reads user's notification prefs from localStorage (userPrefs).
 * Exposes a `notify(key, { title, desc, type })` function that
 * only fires if the user has that key toggled on.
 *
 * Also exposes the full queue so the NotificationToast component
 * can render and dismiss them.
 */

import { useState, useCallback, useRef } from 'react';

const DURATION = 5000; // ms each toast stays visible

export function useNotifications() {
  const [queue, setQueue] = useState([]); // [{ id, title, desc, type }]
  const timerMap = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timerMap.current[id]);
    setQueue(q => q.filter(n => n.id !== id));
  }, []);

  const notify = useCallback((key, { title, desc, type = 'info' }) => {
    // Check if user has this notification enabled
    const prefs = JSON.parse(localStorage.getItem('userPrefs') || '{}');

    // Default to true if the key was never explicitly set
    const enabled = prefs[key] !== undefined ? prefs[key] : true;
    if (!enabled) return;

    const id = `${key}-${Date.now()}`;
    setQueue(q => [...q, { id, title, desc, type }]);

    timerMap.current[id] = setTimeout(() => {
      setQueue(q => q.filter(n => n.id !== id));
    }, DURATION);
  }, []);

  return { queue, notify, dismiss };
}