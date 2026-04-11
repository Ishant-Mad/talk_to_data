import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";

function SunIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="10" cy="10" r="3.25" fill="currentColor" opacity="0.95" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 10 + Math.cos(rad) * 5.2;
        const y1 = 10 + Math.sin(rad) * 5.2;
        const x2 = 10 + Math.cos(rad) * 7.4;
        const y2 = 10 + Math.sin(rad) * 7.4;
        return (
          <line
            key={deg}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
            opacity="0.9"
          />
        );
      })}
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12.2 3.2a6.2 6.2 0 1 0 4.6 10.1A7.8 7.8 0 0 1 10 18 8 8 0 0 1 12.2 3.2Z"
        fill="currentColor"
        opacity="0.92"
      />
      <circle
        className="theme-toggle__star"
        cx="5.2"
        cy="5.3"
        r="0.65"
        fill="currentColor"
        opacity="0.85"
      />
      <circle
        className="theme-toggle__star theme-toggle__star--2"
        cx="7.1"
        cy="3.4"
        r="0.45"
        fill="currentColor"
        opacity="0.75"
      />
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isLight = theme === "light";

  if (!mounted) {
    return (
      <span
        className="theme-toggle theme-toggle--defer"
        aria-hidden="true"
      />
    );
  }

  return (
    <button
      type="button"
      className={`theme-toggle theme-toggle--${isLight ? "light" : "dark"}`}
      onClick={toggleTheme}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      title={isLight ? "Dark mode" : "Light mode"}
    >
      <span className="theme-toggle__inner">
        <span className="theme-toggle__layer theme-toggle__layer--sun theme-toggle__sun">
          <SunIcon />
        </span>
        <span className="theme-toggle__layer theme-toggle__layer--moon theme-toggle__moon">
          <MoonIcon />
        </span>
      </span>
    </button>
  );
}
