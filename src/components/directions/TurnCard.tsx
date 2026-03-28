"use client";

import { TurnType } from "@/lib/types";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RotateCcw,
  MapPin,
  ArrowUpDown,
  Footprints,
} from "lucide-react";

interface TurnCardProps {
  type: TurnType;
  distance: string;
  streetName: string;
  isAlert?: boolean;
}

const ICON_MAP: Record<TurnType, React.ElementType> = {
  left: ArrowLeft,
  right: ArrowRight,
  straight: ArrowUp,
  uturn: RotateCcw,
  arrive: MapPin,
  elevator: ArrowUpDown,
  stairs: Footprints,
};

export default function TurnCard({
  type,
  distance,
  streetName,
  isAlert = false,
}: TurnCardProps) {
  const Icon = ICON_MAP[type];
  const cardClass = isAlert ? "turn-card turn-card--alert" : "turn-card";

  return (
    <div className={cardClass} role="alert" aria-live="assertive">
      <Icon size={72} className={isAlert ? "text-danger" : "text-primary-600"} aria-hidden="true" />
      <div>
        <div className="turn-card__distance">{distance}</div>
        <div className="turn-card__street">{streetName}</div>
      </div>
    </div>
  );
}
