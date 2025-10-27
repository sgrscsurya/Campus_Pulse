import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, MapPin, Users, DollarSign, ArrowLeft, Star, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import ThemeToggle from '../components/ThemeToggle';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EventDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, token } = useAuth();
  const [event, setEvent] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackData, setFeedbackData] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    fetchEventDetails();
    fetchFeedbacks();
    checkRegistration();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const response = await axios.get(`${API}/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvent(response.data);
    } catch (error) {
      toast.error('Failed to fetch event details');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const response = await axios.get(`${API}/feedbacks/event/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbacks(response.data);
    } catch (error) {
      console.error('Failed to fetch feedbacks');
    }
  };

  const checkRegistration = async () => {
    if (user?.role !== 'student') return;
    try {
      const response = await axios.get(`${API}/registrations/my-registrations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsRegistered(response.data.some(reg => reg.event_id === id));
    } catch (error) {
      console.error('Failed to check registration');
    }
  };

  const handleRegister = async () => {
    try {
      await axios.post(`${API}/registrations/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Successfully registered for event!');
      setIsRegistered(true);
      fetchEventDetails();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const handleSubmitFeedback = async () => {
    try {
      await axios.post(`${API}/feedbacks`, {
        event_id: id,
        rating: feedbackData.rating,
        comment: feedbackData.comment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Feedback submitted successfully!');
      setShowFeedbackForm(false);
      setFeedbackData({ rating: 5, comment: '' });
      fetchFeedbacks();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit feedback');
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!event) {
    return <div className="loading-screen">Event not found</div>;
  }

  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 glass" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} data-testid="back-btn">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Event Header */}
        <div className="space-y-6">
          {/* Event Image */}
          {event.image_url ? (
            <img src={event.image_url} alt={event.title} className="w-full h-96 object-cover rounded-2xl" />
          ) : (
            <div className="w-full h-96 flex items-center justify-center rounded-2xl" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <Calendar className="w-32 h-32 text-white" />
            </div>
          )}

          {/* Event Info */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-500 text-white border-0">{event.category}</Badge>
                  <Badge>{event.status}</Badge>
                </div>
                <h1 className="text-4xl font-bold">{event.title}</h1>
                <p className="text-lg" style={{ color: 'var(--muted-foreground)' }}>Organized by {event.organizer_name}</p>
              </div>
              {user?.role === 'student' && !isRegistered && event.status === 'upcoming' && (
                <Button onClick={handleRegister} size="lg" className="btn-primary" data-testid="register-event-btn">
                  Register Now
                </Button>
              )}
              {isRegistered && (
                <Badge className="bg-green-500 text-white border-0">Registered</Badge>
              )}
            </div>

            <p className="text-lg">{event.description}</p>

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 space-y-2" style={{ backgroundColor: 'var(--card)' }}>
                <div className="flex items-center space-x-2" style={{ color: 'var(--muted-foreground)' }}>
                  <Calendar className="w-5 h-5" />
                  <span className="font-semibold">Start Date</span>
                </div>
                <p>{format(new Date(event.start_date), 'MMMM dd, yyyy • h:mm a')}</p>
              </Card>
              <Card className="p-4 space-y-2" style={{ backgroundColor: 'var(--card)' }}>
                <div className="flex items-center space-x-2" style={{ color: 'var(--muted-foreground)' }}>
                  <Calendar className="w-5 h-5" />
                  <span className="font-semibold">End Date</span>
                </div>
                <p>{format(new Date(event.end_date), 'MMMM dd, yyyy • h:mm a')}</p>
              </Card>
              <Card className="p-4 space-y-2" style={{ backgroundColor: 'var(--card)' }}>
                <div className="flex items-center space-x-2" style={{ color: 'var(--muted-foreground)' }}>
                  <MapPin className="w-5 h-5" />
                  <span className="font-semibold">Venue</span>
                </div>
                <p>{event.venue}</p>
              </Card>
              <Card className="p-4 space-y-2" style={{ backgroundColor: 'var(--card)' }}>
                <div className="flex items-center space-x-2" style={{ color: 'var(--muted-foreground)' }}>
                  <Users className="w-5 h-5" />
                  <span className="font-semibold">Capacity</span>
                </div>
                <p>{event.registered_count} / {event.capacity}</p>
              </Card>
              {event.cost > 0 && (
                <Card className="p-4 space-y-2" style={{ backgroundColor: 'var(--card)' }}>
                  <div className="flex items-center space-x-2" style={{ color: 'var(--muted-foreground)' }}>
                    <DollarSign className="w-5 h-5" />
                    <span className="font-semibold">Entry Fee</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>${event.cost}</p>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold">Feedbacks & Ratings</h2>
              {feedbacks.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  <span className="text-xl font-semibold">{avgRating}</span>
                  <span style={{ color: 'var(--muted-foreground)' }}>({feedbacks.length} reviews)</span>
                </div>
              )}
            </div>
            {user?.role === 'student' && isRegistered && (
              <Button onClick={() => setShowFeedbackForm(!showFeedbackForm)} data-testid="add-feedback-btn">
                <MessageSquare className="w-4 h-4 mr-2" />
                Add Feedback
              </Button>
            )}
          </div>

          {/* Feedback Form */}
          {showFeedbackForm && (
            <Card className="p-6 space-y-4" style={{ backgroundColor: 'var(--card)' }}>
              <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                      data-testid={`rating-star-${star}`}
                    >
                      <Star
                        className={`w-8 h-8 cursor-pointer transition-colors ${
                          star <= feedbackData.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Comment</Label>
                <Textarea
                  placeholder="Share your experience..."
                  value={feedbackData.comment}
                  onChange={(e) => setFeedbackData({ ...feedbackData, comment: e.target.value })}
                  rows={4}
                  data-testid="feedback-comment-input"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button onClick={handleSubmitFeedback} data-testid="submit-feedback-btn">Submit Feedback</Button>
                <Button variant="outline" onClick={() => setShowFeedbackForm(false)} data-testid="cancel-feedback-btn">Cancel</Button>
              </div>
            </Card>
          )}

          {/* Feedback List */}
          <div className="space-y-4">
            {feedbacks.length === 0 ? (
              <p style={{ color: 'var(--muted-foreground)' }}>No feedback yet</p>
            ) : (
              feedbacks.map((feedback) => (
                <Card key={feedback.id} className="p-6 space-y-3" style={{ backgroundColor: 'var(--card)' }} data-testid={`feedback-${feedback.id}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{feedback.user_name}</p>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < feedback.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      {format(new Date(feedback.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <p>{feedback.comment}</p>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;