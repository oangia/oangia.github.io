const sharp = require('sharp');
const fs = require('fs');
const toIco = require('to-ico');

async function generateFaviconICO({
  text = 'A',
  size = 64,
  output = 'favicon.ico',
}) {
  const svg = `
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="100%" height="100%" fill="#ffffff" />

    <text
      x="50%"
      y="50%"
      text-anchor="middle"
      dominant-baseline="central"
      font-size="${size * 0.75}"
      font-family="Arial, sans-serif"
      font-weight="700"
      fill="#000000"
      stroke="#000000"
      stroke-width="1"
      paint-order="stroke"
    >
      ${text}
    </text>
  </svg>
  `;

  const pngBuffer = await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toBuffer();

  const icoBuffer = await toIco([pngBuffer]);
  fs.writeFileSync(output, icoBuffer);
}

module.exports = generateFaviconICO;

//generateFaviconICO({
//  text: 'M',
//  output: 'public/favicon.ico',
//});