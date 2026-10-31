import { useEffect } from 'react';
import { todayKey } from '@/lib/scheduling';

const LAST_REMINDER_KEY = 'learnmaths:last-reminder-day';
const CHECK_INTERVAL_MS = 60_000;

export function canNotify(): boolean {
  return typeof Notification !== 'undefined';
}

export function useDailyReminder(dueCount: number, reminderHour: number) {
  useEffect(() => {
    const check = () => {
      if (!canNotify() || Notification.permission !== 'granted') return;
      if (dueCount === 0 || new Date().getHours() < reminderHour) return;
      const today = todayKey();
      if (localStorage.getItem(LAST_REMINDER_KEY) === today) return;
      localStorage.setItem(LAST_REMINDER_KEY, today);
      new Notification('Vos devoirs du jour', {
        body: `${dueCount} carte${dueCount > 1 ? 's' : ''} à réviser aujourd'hui.`,
        icon: '/icon.svg',
        tag: 'daily-review',
      });
    };

    check();
    const timer = window.setInterval(check, CHECK_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [dueCount, reminderHour]);
}
