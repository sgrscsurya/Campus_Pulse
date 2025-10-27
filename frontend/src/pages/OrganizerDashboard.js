import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, User, Bell, LogOut, Plus, TrendingUp, Users, QrCode } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import ThemeToggle from '../components/ThemeToggle';
import EventCard from '../components/EventCard';
import NotificationPanel from '../components/NotificationPanel';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({});
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyEvents();
    fetchStats();
  }, []);

  const fetchMyEvents = async () => {
    try {
      const response = await axios.get(`${API}/events/organizer/my-events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(response.data);
    } catch (error) {
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/users/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 glass" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Campus Pulse</h1>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Organizer Dashboard</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon" onClick={() => setShowNotifications(!showNotifications)} data-testid="notifications-btn">
                <Bell className="w-5 h-5" />
              </Button>
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => navigate('/profile')} data-testid="profile-btn">
                <User className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={logout} data-testid="logout-btn">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Panel */}
      {showNotifications && (
        <NotificationPanel onClose={() => setShowNotifications(false)} />
      )}

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-4xl font-bold">Welcome, {user?.name}!</h2>
            <p className="text-lg" style={{ color: 'var(--muted-foreground)' }}>Manage your events and track performance</p>
          </div>
          <Button onClick={() => navigate('/create-event')} size="lg" className="btn-primary flex items-center space-x-2" data-testid="create-event-btn">
            <Plus className="w-5 h-5" />
            <span>Create Event</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-2 card-hover" style={{ backgroundColor: 'var(--card)', borderLeft: '4px solid var(--primary)' }} data-testid="stats-events">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Events Created</p>
                <p className="text-3xl font-bold">{stats.events_created || 0}</p>
              </div>
              <Calendar className="w-12 h-12" style={{ color: 'var(--primary)', opacity: 0.3 }} />
            </div>
          </Card>
          <Card className="p-6 space-y-2 card-hover" style={{ backgroundColor: 'var(--card)', borderLeft: '4px solid var(--success)' }} data-testid="stats-registrations">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Total Registrations</p>
                <p className="text-3xl font-bold">{stats.total_registrations || 0}</p>
              </div>
              <Users className="w-12 h-12" style={{ color: 'var(--success)', opacity: 0.3 }} />
            </div>
          </Card>
        </div>

        {/* My Events */}
        <div>
          <h3 className="text-2xl font-bold mb-6">My Events</h3>
          {loading ? (
            <div className="text-center py-12" style={{ color: 'var(--muted-foreground)' }}>Loading events...</div>
          ) : events.length === 0 ? (
            <Card className="p-12 text-center space-y-4" style={{ backgroundColor: 'var(--card)' }}>
              <Calendar className="w-16 h-16 mx-auto" style={{ color: 'var(--muted-foreground)' }} />
              <p className="text-lg" style={{ color: 'var(--muted-foreground)' }}>No events created yet</p>
              <Button onClick={() => navigate('/create-event')} data-testid="create-first-event-btn">Create Your First Event</Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div key={event.id} className="relative">
                  <EventCard event={event} onEventUpdate={fetchMyEvents} showActions={false} />
                  <div className="absolute bottom-6 left-6 right-6 flex items-center space-x-2">
                    <Button
                      onClick={() => navigate(`/event/${event.id}/analytics`)}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      data-testid={`analytics-btn-${event.id}`}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Analytics
                    </Button>
                    <Button
                      onClick={() => navigate(`/event/${event.id}`)}
                      size="sm"
                      className="flex-1"
                      data-testid={`manage-btn-${event.id}`}
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;