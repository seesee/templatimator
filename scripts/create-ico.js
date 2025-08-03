// create-ico.js - Create a simple ICO file from SVG
const fs = require('fs');

// Create a minimal 16x16 ICO file
// This is a simplified approach - for production, you'd use a proper image library

// ICO file header (6 bytes)
const icoHeader = Buffer.from([
  0x00, 0x00, // Reserved (0)
  0x01, 0x00, // Type (1 = ICO)
  0x01, 0x00  // Number of images (1)
]);

// Image directory entry (16 bytes)
const imageEntry = Buffer.from([
  0x10,       // Width (16)
  0x10,       // Height (16)
  0x00,       // Color palette (0 = no palette)
  0x00,       // Reserved (0)
  0x01, 0x00, // Color planes (1)
  0x20, 0x00, // Bits per pixel (32)
  0x00, 0x04, 0x00, 0x00, // Image size (1024 bytes for 16x16x32bit)
  0x16, 0x00, 0x00, 0x00  // Offset to image data (22 bytes)
]);

// Create a simple 16x16 RGBA bitmap
// This represents our blue template icon in a very simplified form
const width = 16;
const height = 16;
const bmpHeader = Buffer.alloc(40);

// BMP Info Header
bmpHeader.writeUInt32LE(40, 0);          // Header size
bmpHeader.writeInt32LE(width, 4);        // Width
bmpHeader.writeInt32LE(height * 2, 8);   // Height (doubled for ICO)
bmpHeader.writeUInt16LE(1, 12);          // Planes
bmpHeader.writeUInt16LE(32, 14);         // Bits per pixel
bmpHeader.writeUInt32LE(0, 16);          // Compression
bmpHeader.writeUInt32LE(width * height * 4, 20); // Image size

// Create pixel data (BGRA format)
const pixelData = Buffer.alloc(width * height * 4);

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const index = (y * width + x) * 4;
    
    // Create a simple template icon pattern
    if (
      // Blue background
      (x >= 1 && x <= 14 && y >= 1 && y <= 14) ||
      // White document area
      (x >= 3 && x <= 12 && y >= 2 && y <= 13)
    ) {
      if (x >= 3 && x <= 12 && y >= 2 && y <= 13) {
        // White document
        pixelData[index] = 255;     // B
        pixelData[index + 1] = 255; // G
        pixelData[index + 2] = 255; // R
        pixelData[index + 3] = 255; // A
      } else if (
        // Template brackets {{ }}
        (x === 5 && y >= 6 && y <= 10) ||
        (x === 6 && (y === 6 || y === 8 || y === 10)) ||
        (x === 9 && (y === 6 || y === 8 || y === 10)) ||
        (x === 10 && y >= 6 && y <= 10)
      ) {
        // White brackets on blue
        pixelData[index] = 255;     // B
        pixelData[index + 1] = 255; // G
        pixelData[index + 2] = 255; // R
        pixelData[index + 3] = 255; // A
      } else {
        // Blue background
        pixelData[index] = 249;     // B
        pixelData[index + 1] = 127; // G
        pixelData[index + 2] = 45;  // R
        pixelData[index + 3] = 255; // A
      }
    } else {
      // Transparent outside
      pixelData[index] = 0;       // B
      pixelData[index + 1] = 0;   // G
      pixelData[index + 2] = 0;   // R
      pixelData[index + 3] = 0;   // A
    }
  }
}

// AND mask (1 bit per pixel, padded to 4 bytes per row)
const andMask = Buffer.alloc(height * 4); // All zeros = no transparency mask

// Combine all parts
const icoFile = Buffer.concat([
  icoHeader,
  imageEntry,
  bmpHeader,
  pixelData,
  andMask
]);

// Write the ICO file
fs.writeFileSync('assets/favicon.ico', icoFile);
console.log('✓ Created assets/favicon.ico (16x16 ICO file)');