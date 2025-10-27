import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { X, Bell } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const NotificationPanel = ({ onClose }) => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (error) {
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`${API}/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark notification as read');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-md h-full glass" style={{ backgroundColor: 'var(--card)', borderLeft: '1px solid var(--border)' }}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <h2 className="text-xl font-bold">Notifications</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="close-notifications-btn">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <ScrollArea className="h-[calc(100vh-120px)]">
            {loading ? (
              <div className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>No notifications</div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 rounded-lg cursor-pointer transition-colors"
                    style={{
                      backgroundColor: notification.read ? 'var(--muted)' : 'var(--background)',
                      border: '1px solid var(--border)'
                    }}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-1">
                        <h4 className="font-semibold">{notification.title}</h4>
                        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                          {notification.message}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          {format(new Date(notification.created_at), 'MMM dd, yyyy • h:mm a')}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary)' }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;