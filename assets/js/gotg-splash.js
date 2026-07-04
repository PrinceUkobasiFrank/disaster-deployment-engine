// ─── PIE WHEEL BUILDER ───────────────────────────────────────────────
// 5 real GotG outreach images from their website / public CDN
const images = [
  'img1.jpg',
  'img2.jpg',
  'img3.jpg',
  'img4.jpg',
  'img5.jpg',
];

// Fallback palette colors if images fail
const fallbackColors = ['#0d3320','#0a2818','#081f12','#0c2d1a','#0f3824'];

const NUM = 5;
const CX = 230, CY = 230;
const OUTER_R = 222;
const INNER_R = 76;
const GAP_DEG = 2;

const defs = document.getElementById('wheelDefs');
const slicesG = document.getElementById('wheelSlices');
const spokesG = document.getElementById('wheelSpokes');

function degToRad(d) { return d * Math.PI / 180; }

function polarPoint(cx, cy, r, angleDeg) {
  const a = degToRad(angleDeg - 90);
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function wedgePath(startDeg, endDeg) {
  const s = startDeg + GAP_DEG / 2;
  const e = endDeg   - GAP_DEG / 2;
  const [ox1, oy1] = polarPoint(CX, CY, OUTER_R, s);
  const [ox2, oy2] = polarPoint(CX, CY, OUTER_R, e);
  const [ix1, iy1] = polarPoint(CX, CY, INNER_R, e);
  const [ix2, iy2] = polarPoint(CX, CY, INNER_R, s);
  const largeArc = (e - s) > 180 ? 1 : 0;
  return [
    `M ${ox1} ${oy1}`,
    `A ${OUTER_R} ${OUTER_R} 0 ${largeArc} 1 ${ox2} ${oy2}`,
    `L ${ix1} ${iy1}`,
    `A ${INNER_R} ${INNER_R} 0 ${largeArc} 0 ${ix2} ${iy2}`,
    `Z`
  ].join(' ');
}

const sliceAngle = 360 / NUM;

images.forEach((imgUrl, i) => {
  const startDeg = i * sliceAngle;
  const endDeg   = startDeg + sliceAngle;

  // ── Clip path ──
  const clipId = `clip${i}`;
  const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
  clipPath.setAttribute('id', clipId);
  const clipShape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  clipShape.setAttribute('d', wedgePath(startDeg, endDeg));
  clipPath.appendChild(clipShape);
  defs.appendChild(clipPath);

  // ── Image element ──
  const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
  img.setAttribute('x', '0');
  img.setAttribute('y', '0');
  img.setAttribute('width', '460');
  img.setAttribute('height', '460');
  img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  img.setAttribute('clip-path', `url(#${clipId})`);
  img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imgUrl);
  img.setAttribute('href', imgUrl);

  // Fallback: color rect behind image
  const fallbackRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  fallbackRect.setAttribute('x','0'); fallbackRect.setAttribute('y','0');
  fallbackRect.setAttribute('width','460'); fallbackRect.setAttribute('height','460');
  fallbackRect.setAttribute('fill', fallbackColors[i]);
  fallbackRect.setAttribute('clip-path', `url(#${clipId})`);

  // ── Dark vignette overlay per slice ──
  const overlayId = `ovlay${i}`;
  const grad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
  grad.setAttribute('id', overlayId);
  grad.setAttribute('cx', '50%'); grad.setAttribute('cy', '50%');
  grad.setAttribute('r', '50%');
  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '55%'); stop1.setAttribute('stop-color', 'transparent');
  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '100%'); stop2.setAttribute('stop-color', 'rgba(0,0,0,0.45)');
  grad.appendChild(stop1); grad.appendChild(stop2);
  defs.appendChild(grad);

  const overlayRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  overlayRect.setAttribute('x','0'); overlayRect.setAttribute('y','0');
  overlayRect.setAttribute('width','460'); overlayRect.setAttribute('height','460');
  overlayRect.setAttribute('fill', `url(#${overlayId})`);
  overlayRect.setAttribute('clip-path', `url(#${clipId})`);

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.appendChild(fallbackRect);
  g.appendChild(img);
  g.appendChild(overlayRect);
  slicesG.appendChild(g);

  // ── Spoke line (gap between slices) ──
  const [sx, sy] = polarPoint(CX, CY, INNER_R,  startDeg);
  const [ex, ey] = polarPoint(CX, CY, OUTER_R, startDeg);
  const spoke = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  spoke.setAttribute('x1', sx); spoke.setAttribute('y1', sy);
  spoke.setAttribute('x2', ex); spoke.setAttribute('y2', ey);
  spokesG.appendChild(spoke);
});

// Handle image load errors — silently fall back to color
document.querySelectorAll('#wheelSlices image').forEach(img => {
  img.addEventListener('error', function() {
    this.style.display = 'none';
  });
});
