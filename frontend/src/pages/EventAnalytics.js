import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Users, CheckCircle, Star, MessageSquare, QrCode } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import ThemeToggle from '../components/ThemeToggle';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EventAnalytics = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token } = useAuth();
  const [event, setEvent] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventDetails();
    fetchAnalytics();
    fetchRegistrations();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const response = await axios.get(`${API}/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvent(response.data);
    } catch (error) {
      toast.error('Failed to fetch event details');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics/event/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (error) {
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const response = await axios.get(`${API}/registrations/event/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRegistrations(response.data);
    } catch (error) {
      console.error('Failed to fetch registrations');
    }
  };

  const handleCheckIn = async (registrationId) => {
    try {
      await axios.post(`${API}/registrations/checkin/${registrationId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Attendee checked in successfully!');
      fetchRegistrations();
      fetchAnalytics();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Check-in failed');
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading analytics...</div>;
  }

  if (!event || !analytics) {
    return <div className="loading-screen">Failed to load data</div>;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 glass" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} data-testid="back-btn">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Event Analytics</h1>
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Event Header */}
        <div className="space-y-2">
          <Badge className="bg-blue-500 text-white border-0">{event.category}</Badge>
          <h2 className="text-4xl font-bold">{event.title}</h2>
          <p className="text-lg" style={{ color: 'var(--muted-foreground)' }}>{event.venue}</p>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 space-y-2 card-hover" style={{ backgroundColor: 'var(--card)', borderLeft: '4px solid var(--primary)' }} data-testid="analytics-registrations">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Total Registrations</p>
                <p className="text-3xl font-bold">{analytics.total_registrations}</p>
              </div>
              <Users className="w-10 h-10" style={{ color: 'var(--primary)', opacity: 0.3 }} />
            </div>
          </Card>

          <Card className="p-6 space-y-2 card-hover" style={{ backgroundColor: 'var(--card)', borderLeft: '4px solid var(--success)' }} data-testid="analytics-checked-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Checked In</p>
                <p className="text-3xl font-bold">{analytics.checked_in}</p>
              </div>
              <CheckCircle className="w-10 h-10" style={{ color: 'var(--success)', opacity: 0.3 }} />
            </div>
          </Card>

          <Card className="p-6 space-y-2 card-hover" style={{ backgroundColor: 'var(--card)', borderLeft: '4px solid var(--warning)' }} data-testid="analytics-attendance-rate">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Attendance Rate</p>
                <p className="text-3xl font-bold">{analytics.attendance_rate.toFixed(1)}%</p>
              </div>
              <QrCode className="w-10 h-10" style={{ color: 'var(--warning)', opacity: 0.3 }} />
            </div>
          </Card>

          <Card className="p-6 space-y-2 card-hover" style={{ backgroundColor: 'var(--card)', borderLeft: '4px solid var(--secondary)' }} data-testid="analytics-rating">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Average Rating</p>
                <div className="flex items-center space-x-2">
                  <p className="text-3xl font-bold">{analytics.average_rating}</p>
                  <Star className="w-6 h-6 fill-yellow-500 text-yellow-500" />
                </div>
              </div>
              <MessageSquare className="w-10 h-10" style={{ color: 'var(--secondary)', opacity: 0.3 }} />
            </div>
          </Card>
        </div>

        {/* Registrations List */}
        <Card className="p-6" style={{ backgroundColor: 'var(--card)' }}>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Registered Attendees</h3>
            <ScrollArea className="h-[500px]">
              {registrations.length === 0 ? (
                <div className="text-center py-12" style={{ color: 'var(--muted-foreground)' }}>No registrations yet</div>
              ) : (
                <div className="space-y-3">
                  {registrations.map((registration) => (
                    <div
                      key={registration.id}
                      className="flex items-center justify-between p-4 rounded-lg"
                      style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}
                      data-testid={`registration-${registration.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{registration.user_name}</p>
                        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{registration.user_email}</p>
                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          Registered: {format(new Date(registration.registered_at), 'MMM dd, yyyy • h:mm a')}
                        </p>
                        {registration.checked_in && registration.checked_in_at && (
                          <p className="text-xs" style={{ color: 'var(--success)' }}>
                            Checked in: {format(new Date(registration.checked_in_at), 'MMM dd, yyyy • h:mm a')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        {registration.checked_in ? (
                          <Badge className="bg-green-500 text-white border-0">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Checked In
                          </Badge>
                        ) : (
                          <Button
                            onClick={() => handleCheckIn(registration.id)}
                            size="sm"
                            data-testid={`checkin-btn-${registration.id}`}
                          >
                            <QrCode className="w-4 h-4 mr-2" />
                            Check In
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EventAnalytics;