import { useState } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths,
  setHours,
  setMinutes
} from "date-fns";
import "./Timeline.css";

const ITEM_TYPE = "EVENT"; // Define draggable type

const TimelineMonthView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState(generateEvents());

  function generateEvents() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return [
      {
        id: 1,
        title: "Team Meeting",
        start: setHours(setMinutes(new Date(year, month, 15), 30), 10),
        end: setHours(setMinutes(new Date(year, month, 15), 0), 12),
        color: "#ffdab9"
      },
      {
        id: 2,
        title: "Client Call",
        start: setHours(setMinutes(new Date(year, month, 20), 0), 14),
        end: setHours(setMinutes(new Date(year, month, 20), 30), 15),
        color: "#b9ffda"
      },
      {
        id: 3,
        title: "Workshop",
        start: setHours(setMinutes(new Date(year, month, 25), 0), 9),
        end: setHours(setMinutes(new Date(year, month, 25), 0), 17),
        color: "#dab9ff"
      }
    ];
  }

  const handlePreviousMonth = () => setCurrentDate(addMonths(currentDate, -1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const times = Array.from({ length: 24 }, (_, i) => i + 6); // 6AM to 10PM

  const moveEvent = (eventId, newDay, newTime) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === eventId
          ? { ...event, start: setHours(setMinutes(newDay, 0), newTime) }
          : event
      )
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="timeline-container">
        {/* Month Navigation Header */}
        <div className="month-header">
          <button onClick={handlePreviousMonth} className="nav-button">
            &lt; Previous
          </button>
          <h2>{format(currentDate, "MMMM yyyy")}</h2>
          <button onClick={handleNextMonth} className="nav-button">
            Next &gt;
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="timeline-grid">
          {/* Time Column */}
          <div className="time-column">
            {times.map((time) => (
              <div key={time} className="time-slot">
                {format(setHours(new Date(), time), "ha")}
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {daysInMonth.map((day) => (
            <DayColumn
              key={day.toISOString()}
              day={day}
              events={events.filter((event) => isSameDay(event.start, day))}
              times={times}
              moveEvent={moveEvent}
            />
          ))}
        </div>
      </div>
    </DndProvider>
  );
};

/* Day Column Component */
const DayColumn = ({ day, events, times, moveEvent }) => {
  return (
    <div className="day-column">
      <div className="day-header">
        <div className="weekday">{format(day, "EEE")}</div>
        <div className="date-number">{format(day, "d")}</div>
      </div>

      <div className="day-cells">
        {times.map((time) => (
          <TimeSlot key={time} day={day} time={time} moveEvent={moveEvent} />
        ))}
      </div>

      {events.map((event) => (
        <DraggableEvent key={event.id} event={event} />
      ))}
    </div>
  );
};

/* Draggable Event Component */
const DraggableEvent = ({ event }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { id: event.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  return (
    <div
      ref={drag}
      className="event"
      style={{
        top: `${(event.start.getHours() - 6) * 60}px`,
        backgroundColor: event.color,
        opacity: isDragging ? 0.5 : 1
      }}
    >
      <div className="event-title">{event.title}</div>
      <div className="event-time">
        {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}
      </div>
    </div>
  );
};

/* Droppable Time Slot Component */
const TimeSlot = ({ day, time, moveEvent }) => {
  const [, drop] = useDrop({
    accept: ITEM_TYPE,
    drop: (item) => moveEvent(item.id, day, time)
  });

  return <div ref={drop} className="time-cell" />;
};

export default TimelineMonthView;
