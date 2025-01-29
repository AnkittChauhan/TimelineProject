import { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths,
  setHours,
  setMinutes
} from 'date-fns';
import './Timeline.css';

const TimelineMonthView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Month navigation handlers
  const handlePreviousMonth = () => setCurrentDate(addMonths(currentDate, -1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // Get current month details
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Dynamic events based on current month
  const generateEvents = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return [
      {
        id: 1,
        title: 'Team Meeting',
        start: setHours(setMinutes(new Date(year, month, 15), 30), 10),
        end: setHours(setMinutes(new Date(year, month, 15), 0), 12),
        color: '#ffdab9'
      },
      {
        id: 2,
        title: 'Client Call',
        start: setHours(setMinutes(new Date(year, month, 20), 0), 14),
        end: setHours(setMinutes(new Date(year, month, 20), 30), 15),
        color: '#b9ffda'
      },
      {
        id: 3,
        title: 'Workshop',
        start: setHours(setMinutes(new Date(year, month, 25), 0), 9),
        end: setHours(setMinutes(new Date(year, month, 25), 0), 17),
        color: '#dab9ff'
      }
    ];
  };

  const events = generateEvents();
  const times = Array.from({ length: 17 }, (_, i) => i + 6); // 6AM to 10PM

  return (
    <div className="timeline-container">
      {/* Month Navigation Header */}
      <div className="month-header">
        <button onClick={handlePreviousMonth} className="nav-button">&lt; Previous</button>
        <h2>{format(currentDate, 'MMMM yyyy')}</h2>
        <button onClick={handleNextMonth} className="nav-button">Next &gt;</button>
      </div>

      {/* Calendar Grid */}
      <div className="timeline-grid">
        {/* Time Column */}
        <div className="time-column">
          {times.map(time => (
            <div key={time} className="time-slot">
              {format(setHours(new Date(), time), 'ha')}
            </div>
          ))}
        </div>

        {/* Day Columns */}
        {daysInMonth.map(day => (
          <div key={day.toISOString()} className="day-column">
            {/* Day Header */}
            <div className="day-header">
              <div className="weekday">{format(day, 'EEE')}</div>
              <div className="date-number">{format(day, 'd')}</div>
            </div>

            {/* Time Cells */}
            <div className="day-cells">
              {times.map(time => (
                <div key={time} className="time-cell" />
              ))}
            </div>

            {/* Events */}
            {events
              .filter(event => isSameDay(event.start, day))
              .map(event => {
                const start = event.start;
                const end = event.end;
                const top = ((start.getHours() - 6) * 60 + start.getMinutes()) * (60 / 60);
                const height = ((end - start) / (1000 * 60)) * (60 / 60);

                return (
                  <div
                    key={event.id}
                    className="event"
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      backgroundColor: event.color
                    }}
                  >
                    <div className="event-title">{event.title}</div>
                    <div className="event-time">
                      {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                    </div>
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineMonthView;