/**
 * Family Chart Genogram - Open Source Implementation
 * Based on donatso/family-chart library
 * With custom genogram features: twins, highlighting, proband indicator
 */
import f3 from 'family-chart';
import * as d3 from 'd3';
import { genogramData, PROBAND_ID } from './data.js';
import { createGenogramCard } from './genogramCard.js';

let store;
let chartView;

/**
 * Initialize the family chart
 */
function init() {
  const cont = document.querySelector('#FamilyChart');

  // Create the store with data
  store = f3.createStore({
    data: genogramData,
    node_separation: 250,
    level_separation: 150
  });

  // Create the chart view
  chartView = f3.view({
    store,
    cont,
    card: createGenogramCard()
  });

  // Initial render
  store.setOnUpdate(() => {
    chartView.update({ tree: store.state.tree });
    // Apply custom genogram features after each update
    setTimeout(() => {
      applyGenogramFeatures();
    }, 100);
  });

  store.update.tree({ initial: true });

  // Update stats
  updateStats();

  // Setup controls
  setupControls(chartView);

  // Apply initial genogram features
  setTimeout(() => {
    applyGenogramFeatures();
    scrollToProband();
  }, 500);

  console.log('Family Chart Genogram initialized');
  console.log(`Total members: ${genogramData.length}`);
}

/**
 * Apply custom genogram visual features
 */
function applyGenogramFeatures() {
  renderTwinConnectors();
  renderIdenticalTwinBars();
  setupHoverHighlighting();
  renderProbandArrow();
}

/**
 * Render shared parent lines for twins/multiples
 */
function renderTwinConnectors() {
  const svg = d3.select('#FamilyChart svg');
  const linksGroup = svg.select('.links-view');

  if (linksGroup.empty()) return;

  // Remove existing twin connectors
  svg.selectAll('.twin-connector').remove();

  // Group nodes by multiple birth ID
  const multipleGroups = {};
  genogramData.forEach(person => {
    if (person.data.multiple) {
      const groupId = person.data.multiple;
      if (!multipleGroups[groupId]) {
        multipleGroups[groupId] = [];
      }
      multipleGroups[groupId].push(person.id);
    }
  });

  // Create twin connector group
  let twinGroup = svg.select('.twin-connectors');
  if (twinGroup.empty()) {
    twinGroup = svg.insert('g', '.cards-view')
      .attr('class', 'twin-connectors');
  }

  // For each multiple birth group, find the cards and draw connectors
  Object.values(multipleGroups).forEach(twinIds => {
    if (twinIds.length < 2) return;

    const twinCards = [];
    twinIds.forEach(id => {
      const card = svg.select(`[data-id="${id}"]`);
      if (!card.empty()) {
        const transform = card.attr('transform');
        const match = transform?.match(/translate\(([^,]+),([^)]+)\)/);
        if (match) {
          twinCards.push({
            id,
            x: parseFloat(match[1]),
            y: parseFloat(match[2])
          });
        }
      }
    });

    if (twinCards.length >= 2) {
      // Sort by x position
      twinCards.sort((a, b) => a.x - b.x);

      // Find the midpoint Y (top of cards)
      const topY = Math.min(...twinCards.map(c => c.y)) - 40;
      const midX = (twinCards[0].x + twinCards[twinCards.length - 1].x) / 2;

      // Draw horizontal line connecting twins at their parent connection point
      const lineY = topY - 20;

      twinGroup.append('line')
        .attr('class', 'twin-connector')
        .attr('x1', twinCards[0].x + 40)
        .attr('y1', lineY)
        .attr('x2', twinCards[twinCards.length - 1].x + 40)
        .attr('y2', lineY)
        .attr('stroke', '#e94560')
        .attr('stroke-width', 2);

      // Draw vertical lines from horizontal bar to each twin
      twinCards.forEach(card => {
        twinGroup.append('line')
          .attr('class', 'twin-connector')
          .attr('x1', card.x + 40)
          .attr('y1', lineY)
          .attr('x2', card.x + 40)
          .attr('y2', card.y)
          .attr('stroke', '#e94560')
          .attr('stroke-width', 2);
      });

      // Draw single line up to parent
      twinGroup.append('line')
        .attr('class', 'twin-connector twin-parent-line')
        .attr('x1', midX + 40)
        .attr('y1', lineY)
        .attr('x2', midX + 40)
        .attr('y2', lineY - 30)
        .attr('stroke', '#e94560')
        .attr('stroke-width', 2);
    }
  });
}

/**
 * Render horizontal bars connecting identical twins
 */
function renderIdenticalTwinBars() {
  const svg = d3.select('#FamilyChart svg');

  // Remove existing identical twin bars
  svg.selectAll('.identical-twin-bar').remove();

  // Find identical twin pairs
  const identicalPairs = [];
  genogramData.forEach(person => {
    if (person.data.identical) {
      identicalPairs.push({
        twin1: person.id,
        twin2: person.data.identical
      });
    }
  });

  // Create bar group
  let barGroup = svg.select('.identical-twin-bars');
  if (barGroup.empty()) {
    barGroup = svg.insert('g', '.cards-view')
      .attr('class', 'identical-twin-bars');
  }

  identicalPairs.forEach(pair => {
    const card1 = svg.select(`[data-id="${pair.twin1}"]`);
    const card2 = svg.select(`[data-id="${pair.twin2}"]`);

    if (card1.empty() || card2.empty()) return;

    const getPosition = (card) => {
      const transform = card.attr('transform');
      const match = transform?.match(/translate\(([^,]+),([^)]+)\)/);
      if (match) {
        return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
      }
      return null;
    };

    const pos1 = getPosition(card1);
    const pos2 = getPosition(card2);

    if (pos1 && pos2) {
      // Draw horizontal bar between identical twins (at top of cards)
      const y = Math.min(pos1.y, pos2.y) - 25;

      barGroup.append('line')
        .attr('class', 'identical-twin-bar')
        .attr('x1', pos1.x + 40)
        .attr('y1', y)
        .attr('x2', pos2.x + 40)
        .attr('y2', y)
        .attr('stroke', '#9b59b6')
        .attr('stroke-width', 3);
    }
  });
}

/**
 * Setup hover highlighting for ancestors and descendants
 */
function setupHoverHighlighting() {
  const svg = d3.select('#FamilyChart svg');

  svg.selectAll('.card').each(function() {
    const card = d3.select(this);
    const cardId = card.attr('data-id');

    card
      .on('mouseenter.highlight', () => highlightRelated(cardId, true))
      .on('mouseleave.highlight', () => highlightRelated(cardId, false));
  });
}

/**
 * Highlight ancestors and descendants of a person
 */
function highlightRelated(personId, highlight) {
  const svg = d3.select('#FamilyChart svg');

  if (!highlight) {
    // Reset all cards
    svg.selectAll('.card')
      .classed('highlighted-ancestor', false)
      .classed('highlighted-descendant', false)
      .classed('highlighted-self', false);
    svg.selectAll('.link')
      .classed('highlighted-link', false);
    return;
  }

  // Find the person
  const person = genogramData.find(p => p.id === personId);
  if (!person) return;

  // Get ancestors
  const ancestors = new Set();
  const getAncestors = (id) => {
    const p = genogramData.find(x => x.id === id);
    if (!p || !p.rels.parents) return;
    p.rels.parents.forEach(parentId => {
      if (!ancestors.has(parentId)) {
        ancestors.add(parentId);
        getAncestors(parentId);
      }
    });
  };
  getAncestors(personId);

  // Get descendants
  const descendants = new Set();
  const getDescendants = (id) => {
    const p = genogramData.find(x => x.id === id);
    if (!p || !p.rels.children) return;
    p.rels.children.forEach(childId => {
      if (!descendants.has(childId)) {
        descendants.add(childId);
        getDescendants(childId);
      }
    });
  };
  getDescendants(personId);

  // Apply highlighting
  svg.selectAll('.card').each(function() {
    const card = d3.select(this);
    const id = card.attr('data-id');

    card.classed('highlighted-self', id === personId);
    card.classed('highlighted-ancestor', ancestors.has(id));
    card.classed('highlighted-descendant', descendants.has(id));
  });
}

/**
 * Render proband arrow indicator
 */
function renderProbandArrow() {
  const svg = d3.select('#FamilyChart svg');

  // Remove existing proband arrow
  svg.selectAll('.proband-arrow-svg').remove();

  const probandCard = svg.select(`[data-id="${PROBAND_ID}"]`);
  if (probandCard.empty()) return;

  const transform = probandCard.attr('transform');
  const match = transform?.match(/translate\(([^,]+),([^)]+)\)/);
  if (!match) return;

  const x = parseFloat(match[1]);
  const y = parseFloat(match[2]);

  // Create arrow group
  const arrow = svg.append('g')
    .attr('class', 'proband-arrow-svg')
    .attr('transform', `translate(${x - 15}, ${y + 70})`);

  // Draw arrow pointing to proband
  arrow.append('path')
    .attr('d', 'M0,0 L15,-25 L10,-20 L10,-25 L25,-25 L25,-15 L20,-15 L15,-20 L0,0')
    .attr('fill', '#e94560')
    .attr('stroke', '#e94560')
    .attr('stroke-width', 1);

  arrow.append('text')
    .attr('x', 30)
    .attr('y', -15)
    .attr('fill', '#e94560')
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .text('Proband');
}

/**
 * Scroll/zoom to center on the proband
 */
function scrollToProband() {
  if (!chartView || !chartView.svg) return;

  const svg = d3.select('#FamilyChart svg');
  const probandCard = svg.select(`[data-id="${PROBAND_ID}"]`);

  if (probandCard.empty()) return;

  const transform = probandCard.attr('transform');
  const match = transform?.match(/translate\(([^,]+),([^)]+)\)/);
  if (!match) return;

  const x = parseFloat(match[1]);
  const y = parseFloat(match[2]);

  // Get container dimensions
  const container = document.querySelector('#FamilyChart');
  const containerRect = container.getBoundingClientRect();
  const centerX = containerRect.width / 2;
  const centerY = containerRect.height / 2;

  // Calculate transform to center on proband
  const translateX = centerX - x - 40;
  const translateY = centerY - y - 50;

  chartView.svg
    .transition()
    .duration(750)
    .call(
      chartView.zoom.transform,
      d3.zoomIdentity.translate(translateX, translateY).scale(1)
    );
}

/**
 * Update statistics panel
 */
function updateStats() {
  const totalEl = document.getElementById('totalMembers');
  const probandEl = document.getElementById('probandName');

  if (totalEl) {
    totalEl.textContent = genogramData.length;
  }

  if (probandEl) {
    const proband = genogramData.find(p => p.id === PROBAND_ID);
    probandEl.textContent = proband ? proband.data['first name'] : '-';
  }
}

/**
 * Setup control buttons
 */
function setupControls(view) {
  document.getElementById('btnZoomIn')?.addEventListener('click', () => {
    view.svg.transition().duration(300).call(view.zoom.scaleBy, 1.3);
  });

  document.getElementById('btnZoomOut')?.addEventListener('click', () => {
    view.svg.transition().duration(300).call(view.zoom.scaleBy, 0.7);
  });

  document.getElementById('btnFit')?.addEventListener('click', () => {
    view.svg.transition().duration(500).call(view.zoom.transform, d3.zoomIdentity);
  });

  document.getElementById('btnProband')?.addEventListener('click', () => {
    scrollToProband();
  });

  document.getElementById('btnExport')?.addEventListener('click', () => {
    const svgEl = document.querySelector('#FamilyChart svg');
    if (svgEl) {
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'family-genogram.svg';
      a.click();
      URL.revokeObjectURL(url);
    }
  });
}

// Navigation API (exported for external use)
export function findParents(personId) {
  const person = genogramData.find(p => p.id === personId);
  if (!person || !person.rels.parents) return [];
  return person.rels.parents.map(id => genogramData.find(p => p.id === id)).filter(Boolean);
}

export function findMates(personId) {
  const person = genogramData.find(p => p.id === personId);
  if (!person || !person.rels.spouses) return [];
  return person.rels.spouses.map(id => genogramData.find(p => p.id === id)).filter(Boolean);
}

export function findChildren(personId) {
  const person = genogramData.find(p => p.id === personId);
  if (!person || !person.rels.children) return [];
  return person.rels.children.map(id => genogramData.find(p => p.id === id)).filter(Boolean);
}

export function findSiblings(personId) {
  const person = genogramData.find(p => p.id === personId);
  if (!person || !person.rels.parents) return [];

  const siblings = new Set();
  person.rels.parents.forEach(parentId => {
    const parent = genogramData.find(p => p.id === parentId);
    if (parent && parent.rels.children) {
      parent.rels.children.forEach(childId => {
        if (childId !== personId) siblings.add(childId);
      });
    }
  });

  return Array.from(siblings).map(id => genogramData.find(p => p.id === id)).filter(Boolean);
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);

// Export for external access
window.genogramAPI = {
  findParents,
  findMates,
  findChildren,
  findSiblings,
  scrollToProband,
  getData: () => genogramData,
  getProband: () => genogramData.find(p => p.id === PROBAND_ID)
};
