/** Inline SVG mark - no external image or copyrighted asset. */
export function Logo() {
  return (
    <svg
      className="logo"
      viewBox="0 0 48 48"
      role="img"
      aria-label="StadiumPulse AI logo"
      focusable="false"
    >
      <defs>
        <linearGradient id="sp-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4f8cff" />
          <stop offset="1" stopColor="#22d3a6" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="none" stroke="url(#sp-grad)" strokeWidth="3" />
      <ellipse cx="24" cy="24" rx="13" ry="8" fill="none" stroke="url(#sp-grad)" strokeWidth="2" />
      <path
        d="M6 24 h8 l3 -8 5 16 4 -11 3 6 h10"
        fill="none"
        stroke="url(#sp-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
