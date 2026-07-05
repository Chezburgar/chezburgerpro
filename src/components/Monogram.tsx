// The ChezburgerPRO vault seal — a stacked-burger glyph in metallic gold,
// wrapped in an engraved ring. Pure SVG so it inherits the active theme.
export function Monogram({ size = 64, ring = true }: { size?: number; ring?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cbp-metal" x1="20" y1="10" x2="80" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--a1)" />
          <stop offset="0.55" stopColor="var(--a2)" />
          <stop offset="1" stopColor="var(--a3)" />
        </linearGradient>
      </defs>
      {ring && (
        <>
          <circle cx="50" cy="50" r="47" stroke="url(#cbp-metal)" strokeWidth="1.6" />
          <circle cx="50" cy="50" r="41.5" stroke="var(--line)" strokeWidth="1" />
        </>
      )}
      <path d="M30 46c0-9 9-15 20-15s20 6 20 15v2H30v-2z" fill="url(#cbp-metal)" />
      <rect x="28" y="52" width="44" height="5" rx="2.5" fill="url(#cbp-metal)" opacity="0.85" />
      <rect x="31" y="60" width="38" height="4" rx="2" fill="url(#cbp-metal)" opacity="0.6" />
      <path d="M30 67h40v2c0 4-4 7-8 7H38c-4 0-8-3-8-7v-2z" fill="url(#cbp-metal)" />
    </svg>
  );
}
