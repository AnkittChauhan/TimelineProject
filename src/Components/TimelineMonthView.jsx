import { useState, useEffect } from "react";
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
  const [resizingEvent, setResizingEvent] = useState(null);

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

  // Event movement handler
  const moveEvent = (eventId, newDay, newTime) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === eventId
          ? {
              ...event,
              start: new Date(newDay.getFullYear(), newDay.getMonth(), newDay.getDate(), newTime, 0),
              end: new Date(newDay.getFullYear(), newDay.getMonth(), newDay.getDate(), newTime + 1, 0),
            }
          : event
      )
    );
  };

  // Event resizing handler
  const handleResize = (eventId, direction, e) => {
    e.preventDefault();
    setResizingEvent(eventId);
  
    const startX = e.pageX;
    const startY = e.pageY;
  
    setEvents((prevEvents) =>
      prevEvents.map((ev) =>
        ev.id === eventId
          ? {
              ...ev,
              originalStart: ev.start,
              originalEnd: ev.end,
            }
          : ev
      )
    );
  
    const handleMouseMove = (e) => {
      setEvents((prevEvents) =>
        prevEvents.map((ev) => {
          if (ev.id === eventId) {
            let newStart = ev.originalStart;
            let newEnd = ev.originalEnd;
  
            if (direction === "vertical") {
              const diffY = e.pageY - startY;
              const minutesDiff = Math.round(diffY / 5) * 5; // Adjusting step size
              newEnd = new Date(ev.originalEnd.getTime() + minutesDiff * 60000);
            } else if (direction === "horizontal") {
              const diffX = e.pageX - startX;
              const hoursDiff = Math.round(diffX / 50); // Adjust step size for resizing
              newEnd = new Date(ev.originalEnd.getTime() + hoursDiff * 3600000);
            }
  
            return { ...ev, start: newStart, end: newEnd };
          }
          return ev;
        })
      );
    };
  
    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      setResizingEvent(null);
    };
  
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };
  

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="timeline-container">
        <div className="month-header">
          <button onClick={handlePreviousMonth} className="nav-button">&lt; Previous</button>
          <h2>{format(currentDate, "MMMM yyyy")}</h2>
          <button onClick={handleNextMonth} className="nav-button">Next &gt;</button>
        </div>

        <div className="timeline-grid">
          <div className="time-column">
            {times.map((time) => (
              <div key={time} className="time-slot">
                {format(setHours(new Date(), time), "ha")}
              </div>
            ))}
          </div>

          {daysInMonth.map((day) => (
            <DayColumn
              key={day.toISOString()}
              day={day}
              times={times}
              events={events}
              moveEvent={moveEvent}
              onResize={handleResize}
            />
          ))}
        </div>
      </div>
    </DndProvider>
  );
};

const DraggableEvent = ({ event, onResize }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.EVENT,
    item: { id: event.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const top = (event.start.getHours() * 60 + event.start.getMinutes()) * (60 / 60);
  const height = (event.end - event.start) / (1000 * 60);

  return (
    <div
      ref={drag}
      className="event"
      style={{
        backgroundColor: event.color,
        opacity: isDragging ? 0.5 : 1,
        top: `${top}px`,
        height: `${height}px`,
        position: "absolute",
        width: "100%",
      }}
    >
      <div className="event-content">
        <div className="event-title">{event.title}</div>
        <div className="event-time">
          {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}
        </div>
      </div>
      <div
        className="resize-handle vertical"
        onMouseDown={(e) => {
          e.stopPropagation();
          onResize(event.id, "vertical", e);
        }}
      />
      <div
        className="resize-handle horizontal"
        onMouseDown={(e) => {
          e.stopPropagation();
          onResize(event.id, "horizontal", e);
        }}
      />
    </div>
  );
};

const TimeCell = ({ time, day, moveEvent }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.EVENT,
    drop: (item) => moveEvent(item.id, day, time),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className="time-cell"
      style={{ background: isOver ? "#f0f0f0" : "transparent" }}
    />
  );
};

const DayColumn = ({ day, times, events, moveEvent, onResize }) => {
  return (
    <div className="day-column" style={{ position: "relative" }}>
      <div className="day-header">
        <div className="weekday">{format(day, "EEE")}</div>
        <div className="date-number">{format(day, "d")}</div>
      </div>

      <div className="day-cells">
        {times.map((time) => (
          <TimeCell key={time} time={time} day={day} moveEvent={moveEvent} />
        ))}
      </div>

      {events
        .filter((event) => isSameDay(event.start, day))
        .map((event) => (
          <DraggableEvent key={event.id} event={event} onResize={onResize} />
        ))}
    </div>
  );
};

const generateEvents = (currentDate) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  return [
    {
      id: 1,
      title: "Team Meeting",
      start: new Date(year, month, 15, 9, 30),
      end: new Date(year, month, 15, 11, 0),
      color: "#ffdab9",
    },
    {
      id: 2,
      title: "Client Call",
      start: new Date(year, month, 20, 14, 0),
      end: new Date(year, month, 20, 15, 0),
      color: "#b9ffda",
    },
    {
      id: 3,
      title: "Workshop",
      start: new Date(year, month, 25, 10, 0),
      end: new Date(year, month, 25, 16, 0),
      color: "#dab9ff",
    },
  ];
};

export default TimelineMonthView;