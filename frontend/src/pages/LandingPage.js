import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, TrendingUp, Award, Bell, QrCode } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

const LandingPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const features = [
    {
      icon: <Calendar className="w-8 h-8" />,
      title: 'Event Management',
      description: 'Create, manage, and discover campus events with ease'
    },
    {
      icon: <QrCode className="w-8 h-8" />,
      title: 'QR Ticket System',
      description: 'Digital tickets with QR codes for seamless check-ins'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Easy Registration',
      description: 'RSVP to events and track your participation history'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Analytics Dashboard',
      description: 'Track event performance with detailed analytics'
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Feedback & Ratings',
      description: 'Share your experience and help improve events'
    },
    {
      icon: <Bell className="w-8 h-8" />,
      title: 'Real-time Updates',
      description: 'Stay notified about event changes and reminders'
    }
  ];

  return (
    <div className="min-h-screen" style={{ background: theme === 'dark' ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">Campus Pulse</h1>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button onClick={() => navigate('/login')} variant="ghost" data-testid="login-btn">Login</Button>
            <Button onClick={() => navigate('/register')} className="btn-primary" data-testid="register-btn">Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8 animate-fade-in">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              Elevate Your
              <span className="gradient-text block mt-2">Campus Experience</span>
            </h2>
            <p className="text-lg sm:text-xl max-w-3xl mx-auto" style={{ color: 'var(--muted-foreground)' }}>
              The ultimate platform for managing college events. Create, discover, and participate in campus activities with advanced features and stunning design.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Button onClick={() => navigate('/register')} size="lg" className="btn-primary text-lg px-8 py-6" data-testid="hero-get-started-btn">
                Get Started
              </Button>
              <Button onClick={() => navigate('/login')} size="lg" variant="outline" className="text-lg px-8 py-6" data-testid="hero-login-btn">
                Sign In
              </Button>
            </div>
          </div>

          {/* Hero Image Placeholder */}
          <div className="mt-16 relative">
            <div className="relative mx-auto max-w-5xl rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: '16/9', background: theme === 'dark' ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Calendar className="w-24 h-24 mx-auto" style={{ color: 'var(--primary)' }} />
                  <p className="text-2xl font-semibold" style={{ color: 'var(--muted-foreground)' }}>Your Campus, Your Events</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6" style={{ backgroundColor: 'var(--card)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h3 className="text-4xl sm:text-5xl font-bold">Powerful Features</h3>
            <p className="text-lg" style={{ color: 'var(--muted-foreground)' }}>Everything you need to manage campus events</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card-hover p-8 rounded-2xl space-y-4"
                style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
                data-testid={`feature-card-${index}`}
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--muted)' }}>
                  <div style={{ color: 'var(--primary)' }}>{feature.icon}</div>
                </div>
                <h4 className="text-xl font-semibold">{feature.title}</h4>
                <p style={{ color: 'var(--muted-foreground)' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h3 className="text-4xl sm:text-5xl font-bold">Ready to Get Started?</h3>
          <p className="text-lg" style={{ color: 'var(--muted-foreground)' }}>
            Join Campus Pulse today and transform your campus event experience
          </p>
          <Button onClick={() => navigate('/register')} size="lg" className="btn-primary text-lg px-8 py-6" data-testid="cta-get-started-btn">
            Create Your Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6" style={{ backgroundColor: 'var(--card)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto text-center">
          <p style={{ color: 'var(--muted-foreground)' }}>© 2025 Campus Pulse. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;