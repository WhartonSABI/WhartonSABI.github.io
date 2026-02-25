#!/usr/bin/env node
/**
 * Generates a favicon-optimized source from wharton-logo.png.
 * Trims transparent edges and creates a square image with minimal padding
 * so the logo appears larger in the favicon.
 */
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const input = join(root, 'public/images/wharton-logo.png');
const output = join(root, 'public/images/favicon-source.png');

const img = sharp(input);
const trimmed = await img.trim({ threshold: 10 }).toBuffer();
const { width, height } = await sharp(trimmed).metadata();
const size = Math.max(width, height);
const padding = Math.round(size * 0.02); // 2% padding - logo fills ~96%
const canvas = size + padding * 2;

await sharp(trimmed)
  .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .extend({
    top: padding,
    bottom: padding,
    left: padding,
    right: padding,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toFile(output);

console.log('[favicon] Generated favicon-source.png');
