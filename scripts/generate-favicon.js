// generate-favicon.js - Convert SVG to ICO favicon
const fs = require('fs');
const path = require('path');

// Since we don't have imagemagick or other complex dependencies,
// we'll create a simple HTML-based approach that you can run manually
// or we'll provide the SVG as a fallback favicon

const svgContent = fs.readFileSync('assets/favicon.svg', 'utf8');

// For now, let's create a simple 16x16 PNG-like SVG that browsers can use
const faviconSvg = `<svg width="16" height="16" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="32" height="32" rx="4" fill="#2d7ff9"/>
  
  <!-- Template icon - document with template brackets -->
  <rect x="6" y="5" width="20" height="22" rx="2" fill="white"/>
  <rect x="8" y="7" width="16" height="18" fill="#f8f9fa"/>
  
  <!-- Template syntax symbols -->
  <!-- {{ symbol on left -->
  <path d="M10 12 L10 14 L12 14 L12 16 L10 16 L10 18" stroke="#2d7ff9" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M11 12 L11 14 L13 14 L13 16 L11 16 L11 18" stroke="#2d7ff9" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  
  <!-- }} symbol on right -->
  <path d="M22 12 L22 14 L20 14 L20 16 L22 16 L22 18" stroke="#2d7ff9" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M21 12 L21 14 L19 14 L19 16 L21 16 L21 18" stroke="#2d7ff9" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  
  <!-- Variable placeholder -->
  <rect x="14" y="13.5" width="4" height="3" rx="1" fill="#94a3b8"/>
</svg>`;

// Write the 16x16 version for favicon
fs.writeFileSync('assets/favicon-16x16.svg', faviconSvg);

console.log('Created assets/favicon.svg (32x32 source)');
console.log('Created assets/favicon-16x16.svg (16x16 favicon)');
console.log('\nTo generate ICO file, you can:');
console.log('1. Use online converter: https://convertio.co/svg-ico/');
console.log('2. Use ImageMagick: convert assets/favicon.svg -resize 16x16 dist/favicon.ico');
console.log('3. Use the SVG directly (modern browsers support this)');