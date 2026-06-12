import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pngToIco from "png-to-ico";
import { PNG } from "pngjs";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildDir = path.join(appRoot, "build");
const sourcePng = path.join(appRoot, "src", "renderer", "assets", "moplayer-mark.png");
const pngTarget = path.join(buildDir, "icon.png");
const icoTarget = path.join(buildDir, "icon.ico");

function sampleBilinear(png, u, v) {
  const x = Math.min(png.width - 1.001, Math.max(0, u * (png.width - 1)));
  const y = Math.min(png.height - 1.001, Math.max(0, v * (png.height - 1)));
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(png.width - 1, x0 + 1);
  const y1 = Math.min(png.height - 1, y0 + 1);
  const fx = x - x0;
  const fy = y - y0;
  const value = (px, py, channel) => png.data[(py * png.width + px) * 4 + channel];
  const sample = (channel) =>
    value(x0, y0, channel) * (1 - fx) * (1 - fy) +
    value(x1, y0, channel) * fx * (1 - fy) +
    value(x0, y1, channel) * (1 - fx) * fy +
    value(x1, y1, channel) * fx * fy;
  return [sample(0), sample(1), sample(2), sample(3)];
}

function drawImage(out, source, dx, dy, dw, dh) {
  for (let y = 0; y < dh; y += 1) {
    for (let x = 0; x < dw; x += 1) {
      const [r, g, b, a] = sampleBilinear(source, x / Math.max(1, dw - 1), y / Math.max(1, dh - 1));
      const dst = ((dy + y) * out.width + (dx + x)) * 4;
      out.data[dst] = Math.round(r);
      out.data[dst + 1] = Math.round(g);
      out.data[dst + 2] = Math.round(b);
      out.data[dst + 3] = Math.round(a);
    }
  }
}

await mkdir(buildDir, { recursive: true });

const mark = PNG.sync.read(await readFile(sourcePng));
const iconSize = 512;
const out = new PNG({ width: iconSize, height: iconSize });
const maxW = 430;
const maxH = 300;
const scale = Math.min(maxW / mark.width, maxH / mark.height);
const dw = Math.max(1, Math.round(mark.width * scale));
const dh = Math.max(1, Math.round(mark.height * scale));
const dx = Math.round((iconSize - dw) / 2);
const dy = Math.round((iconSize - dh) / 2);

drawImage(out, mark, dx, dy, dw, dh);

const pngBuffer = PNG.sync.write(out);
await writeFile(pngTarget, pngBuffer);

const ico = await pngToIco(pngTarget);
await writeFile(icoTarget, ico);
