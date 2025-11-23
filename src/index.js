/**
 * Family Chart Genogram - Open Source Implementation
 * Based on donatso/family-chart library
 */
import f3 from 'family-chart';
import { genogramData, PROBAND_ID } from './data.js';
import { createGenogramCard } from './genogramCard.js';

let store;

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
  const view = f3.view({
    store,
    cont,
    card: createGenogramCard()
  });

  // Initial render
  store.setOnUpdate(() => view.update({ tree: store.state.tree }));
  store.update.tree({ initial: true });

  // Update stats
  updateStats();

  // Setup controls
  setupControls(view);

  console.log('Family Chart Genogram initialized');
  console.log(`Total members: ${genogramData.length}`);
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
    view.svg.transition().call(view.zoom.scaleBy, 1.3);
  });

  document.getElementById('btnZoomOut')?.addEventListener('click', () => {
    view.svg.transition().call(view.zoom.scaleBy, 0.7);
  });

  document.getElementById('btnFit')?.addEventListener('click', () => {
    view.svg.transition().call(view.zoom.transform, d3.zoomIdentity);
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

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
