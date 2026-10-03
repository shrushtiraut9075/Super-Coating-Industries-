const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Build an ultra-crisp, professional icon SVG
// ViewBox is 512x512
// Graphic symbol from public/logo.svg:
// Top arc (Cobalt blue):
// M 53 38 C 53 18 73 4 98 4 C 126 4 137 18 137 34 L 115 34 C 115 25 109 18 97 18 C 83 18 73 24 73 34 C 73 44 82 48 98 51 L 110 54 C 128 58 136 67 136 82 C 134 83 131 84 126 84 C 118 70 105 65 91 62 L 76 59 C 60 55 53 48 53 38 Z
// Upper curve:
// M 68 28 C 73 21 82 17 93 17 C 107 17 117 25 117 35 C 117 48 102 52 82 56 C 60 60 48 68 44 80 C 41 89 42 100 48 110 C 43 103 40 94 42 84 C 45 70 57 60 76 56 L 94 53 C 106 50 112 45 112 37 C 112 30 105 24 93 24 C 80 24 72 30 68 36 Z
// Bottom orange swoosh:
// M 45 82 C 41 97 45 113 58 125 C 71 137 92 140 113 136 C 130 133 143 120 142 103 C 142 90 132 82 119 79 L 105 77 C 88 74 72 73 59 78 C 52 80 48 83 45 86 C 49 84 57 82 66 82 C 80 82 96 86 110 89 C 125 93 130 100 130 107 C 129 119 116 127 101 127 C 83 127 67 121 59 111 C 53 103 51 93 54 83 Z
// Bottom blue swoosh:
// M 45 92 C 46 108 55 124 70 134 C 86 145 107 146 124 139 C 111 143 93 141 79 133 C 65 125 56 112 53 97 C 51 89 51 82 53 75 C 48 80 45 86 45 92 Z
// Spray gun: paint cup, handle, nozzle, rays

function getIconSvg(isMaskable = false) {
  // If maskable, safe zone is 80% circle (radius ~204 from center (256, 256))
  // We keep all important content well within 50px..462px
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0E5BB5" />
        <stop offset="50%" stop-color="#0B478B" />
        <stop offset="100%" stop-color="#072C59" />
      </linearGradient>

      <linearGradient id="plateGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#FFFFFF" />
        <stop offset="100%" stop-color="#F8FAFC" />
      </linearGradient>

      <filter id="plateShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.25" />
      </filter>

      <linearGradient id="sciBlue" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1268C8" />
        <stop offset="100%" stop-color="#0B478B" />
      </linearGradient>

      <linearGradient id="sciOrange" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFA000" />
        <stop offset="100%" stop-color="#F2600C" />
      </linearGradient>
    </defs>

    <!-- App Background -->
    <rect width="512" height="512" rx="${isMaskable ? 0 : 110}" fill="url(#bgGrad)" />

    <!-- Subtle background pattern accent -->
    <circle cx="512" cy="0" r="260" fill="#FFFFFF" opacity="0.04" />
    <circle cx="0" cy="512" r="220" fill="#000000" opacity="0.15" />

    <!-- Center Card / Shield -->
    <rect
      x="56"
      y="56"
      width="400"
      height="400"
      rx="92"
      fill="url(#plateGrad)"
      filter="url(#plateShadow)"
    />

    <!-- Subtle inner border for card -->
    <rect
      x="56"
      y="56"
      width="400"
      height="400"
      rx="92"
      fill="none"
      stroke="#E2E8F0"
      stroke-width="3"
    />

    <!-- Super Coating Logo Mark -->
    <!-- Original symbol bounding box: X: 41..205 (w=164), Y: 4..146 (h=142) -->
    <!-- Center of symbol is at (123, 75). Scale 1.7x gives w=278, h=241 -->
    <!-- Translate to center inside the 400x400 card at (256, 215) -->
    <g transform="translate(256, 215) scale(1.65) translate(-123, -75)">
      <!-- Top Arc in Cobalt Blue -->
      <path
        d="M 53 38 C 53 18 73 4 98 4 C 126 4 137 18 137 34 L 115 34 C 115 25 109 18 97 18 C 83 18 73 24 73 34 C 73 44 82 48 98 51 L 110 54 C 128 58 136 67 136 82 C 134 83 131 84 126 84 C 118 70 105 65 91 62 L 76 59 C 60 55 53 48 53 38 Z"
        fill="url(#sciBlue)"
      />
      <!-- Upper Body Curve -->
      <path
        d="M 68 28 C 73 21 82 17 93 17 C 107 17 117 25 117 35 C 117 48 102 52 82 56 C 60 60 48 68 44 80 C 41 89 42 100 48 110 C 43 103 40 94 42 84 C 45 70 57 60 76 56 L 94 53 C 106 50 112 45 112 37 C 112 30 105 24 93 24 C 80 24 72 30 68 36 Z"
        fill="url(#sciBlue)"
      />
      <!-- Bottom Swoosh in Orange -->
      <path
        d="M 45 82 C 41 97 45 113 58 125 C 71 137 92 140 113 136 C 130 133 143 120 142 103 C 142 90 132 82 119 79 L 105 77 C 88 74 72 73 59 78 C 52 80 48 83 45 86 C 49 84 57 82 66 82 C 80 82 96 86 110 89 C 125 93 130 100 130 107 C 129 119 116 127 101 127 C 83 127 67 121 59 111 C 53 103 51 93 54 83 Z"
        fill="url(#sciOrange)"
      />
      <!-- Bottom Dark Blue Swoosh -->
      <path
        d="M 45 92 C 46 108 55 124 70 134 C 86 145 107 146 124 139 C 111 143 93 141 79 133 C 65 125 56 112 53 97 C 51 89 51 82 53 75 C 48 80 45 86 45 92 Z"
        fill="url(#sciBlue)"
      />

      <!-- Spray Gun -->
      <path d="M 142 36 L 161 40 L 155 64 L 142 61 Z" fill="#0B478B" stroke="#1268C8" stroke-width="1.5" stroke-linejoin="round" />
      <path d="M 140 35 L 163 40 L 161 43 L 138 38 Z" fill="#1268C8" />
      <path d="M 145 62 L 154 64 L 152 74 L 165 74 L 165 80 L 150 80 L 145 98 L 138 106 L 135 98 L 142 79 L 137 77 Z" fill="#0B478B" />
      <path d="M 147 79 C 149 84 149 88 147 93" stroke="#1268C8" stroke-width="2" stroke-linecap="round" />
      <rect x="165" y="74" width="8" height="6" rx="1" fill="#1268C8" />

      <!-- Spray Mist Rays -->
      <polygon points="176,74 204,63 203,66 176,75" fill="#F2600C" />
      <polygon points="177,75 205,72 204,75 177,76" fill="#F2600C" />
      <polygon points="178,77 205,81 204,84 178,78" fill="#F2600C" />
      <polygon points="177,78 204,91 203,94 177,79" fill="#F2600C" />
    </g>

    <!-- Brand Typography on the white card -->
    <text x="256" y="380" text-anchor="middle" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="34" letter-spacing="-0.5">
      <tspan fill="#0B478B">SUPER </tspan>
      <tspan fill="#F2600C">COATING</tspan>
    </text>

    <!-- Subtitle: INDUSTRIES -->
    <text x="256" y="414" text-anchor="middle" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="800" font-size="16" letter-spacing="8" fill="#475569">
      INDUSTRIES
    </text>
  </svg>`;
}

async function run() {
  const publicDir = path.resolve(__dirname, '../public');

  const standardSvg = Buffer.from(getIconSvg(false));
  const maskableSvg = Buffer.from(getIconSvg(true));

  console.log('Generating pwa-512x512.png...');
  await sharp(standardSvg).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-512x512.png'));

  console.log('Generating pwa-192x192.png...');
  await sharp(standardSvg).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'));

  console.log('Generating apple-touch-icon.png...');
  await sharp(standardSvg).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('Generating pwa-maskable-512x512.png...');
  await sharp(maskableSvg).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  console.log('All icons generated successfully!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
