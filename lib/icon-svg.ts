// Trophy-on-controller icon — PS5 color scheme with 3D gradients
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <!-- Background: PS5 deep navy -->
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1C2354"/>
      <stop offset="100%" stop-color="#080B18"/>
    </linearGradient>

    <!-- Trophy: bright gold top-left to dark shadow bottom-right -->
    <linearGradient id="gold" x1="0.1" y1="0" x2="0.95" y2="1">
      <stop offset="0%"   stop-color="#FFF4B0"/>
      <stop offset="30%"  stop-color="#F5C200"/>
      <stop offset="70%"  stop-color="#B87E00"/>
      <stop offset="100%" stop-color="#6B4800"/>
    </linearGradient>
    <!-- Handle same gold but re-angled -->
    <linearGradient id="goldH" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#FFE55A"/>
      <stop offset="50%"  stop-color="#F5C200"/>
      <stop offset="100%" stop-color="#9A6800"/>
    </linearGradient>

    <!-- Controller top surface: PS5 white → ice-blue -->
    <linearGradient id="ctrl" x1="0.25" y1="0" x2="0.75" y2="1">
      <stop offset="0%"   stop-color="#FFFFFF"/>
      <stop offset="55%"  stop-color="#D0D8FF"/>
      <stop offset="100%" stop-color="#7A8FC0"/>
    </linearGradient>
    <!-- Controller bottom face: darker for depth -->
    <linearGradient id="ctrlB" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#A8B4D8"/>
      <stop offset="100%" stop-color="#5566A0"/>
    </linearGradient>

    <filter id="sh">
      <feDropShadow dx="0" dy="1.5" stdDeviation="1.8"
                    flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Background rounded square -->
  <rect width="100" height="100" rx="20" fill="url(#bg)"/>

  <!-- ─── CONTROLLER ─── (behind trophy) -->
  <g filter="url(#sh)">
    <!-- Main controller silhouette (PS-style two-bump shape) -->
    <path d="
      M 14,72
      C 12,67 12,60 17,55
      C 21,51 27,51 31,54
      C 34,56 36,58 40,58
      C 44,58 47,56 50,56
      C 53,56 56,58 60,58
      C 64,58 66,56 69,54
      C 73,51 79,51 83,55
      C 88,60 88,67 86,72
      C 84,79 78,85 68,86
      C 60,87 55,83 50,83
      C 45,83 40,87 32,86
      C 22,85 16,79 14,72 Z
    " fill="url(#ctrl)"/>

    <!-- Bottom face overlay for 3D depth -->
    <path d="
      M 18,75
      C 17,71 18,67 20,64
      C 22,62 25,61 28,62
      C 32,63 34,65 38,66
      C 43,67 47,65 50,65
      C 53,65 57,67 62,66
      C 66,65 68,63 72,62
      C 75,61 78,62 80,64
      C 82,67 83,71 82,75
      C 80,81 74,84 66,85
      C 58,86 54,82 50,82
      C 46,82 42,86 34,85
      C 26,84 20,81 18,75 Z
    " fill="url(#ctrlB)"/>

    <!-- Center notch at top (dark dip where trophy stem sits) -->
    <path d="M 43,57 Q 50,61 57,57" fill="#0D1230"/>

    <!-- D-pad horizontal -->
    <rect x="19" y="66" width="13" height="4" rx="2" fill="#001166"/>
    <!-- D-pad vertical -->
    <rect x="23.5" y="61.5" width="4" height="13" rx="2" fill="#001166"/>

    <!-- Face buttons (4 circles) -->
    <circle cx="72"   cy="63"   r="2.4" fill="#001166"/>
    <circle cx="67.5" cy="67.5" r="2.4" fill="#001166"/>
    <circle cx="76.5" cy="67.5" r="2.4" fill="#001166"/>
    <circle cx="72"   cy="72"   r="2.4" fill="#001166"/>

    <!-- Touchpad (PS5) -->
    <rect x="44.5" y="61" width="11" height="7" rx="3.5" fill="#8899CC" opacity="0.85"/>

    <!-- PS blue trim accent at bottom -->
    <path d="M 30,82 Q 50,87 70,82"
          stroke="#1144EE" stroke-width="1.2" fill="none" opacity="0.65"/>

    <!-- Left-side highlight (light source top-left) -->
    <path d="M 18,62 Q 15,68 15,74"
          stroke="white" stroke-width="1.1" fill="none"
          opacity="0.3" stroke-linecap="round"/>
  </g>

  <!-- ─── TROPHY ─── (in front) -->
  <g filter="url(#sh)">
    <!-- Left handle (C-arc) -->
    <path d="M 32,16 C 24,15 17,21 17,28 C 17,35 24,40 32,40"
          stroke="url(#goldH)" stroke-width="4"
          fill="none" stroke-linecap="round"/>

    <!-- Right handle (mirror) -->
    <path d="M 68,16 C 76,15 83,21 83,28 C 83,35 76,40 68,40"
          stroke="url(#goldH)" stroke-width="4"
          fill="none" stroke-linecap="round"/>

    <!-- Cup body: wide rim → narrows to stem -->
    <path d="
      M 28,7
      L 72,7
      C 74,7 75,9 75,11
      L 69,40
      C 65,47 58,49 55,50
      L 55,53
      L 45,53
      L 45,50
      C 42,49 35,47 31,40
      L 25,11
      C 25,9 26,7 28,7 Z
    " fill="url(#gold)"/>

    <!-- Rim bright highlight -->
    <line x1="30" y1="8" x2="70" y2="8"
          stroke="#FFFBE8" stroke-width="2.5"
          stroke-linecap="round" opacity="0.8"/>

    <!-- Vertical shine on cup left face -->
    <line x1="34" y1="14" x2="37" y2="41"
          stroke="#FFF4AA" stroke-width="2"
          stroke-linecap="round" opacity="0.38"/>

    <!-- Stem -->
    <rect x="43" y="53" width="14" height="5" rx="2.5" fill="url(#gold)"/>
  </g>
</svg>`;

export function iconDataUri(): string {
  const encoded = Buffer.from(SVG).toString("base64");
  return `data:image/svg+xml;base64,${encoded}`;
}
