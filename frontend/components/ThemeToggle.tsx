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
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
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
      <button
        type="button"
        className="theme-switch theme-switch--defer"
        aria-hidden="true"
        disabled
      />
    );
  }

  return (
    <button
      type="button"
      className={`theme-switch ${isLight ? "" : "theme-switch--dark"}`}
      onClick={toggleTheme}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      title={isLight ? "Dark mode" : "Light mode"}
    >
      <span className="theme-switch__track">
        <span className="theme-switch__thumb">
          {isLight ? <SunIcon /> : <MoonIcon />}
        </span>
        <span className="theme-switch__icon theme-switch__icon--sun">
          <SunIcon />
        </span>
        <span className="theme-switch__icon theme-switch__icon--moon">
          <MoonIcon />
        </span>
      </span>
    </button>
  );
}
