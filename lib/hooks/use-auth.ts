import { currentUserId, notifications, profiles } from '@/lib/sample-data';

/** Returns the mocked authenticated user profile and unread notifications for the MVP shell. */
export function useAuth() {
  const profile = profiles.find((item) => item.id === currentUserId) ?? null;
  const unreadNotifications = notifications.filter((item) => item.user_id === currentUserId && !item.read).length;
  return { profile, unreadNotifications, isAuthenticated: Boolean(profile) };
}
