/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useMemo, useRef } from "react";
// Lazy load ForceGraph3D
const ForceGraph3D = React.lazy(() => import("react-force-graph-3d"));
import { useSkillsStore } from "@shared/model/skillsStore";

interface SkillTreeGraphProps {
  subjectName: string;
}

export const SkillTreeGraph: React.FC<SkillTreeGraphProps> = ({
  subjectName,
}) => {
  const { getSkills } = useSkillsStore();
  const skills = getSkills(subjectName);
  const graphRef = useRef<any>(null);

  const graphData = useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];

    // 1. Create Category Hubs
    const categories = Array.from(new Set(skills.map((s) => s.category)));
    categories.forEach((cat) => {
      nodes.push({
        id: `cat-${cat}`,
        name: cat,
        group: "category",
        val: 20, // Larger size for hubs
        color: "#64748b", // Slate-500
      });
    });

    // 2. Create Skill Nodes
    skills.forEach((skill) => {
      const masteryColor =
        skill.mastery >= 80
          ? "#34d399" // Emerald-400
          : skill.mastery >= 60
            ? "#60a5fa" // Blue-400
            : skill.mastery >= 40
              ? "#fbbf24" // Amber-400
              : "#fb7185"; // Rose-400

      nodes.push({
        id: skill.id,
        name: skill.name,
        group: "skill",
        val: 10 + skill.mastery / 10, // Size based on mastery
        color: masteryColor,
        mastery: skill.mastery,
      });

      // Link to Category
      links.push({
        source: `cat-${skill.category}`,
        target: skill.id,
        distance: 50,
      });

      // Link to Prerequisites
      if (skill.prerequisites) {
        skill.prerequisites.forEach((preId) => {
          // Only link if prereq exists in this subject
          if (skills.find((s) => s.id === preId)) {
            links.push({
              source: preId,
              target: skill.id,
              distance: 30,
              color: "#ffffff30",
            });
          }
        });
      }
    });

    return { nodes, links };
  }, [skills]);

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden border border-white/10 bg-black/40 relative">
      {skills.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-slate-500">
          Geen vaardigheden gevonden voor visualisatie.
        </div>
      ) : (
        <React.Suspense
          fallback={
            <div className="flex items-center justify-center h-full text-slate-500">
              Laden van grafiek...
            </div>
          }
        >
          <ForceGraph3D
            ref={graphRef}
            graphData={graphData}
            nodeLabel="name"
            nodeColor="color"
            nodeVal="val"
            backgroundColor="rgba(0,0,0,0)"
            linkOpacity={0.2}
            linkWidth={1}
            nodeResolution={16}
            showNavInfo={false}
            onNodeClick={(node) => {
              // Aim at node from outside it
              const distance = 40;
              const distRatio =
                1 +
                distance / Math.hypot(node.x || 0, node.y || 0, node.z || 0);

              if (graphRef.current) {
                graphRef.current.cameraPosition(
                  {
                    x: (node.x || 0) * distRatio,
                    y: (node.y || 0) * distRatio,
                    z: (node.z || 0) * distRatio,
                  }, // new position
                  node, // lookAt ({ x, y, z })
                  3000, // ms transition duration
                );
              }
            }}
          />
        </React.Suspense>
      )}
      <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur px-3 py-2 rounded-lg border border-white/10 text-[10px] text-slate-400 font-mono">
        Left Click: Rotate • Right Click: Pan • Scroll: Zoom • Click Node: Focus
      </div>
    </div>
  );
};
