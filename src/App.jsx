/* eslint-disable react/prop-types */
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import timelineItems from './timelineItems';
import {
  formatTwoDigit,
  parseDate,
  sortEvents,
  getMonths,
  getDaysBetweenTwoDates,
} from './utils';

// main component to display all
const App = () => {
  // Sort events by start date, then by end date
  const [events, setEvents] = useState(sortEvents(timelineItems));
  const [timeLines, setTimeLines] = useState([]);
  const lastDraggedZone = useRef();

  const createTimeLines = useCallback(() => {
    const lanes = [];
    const positions = [];

    events.forEach((event) => {
      let placed = false;
      const { monthFormatted: startMonth } = parseDate(event.start);
      const { monthFormatted: endMonth } = parseDate(event.end);

      for (let i = 0; i < positions.length; i++) {
        // Check if the event can be placed in the current lane
        if (event.start > positions[i]) {
          // Place event in this lane
          lanes[i].push(event);

          // this is for render the rest of days that pass from a month to other
          if (startMonth !== endMonth) {
            const endDay = formatTwoDigit(new Date(event.end).getUTCDate());
            lanes[i].push({
              ...event,
              start: `2021-${endMonth}-01`,
              end: `2021-${endMonth}-${endDay}`,
            });
          }

          // Update the last used position in this lane
          placed = true;
          positions[i] = event.end;
          break;
        }
      }

      // If no lane was found, create a new lane
      if (!placed) {
        lanes.push([event]);
        positions.push(event.end);
      }
    });

    setTimeLines(lanes);
  }, [events]);

  useEffect(() => createTimeLines(), [createTimeLines]);

  const monthsData = useMemo(() => getMonths(events), [events]);

  const updateTimeLines = (event) => {
    const newDate = lastDraggedZone.current.target.id;
    const duration = new Date(event.end) - new Date(event.start);
    const updatedEndDate = new Date(new Date(newDate).getTime() + duration)
      .toISOString()
      .split('T')[0];

    const updatedEvents = events.map((ev) =>
      ev.id === event.id
        ? {
            ...ev,
            start: newDate,
            end: updatedEndDate,
          }
        : ev
    );

    setEvents(sortEvents(updatedEvents));
  };

  const handleEditLine = (event) => {
    const newName = prompt('Please enter a new name', event.name);

    if (!newName || newName === event.name) return;

    const updatedEvents = events.map((ev) =>
      ev.id === event.id
        ? {
            ...ev,
            name: newName,
          }
        : ev
    );

    setEvents(sortEvents(updatedEvents));
  };

  return (
    <Container>
      {monthsData.map((month) => (
        <Calendar
          key={month.name}
          month={month}
          timeLines={timeLines}
          updateTimeLines={updateTimeLines}
          lastDraggedZone={lastDraggedZone}
          handleClickEdit={handleEditLine}
        />
      ))}
    </Container>
  );
};

// component for wrapping calentdar component, and separate the logit of zoom
const Container = ({ children }) => {
  const [zoom, setZoom] = useState(1);

  const handleWheel = useCallback((event) => {
    setZoom((prevZoom) =>
      event.deltaY < 0
        ? Math.min(prevZoom * 1.1, 5)
        : Math.max(prevZoom / 1.1, 1)
    );
  }, []);

  return (
    <div
      onWheel={handleWheel}
      className="my-5"
      style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s' }}
    >
      {children}
    </div>
  );
};

// component that display the timelines
const Calendar = ({
  month,
  timeLines,
  updateTimeLines,
  lastDraggedZone,
  handleClickEdit,
}) => {
  const dragItemNode = useRef();
  const [draggedItem, setDraggedItem] = useState(null);
  const [newDate, setNewDate] = useState(null);

  const handleDragStart = (e, event) => {
    setDraggedItem(event);
    dragItemNode.current = e.target;

    setTimeout(() => {
      if (dragItemNode.current) {
        dragItemNode.current.style.display = 'none';
      }
    }, 0);
  };

  const handleDragEnd = () => {
    lastDraggedZone.current.target.style.backgroundColor = '';
    updateTimeLines(draggedItem, newDate);

    if (dragItemNode.current) {
      dragItemNode.current.style.display = 'block';
    }
  };

  const handleDragLeave = (e) => {
    e.target.style.backgroundColor = '';
  };

  const handleDragEnter = (e) => {
    lastDraggedZone.current = e;
    setNewDate(e.target.id);
    e.target.style.backgroundColor = '#3c3c41';
  };

  const handleDragOver = (e) => e.preventDefault();

  return (
    <div onDragOver={handleDragOver}>
      <h2 className="my-2 font-bold">{month.name}</h2>
      <Row date={month} className="bg-zinc-700" showDays />
      {timeLines.map((row, indexLine) => (
        <div id={indexLine} className="relative" key={indexLine}>
          {row.map(
            (event) =>
              parseDate(event.start).name === month.name && (
                <EventLine
                  draggable
                  key={event.id}
                  event={event}
                  onDragStart={(e) => handleDragStart(e, event)}
                  onDragEnd={handleDragEnd}
                  handleClickEdit={handleClickEdit}
                />
              )
          )}
          <Row
            date={month}
            className="border-l-2 border-zinc-800/20 last:border-r-2"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          />
        </div>
      ))}
    </div>
  );
};

// component used for render days of months in calendar and render drag zones
const Row = ({ date, className, showDays = false, ...rest }) => {
  const formattedDate = `${date.year}-${date.monthFormatted}`;

  return (
    <div className="flex justify-start" {...rest}>
      {Array.from({ length: date.daysOfMonth }, (_, day) => (
        <span
          key={`${formattedDate}-${formatTwoDigit(day + 1)}`}
          id={`${formattedDate}-${formatTwoDigit(day + 1)}`}
          className={`w-[31px] h-[40px] text-center p-2 first:rounded-l last:rounded-r ${className}`}
        >
          {showDays ? day + 1 : ''}
        </span>
      ))}
    </div>
  );
};

// component for render the tiemline of each event
const EventLine = ({ event, handleClickEdit, ...rest }) => {
  const lineRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);

  const calendarWith = 961;
  const startPosition =
    (calendarWith / 31) * (new Date(event.start).getUTCDate() - 1);
  const width =
    (getDaysBetweenTwoDates(event.start, event.end) * calendarWith) / 31;

  const handleMouseEnter = () => setIsHovering(true);

  const handleMouseLeave = () => setIsHovering(false);

  const hasOverFlow = () =>
    lineRef.current.offsetWidth < lineRef.current.scrollWidth;

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div
        ref={lineRef}
        id={event.id}
        key={event.id}
        style={{
          left: startPosition,
          width: width,
        }}
        className={`bg-cyan-900 border-cyan-500 p-1 rounded border absolute overflow-hidden text-ellipsis text-nowrap`}
        {...rest}
      >
        {event.name}
      </div>
      {isHovering && (
        <button
          className="rounded border absolute bg-zinc-900 border-cyan-500 active:bg-cyan-500 text-cyan-400 p-1 w-8 h-[34px]"
          style={{ left: startPosition - 31 + 'px' }}
          onClick={() => handleClickEdit(event)}
        >
          &#9998;
        </button>
      )}
      {isHovering && hasOverFlow() && (
        <div
          className="rounded border absolute bg-zinc-900 border-zinc-500 p-1 -top-8 w-max"
          style={{ left: startPosition + 'px' }}
        >
          {event.name}
        </div>
      )}
    </div>
  );
};

export default App;
