/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";

import { NAVIGATION_SECTIONS } from "./NavigationData";
import { MobileNavigationItem } from "./NavigationItem";

interface MobileMenuProps {
  onClose: () => void;
  t?: any;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ onClose, t }) => {
  return (
    <div className="md:hidden force-desktop-hidden glass border-b border-white/5 px-6 py-4 space-y-3 shadow-2xl">
      {NAVIGATION_SECTIONS.map((section) => (
        <div key={section.id} className="space-y-1">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest px-2 pt-2 mb-1">
            {section.label}
          </div>
          {section.items.map((item) => (
            <MobileNavigationItem
              key={item.id}
              item={item}
              onClick={onClose}
              t={t}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
