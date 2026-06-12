// Trophy-on-controller icon — PS5 colour scheme, 3D gradients
// Controller is oriented face-up (grips hang down), trophy sits on flat top surface.
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <!-- Background: PS5 deep navy -->
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#1C2354"/>
      <stop offset="100%" stop-color="#080B18"/>
    </linearGradient>

    <!-- Trophy: bright gold (top-left highlight) → dark shadow (bottom-right) -->
    <linearGradient id="gold" x1="0.1" y1="0" x2="0.95" y2="1">
      <stop offset="0%"   stop-color="#FFF4B0"/>
      <stop offset="30%"  stop-color="#F5C200"/>
      <stop offset="70%"  stop-color="#B87E00"/>
      <stop offset="100%" stop-color="#6B4800"/>
    </linearGradient>
    <linearGradient id="goldH" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#FFE55A"/>
      <stop offset="50%"  stop-color="#F5C200"/>
      <stop offset="100%" stop-color="#9A6800"/>
    </linearGradient>

    <!-- Controller face: PS5 white → ice-blue (lit from top) -->
    <linearGradient id="ctrl" x1="0.25" y1="0" x2="0.75" y2="1">
      <stop offset="0%"   stop-color="#FFFFFF"/>
      <stop offset="55%"  stop-color="#D0D8FF"/>
      <stop offset="100%" stop-color="#7A8FC0"/>
    </linearGradient>
    <!-- Grip underside: darker for depth -->
    <linearGradient id="ctrlB" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#9AAAD0"/>
      <stop offset="100%" stop-color="#4A5A90"/>
    </linearGradient>

    <filter id="sh">
      <feDropShadow dx="0" dy="1.5" stdDeviation="1.8"
                    flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="100" height="100" rx="20" fill="url(#bg)"/>

  <!-- ─── CONTROLLER (face-up, grips hang down) ─── -->
  <g filter="url(#sh)">
    <!-- Main silhouette: flat top, two grips hanging at bottom -->
    <path d="
      M 10,53
      L 42,53 Q 50,58 58,53
      L 90,53
      C 93,53 93,56 93,60
      L 93,72
      C 93,80 88,87 80,90
      C 74,92 67,92 63,89
      C 58,86 54,84 50,84
      C 46,84 42,86 37,89
      C 33,92 26,92 20,90
      C 12,87 7,80 7,72
      L 7,60
      C 7,56 7,53 10,53 Z
    " fill="url(#ctrl)"/>

    <!-- Grip undersides: darker gradient overlay on lower bump area -->
    <path d="
      M 7,76
      C 7,83 12,88 20,91
      C 26,93 33,93 37,90
      C 42,87 46,85 50,85
      C 54,85 58,87 63,90
      C 67,93 74,93 80,91
      C 88,88 93,83 93,76
      L 93,80
      C 93,87 88,91 80,93
      C 74,95 67,95 63,92
      C 58,89 54,87 50,87
      C 46,87 42,89 37,92
      C 33,95 26,95 20,93
      C 12,91 7,87 7,80 Z
    " fill="url(#ctrlB)"/>

    <!-- Notch at top-centre where trophy stem sits (dark recess) -->
    <path d="M 42,53 Q 50,58 58,53 L 58,55 Q 50,60 42,55 Z" fill="#0C1128"/>

    <!-- D-pad — left side (horizontal bar) -->
    <rect x="17" y="65" width="14" height="4.5" rx="2.2" fill="#001166"/>
    <!-- D-pad — vertical bar -->
    <rect x="21.8" y="60.5" width="4.5" height="14" rx="2.2" fill="#001166"/>

    <!-- Face buttons — right side (4 circles) -->
    <circle cx="75"   cy="62"   r="2.5" fill="#001166"/>
    <circle cx="70.5" cy="66.5" r="2.5" fill="#001166"/>
    <circle cx="79.5" cy="66.5" r="2.5" fill="#001166"/>
    <circle cx="75"   cy="71"   r="2.5" fill="#001166"/>

    <!-- Touchpad (PS5) — centre -->
    <rect x="44" y="61.5" width="12" height="7.5" rx="3.5" fill="#8899CC" opacity="0.85"/>

    <!-- PS blue trim just below the top edge -->
    <path d="M 18,55 Q 50,53.5 82,55"
          stroke="#1144EE" stroke-width="1.2" fill="none" opacity="0.55"/>

    <!-- Left-edge highlight (light source top-left) -->
    <path d="M 8,62 Q 7,69 8,75"
          stroke="white" stroke-width="1.1" fill="none"
          opacity="0.28" stroke-linecap="round"/>
  </g>

  <!-- ─── TROPHY (sits on flat top of controller) ─── -->
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
      M 28,7 L 72,7
      C 74,7 75,9 75,11
      L 69,40
      C 65,47 58,49 55,50
      L 55,53 L 45,53 L 45,50
      C 42,49 35,47 31,40
      L 25,11
      C 25,9 26,7 28,7 Z
    " fill="url(#gold)"/>

    <!-- Rim bright highlight -->
    <line x1="30" y1="8"  x2="70" y2="8"
          stroke="#FFFBE8" stroke-width="2.5"
          stroke-linecap="round" opacity="0.8"/>

    <!-- Vertical shine on left cup face -->
    <line x1="34" y1="14" x2="37" y2="41"
          stroke="#FFF4AA" stroke-width="2"
          stroke-linecap="round" opacity="0.38"/>

    <!-- Stem (drops into controller notch) -->
    <rect x="43" y="53" width="14" height="6" rx="2.5" fill="url(#gold)"/>
  </g>
</svg>`;

export function iconDataUri(): string {
  const encoded = Buffer.from(SVG).toString("base64");
  return `data:image/svg+xml;base64,${encoded}`;
}
