import React from "react";

const EventsList = ({ eventsFound }) => {
  // Sort events by date and take 10 soonest

  function convertListToMap(jsonList, keyField) {
    const myMap = new Map();
    jsonList.forEach((item) => {
      myMap.set(item[keyField], item);
    });
    return myMap;
  }

  const sortedEvents = convertListToMap(eventsFound, "start");

  return (
    <ul className="list bg-base-100 rounded-box shadow-md">
      <li className="p-4 pb-2 text-xs opacity-60 tracking-wide">
        Upcoming Events
      </li>
      {sortedEvents.map((event, index) => (
        <li
          key={index}
          className="list-row p-4 flex items-center justify-between"
        >
          <div className="flex items-center">
            <img
              className="size-10 rounded-box mr-4"
              src={event.image || "/default-image.jpg"} // Use fallback image if none
              alt={event.name}
            />
            <div>
              <div>{event.name}</div>
              <div className="text-xs uppercase font-semibold opacity-60">
                {event.description}
              </div>
              <div className="text-xs opacity-60">
                {event.date.toDateString()} {/* Ensure it's a Date object */}
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button className="btn btn-square btn-ghost">
              <svg
                className="size-[1.2em]"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <g
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeWidth="2"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M6 3L20 12 6 21 6 3z"></path>
                </g>
              </svg>
            </button>
            <button className="btn btn-square btn-ghost">
              <svg
                className="size-[1.2em]"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <g
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeWidth="2"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                </g>
              </svg>
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default EventsList;
