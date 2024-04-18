import { useEffect, useState, useRef } from 'react';
import timelineItems from './timelineItems';

function App() {
  const dragItem = useRef();
  const dragItemNode = useRef();
  const [timeLines, setTimeLines] = useState([]);

  function placeEvents(events) {
    // Sort events by start date, then by end date
    events.sort(
      (a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end)
    );

    const lanes = [];
    const positions = [];
    events.forEach((event) => {
      let placed = false;

      for (let i = 0; i < positions.length; i++) {
        // Check if the event can be placed in the current lane
        if (event.start >= positions[i]) {
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
      }
    });

    setTimeLines(lanes);
  }

  useEffect(() => placeEvents(timelineItems), [timelineItems]);

  const getDays = (startDate, endDate) => {
    const diff =
      (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
    return diff + 1;
  };

  const handleDragStart = (e, item) => {
    dragItemNode.current = e.target;
    dragItemNode.current.addEventListener('dragend', handleDragEnd);
    dragItem.current = item;

    setTimeout(() => {
      if (dragItemNode.current) {
        dragItemNode.current.style.display = 'none';
      }
    }, 0);
  };

  const handleDragEnd = () => {
    if (dragItemNode.current) {
      dragItemNode.current.style.display = 'block';
      dragItemNode.current.removeEventListener('dragend', handleDragEnd);
      dragItem.current = null;
      dragItemNode.current = null;
    }
  };

  const handleDrop = (e, newStartDate) => {
    e.preventDefault();
    const draggedEvent = timeLines.find(
      (event) => event.id === dragItem.current.id
    );
    const duration =
      new Date(draggedEvent.endDate) - new Date(draggedEvent.startDate);
    const updatedEndDate = new Date(newStartDate.getTime() + duration);

    const updatedEvents = timeLines.map((event) =>
      event.id === draggedEvent.id
        ? {
            ...event,
            startDate: newStartDate.toISOString().split('T')[0],
            endDate: updatedEndDate.toISOString().split('T')[0],
          }
        : event
    );

    setTimeLines(updatedEvents);
    handleDragEnd();
  };

  function handleDragOver(e) {
    e.preventDefault(); // Necessary for allowing a drop
  }

  return (
    <div>
      <h2 className="my-2">January</h2>
      <div className="flex justify-between mb-2">
        {' '
          .repeat(31)
          .split('')
          .map((day, index) => (
            <div className="w-[31px] text-center bg-gray-900 p-2" key={index}>
              {index + 1}
            </div>
          ))}
      </div>
      {timeLines.map((row, indexRow) => (
        <div className="relative" key={indexRow}>
          {row.map((event, eventIndex) => (
            <span
              draggable
              onDragStart={(e) => handleDragStart(e, event)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, new Date(event.startDate))}
              style={{
                top: indexRow * 50,
                left: (961 / 31) * (new Date(event.start).getUTCDate() - 1),
                width: (getDays(event.start, event.end) * 961) / 31,
              }}
              className={`bg-cyan-900 p-2 rounded absolute overflow-hidden text-ellipsis text-nowrap border-1 border-cyan-500`}
              key={event.id}
            >
              {getDays(event.start, event.end)} days
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export default App;
