/* eslint-disable react/prop-types */
import { useEffect, useState, useRef } from 'react';
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

function App() {
  // Sort events by start date, then by end date
  const [events] = useState(
    timelineItems.sort(
      (a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end)
    )
  );
  const dragItemNode = useRef();

  const [timeLines, setTimeLines] = useState([]);

  function placeEvents() {
    
    const lanes = [];
    const positions = [];
    events.forEach((event) => {
      let placed = false;
      const startMonth = String(new Date(event.start).getUTCMonth() + 1).padStart(2, '0')
      const endMonth = String(new Date(event.end).getUTCMonth() + 1).padStart(2, '0')

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

        if(startMonth !== endMonth){
          const endDays = String(new Date(event.end).getUTCDate()).padStart(2, '0')
          lanes[lanes.length-1].push({
            ...event,
            start: `2021-${endMonth}-01`,
            end: `2021-${endMonth}-${endDays}`,
          });
        }
      }
    });

    setTimeLines(lanes);
  }

  useEffect(() => {
    placeEvents(events);
  }, [events]);

  function handleDragStart(e, event) {
    dragItemNode.current = e.target;

    setTimeout(() => {
      if (dragItemNode.current) {
        dragItemNode.current.style.display = 'none';
      }
    }, 0);
  }

  function handleDragEnd(e) {
    console.log('handleDragEnd ', e);
    if (dragItemNode.current) {
      dragItemNode.current.style.display = 'block';
      // dragItemNode.current.removeEventListener('dragend', handleDragEnd);
      // dragItemNode.current = null;
    }
  }

  const handleDrop = (e) => {
    console.log('handleDrop: ', e.target);
    // console.log('handleDragLeave: ', dragEvent);
    e.target.style.backgroundColor = '';
  };

  const handleDragLeave = (e) => {
    e.target.style.backgroundColor = '';
  };

  const handleDragEnter = (e) => {
    console.log('handleDragEnter', e);
    e.target.style.backgroundColor = '#3c3c41';
  };

  const getMonthData = (date) => {
    const formatedDate = new Date(date);
    const month = String(formatedDate.getUTCMonth() + 1).padStart(2, '0');
    const days = new Date(formatedDate.getFullYear(), month, 0).getDate();
    const year = formatedDate.getFullYear();
    const name = monthNames[formatedDate.getUTCMonth() + 1]

    return { month, days, year, name }
  }

  const getMonths = () => {
    const tempEvents = [...events];
    
    const min = getMonthData(tempEvents[0].start);
    min.date =tempEvents[0].start

    const max = getMonthData(tempEvents[tempEvents.length-1].end);
    max.date = tempEvents[tempEvents.length-1].end

    const result = min.name === max.name ? [min] : [min, max];
    // console.log('result: ', result);
    return result;
  };

  const renderRow = (date, className, showDays = false) => {
    return (
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className="flex justify-start"
      >
        {' '
          .repeat(date.days)
          .split('')
          .map((day, index) => (
            <div
              key={`${date.year}-${date.month}-${String(index + 1).padStart(
                2,
                '0'
              )}`}
              id={`${date.year}-${date.month}-${String(index + 1).padStart(
                2,
                '0'
              )}`}
              className={`w-[31px] h-[36px] text-center p-2 ${className}`}
            >
              {showDays ? index + 1 : ''}
            </div>
          ))}
      </div>
    );
  };

  return (
    <div>
      {getMonths().map((item, index) => (
        <div key={index}>
          <h2 className="my-2">{item.name}</h2>
          {renderRow(item, 'bg-zinc-700', true)}
          {timeLines.map((row, indexRow) => (
            <div id={indexRow} className="relative" key={indexRow}>
              {row.map((event) =>
                monthNames[new Date(event.start).getUTCMonth() + 1] ===
                item.name ? (
                  <EventBar
                    key={event.id}
                    event={event}
                    onDragStart={(e) => handleDragStart(e, event)}
                    onDragEnd={handleDragEnd}
                  />
                ) : (
                  ''
                )
              )}
              {renderRow(item, 'border-l-2 border-zinc-800/20')}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const EventBar = ({ event, eventRef, ...rest }) => {
  const getDays = (startDate, endDate) => {
    let diff =
      (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);

      const startMonth = monthNames[new Date(startDate).getUTCMonth() + 1]
      const endMonth = monthNames[new Date(endDate).getUTCMonth() + 1]
      const endDays = new Date(endDate).getUTCDate()

      if(startMonth !== endMonth){
        diff -= endDays
      }

    return diff + 1;
  };


  return (
    <div
      ref={eventRef}
      draggable
      style={{
        top: 1,
        left: (961 / 31) * (new Date(event.start).getUTCDate() - 1),
        width: (getDays(event.start, event.end) * 961) / 31,
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
  );
};

export default App;
