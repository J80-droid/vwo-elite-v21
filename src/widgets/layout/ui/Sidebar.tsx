/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";

import { getNavLabel, NAVIGATION_SECTIONS } from "./NavigationData";
import { NavigationItem } from "./NavigationItem";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  t?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, t }) => {
  return (
    <aside
      style={{
        position: "fixed",
        right: 0,
        top: "4rem",
        bottom: 0,
        zIndex: 40,
      }}
      className={`hidden md:flex force-desktop-visible bg-obsidian-950/95 backdrop-blur-lg border-l border-white/10 transition-all duration-300 flex-col ${
        isOpen ? "w-52" : "w-14"
      }`}
    >
      <div className="flex-1 overflow-y-auto py-4 px-2">
        {NAVIGATION_SECTIONS.map((section) => (
          <div key={section.id} className="mb-4">
            {isOpen && (
              <p className="text-xs text-slate-500 uppercase tracking-wider px-2 mb-2">
                {getNavLabel(section, t)}
              </p>
            )}
            {section.items.map((item) => (
              <NavigationItem
                key={item.id}
                item={item}
                collapsed={!isOpen}
                t={t}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Toggle Arrow at Bottom */}
      <button
        onClick={onToggle}
        className="p-4 border-t border-white/10 hover:bg-white/5 transition-colors flex items-center justify-center text-slate-400 hover:text-white"
        title={isOpen ? "Inklappen" : "Uitklappen"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {isOpen ? (
            <polyline points="9 18 15 12 9 6" />
          ) : (
            <polyline points="15 18 9 12 15 6" />
          )}
        </svg>
      </button>
    </aside>
  );
};
