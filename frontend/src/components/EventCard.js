import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, MapPin, DollarSign } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { format } from 'date-fns';

const EventCard = ({ event, onEventUpdate, showActions = true }) => {
  const navigate = useNavigate();

  const getCategoryColor = (category) => {
    const colors = {
      technical: 'bg-blue-500',
      cultural: 'bg-purple-500',
      sports: 'bg-green-500',
      workshop: 'bg-orange-500',
      seminar: 'bg-teal-500',
      fest: 'bg-pink-500',
      other: 'bg-gray-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  const getStatusColor = (status) => {
    const colors = {
      upcoming: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      ongoing: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colors[status] || colors.upcoming;
  };

  return (
    <Card
      className="overflow-hidden card-hover cursor-pointer"
      style={{ backgroundColor: 'var(--card)' }}
      onClick={() => navigate(`/event/${event.id}`)}
      data-testid={`event-card-${event.id}`}
    >
      {/* Event Image */}
      <div className="relative" style={{ height: '200px', overflow: 'hidden' }}>
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Calendar className="w-16 h-16 text-white" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge className={`${getCategoryColor(event.category)} text-white border-0`}>
            {event.category}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge className={getStatusColor(event.status)}>
            {event.status}
          </Badge>
        </div>
      </div>

      {/* Event Details */}
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-bold mb-2 line-clamp-2">{event.title}</h3>
          <p className="text-sm line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>
            {event.description}
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2" style={{ color: 'var(--muted-foreground)' }}>
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(event.start_date), 'MMM dd, yyyy • h:mm a')}</span>
          </div>
          <div className="flex items-center space-x-2" style={{ color: 'var(--muted-foreground)' }}>
            <MapPin className="w-4 h-4" />
            <span>{event.venue}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2" style={{ color: 'var(--muted-foreground)' }}>
              <Users className="w-4 h-4" />
              <span>{event.registered_count}/{event.capacity}</span>
            </div>
            {event.cost > 0 && (
              <div className="flex items-center space-x-1 font-semibold" style={{ color: 'var(--primary)' }}>
                <DollarSign className="w-4 h-4" />
                <span>{event.cost}</span>
              </div>
            )}
          </div>
        </div>

        {showActions && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/event/${event.id}`);
            }}
            className="w-full"
            data-testid={`view-event-btn-${event.id}`}
          >
            View Details
          </Button>
        )}
      </div>
    </Card>
  );
};

export default EventCard;