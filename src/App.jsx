/* eslint-disable react/prop-types */
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import timelineItems from './timelineItems';

const monthNames = {
  1: 'January',
  2: 'February',
  3: 'March',
  4: 'April',
  5: 'May',
  6: 'June',
  7: 'July',
  8: 'August',
  9: 'September',
  10: 'October',
  11: 'November',
  12: 'December',
};

const formatTwoDigit = (digits) => {
  return String(digits).padStart(2, '0');
};

const parseDate = (date) => {
  const formatedDate = new Date(date);
  const monthFormated = formatTwoDigit(formatedDate.getUTCMonth() + 1);
  const daysOfMonth = new Date(
    formatedDate.getFullYear(),
    monthFormated,
    0
  ).getDate();
  const year = formatedDate.getFullYear();
  const name = monthNames[formatedDate.getUTCMonth() + 1];

  return { monthFormated, daysOfMonth, year, name, formatedDate };
};

const sortEvents = (events) => {
  return [...events].sort(
    (a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end)
  );
};

const getMonths = (events) => {
  const tempEvents = [...events];
  const months = new Set();

  tempEvents.forEach((item) => {
    months.add(new Date(item.end).getMonth());
  });

  const uniqueMonths = Array.from(months);

  const formatedMonths = []
  
  uniqueMonths.forEach(month => {
    const formated = parseDate(Date.UTC(2023, month));
    formatedMonths.push(formated)
  })
  console.log('formatedMonths: ', formatedMonths);

  return formatedMonths;
};

function App() {
  // Sort events by start date, then by end date
  const [events] = useState(() => sortEvents(timelineItems));
  const dragItemNode = useRef();
  const [timeLines, setTimeLines] = useState([]);
  const [zoom, setZoom] = useState(1);

  const handleWheel = useCallback((event) => {
    setZoom((prevZoom) =>
      event.deltaY < 0
        ? Math.min(prevZoom * 1.1, 5)
        : Math.max(prevZoom / 1.1, 1)
    );
  }, []);

  const placeEvents = () => {
    const lanes = [];
    const positions = [];
    events.forEach((event) => {
      let placed = false;
      const { monthFormated: startMonth } = parseDate(event.start);
      const { monthFormated: endMonth } = parseDate(event.end);

      for (let i = 0; i < positions.length; i++) {
        // Check if the event can be placed in the current lane
        if (event.start >= positions[i] && startMonth === endMonth) {
          // Place event in this lane
          lanes[i].push(event);
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

        if (startMonth !== endMonth) {
          const endDay = formatTwoDigit(new Date(event.end).getUTCDate());
          lanes[lanes.length - 1].push({
            ...event,
            start: `2021-${endMonth}-01`,
            end: `2021-${endMonth}-${endDay}`,
          });
        }
      }
    });

    setTimeLines(lanes);
  };

  useEffect(() => {
    placeEvents(events);
  }, [events]);

  const handleDragStart = (e) => {
    dragItemNode.current = e.target;

    setTimeout(() => {
      if (dragItemNode.current) {
        dragItemNode.current.style.display = 'none';
      }
    }, 0);
  };

  const handleDragEnd = (e) => {
    console.log('handleDragEnd ', e);
    if (dragItemNode.current) {
      dragItemNode.current.style.display = 'block';
    }
  };

  const handleDragLeave = (e) => {
    e.target.style.backgroundColor = '';
  };

  const handleDragEnter = (e) => {
    console.log('handleDragEnter', e);
    e.target.style.backgroundColor = '#3c3c41';
  };

  const monthsData = useMemo(() => getMonths(events), [events]);

  const renderRow = (date, className, showDays = false) => {
    const formatedDate = `${date.year}-${date.monthFormated}`;
    return (
      <div
        className="flex justify-start"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        {'_'
          .repeat(date.daysOfMonth)
          .split('')
          .map((day, index) => (
            <span
              key={`${formatedDate}-${formatTwoDigit(index + 1)}`}
              id={`${formatedDate}-${formatTwoDigit(index + 1)}`}
              className={`w-[31px] h-[36px] text-center p-2 first:rounded-l last:rounded-r ${className}`}
            >
              {showDays ? index + 1 : ''}
            </span>
          ))}
      </div>
    );
  };

  return (
    <div
      onWheel={handleWheel}
      className="overflow-hidden my-5"
      style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s' }}
    >
      {monthsData.map((month, index) => (
        <div key={index}>
          <h2 className="my-2">{month.name}</h2>
          {renderRow(month, 'bg-zinc-700', true)}
          {timeLines.map((row, indexRow) => (
            <div id={indexRow} className="relative" key={indexRow}>
              {row.map(
                (event) =>
                  monthNames[new Date(event.start).getUTCMonth() + 1] ===
                    month.name && (
                    <EventBar
                      key={event.id}
                      event={event}
                      onDragStart={(e) => handleDragStart(e, event)}
                      onDragEnd={handleDragEnd}
                    />
                  )
              )}
              {renderRow(month, 'border-l-2 border-zinc-800/20 last:border-r-2')}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const EventBar = ({ event, ...rest }) => {
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  // calculate number fo days between two dates
  const getDays = (startDate, endDate) => {
    let diff =
      (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);

    const { name: startMonth } = parseDate(startDate);
    const { name: endMonth } = parseDate(endDate);

    if (startMonth !== endMonth) {
      diff -= new Date(endDate).getUTCDate();
    }

    return diff + 1;
  };

  const left = (961 / 31) * (new Date(event.start).getUTCDate() - 1);
  const width = (getDays(event.start, event.end) * 961) / 31;
  const longText = event.name.length * 5 > width;

  return (
    <div>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        draggable
        style={{
          top: 1,
          left: left,
          width: width,
        }}
        className={`bg-cyan-900 border-cyan-500 p-1 rounded border absolute overflow-hidden text-ellipsis text-nowrap`}
        key={event.id}
        {...rest}
      >
        {/* {new Date(event.start).getUTCDate()} */}
        {/* {getDays(event.start, event.end)}  -{' '} */}
        {/* {new Date(event.start).getUTCDate() - 1 + getDays(event.start, event.end)} */}
        {/* {monthNames[new Date(event.start).getUTCMonth() + 1]} -
      {event.start} */}
        {event.name}
      </div>
      {isHovering && longText && (
        <div
          className="rounded border absolute bg-zinc-900 border-zinc-500 p-1 -top-8"
          style={{ left: left + 'px' }}
        >
          {event.name}
        </div>
      )}
    </div>
  );
};

export default App;
