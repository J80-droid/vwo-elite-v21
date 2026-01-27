/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { NavLink } from "react-router-dom";

import { getNavLabel, NavItem } from "./NavigationData";

interface NavigationItemProps {
  item: NavItem;
  collapsed?: boolean;
  t?: any;
}

export const NavigationItem: React.FC<NavigationItemProps> = ({
  item,
  collapsed = false,
  t,
}) => {
  const Icon = item.icon;
  const label = getNavLabel(item, t);

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `w-full flex items-center ${collapsed ? "px-0 justify-center" : "px-3 justify-start"} py-2 rounded-lg transition-all duration-300 ${
          isActive
            ? "btn-glass-primary shadow-[0_0_15px_-5px_rgba(99,102,241,0.5)] border-indigo-500/50"
            : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
        }`
      }
      aria-label={label}
      title={label}
    >
      <Icon size={18} className={`${item.iconColor} shrink-0`} />
      {!collapsed && (
        <span className="text-sm ml-3 text-left overflow-hidden whitespace-nowrap">
          {label}
        </span>
      )}
    </NavLink>
  );
};

// Mobile variant with different styling
interface MobileNavigationItemProps {
  item: NavItem;
  onClick: () => void;
  t?: any;
}

export const MobileNavigationItem: React.FC<MobileNavigationItemProps> = ({
  item,
  onClick,
  t,
}) => {
  const Icon = item.icon;
  const label = getNavLabel(item, t);

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `block w-full text-left py-2 px-3 rounded-lg transition-colors flex items-center gap-2 ${
          isActive
            ? "bg-electric/20 text-electric"
            : "text-slate-400 hover:text-white"
        }`
      }
      onClick={onClick}
    >
      <Icon size={18} className={item.iconColor} />
      {label}
    </NavLink>
  );
};
