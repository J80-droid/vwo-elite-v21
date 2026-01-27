import { normalizeSubjectName } from "@shared/api/somtodayService";
import { ManualGrade } from "@shared/api/sqliteService";
import {
  Chart as ChartJS,
  ChartOptions,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from "chart.js";
import React from "react";
import { Radar } from "react-chartjs-2";

// Register ChartJS components required for this chart
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

export interface SubjectRadarProps {
  subjects: readonly string[];
  labels: string[];
  grades: number[];
  goalAverage?: number;
  rawGrades: ManualGrade[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}

export const SubjectRadar: React.FC<SubjectRadarProps> = ({
  subjects,
  labels,
  grades,
  goalAverage = 0,
  rawGrades,
  t,
}) => {
  const radarLabels = labels.map((label, idx) => {
    const grade = grades[idx];
    return grade !== undefined && grade > 0
      ? `${label} ${grade.toFixed(1)}`
      : label;
  });

  const radarData = {
    labels: radarLabels,
    datasets: [
      {
        label: t.dashboard.mastery,
        data: grades,
        backgroundColor: "rgba(6, 182, 212, 0.1)",
        borderColor: "#06b6d4",
        borderWidth: 2,
        pointBackgroundColor: "#06b6d4",
        pointBorderColor: "#fff",
        pointRadius: 2,
        fill: true,
        tension: 0.1,
      },
      {
        label: t.dashboard.goal,
        data: subjects.map(() => goalAverage),
        backgroundColor: "transparent",
        borderColor: "rgba(234, 179, 8, 0.4)",
        borderWidth: 1.5,
        borderDash: [5, 5],
        pointRadius: 0,
      },
      {
        label: "Onvoldoende",
        data: subjects.map(() => 5.5),
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderColor: "transparent",
        borderWidth: 0,
        pointRadius: 0,
        fill: true,
      },
    ],
  };

  const radarOptions: ChartOptions<"radar"> = {
    scales: {
      r: {
        angleLines: { color: "rgba(255, 255, 255, 0.05)" },
        pointLabels: {
          color: "#94a3b8",
          font: { size: 10, weight: "bold" },
          padding: 4,
        },
        ticks: { display: false },
        suggestedMin: 0,
        suggestedMax: 10,
        grid: {
          color: "rgba(255, 255, 255, 0.05)",
          lineWidth: 1,
        },
      },
    },
    layout: {
      padding: {
        top: -25,
        bottom: -25,
        left: -25,
        right: -25,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
        external: (context) => {
          let tooltipEl = document.getElementById("chartjs-radar-tooltip");

          if (!tooltipEl) {
            tooltipEl = document.createElement("div");
            tooltipEl.id = "chartjs-radar-tooltip";
            tooltipEl.style.background = "rgba(5, 5, 10, 0.95)";
            tooltipEl.style.backdropFilter = "blur(10px)";
            tooltipEl.style.borderRadius = "12px";
            tooltipEl.style.border = "1px solid rgba(56, 189, 248, 0.2)";
            tooltipEl.style.padding = "12px";
            tooltipEl.style.fontFamily = "'Outfit', sans-serif";
            tooltipEl.style.boxShadow = "0 10px 25px -5px rgba(0, 0, 0, 0.5)";
            tooltipEl.style.pointerEvents = "none";
            tooltipEl.style.position = "absolute";
            tooltipEl.style.transition = "opacity 0.1s ease";
            tooltipEl.style.zIndex = "100";
            tooltipEl.style.minWidth = "200px";
            document.body.appendChild(tooltipEl);
          }

          const tooltipModel = context.tooltip;
          if (tooltipModel.opacity === 0) {
            tooltipEl.style.opacity = "0";
            return;
          }

          if (
            tooltipModel.body &&
            tooltipModel.dataPoints &&
            tooltipModel.dataPoints[0]
          ) {
            const subjectIndex = tooltipModel.dataPoints[0].dataIndex;
            const subjectName = subjects[subjectIndex] || "";
            const datasets = context.chart.data.datasets;
            const averageGrade =
              datasets && datasets[0] && datasets[0].data
                ? (datasets[0].data[subjectIndex] as number | undefined)
                : undefined;

            // Use rawGrades passed from parent
            const relevantGrades = rawGrades
              .filter((g: ManualGrade) => {
                if (!g.subject || !subjectName) return false;
                const vak = normalizeSubjectName(g.subject);
                const target = normalizeSubjectName(subjectName);
                return vak === target || vak.includes(target);
              })
              .sort(
                (a: ManualGrade, b: ManualGrade) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime(),
              )
              .slice(0, 5);

            let innerHtml = `
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
                                <span style="color: #fff; font-weight: 700; font-size: 14px;">${labels[subjectIndex]}</span>
                                <div style="display: flex; align-items: center; gap: 4px; color: #06b6d4; font-size: 13px; font-weight: 600;">
                                    <span>Ø</span>
                                    <span>${typeof averageGrade === "number" && averageGrade ? averageGrade.toFixed(1) : "-"}</span>
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                        `;

            if (relevantGrades.length === 0) {
              innerHtml += `<span style="font-size: 12px; color: #94a3b8; font-style: italic;">Geen recente cijfers</span>`;
            } else {
              relevantGrades.forEach((g: ManualGrade) => {
                const date = new Date(g.date).toLocaleDateString("nl-NL", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });
                const grade = Number(g.grade).toFixed(1);
                const weight = g.weight;

                let gradeColor = "#22c55e";
                if (parseFloat(grade) < 5.5) gradeColor = "#ef4444";
                else if (parseFloat(grade) < 7.0) gradeColor = "#f59e0b";

                innerHtml += `
                                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
                                        <span style="color: #cbd5e1;">${date} (${weight}x)</span>
                                        <span style="color: ${gradeColor}; font-weight: 600;">${grade}</span>
                                    </div>
                                `;
              });
            }
            innerHtml += `</div>`;

            tooltipEl.innerHTML = innerHtml;
          }

          const position = context.chart.canvas.getBoundingClientRect();
          tooltipEl.style.opacity = "1";
          tooltipEl.style.left =
            position.left + window.scrollX + tooltipModel.caretX + "px";
          tooltipEl.style.top =
            position.top + window.scrollY + tooltipModel.caretY + "px";
        },
      },
    },
    maintainAspectRatio: false,
  };

  return <Radar data={radarData} options={radarOptions} />;
};
