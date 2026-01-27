import "./LoadingSpinner.css";

import React from "react";

interface LoadingSpinnerProps {
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = "Onderdeel laden...",
}) => {
  return (
    <div className="spinner-container">
      <div className="spinner"></div>
      <p className="spinner-text">{text}</p>
    </div>
  );
};

export default LoadingSpinner;
