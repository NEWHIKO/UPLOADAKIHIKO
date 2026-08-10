const { createCanvas, loadImage } = require('canvas');
const path = require('path');

/*
  ============================
  BAGIAN PENTING (YANG SERING DIUBAH)
  ============================

  options.width
  → MENGATUR LEBAR FOTO
  → BESARIN  = foto makin besar
  → KECILIN  = foto makin kecil

  options.height
  → MENGATUR TINGGI FOTO
  → Biasanya DISAMAKAN dengan width
    biar foto tidak gepeng

  options.x
  → POSISI KIRI / KANAN
  → NILAI KECIL  = geser ke KIRI
  → NILAI BESAR  = geser ke KANAN

  options.y
  → POSISI ATAS / BAWAH
  → NILAI KECIL  = geser ke ATAS
  → NILAI BESAR  = geser ke BAWAH

  --------------------------------
  CONTOH CEPAT:
  --------------------------------
  x: 50     → agak ke kiri
  x: 200    → ke kanan
  y: 30     → agak ke atas
  y: 250    → ke bawah
  width: 200  → foto kecil
  width: 400  → foto besar
*/

async function overlayImage(inputPath, options = {}) {
  const bgPath = path.join(__dirname, '../media/menu.jpg');

  const bg = await loadImage(bgPath);
  const input = await loadImage(inputPath);

  const canvas = createCanvas(bg.width, bg.height);
  const ctx = canvas.getContext('2d');

  // gambar background
  ctx.drawImage(bg, 0, 0, bg.width, bg.height);

  // ============================
  // UKURAN FOTO (UBAH ANGKA INI)
  // ============================
  const drawWidth  = options.width  || 300; // BESAR / KECIL FOTO
  const drawHeight = options.height || 300;

  // ============================
  // POSISI FOTO (UBAH ANGKA INI)
  // ============================
  const x = options.x ?? (bg.width  - drawWidth)  / 2; // KIRI / KANAN
  const y = options.y ?? (bg.height - drawHeight) / 2; // ATAS / BAWAH

  // tempel foto
  ctx.drawImage(input, x, y, drawWidth, drawHeight);

  return canvas.toBuffer('image/png');
}

module.exports = { overlayImage };