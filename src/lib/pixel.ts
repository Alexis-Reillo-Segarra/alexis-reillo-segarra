export type Palette = Record<string, string>;

/** Converts a character map into SVG paths, one per colour, each made of its one-pixel-high runs. */
export function pixelPaths(map: string[], palette: Palette) {
  const height = map.length;
  const width = Math.max(...map.map((row) => row.length));
  const runs: Record<string, string> = {};
  map.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const char = row[x];
      let run = 1;
      while (row[x + run] === char) run++;
      if (palette[char]) runs[char] = `${runs[char] ?? ''}M${x} ${y}h${run}v1h-${run}z`;
      x += run;
    }
  });
  const paths = Object.entries(runs)
    .map(([char, d]) => `<path fill="${palette[char]}" d="${d}"/>`)
    .join('');
  return { width, height, paths };
}

export function pixelSvg(map: string[], palette: Palette, scale = 1) {
  const { width, height, paths } = pixelPaths(map, palette);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width * scale}" height="${height * scale}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">${paths}</svg>`;
}

const CURSOR_SCALE = 2;

export function cssCursor(map: string[], palette: Palette, fallback: string, hotspot = { x: 0, y: 0 }) {
  const svg = encodeURIComponent(pixelSvg(map, palette, CURSOR_SCALE));
  return `url("data:image/svg+xml,${svg}") ${Math.round(hotspot.x * CURSOR_SCALE)} ${Math.round(hotspot.y * CURSOR_SCALE)}, ${fallback}`;
}
