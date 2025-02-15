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
  const [events, setEvents] = useState(() => {
    // Load events from localStorage on initial render
    const storedEvents = localStorage.getItem("events");
    if (storedEvents) {
      // Parse events and ensure start and end are Date objects
      const parsedEvents = JSON.parse(storedEvents).map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end)
      }));
      return parsedEvents;
    }
    return generateEvents(currentDate);
  });
  const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "", color: "#ffdab9" });
  const [isBtnClicked, setIsBtnClicked] = useState(false);

  // Handle month navigation
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

  // Move event handler
  const moveEvent = (eventId, newDay, newTime) => {
    setEvents((prevEvents) => {
      const updatedEvents = prevEvents.map((event) =>
        event.id === eventId
          ? {
              ...event,
              start: new Date(newDay.getFullYear(), newDay.getMonth(), newDay.getDate(), newTime, 0),
              end: new Date(newDay.getFullYear(), newDay.getMonth(), newDay.getDate(), newTime + 1, 0),
            }
          : event
      );
      localStorage.setItem("events", JSON.stringify(updatedEvents)); // Save updated events to localStorage
      return updatedEvents;
    });
  };

  // Create a new event
  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time) return;

    const eventDate = new Date(newEvent.date);
    const eventStart = setHours(setMinutes(eventDate, 0), parseInt(newEvent.time, 10));
    const eventEnd = new Date(eventStart.getTime() + 60 * 60000); // 1-hour event

    const newEventData = {
      id: events.length + 1,
      title: newEvent.title,
      start: eventStart,
      end: eventEnd,
      color: newEvent.color,
    };

    console.log(newEventData); // Debugging the event creation
    setEvents((prevEvents) => {
      const updatedEvents = [...prevEvents, newEventData];
      localStorage.setItem("events", JSON.stringify(updatedEvents)); // Save new events to localStorage
      return updatedEvents;
    });

    setNewEvent({ title: "", date: "", time: "", color: "#ffdab9" });
    setIsBtnClicked(false);
    alert("Event Added Successfully!!");
  };

  const handleAddBtnClick = () => {
    setIsBtnClicked(true);
  };

  const handleDeleteEvent = (eventId) => {
    setEvents((prevEvents) => {
      const updatedEvents = prevEvents.filter((event) => event.id !== eventId);
      localStorage.setItem("events", JSON.stringify(updatedEvents)); // Save updated events to localStorage
      return updatedEvents;
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="timeline-container">
        {/* Navigation */}
        <div className="month-header">
          <button onClick={handlePreviousMonth} className="nav-button">&lt; Previous</button>
          <h2>{format(currentDate, "MMMM yyyy")}</h2>
          <button onClick={handleNextMonth} className="nav-button">Next &gt;</button>
        </div>

        {/* Create Event Form */}
        {isBtnClicked ? (
          <div className="create-event-form">
            <input
              type="text"
              placeholder="Event Title"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            />
            <input
              type="date"
              value={newEvent.date}
              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
            />
            <select value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}>
              {times.map((time) => (
                <option key={time} value={time}>
                  {format(setHours(new Date(), time), "ha")}
                </option>
              ))}
            </select>
            <input
              type="color"
              value={newEvent.color}
              onChange={(e) => setNewEvent({ ...newEvent, color: e.target.value })}
            />
            <button onClick={handleCreateEvent}>Add Event</button>
          </div>
        ) : (
          <div className="add-event-btn">
            <button onClick={handleAddBtnClick} id="add-btn">
              Add an Event
            </button>
          </div>
        )}

        {/* Timeline Grid */}
        <div className="timeline-grid">
          <div className="time-column">
            <div className="time-slot"></div> {/* Blank first time column */}
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
              handleDeleteEvent={handleDeleteEvent}
            />
          ))}
        </div>
      </div>
    </DndProvider>
  );
};

const DraggableEvent = ({ event, onDelete }) => {
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
        <button onClick={() => onDelete(event.id)} className="delete-button">
          ❌
        </button>
      </div>
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
    <div ref={drop} className="time-cell" style={{ background: isOver ? "#f0f0f0" : "transparent" }} />
  );
};

const DayColumn = ({ day, times, events, moveEvent, handleDeleteEvent }) => {
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
          <DraggableEvent key={event.id} event={event} onDelete={handleDeleteEvent} />
        ))}
    </div>
  );
};

const generateEvents = (currentDate) => {
  return [];
};

export default TimelineMonthView;
