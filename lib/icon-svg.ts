const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#0f172a"/>
  <circle cx="50" cy="50" r="40" fill="#15803d"/>
  <circle cx="50" cy="50" r="34" fill="#f8fafc"/>
  <polygon points="50,19 60,27 56,40 44,40 40,27" fill="#0f172a"/>
  <polygon points="70,36 60,27 70,21 79,30 74,43" fill="#0f172a"/>
  <polygon points="30,36 40,27 30,21 21,30 26,43" fill="#0f172a"/>
  <polygon points="64,62 56,40 70,36 77,48 70,62" fill="#0f172a"/>
  <polygon points="36,62 44,40 30,36 23,48 30,62" fill="#0f172a"/>
</svg>`;

export function iconDataUri(): string {
  const encoded = Buffer.from(SVG).toString("base64");
  return `data:image/svg+xml;base64,${encoded}`;
}
