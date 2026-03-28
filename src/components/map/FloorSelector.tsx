"use client";

interface FloorSelectorProps {
  floors: number[];
  activeFloor: number;
  onFloorChange: (floor: number) => void;
}

export default function FloorSelector({
  floors,
  activeFloor,
  onFloorChange,
}: FloorSelectorProps) {
  return (
    <div className="floor-selector" role="tablist" aria-label="Floor selection">
      {floors.map((floor) => (
        <button
          key={floor}
          role="tab"
          aria-selected={floor === activeFloor}
          className={`floor-tab ${floor === activeFloor ? "floor-tab--active" : ""}`}
          onClick={() => onFloorChange(floor)}
        >
          F{floor}
        </button>
      ))}
    </div>
  );
}
