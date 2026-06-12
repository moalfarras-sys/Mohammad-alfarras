import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

// Extracts the glossy orange M/play mark from the launcher art and removes
// black, white, and border pixels so the UI never shows a boxed logo.

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(appRoot, "src", "renderer", "assets", "moplayer-app-icon.png");
const targetPath = path.join(appRoot, "src", "renderer", "assets", "moplayer-mark.png");

const png = PNG.sync.read(await readFile(sourcePath));

function colorStatsAt(x, y) {
  const off = (y * png.width + x) * 4;
  const r = png.data[off];
  const g = png.data[off + 1];
  const b = png.data[off + 2];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return { r, g, b, max, saturation: max - min };
}

function isLogoPixel({ r, g, b, max, saturation }) {
  const warmMark = r > 90 && g > 28 && r > b * 1.55 && saturation > 34;
  const greenLight = g > 105 && r < 150 && b < 125 && saturation > 42;
  return max > 42 && (warmMark || greenLight);
}

const yLimit = Math.floor(png.height * 0.62);
let minX = png.width;
let maxX = 0;
let minY = png.height;
let maxY = 0;

for (let y = 0; y < yLimit; y += 1) {
  for (let x = 0; x < png.width; x += 1) {
    if (isLogoPixel(colorStatsAt(x, y))) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

if (minX > maxX || minY > maxY) {
  throw new Error("Could not detect the MoPlayer logo mark in the source PNG.");
}

const pad = 8;
minX = Math.max(0, minX - pad);
minY = Math.max(0, minY - pad);
maxX = Math.min(png.width - 1, maxX + pad);
maxY = Math.min(yLimit - 1, maxY + pad);

const width = maxX - minX + 1;
const height = maxY - minY + 1;
const out = new PNG({ width, height });

for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const src = ((y + minY) * png.width + (x + minX)) * 4;
    const dst = (y * width + x) * 4;
    const r = png.data[src];
    const g = png.data[src + 1];
    const b = png.data[src + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = (max - min) / 255;
    const brightness = max / 255;
    const warm = r > b * 1.25 && r > 55;
    const green = g > r * 1.2 && g > b * 1.2;
    const alpha = Math.max(0, Math.min(1, (warm || green ? 1 : 0) * (saturation * 2.15 + brightness * 0.72 - 0.32)));

    out.data[dst] = r;
    out.data[dst + 1] = g;
    out.data[dst + 2] = b;
    out.data[dst + 3] = Math.round(alpha * 255);
  }
}

function removeLongIsolatedLines(image) {
  const seen = new Uint8Array(image.width * image.height);
  const queue = [];

  for (let sy = 0; sy < image.height; sy += 1) {
    for (let sx = 0; sx < image.width; sx += 1) {
      const start = sy * image.width + sx;
      if (seen[start] || image.data[start * 4 + 3] === 0) continue;

      let minCx = sx;
      let maxCx = sx;
      let minCy = sy;
      let maxCy = sy;
      const pixels = [];

      seen[start] = 1;
      queue.push(start);

      while (queue.length) {
        const idx = queue.pop();
        const x = idx % image.width;
        const y = Math.floor(idx / image.width);
        pixels.push(idx);
        if (x < minCx) minCx = x;
        if (x > maxCx) maxCx = x;
        if (y < minCy) minCy = y;
        if (y > maxCy) maxCy = y;

        for (let oy = -1; oy <= 1; oy += 1) {
          for (let ox = -1; ox <= 1; ox += 1) {
            if (ox === 0 && oy === 0) continue;
            const nx = x + ox;
            const ny = y + oy;
            if (nx < 0 || nx >= image.width || ny < 0 || ny >= image.height) continue;
            const next = ny * image.width + nx;
            if (!seen[next] && image.data[next * 4 + 3] > 0) {
              seen[next] = 1;
              queue.push(next);
            }
          }
        }
      }

      const componentWidth = maxCx - minCx + 1;
      const componentHeight = maxCy - minCy + 1;
      const isolatedHairline = componentHeight <= 2 && componentWidth > image.width * 0.28;

      if (isolatedHairline) {
        for (const idx of pixels) {
          image.data[idx * 4 + 3] = 0;
        }
      }
    }
  }
}

function removeSparseTopRows(image) {
  for (let y = 0; y < Math.floor(image.height * 0.24); y += 1) {
    let count = 0;
    let rowMinX = image.width;
    let rowMaxX = 0;

    for (let x = 0; x < image.width; x += 1) {
      if (image.data[(y * image.width + x) * 4 + 3] > 0) {
        count += 1;
        if (x < rowMinX) rowMinX = x;
        if (x > rowMaxX) rowMaxX = x;
      }
    }

    if (!count) continue;

    const span = rowMaxX - rowMinX + 1;
    const sparseHairline = y < image.height * 0.2 && span > image.width * 0.42;

    if (sparseHairline) {
      for (let x = rowMinX; x <= rowMaxX; x += 1) {
        image.data[(y * image.width + x) * 4 + 3] = 0;
      }
    }
  }
}

removeSparseTopRows(out);
removeLongIsolatedLines(out);
removeSparseTopRows(out);

await writeFile(targetPath, PNG.sync.write(out));
console.log(`mark written: ${targetPath} (${width}x${height})`);
