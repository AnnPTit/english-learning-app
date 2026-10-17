/**
 * Sinh icon PWA (hình vuông, nền màu + khối "flashcard" màu trắng) bằng cách
 * vẽ pixel thủ công rồi encode PNG thô (chỉ dùng zlib có sẵn của Node, không
 * cần thêm thư viện xử lý ảnh nào).
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const BG = [79, 70, 229] as const; // indigo-600
const WHITE = [255, 255, 255] as const;

let crcTable: Uint32Array | null = null;
function crc32(buf: Buffer): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function inRoundedRect(
  x: number,
  y: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  r: number,
) {
  if (x < rx || x >= rx + rw || y < ry || y >= ry + rh) return false;
  if (x < rx + r && y < ry + r) return dist(x, y, rx + r, ry + r) <= r;
  if (x >= rx + rw - r && y < ry + r) return dist(x, y, rx + rw - r, ry + r) <= r;
  if (x < rx + r && y >= ry + rh - r) return dist(x, y, rx + r, ry + rh - r) <= r;
  if (x >= rx + rw - r && y >= ry + rh - r)
    return dist(x, y, rx + rw - r, ry + rh - r) <= r;
  return true;
}

function makeIcon(size: number): Buffer {
  const pixels = Buffer.alloc(size * size * 4);
  const setPixel = (x: number, y: number, [r, g, b]: readonly number[]) => {
    const idx = (y * size + x) * 4;
    pixels[idx] = r;
    pixels[idx + 1] = g;
    pixels[idx + 2] = b;
    pixels[idx + 3] = 255;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) setPixel(x, y, BG);
  }

  const margin = Math.round(size * 0.18);
  const cardW = size - margin * 2;
  const cardH = Math.round(cardW * 0.72);
  const cardX = margin;
  const cardY = Math.round((size - cardH) / 2);
  const radius = Math.round(size * 0.1);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (inRoundedRect(x, y, cardX, cardY, cardW, cardH, radius)) {
        setPixel(x, y, WHITE);
      }
    }
  }

  const lineH = Math.max(2, Math.round(cardH * 0.08));
  const lineMarginX = Math.round(cardW * 0.18);
  for (const frac of [0.28, 0.52, 0.76]) {
    const ly = cardY + Math.round(cardH * frac);
    for (let y = ly; y < ly + lineH; y++) {
      for (let x = cardX + lineMarginX; x < cardX + cardW - lineMarginX; x++) {
        if (y >= 0 && y < size && x >= 0 && x < size) setPixel(x, y, BG);
      }
    }
  }

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idatData = deflateSync(raw);

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idatData),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", makeIcon(192));
writeFileSync("public/icons/icon-512.png", makeIcon(512));
writeFileSync("public/apple-touch-icon.png", makeIcon(180));
console.log("Generated: public/icons/icon-192.png, icon-512.png, public/apple-touch-icon.png");
