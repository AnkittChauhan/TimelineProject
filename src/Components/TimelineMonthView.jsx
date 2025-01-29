import { useState } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, setHours, setMinutes } from "date-fns";
import "./Timeline.css";

const ItemTypes = {
  EVENT: "event",
};

const TimelineMonthView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState(generateEvents(currentDate));

  // Month navigation
  const handlePreviousMonth = () => {
    const newDate = addMonths(currentDate, -1);
    setCurrentDate(newDate);
    setEvents(generateEvents(newDate));
  };

  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1);
    setCurrentDate(newDate);
    setEvents(generateEvents(newDate));
  };

  // Get current month details
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Time slots from 12 AM to 11 PM
  const times = Array.from({ length: 24 }, (_, i) => i);

  // Function to handle dropping an event
  const moveEvent = (eventId, newDay, newTime) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === eventId
          ? {
              ...event,
              start: new Date(newDay.getFullYear(), newDay.getMonth(), newDay.getDate(), newTime, 0),
              end: new Date(newDay.getFullYear(), newDay.getMonth(), newDay.getDate(), newTime + 1, 0), // Assuming 1-hour duration
            }
          : event
      )
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="timeline-container">
        {/* Month Navigation */}
        <div className="month-header">
          <button onClick={handlePreviousMonth} className="nav-button">&lt; Previous</button>
          <h2>{format(currentDate, "MMMM yyyy")}</h2>
          <button onClick={handleNextMonth} className="nav-button">Next &gt;</button>
        </div>

        {/* Calendar Grid */}
        <div className="timeline-grid">
          {/* Time Column */}
          <div className="time-column">
            {times.map((time) => (
              <div key={time} className="time-slot">{format(setHours(new Date(), time), "ha")}</div>
            ))}
          </div>

          {/* Day Columns */}
          {daysInMonth.map((day) => (
            <DayColumn key={day.toISOString()} day={day} times={times} events={events} moveEvent={moveEvent} />
          ))}
        </div>
      </div>
    </DndProvider>
  );
};

// Draggable Event Component
const DraggableEvent = ({ event }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.EVENT,
    item: { id: event.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  // Calculating event position based on time
  const top = (event.start.getHours() * 60 + event.start.getMinutes()) * (60 / 60); // Convert to pixel height

  return (
    <div
      ref={drag}
      className="event"
      style={{
        backgroundColor: event.color,
        opacity: isDragging ? 0.5 : 1,
        top: `${top}px`,  // Position vertically
        position: "absolute",
        width: "100%",
      }}
    >
      <div className="event-title">{event.title}</div>
      <div className="event-time">{format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}</div>
    </div>
  );
};

// Droppable Time Cell Component
const TimeCell = ({ time, day, moveEvent }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.EVENT,
    drop: (item) => moveEvent(item.id, day, time),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div ref={drop} className="time-cell" style={{ background: isOver ? "#f0f0f0" : "transparent" }} />
  );
};

// Day Column Component
const DayColumn = ({ day, times, events, moveEvent }) => {
  return (
    <div className="day-column" style={{ position: "relative" }}>
      {/* Day Header */}
      <div className="day-header">
        <div className="weekday">{format(day, "EEE")}</div>
        <div className="date-number">{format(day, "d")}</div>
      </div>

      {/* Time Cells */}
      <div className="day-cells">
        {times.map((time) => (
          <TimeCell key={time} time={time} day={day} moveEvent={moveEvent} />
        ))}
      </div>

      {/* Events */}
      {events
        .filter((event) => isSameDay(event.start, day))
        .map((event) => (
          <DraggableEvent key={event.id} event={event} />
        ))}
    </div>
  );
};

// Function to generate dummy events
const generateEvents = (currentDate) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  return [
    {
      id: 1,
      title: "Team Meeting",
      start: new Date(year, month, 15, 10, 30),
      end: new Date(year, month, 15, 12, 0),
      color: "#ffdab9",
    },
    {
      id: 2,
      title: "Client Call",
      start: new Date(year, month, 20, 14, 0),
      end: new Date(year, month, 20, 15, 30),
      color: "#b9ffda",
    },
    {
      id: 3,
      title: "Workshop",
      start: new Date(year, month, 25, 9, 0),
      end: new Date(year, month, 25, 17, 0),
      color: "#dab9ff",
    },
  ];
};

export default TimelineMonthView;
