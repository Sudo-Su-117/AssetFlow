import type { NotificationData, ActivityLogData } from '../types/notification';

const BASE_URL = 'http://localhost:5000/api';

function getHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

export async function fetchNotifications(token: string): Promise<NotificationData[]> {
  const res = await fetch(`${BASE_URL}/notifications`, { headers: getHeaders(token) });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch notifications');
  return res.json();
}

export async function markAsRead(token: string, id: string): Promise<NotificationData> {
  const res = await fetch(`${BASE_URL}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: getHeaders(token)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to mark notification as read');
  return res.json();
}

export async function markAllAsRead(token: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/notifications/read-all`, {
    method: 'PATCH',
    headers: getHeaders(token)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to mark all as read');
}

export async function fetchActivityLogs(token: string): Promise<ActivityLogData[]> {
  const res = await fetch(`${BASE_URL}/activity`, { headers: getHeaders(token) });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch activity logs');
  return res.json();
}
