import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, QrCode, Calendar, MapPin, CheckCircle, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import ThemeToggle from '../components/ThemeToggle';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MyTickets = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const regResponse = await axios.get(`${API}/registrations/my-registrations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRegistrations(regResponse.data);

      // Fetch event details for each registration
      const eventPromises = regResponse.data.map(reg =>
        axios.get(`${API}/events/${reg.event_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      const eventResponses = await Promise.all(eventPromises);
      const eventsMap = {};
      eventResponses.forEach(res => {
        eventsMap[res.data.id] = res.data;
      });
      setEvents(eventsMap);
    } catch (error) {
      toast.error('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 glass" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} data-testid="back-btn">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">My Tickets</h1>
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold">Your Event Tickets</h2>
          <p className="text-lg" style={{ color: 'var(--muted-foreground)' }}>Digital tickets with QR codes for easy check-in</p>
        </div>

        {loading ? (
          <div className="text-center py-12" style={{ color: 'var(--muted-foreground)' }}>Loading tickets...</div>
        ) : registrations.length === 0 ? (
          <Card className="p-12 text-center space-y-4" style={{ backgroundColor: 'var(--card)' }}>
            <QrCode className="w-16 h-16 mx-auto" style={{ color: 'var(--muted-foreground)' }} />
            <p className="text-lg" style={{ color: 'var(--muted-foreground)' }}>No tickets yet</p>
            <Button onClick={() => navigate('/student')} data-testid="browse-events-btn">Browse Events</Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {registrations.map((registration) => {
              const event = events[registration.event_id];
              if (!event) return null;

              return (
                <Card
                  key={registration.id}
                  className="overflow-hidden"
                  style={{ backgroundColor: 'var(--card)' }}
                  data-testid={`ticket-${registration.id}`}
                >
                  <div className="md:flex">
                    {/* Ticket Info */}
                    <div className="flex-1 p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <Badge className="bg-blue-500 text-white border-0">{event.category}</Badge>
                          <h3 className="text-2xl font-bold">{event.title}</h3>
                          <p style={{ color: 'var(--muted-foreground)' }}>{registration.user_name}</p>
                        </div>
                        {registration.checked_in ? (
                          <Badge className="bg-green-500 text-white border-0 flex items-center space-x-1">
                            <CheckCircle className="w-4 h-4" />
                            <span>Checked In</span>
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500 text-white border-0 flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>Pending</span>
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2" style={{ color: 'var(--muted-foreground)' }}>
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(event.start_date), 'MMMM dd, yyyy • h:mm a')}</span>
                        </div>
                        <div className="flex items-center space-x-2" style={{ color: 'var(--muted-foreground)' }}>
                          <MapPin className="w-4 h-4" />
                          <span>{event.venue}</span>
                        </div>
                      </div>

                      <div className="pt-4">
                        <p className="text-sm font-semibold" style={{ color: 'var(--muted-foreground)' }}>Ticket ID</p>
                        <p className="font-mono text-sm">{registration.id}</p>
                      </div>

                      <Button onClick={() => navigate(`/event/${event.id}`)} variant="outline" data-testid={`view-event-${registration.id}`}>
                        View Event Details
                      </Button>
                    </div>

                    {/* QR Code */}
                    <div className="md:w-80 p-6 flex flex-col items-center justify-center space-y-4" style={{ backgroundColor: 'var(--muted)', borderLeft: '1px solid var(--border)' }}>
                      <div className="w-48 h-48 bg-white p-4 rounded-lg flex items-center justify-center">
                        <img src={`data:image/png;base64,${registration.qr_code}`} alt="QR Code" className="w-full h-full" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="font-semibold">Show this QR code</p>
                        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>at event check-in</p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTickets;