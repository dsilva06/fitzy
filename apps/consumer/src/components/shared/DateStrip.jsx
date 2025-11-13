import React, { useRef, useEffect, useMemo } from "react";
import { format, addDays, isSameDay } from "date-fns";
import { getLocalToday } from "@/utils";

export default function DateStrip({ selectedDate, onDateSelect }) {
  const today = useMemo(() => getLocalToday(), []);
  const dates = useMemo(
    () => Array.from({ length: 9 }, (_, i) => addDays(today, i)),
    [today]
  );
  const selectedRef = useRef(null);

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [selectedDate]);

  return (
    <div className="flex space-x-4 overflow-x-auto px-4 pb-2 no-scrollbar">
      {dates.map((date, index) => {
        const isSelected = isSameDay(date, selectedDate);
        const isCurrent = isSameDay(date, today);
        
        return (
          <button
            key={index}
            ref={isSelected ? selectedRef : null}
            onClick={() => onDateSelect(date)}
            className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-24 rounded-2xl transition-all duration-300 ${
              isSelected
                ? "bg-brand-600 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-100 shadow-sm border border-gray-100"
            }`}
          >
            <span className={`text-xs font-semibold uppercase ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
              {isCurrent ? "Today" : format(date, "E")}
            </span>
            <span className="text-3xl font-bold mt-1">
              {format(date, "d")}
            </span>
          </button>
        );
      })}
       <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
