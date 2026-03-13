import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import { 
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, 
  Clock, MapPin, Loader2, User, X
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 
                'July', 'August', 'September', 'October', 'November', 'December'];

const EVENT_COLORS = [
  { name: 'Gold', value: '#D4A017', class: 'bg-[#D4A017]' },
  { name: 'Green', value: '#A8E6CF', class: 'bg-[#A8E6CF]' },
  { name: 'Purple', value: '#C5B3FF', class: 'bg-[#C5B3FF]' },
  { name: 'Orange', value: '#FFCFA8', class: 'bg-[#FFCFA8]' },
  { name: 'Pink', value: '#FFB8D1', class: 'bg-[#FFB8D1]' },
  { name: 'Teal', value: '#A8E6E6', class: 'bg-[#A8E6E6]' },
];

const initialEventForm = {
  title: '',
  description: '',
  date: '',
  start_time: '09:00',
  end_time: '10:00',
  location: '',
  color: '#D4A017',
  all_day: false,
  attendees: []
};

export default function CalendarPage() {
  const { token } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week, day
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [formData, setFormData] = useState(initialEventForm);
  const [formLoading, setFormLoading] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);

  useEffect(() => {
    fetchEvents();
    checkGoogleConnection();
  }, [currentDate, view]);

  const checkGoogleConnection = async () => {
    try {
      const response = await fetch(`${API}/api/organization-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setGoogleConnected(data.google_calendar_connected || false);
      }
    } catch (error) {
      console.error('Failed to check Google connection:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const startDate = getViewStartDate();
      const endDate = getViewEndDate();
      
      const params = new URLSearchParams();
      params.append('start_date', startDate.toISOString().split('T')[0]);
      params.append('end_date', endDate.toISOString().split('T')[0]);
      
      const response = await fetch(`${API}/api/calendar/events?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getViewStartDate = () => {
    const date = new Date(currentDate);
    if (view === 'month') {
      date.setDate(1);
      date.setDate(date.getDate() - date.getDay());
    } else if (view === 'week') {
      date.setDate(date.getDate() - date.getDay());
    }
    return date;
  };

  const getViewEndDate = () => {
    const date = new Date(currentDate);
    if (view === 'month') {
      date.setMonth(date.getMonth() + 1, 0);
      date.setDate(date.getDate() + (6 - date.getDay()));
    } else if (view === 'week') {
      date.setDate(date.getDate() + (6 - date.getDay()));
    }
    return date;
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
    else if (view === 'week') newDate.setDate(newDate.getDate() - 7);
    else newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
    else if (view === 'week') newDate.setDate(newDate.getDate() + 7);
    else newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const openCreateEvent = (date = null) => {
    const eventDate = date || new Date();
    setFormData({
      ...initialEventForm,
      date: eventDate.toISOString().split('T')[0]
    });
    setSelectedDate(eventDate);
    setIsCreateOpen(true);
  };

  const openEventDetail = (event) => {
    setSelectedEvent(event);
    setIsEventDetailOpen(true);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date) {
      toast.error('Title and date are required');
      return;
    }
    
    setFormLoading(true);
    try {
      const response = await fetch(`${API}/api/calendar/events`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        toast.success('Event created successfully');
        setIsCreateOpen(false);
        setFormData(initialEventForm);
        fetchEvents();
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to create event');
      }
    } catch (error) {
      toast.error('Failed to create event');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Delete this event?')) return;
    
    try {
      const response = await fetch(`${API}/api/calendar/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Event deleted');
        setIsEventDetailOpen(false);
        fetchEvents();
      }
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.date === dateStr);
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${minutes} ${ampm}`;
  };

  const getHeaderText = () => {
    if (view === 'month') {
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (view === 'week') {
      const start = getViewStartDate();
      const end = getViewEndDate();
      if (start.getMonth() === end.getMonth()) {
        return `${MONTHS[start.getMonth()]} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
      }
      return `${MONTHS[start.getMonth()]} ${start.getDate()} - ${MONTHS[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
  };

  // Generate calendar grid for month view
  const generateMonthGrid = () => {
    const grid = [];
    const startDate = getViewStartDate();
    
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + (week * 7) + day);
        weekDays.push(date);
      }
      grid.push(weekDays);
    }
    return grid;
  };

  // Generate week grid
  const generateWeekGrid = () => {
    const grid = [];
    const startDate = getViewStartDate();
    
    for (let day = 0; day < 7; day++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + day);
      grid.push(date);
    }
    return grid;
  };

  // Generate day hours
  const generateDayHours = () => {
    const hours = [];
    for (let h = 0; h < 24; h++) {
      hours.push(h);
    }
    return hours;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  return (
    <div className="space-y-6" data-testid="calendar-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            Manage your schedule and appointments
            {googleConnected && (
              <span className="ml-2 text-xs text-primary">
                (Synced with Google Calendar)
              </span>
            )}
          </p>
        </div>
        <button 
          onClick={() => openCreateEvent()}
          className="elstar-btn-primary flex items-center gap-2"
          data-testid="create-event-btn"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      {/* Calendar Controls */}
      <div className="elstar-card p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button 
              onClick={navigatePrevious}
              className="p-2 hover:bg-secondary rounded-lg"
              data-testid="prev-btn"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={goToToday}
              className="px-3 py-1 text-sm hover:bg-secondary rounded-lg"
            >
              Today
            </button>
            <button 
              onClick={navigateNext}
              className="p-2 hover:bg-secondary rounded-lg"
              data-testid="next-btn"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold ml-4">{getHeaderText()}</h2>
          </div>

          {/* View Switcher */}
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            {['month', 'week', 'day'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${
                  view === v 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'hover:bg-background'
                }`}
                data-testid={`view-${v}-btn`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="elstar-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : view === 'month' ? (
          /* Month View */
          <div>
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-border">
              {DAYS.map(day => (
                <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-r border-border last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Cells */}
            {generateMonthGrid().map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 border-b border-border last:border-b-0">
                {week.map((date, dayIdx) => {
                  const dayEvents = getEventsForDate(date);
                  const isTodayDate = isToday(date);
                  const isInMonth = isCurrentMonth(date);
                  
                  return (
                    <div 
                      key={dayIdx}
                      onClick={() => openCreateEvent(date)}
                      className={`min-h-[100px] p-2 border-r border-border last:border-r-0 cursor-pointer hover:bg-secondary/50 transition-colors ${
                        !isInMonth ? 'bg-muted/30' : ''
                      }`}
                      data-testid={`calendar-cell-${date.toISOString().split('T')[0]}`}
                    >
                      <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                        isTodayDate ? 'bg-primary text-primary-foreground' : isInMonth ? '' : 'text-muted-foreground'
                      }`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event, idx) => (
                          <div 
                            key={idx}
                            onClick={(e) => { e.stopPropagation(); openEventDetail(event); }}
                            className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                            style={{ backgroundColor: event.color || '#D4A017' }}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : view === 'week' ? (
          /* Week View */
          <div>
            {/* Day Headers */}
            <div className="grid grid-cols-8 border-b border-border">
              <div className="p-3 text-center text-sm font-medium text-muted-foreground border-r border-border w-16"></div>
              {generateWeekGrid().map((date, idx) => (
                <div key={idx} className={`p-3 text-center border-r border-border last:border-r-0 ${isToday(date) ? 'bg-primary/10' : ''}`}>
                  <div className="text-sm text-muted-foreground">{DAYS[date.getDay()]}</div>
                  <div className={`text-lg font-medium ${isToday(date) ? 'text-primary' : ''}`}>{date.getDate()}</div>
                </div>
              ))}
            </div>
            
            {/* Time slots */}
            <div className="max-h-[500px] overflow-y-auto">
              {generateDayHours().map(hour => (
                <div key={hour} className="grid grid-cols-8 border-b border-border">
                  <div className="p-2 text-xs text-muted-foreground border-r border-border w-16 text-right pr-2">
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </div>
                  {generateWeekGrid().map((date, idx) => {
                    const dayEvents = getEventsForDate(date).filter(e => {
                      const eventHour = parseInt(e.start_time?.split(':')[0] || 0);
                      return eventHour === hour;
                    });
                    
                    return (
                      <div 
                        key={idx}
                        onClick={() => openCreateEvent(date)}
                        className={`min-h-[50px] p-1 border-r border-border last:border-r-0 cursor-pointer hover:bg-secondary/30 ${isToday(date) ? 'bg-primary/5' : ''}`}
                      >
                        {dayEvents.map((event, eIdx) => (
                          <div 
                            key={eIdx}
                            onClick={(e) => { e.stopPropagation(); openEventDetail(event); }}
                            className="text-xs p-1 rounded truncate cursor-pointer"
                            style={{ backgroundColor: event.color || '#D4A017' }}
                          >
                            {event.title}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Day View */
          <div>
            <div className="p-4 border-b border-border">
              <h3 className={`text-xl font-semibold ${isToday(currentDate) ? 'text-primary' : ''}`}>
                {DAYS[currentDate.getDay()]}, {MONTHS[currentDate.getMonth()]} {currentDate.getDate()}
              </h3>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {generateDayHours().map(hour => {
                const hourEvents = getEventsForDate(currentDate).filter(e => {
                  const eventHour = parseInt(e.start_time?.split(':')[0] || 0);
                  return eventHour === hour;
                });
                
                return (
                  <div key={hour} className="flex border-b border-border">
                    <div className="w-20 p-3 text-sm text-muted-foreground text-right border-r border-border">
                      {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                    </div>
                    <div 
                      onClick={() => openCreateEvent(currentDate)}
                      className="flex-1 min-h-[60px] p-2 cursor-pointer hover:bg-secondary/30"
                    >
                      {hourEvents.map((event, idx) => (
                        <div 
                          key={idx}
                          onClick={(e) => { e.stopPropagation(); openEventDetail(event); }}
                          className="p-2 rounded mb-1 cursor-pointer hover:opacity-80"
                          style={{ backgroundColor: event.color || '#D4A017' }}
                        >
                          <div className="font-medium text-sm">{event.title}</div>
                          <div className="text-xs opacity-80">
                            {formatTime(event.start_time)} - {formatTime(event.end_time)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Event" size="lg">
        <form onSubmit={handleCreateEvent}>
          <div className="elstar-modal-body space-y-4">
            <div>
              <label className="elstar-label">Event Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="elstar-input"
                placeholder="Meeting with client"
                data-testid="event-title-input"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="elstar-label">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="elstar-input"
                  data-testid="event-date-input"
                />
              </div>
              <div>
                <label className="elstar-label">Color</label>
                <div className="flex gap-2 mt-2">
                  {EVENT_COLORS.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                      className={`w-8 h-8 rounded-full ${color.class} transition-all ${formData.color === color.value ? 'ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110' : 'hover:scale-105'}`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="all-day"
                checked={formData.all_day}
                onChange={(e) => setFormData(prev => ({ ...prev, all_day: e.target.checked }))}
                className="w-4 h-4 rounded border-border"
              />
              <label htmlFor="all-day" className="text-sm">All day event</label>
            </div>
            
            {!formData.all_day && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="elstar-label">Start Time</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    className="elstar-input"
                  />
                </div>
                <div>
                  <label className="elstar-label">End Time</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    className="elstar-input"
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="elstar-label">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="elstar-input"
                placeholder="Office / Zoom link"
              />
            </div>
            
            <div>
              <label className="elstar-label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="elstar-input min-h-[100px]"
                placeholder="Event details..."
              />
            </div>
          </div>
          
          <div className="elstar-modal-footer">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="elstar-btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={formLoading} className="elstar-btn-primary" data-testid="save-event-btn">
              {formLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Event
            </button>
          </div>
        </form>
      </Modal>

      {/* Event Detail Modal */}
      <Modal isOpen={isEventDetailOpen} onClose={() => setIsEventDetailOpen(false)} title="Event Details">
        {selectedEvent && (
          <>
            <div className="elstar-modal-body space-y-4">
              <div className="flex items-start gap-3">
                <div 
                  className="w-4 h-4 rounded mt-1"
                  style={{ backgroundColor: selectedEvent.color || '#D4A017' }}
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {new Date(selectedEvent.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              
              {!selectedEvent.all_day && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {formatTime(selectedEvent.start_time)} - {formatTime(selectedEvent.end_time)}
                </div>
              )}
              
              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {selectedEvent.location}
                </div>
              )}
              
              {selectedEvent.description && (
                <p className="text-sm">{selectedEvent.description}</p>
              )}
            </div>
            
            <div className="elstar-modal-footer">
              <button 
                onClick={() => handleDeleteEvent(selectedEvent.id)}
                className="elstar-btn-ghost text-destructive"
              >
                Delete
              </button>
              <button 
                onClick={() => setIsEventDetailOpen(false)}
                className="elstar-btn-primary"
              >
                Close
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
