import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "solid" | "outline";
}

/**
 * Local Button component for UserSettings.
 * @param variant - 'solid' | 'outline' (default: 'solid')
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "solid",
  ...props
}) => {
  const baseStyles =
    "px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

  const variants = {
    solid:
      "bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]",
    outline: "border border-white/20 hover:bg-white/10 text-slate-200",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className || ""}`}
      {...props}
    >
      {children}
    </button>
  );
};
