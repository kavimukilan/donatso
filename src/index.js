/**
 * Family Chart Genogram - Open Source Implementation
 * Based on donatso/family-chart library
 * With custom genogram features: twins, highlighting, proband indicator
 */
import f3 from 'family-chart';
import * as d3 from 'd3';
import { genogramData, PROBAND_ID, relationshipStatus } from './data.js';
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
  styleMateLinks();
  setupTooltips();
  setupCardSelection();
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
    // Reset all cards and remove highlighting state
    svg.classed('highlighting-active', false);
    svg.selectAll('.card')
      .classed('highlighted-ancestor', false)
      .classed('highlighted-descendant', false)
      .classed('highlighted-self', false);
    svg.selectAll('.link')
      .classed('highlighted-link', false);
    return;
  }

  // Enable highlighting state on SVG
  svg.classed('highlighting-active', true);

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
 * Get relationship key for two people (alphabetically sorted)
 */
function getRelationshipKey(id1, id2) {
  return [id1, id2].sort().join('-');
}

/**
 * Style mate links based on relationship status (divorced, separated)
 */
function styleMateLinks() {
  const svg = d3.select('#FamilyChart svg');

  // Find all link paths (spouse links are typically horizontal connections)
  svg.selectAll('.link').each(function() {
    const link = d3.select(this);
    const linkData = link.datum();

    // Check if this is a spouse link
    if (linkData && linkData.source && linkData.target) {
      const sourceId = linkData.source.data?.id || linkData.source.id;
      const targetId = linkData.target.data?.id || linkData.target.id;

      if (sourceId && targetId) {
        const key = getRelationshipKey(sourceId, targetId);
        const status = relationshipStatus[key];

        if (status === 'divorced') {
          link.classed('link-divorced', true)
            .attr('stroke', '#e74c3c')
            .attr('stroke-dasharray', '8,4')
            .attr('stroke-width', 3);
        } else if (status === 'separated') {
          link.classed('link-separated', true)
            .attr('stroke', '#f39c12')
            .attr('stroke-dasharray', '4,4')
            .attr('stroke-width', 3);
        }
      }
    }
  });

  // Also add divorce/separation markers on the link lines
  renderRelationshipMarkers();
}

/**
 * Render divorce/separation markers (X or //) on links
 */
function renderRelationshipMarkers() {
  const svg = d3.select('#FamilyChart svg');

  // Remove existing markers
  svg.selectAll('.relationship-marker').remove();

  // Create markers group
  let markersGroup = svg.select('.relationship-markers');
  if (markersGroup.empty()) {
    markersGroup = svg.insert('g', '.cards-view')
      .attr('class', 'relationship-markers');
  }

  // Find spouse pairs with special status
  genogramData.forEach(person => {
    if (!person.rels.spouses) return;

    person.rels.spouses.forEach(spouseId => {
      const key = getRelationshipKey(person.id, spouseId);
      const status = relationshipStatus[key];

      if (!status) return;

      // Avoid duplicates - only process if person.id < spouseId alphabetically
      if (person.id > spouseId) return;

      // Get card positions
      const card1 = svg.select(`[data-id="${person.id}"]`);
      const card2 = svg.select(`[data-id="${spouseId}"]`);

      if (card1.empty() || card2.empty()) return;

      const getPos = (card) => {
        const transform = card.attr('transform');
        const match = transform?.match(/translate\(([^,]+),([^)]+)\)/);
        return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : null;
      };

      const pos1 = getPos(card1);
      const pos2 = getPos(card2);

      if (!pos1 || !pos2) return;

      // Calculate midpoint between spouses
      const midX = (pos1.x + pos2.x) / 2 + 40;
      const midY = (pos1.y + pos2.y) / 2 + 30;

      if (status === 'divorced') {
        // Draw two diagonal lines (divorce symbol)
        markersGroup.append('line')
          .attr('class', 'relationship-marker divorce-line')
          .attr('x1', midX - 8)
          .attr('y1', midY - 10)
          .attr('x2', midX + 8)
          .attr('y2', midY + 10)
          .attr('stroke', '#e74c3c')
          .attr('stroke-width', 3);

        markersGroup.append('line')
          .attr('class', 'relationship-marker divorce-line')
          .attr('x1', midX + 8)
          .attr('y1', midY - 10)
          .attr('x2', midX - 8)
          .attr('y2', midY + 10)
          .attr('stroke', '#e74c3c')
          .attr('stroke-width', 3);
      } else if (status === 'separated') {
        // Draw single diagonal line (separated symbol)
        markersGroup.append('line')
          .attr('class', 'relationship-marker separated-line')
          .attr('x1', midX - 6)
          .attr('y1', midY - 10)
          .attr('x2', midX + 6)
          .attr('y2', midY + 10)
          .attr('stroke', '#f39c12')
          .attr('stroke-width', 3);
      }
    });
  });
}

let selectedPersonId = null;

/**
 * Setup tooltips on card hover
 */
function setupTooltips() {
  const svg = d3.select('#FamilyChart svg');
  const tooltip = document.getElementById('tooltip');

  svg.selectAll('.card').each(function() {
    const card = d3.select(this);
    const cardId = card.attr('data-id');

    card
      .on('mousemove.tooltip', (event) => {
        const person = genogramData.find(p => p.id === cardId);
        if (!person) return;

        const data = person.data;
        const status = getPersonStatus(data);

        tooltip.innerHTML = `
          <div class="tooltip-name">${data['first name'] || 'Unknown'}</div>
          <div class="tooltip-row"><span>Gender:</span> <span>${formatGender(data.gender)}</span></div>
          ${data.birthday ? `<div class="tooltip-row"><span>Born:</span> <span>${data.birthday}</span></div>` : ''}
          <div class="tooltip-row"><span>Status:</span> <span>${status}</span></div>
          ${data.attributes?.length ? `<div class="tooltip-row"><span>Attrs:</span> <span>${data.attributes.slice(0, 3).join(', ')}${data.attributes.length > 3 ? '...' : ''}</span></div>` : ''}
        `;

        tooltip.style.display = 'block';

        // Calculate position with boundary checking
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left = event.clientX + 15;
        let top = event.clientY + 15;

        // Adjust if tooltip would go off right edge
        if (left + tooltipRect.width > viewportWidth - 10) {
          left = event.clientX - tooltipRect.width - 15;
        }

        // Adjust if tooltip would go off bottom edge
        if (top + tooltipRect.height > viewportHeight - 10) {
          top = event.clientY - tooltipRect.height - 15;
        }

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
      })
      .on('mouseleave.tooltip', () => {
        tooltip.style.display = 'none';
      });
  });
}

/**
 * Get person status string
 */
function getPersonStatus(data) {
  const statuses = [];
  if (data.deceased) statuses.push('Deceased');
  if (data.adopted === true) statuses.push('Adopted In');
  if (data.adopted === 'out') statuses.push('Adopted Out');
  if (data.multiple) statuses.push(`Twin Group ${data.multiple}`);
  if (data.identical) statuses.push('Identical Twin');
  return statuses.length ? statuses.join(', ') : 'Living';
}

/**
 * Format gender for display
 */
function formatGender(gender) {
  if (gender === 'M') return 'Male';
  if (gender === 'F') return 'Female';
  return 'Unknown';
}

let infoPanelCloseListenerAdded = false;

/**
 * Setup card click selection
 */
function setupCardSelection() {
  const svg = d3.select('#FamilyChart svg');

  svg.selectAll('.card').each(function() {
    const card = d3.select(this);
    const cardId = card.attr('data-id');

    card.on('click.select', (event) => {
      event.stopPropagation();
      selectPerson(cardId);
    });
  });

  // Click on background to deselect
  svg.on('click.deselect', () => {
    deselectPerson();
  });

  // Setup info panel close button (only once)
  if (!infoPanelCloseListenerAdded) {
    document.getElementById('infoPanelClose')?.addEventListener('click', () => {
      deselectPerson();
    });

    // Keyboard support - Escape to deselect
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        deselectPerson();
      }
    });

    infoPanelCloseListenerAdded = true;
  }
}

/**
 * Select a person and show info panel
 */
function selectPerson(personId) {
  const svg = d3.select('#FamilyChart svg');

  // Remove previous selection
  svg.selectAll('.card').classed('selected', false);

  // Select new card
  svg.select(`[data-id="${personId}"]`).classed('selected', true);
  selectedPersonId = personId;

  // Update info panel
  updateInfoPanel(personId);
}

/**
 * Deselect current person
 */
function deselectPerson() {
  const svg = d3.select('#FamilyChart svg');
  svg.selectAll('.card').classed('selected', false);
  selectedPersonId = null;

  const infoPanel = document.getElementById('infoPanel');
  if (infoPanel) infoPanel.style.display = 'none';
}

/**
 * Update info panel with person details
 */
function updateInfoPanel(personId) {
  const person = genogramData.find(p => p.id === personId);
  if (!person) return;

  const data = person.data;

  document.getElementById('infoPanelName').textContent = data['first name'] || 'Unknown';
  document.getElementById('infoPanelGender').textContent = formatGender(data.gender);
  document.getElementById('infoPanelBirth').textContent = data.birthday || '-';
  document.getElementById('infoPanelStatus').textContent = getPersonStatus(data);
  document.getElementById('infoPanelAttrs').textContent = data.attributes?.join(', ') || '-';

  // Parents
  const parents = findParents(personId);
  document.getElementById('infoPanelParents').textContent =
    parents.length ? parents.map(p => p.data['first name']).join(', ') : 'None';

  // Spouses
  const spouses = findMates(personId);
  const spouseText = spouses.map(s => {
    const key = getRelationshipKey(personId, s.id);
    const status = relationshipStatus[key];
    let suffix = '';
    if (status === 'divorced') suffix = ' (divorced)';
    else if (status === 'separated') suffix = ' (separated)';
    return s.data['first name'] + suffix;
  }).join(', ');
  document.getElementById('infoPanelSpouses').textContent = spouseText || 'None';

  // Children
  const children = findChildren(personId);
  document.getElementById('infoPanelChildren').textContent =
    children.length ? children.map(c => c.data['first name']).join(', ') : 'None';

  // Siblings
  const siblings = findSiblings(personId);
  document.getElementById('infoPanelSiblings').textContent =
    siblings.length ? siblings.map(s => s.data['first name']).join(', ') : 'None';

  // Show panel
  const infoPanel = document.getElementById('infoPanel');
  if (infoPanel) infoPanel.style.display = 'block';
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

  // JSON Export
  document.getElementById('btnExportJSON')?.addEventListener('click', () => {
    exportToJSON();
  });

  // JSON Import
  document.getElementById('btnImportJSON')?.addEventListener('click', () => {
    document.getElementById('jsonFileInput')?.click();
  });

  document.getElementById('jsonFileInput')?.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (file) {
      importFromJSON(file);
    }
  });
}

/**
 * Export genogram data to JSON file
 */
function exportToJSON() {
  const exportData = {
    version: '1.0',
    probandId: PROBAND_ID,
    relationshipStatus: relationshipStatus,
    members: genogramData,
    exportDate: new Date().toISOString()
  };

  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'family-genogram.json';
  a.click();
  URL.revokeObjectURL(url);

  console.log('Exported genogram data to JSON');
}

/**
 * Import genogram data from JSON file
 */
function importFromJSON(file) {
  const reader = new FileReader();

  reader.onload = (event) => {
    try {
      const importData = JSON.parse(event.target.result);

      // Validate import data
      if (!importData.members || !Array.isArray(importData.members)) {
        throw new Error('Invalid genogram data: missing members array');
      }

      // Update genogramData (note: this requires page reload for full effect)
      console.log(`Importing ${importData.members.length} family members...`);

      // For now, show what would be imported
      const summary = `
Import Summary:
- Members: ${importData.members.length}
- Proband: ${importData.probandId || 'Not specified'}
- Export Date: ${importData.exportDate || 'Unknown'}

Note: Full import requires modifying the data source.
The data has been logged to the console for manual integration.
      `;

      alert(summary);
      console.log('Import data:', importData);

      // Store in window for manual access
      window.importedGenogramData = importData;
      console.log('Access imported data via: window.importedGenogramData');

    } catch (error) {
      console.error('Import error:', error);
      alert(`Error importing JSON: ${error.message}`);
    }
  };

  reader.onerror = () => {
    alert('Error reading file');
  };

  reader.readAsText(file);
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
  getProband: () => genogramData.find(p => p.id === PROBAND_ID),
  exportToJSON,
  selectPerson,
  deselectPerson
};
