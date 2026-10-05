import { deflateSync } from 'node:zlib';
import type { APIRoute } from 'astro';
import { character, characterPalette } from '../data/sprites';

/**
 * The favicon is Alexis himself: the head of the same sprite on a transparent ground, written out as
 * a PNG at build time so it always matches the character.
 */
const FRAME = { x: 10, y: 0, size: 45 };
const SCALE = 4;

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function chunk(type: string, data: Buffer) {
  const body = Buffer.concat([Buffer.from(type), data]);
  let crc = 0xffffffff;
  for (const byte of body) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE((crc ^ 0xffffffff) >>> 0, body.length + 4);
  return out;
}

export const GET: APIRoute = () => {
  const { x, y, size } = FRAME;
  const side = size * SCALE;
  // The head layer sits over the body, as it does in the sprite.
  const colour = (px: number, py: number) => {
    const code = [character.head, character.front.idle].map((map) => map[py]?.[px]).find((c) => c && c !== '.');
    return code ? characterPalette[code] : undefined;
  };
  // One filter byte, then RGBA for every pixel of the row.
  const rows = Buffer.alloc(side * (side * 4 + 1));
  for (let row = 0; row < side; row++) {
    for (let col = 0; col < side; col++) {
      const hex = colour(x + Math.floor(col / SCALE), y + Math.floor(row / SCALE));
      if (!hex) continue;
      const at = row * (side * 4 + 1) + 1 + col * 4;
      rows.writeUInt32BE(((parseInt(hex.slice(1), 16) << 8) | 0xff) >>> 0, at);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(side, 0);
  header.writeUInt32BE(side, 4);
  header.set([8, 6, 0, 0, 0], 8);
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
