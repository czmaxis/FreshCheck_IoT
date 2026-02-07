import React from "react";
import TimeRangeSelector from "./TimeRangeSelector.jsx";

export default function AlertFilters({
  dateRange,
  onDateRangeChange,
  onQuickRange,
}) {
  return (
    <TimeRangeSelector
      dateRange={dateRange}
      onDateRangeChange={onDateRangeChange}
      onQuickRange={onQuickRange}
      label="Zobrazit"
    />
  );
}
