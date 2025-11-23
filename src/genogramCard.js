/**
 * Genogram Card Template for family-chart
 * Creates standard genogram shapes: Square (male), Circle (female), Diamond (unknown)
 */
import f3 from 'family-chart';
import { PROBAND_ID } from './data.js';

// Attribute colors (genetic markers)
const ATTR_COLORS = {
  'A': '#5d8cc1',
  'B': '#775a4a',
  'C': '#94251e',
  'D': '#ca6958',
  'E': '#68bfaf',
  'F': '#23848a',
  'G': '#cfdf41',
  'H': '#717c42',
  'V': '#332d31',
  'M': '#9b59b6'
};

/**
 * Get color for attribute code
 */
function getAttrColor(attr) {
  if (!attr) return 'transparent';
  const code = attr[0]?.toUpperCase();
  return ATTR_COLORS[code] || 'transparent';
}

/**
 * Create genogram-style card HTML
 */
function genogramCardHtml(d) {
  const data = d.data;
  const gender = data.gender || '?';
  const name = data['first name'] || '';
  const birth = data.birthday || '';
  const deceased = data.deceased || false;
  const adopted = data.adopted || false;
  const pregnancy = data.pregnancy || false; // Pregnancy indicator
  const multiple = data.multiple; // Twin/triplet marker
  const attributes = data.attributes || [];
  const isProband = d.id === PROBAND_ID;

  // Detect stillbirth/miscarriage: unknown sex, deceased, no birth year
  const isStillbirth = (gender === '?' && deceased && !birth);
  const isMiscarriage = data.miscarriage || false;

  // Determine shape class
  let shapeClass = 'genogram-shape-unknown';
  if (pregnancy) {
    shapeClass = 'genogram-shape-pregnancy';
  } else if (isMiscarriage) {
    shapeClass = 'genogram-shape-miscarriage';
  } else if (isStillbirth) {
    shapeClass = 'genogram-shape-stillbirth';
  } else if (gender === 'M') {
    shapeClass = 'genogram-shape-male';
  } else if (gender === 'F') {
    shapeClass = 'genogram-shape-female';
  }

  // Build classes
  const classes = [shapeClass];
  if (deceased && !isStillbirth && !isMiscarriage) classes.push('genogram-deceased');
  if (adopted === true) classes.push('genogram-adopted');
  if (adopted === 'out') classes.push('genogram-adopted-out');
  if (isProband) classes.push('genogram-proband');

  // Build attribute quadrants HTML
  let attrHtml = '';
  if (attributes.length > 0) {
    attrHtml = '<div class="genogram-attributes">';
    for (let i = 0; i < 4; i++) {
      const color = attributes[i] ? getAttrColor(attributes[i]) : 'transparent';
      attrHtml += `<div class="genogram-attr" style="background:${color}" title="${attributes[i] || ''}"></div>`;
    }
    attrHtml += '</div>';
  }

  // Twin marker
  const twinHtml = multiple ? `<span class="genogram-twin-marker">T${multiple}</span>` : '';

  return `
    <div class="genogram-card ${classes.join(' ')}">
      ${attrHtml}
      <div class="genogram-content"></div>
      ${twinHtml}
      <div class="genogram-name">${name}</div>
      ${birth ? `<div class="genogram-birth">${birth}</div>` : ''}
    </div>
  `;
}

/**
 * Create the genogram card component for family-chart
 */
export function createGenogramCard() {
  return f3.cardHtml({
    card_dim: { w: 80, h: 100 },
    card_display: [],
    mini_tree: true,
    link_break: false,
    cardInnerHtmlCreator: genogramCardHtml
  });
}

/**
 * SVG-based genogram card (alternative)
 */
export function createGenogramSvgCard() {
  return f3.cardSvg({
    card_dim: { w: 60, h: 60 },
    card_display: [d => d.data['first name'] || ''],
    mini_tree: true,
    link_break: false
  });
}
