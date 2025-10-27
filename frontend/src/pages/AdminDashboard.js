import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, User, Bell, LogOut, Users, TrendingUp, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import ThemeToggle from '../components/ThemeToggle';
import EventCard from '../components/EventCard';
import NotificationPanel from '../components/NotificationPanel';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
    fetchAnalytics();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API}/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(response.data);
    } catch (error) {
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics');
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
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Admin Dashboard</p>
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
        <div className="space-y-2">
          <h2 className="text-4xl font-bold">Admin Dashboard</h2>
          <p className="text-lg" style={{ color: 'var(--muted-foreground)' }}>Monitor and manage the entire platform</p>
        </div>

        {/* Stats Overview */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 space-y-2 card-hover" style={{ backgroundColor: 'var(--card)', borderLeft: '4px solid var(--primary)' }} data-testid="stats-users">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Total Users</p>
                  <p className="text-3xl font-bold">{analytics.total_users}</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {analytics.students} Students • {analytics.organizers} Organizers
                  </p>
                </div>
                <Users className="w-12 h-12" style={{ color: 'var(--primary)', opacity: 0.3 }} />
              </div>
            </Card>

            <Card className="p-6 space-y-2 card-hover" style={{ backgroundColor: 'var(--card)', borderLeft: '4px solid var(--success)' }} data-testid="stats-events">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Total Events</p>
                  <p className="text-3xl font-bold">{analytics.total_events}</p>
                </div>
                <CalendarIcon className="w-12 h-12" style={{ color: 'var(--success)', opacity: 0.3 }} />
              </div>
            </Card>

            <Card className="p-6 space-y-2 card-hover" style={{ backgroundColor: 'var(--card)', borderLeft: '4px solid var(--secondary)' }} data-testid="stats-registrations">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Total Registrations</p>
                  <p className="text-3xl font-bold">{analytics.total_registrations}</p>
                </div>
                <TrendingUp className="w-12 h-12" style={{ color: 'var(--secondary)', opacity: 0.3 }} />
              </div>
            </Card>
          </div>
        )}

        {/* Events by Category */}
        {analytics && (
          <Card className="p-6" style={{ backgroundColor: 'var(--card)' }}>
            <h3 className="text-xl font-bold mb-4">Events by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {Object.entries(analytics.events_by_category).map(([category, count]) => (
                <div key={category} className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm capitalize" style={{ color: 'var(--muted-foreground)' }}>{category}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* All Events */}
        <div>
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all" data-testid="tab-all-events">All Events</TabsTrigger>
              <TabsTrigger value="upcoming" data-testid="tab-upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="ongoing" data-testid="tab-ongoing">Ongoing</TabsTrigger>
              <TabsTrigger value="completed" data-testid="tab-completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {loading ? (
                <div className="text-center py-12" style={{ color: 'var(--muted-foreground)' }}>Loading events...</div>
              ) : events.length === 0 ? (
                <div className="text-center py-12" style={{ color: 'var(--muted-foreground)' }}>No events found</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} onEventUpdate={fetchEvents} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="upcoming">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.filter(e => e.status === 'upcoming').map((event) => (
                  <EventCard key={event.id} event={event} onEventUpdate={fetchEvents} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ongoing">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.filter(e => e.status === 'ongoing').map((event) => (
                  <EventCard key={event.id} event={event} onEventUpdate={fetchEvents} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="completed">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.filter(e => e.status === 'completed').map((event) => (
                  <EventCard key={event.id} event={event} onEventUpdate={fetchEvents} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;