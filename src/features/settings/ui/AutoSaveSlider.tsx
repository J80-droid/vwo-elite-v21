import React, { useEffect, useState } from "react";

interface AutoSaveSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: string | number;
  max?: string | number;
  className?: string;
}

export const AutoSaveSlider: React.FC<AutoSaveSliderProps> = ({
  value,
  onChange,
  min,
  max,
  className,
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleCommit = () => {
    if (localValue != value) {
      onChange(localValue);
    }
  };

  return (
    <input
      type="range"
      min={min}
      max={max}
      value={localValue}
      onChange={(e) => setLocalValue(parseInt(e.target.value))}
      onMouseUp={handleCommit}
      onTouchEnd={handleCommit}
      className={className}
    />
  );
};
