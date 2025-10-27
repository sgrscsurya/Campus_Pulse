import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Ticket, User, Bell, LogOut, Search, Filter } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import ThemeToggle from '../components/ThemeToggle';
import EventCard from '../components/EventCard';
import NotificationPanel from '../components/NotificationPanel';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [stats, setStats] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
    fetchStats();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchQuery, categoryFilter]);

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

  const filterEvents = () => {
    let filtered = events;

    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(event => event.category === categoryFilter);
    }

    setFilteredEvents(filtered);
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
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Student Dashboard</p>
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
          <h2 className="text-4xl font-bold">Welcome back, {user?.name}!</h2>
          <p className="text-lg" style={{ color: 'var(--muted-foreground)' }}>Discover and join amazing campus events</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-2 card-hover" style={{ backgroundColor: 'var(--card)', borderLeft: '4px solid var(--primary)' }} data-testid="stats-registrations">
            <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Registered Events</p>
            <p className="text-3xl font-bold">{stats.registrations || 0}</p>
          </Card>
          <Card className="p-6 space-y-2 card-hover" style={{ backgroundColor: 'var(--card)', borderLeft: '4px solid var(--success)' }} data-testid="stats-attended">
            <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Events Attended</p>
            <p className="text-3xl font-bold">{stats.attended || 0}</p>
          </Card>
          <Card className="p-6 space-y-2 card-hover" style={{ backgroundColor: 'var(--card)', borderLeft: '4px solid var(--secondary)' }} data-testid="stats-feedbacks">
            <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Feedbacks Given</p>
            <p className="text-3xl font-bold">{stats.feedbacks || 0}</p>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-4">
          <Button onClick={() => navigate('/my-tickets')} className="flex items-center space-x-2" data-testid="my-tickets-btn">
            <Ticket className="w-4 h-4" />
            <span>My Tickets</span>
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--muted-foreground)' }} />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="search-events-input"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px]" data-testid="category-filter-select">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <SelectValue placeholder="All Categories" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="cultural">Cultural</SelectItem>
              <SelectItem value="sports">Sports</SelectItem>
              <SelectItem value="workshop">Workshop</SelectItem>
              <SelectItem value="seminar">Seminar</SelectItem>
              <SelectItem value="fest">Fest</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Events Grid */}
        <div>
          <h3 className="text-2xl font-bold mb-6">Upcoming Events</h3>
          {loading ? (
            <div className="text-center py-12" style={{ color: 'var(--muted-foreground)' }}>Loading events...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12" style={{ color: 'var(--muted-foreground)' }}>No events found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} onEventUpdate={fetchEvents} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;