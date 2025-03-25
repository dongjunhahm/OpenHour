import React from "react";

const EventsList = ({ eventsFound = [] }) => {
  function formatTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();
  }

  const sortedEvents = eventsFound
    .map((event) => ({
      ...event,
      date:
        event.start && event.start.dateTime
          ? new Date(event.start.dateTime)
          : new Date(),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 10);

  return (
    <ul className="list bg-base-100 rounded-box shadow-md">
      <li className="p-4 pb-2 text-xs opacity-60 tracking-wide">
        Upcoming Events
      </li>
      {sortedEvents.length > 0 ? (
        sortedEvents.map((event) => (
          <li
            key={event.id}
            className="list-row p-4 flex items-center justify-between"
          >
            <div className="flex items-center w-full">
              {/* Event Title on the Left */}
              <div className="w-1/3 pr-4 truncate">
                <h3 className="font-bold text-lg">
                  {event.summary || "Untitled Event"}
                </h3>
              </div>

              {/* Details on the Right */}
              <div className="flex-grow flex flex-col">
                <div className="text-xs uppercase font-semibold opacity-60">
                  {event.location || "No location specified"}
                </div>
                <div className="text-xs opacity-60">
                  {event.date.toDateString()},{" "}
                  {formatTime(event.start.dateTime)}-
                  {formatTime(event.end.dateTime)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 ml-4">
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
            </div>
          </li>
        ))
      ) : (
        <li className="p-4 text-center text-gray-500">No upcoming events</li>
      )}
    </ul>
  );
};

export default EventsList;
