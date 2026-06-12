// World Cup-inspired minimal trophy icon
// Layout (100x100 viewBox):
//   Globe:  cx=50, cy=22, r=14  (y 8–36)
//   Arms:   widen from globe base to y≈54, taper back to stem at y=66
//   Stem:   x 44–56, y 66–71
//   Base 1: x 38–62, y 71–76
//   Base 2: x 32–68, y 76–85
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#0f172a"/>

  <!-- Left figure arm: starts at globe bottom-left, sweeps outward then tucks back into stem -->
  <path d="M38,34 C32,36 24,44 24,54 C24,62 30,67 40,67 L44,67 L44,60 C36,60 32,56 32,52 C32,47 37,43 42,41 L44,38 Z" fill="#fbbf24"/>

  <!-- Right figure arm (mirror) -->
  <path d="M62,34 C68,36 76,44 76,54 C76,62 70,67 60,67 L56,67 L56,60 C64,60 68,56 68,52 C68,47 63,43 58,41 L56,38 Z" fill="#fbbf24"/>

  <!-- Central column connecting globe to stem -->
  <rect x="44" y="34" width="12" height="33" rx="1" fill="#fbbf24"/>

  <!-- Globe -->
  <circle cx="50" cy="22" r="14" fill="#fbbf24"/>

  <!-- Globe latitude line -->
  <ellipse cx="50" cy="22" rx="14" ry="6" fill="none" stroke="#92400e" stroke-width="1.4" opacity="0.45"/>
  <!-- Globe meridian line -->
  <line x1="50" y1="8" x2="50" y2="36" stroke="#92400e" stroke-width="1.4" opacity="0.45"/>
  <!-- Globe equator -->
  <line x1="36" y1="22" x2="64" y2="22" stroke="#92400e" stroke-width="1.4" opacity="0.45"/>

  <!-- Stem -->
  <rect x="44" y="67" width="12" height="5" rx="2" fill="#fbbf24"/>

  <!-- Base tier 1 -->
  <rect x="37" y="72" width="26" height="5" rx="2" fill="#fbbf24"/>

  <!-- Base tier 2 (wider, accent shade for depth) -->
  <rect x="31" y="77" width="38" height="8" rx="3" fill="#d97706"/>
</svg>`;

export function iconDataUri(): string {
  const encoded = Buffer.from(SVG).toString("base64");
  return `data:image/svg+xml;base64,${encoded}`;
}
