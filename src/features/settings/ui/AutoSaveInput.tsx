/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";

interface AutoSaveInputProps {
  value: string | number;
  onSave: (value: any) => void;
  type?: string;
  className?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  placeholder?: string;
}

export const AutoSaveInput: React.FC<AutoSaveInputProps> = ({
  value,
  onSave,
  type = "text",
  className,
  min,
  max,
  step,
  placeholder,
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    if (localValue != value) {
      onSave(localValue);
    }
  };

  return (
    <input
      type={type}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      className={className}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
    />
  );
};
