import {
  ArcElement,
  Chart as ChartJS,
  ChartOptions,
  Legend,
  Tooltip,
} from "chart.js";
import React from "react";
import { Doughnut } from "react-chartjs-2";

// Register ChartJS components required for this chart
ChartJS.register(ArcElement, Tooltip, Legend);

export interface GaugeChartProps {
  value: number;
  label: string;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({ value, label }) => {
  const getColor = (v: number) => {
    if (v < 40) return "#ef4444";
    if (v < 60) return "#f97316";
    if (v < 80) return "#eab308";
    return "#22c55e";
  };

  const color = getColor(value);
  const data = {
    datasets: [
      {
        data: [value, 100 - value],
        backgroundColor: [color, "rgba(255, 255, 255, 0.05)"],
        borderWidth: 0,
        circumference: 180,
        rotation: 270,
        weight: 0.5,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { tooltip: { enabled: false } },
    cutout: "85%",
  };

  return (
    <div className="ud-gauge-item neon-gauge">
      <div className="ud-gauge-chart-wrapper">
        <Doughnut data={data} options={options} />
        <div
          className="ud-gauge-needle"
          style={{
            transform: `rotate(${(value / 100) * 180 - 90}deg)`,
            background: color,
            boxShadow: `0 0 10px ${color}`,
          }}
        />
      </div>
      <p className="ud-gauge-label">
        {label}{" "}
        <span style={{ color, marginLeft: "3px", fontWeight: "bold" }}>
          {(value / 10).toFixed(1)}
        </span>
      </p>
    </div>
  );
};
