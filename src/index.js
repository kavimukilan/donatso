import * as go from 'gojs';
import { GenogramLayout } from './GenogramLayout.js';
import { genogramData } from './data.js';
import {
  createNodeTemplate,
  createLinkTemplate,
  createMateLinkTemplate,
  createMateLabelTemplate,
  createIdenticalLinkTemplate,
  createTwinLabelTemplate
} from './templates.js';

let myDiagram;

/**
 * Initialize the GoJS diagram
 */
function init() {
  // Create the diagram with the custom GenogramLayout
  const layout = new GenogramLayout({
    isInitial: false,
    direction: 90,
    layerSpacing: 20,
    columnSpacing: 10
  });

  myDiagram = new go.Diagram("myDiagramDiv", {
    isReadOnly: false,
    initialAutoScale: go.AutoScale.Uniform,
    "animationManager.isInitial": false,
    "toolManager.hoverDelay": 100,
    maxSelectionCount: 1,
    "ChangedSelection": e => {
      const selnode = e.diagram.selection.first();
      const insp = document.getElementById("myInspectorDiv");
      if (selnode && selnode.data && !selnode.data.category) {
        if (insp) {
          const dp = selnode.getDocumentPoint(go.Spot.BottomRight);
          const vp = e.diagram.transformDocToView(dp);
          insp.style.left = (vp.x + 10) + "px";
          insp.style.top = (vp.y + 10) + "px";
          insp.style.display = "block";
          updateInspector(selnode.data);
        }
      } else {
        if (insp) insp.style.display = "none";
      }
    },
    layout: layout
  });

  // Set up templates
  myDiagram.nodeTemplate = createNodeTemplate(layout);
  myDiagram.linkTemplate = createLinkTemplate();
  myDiagram.linkTemplateMap.add("Mate", createMateLinkTemplate());
  myDiagram.nodeTemplateMap.add("MateLabel", createMateLabelTemplate());
  myDiagram.linkTemplateMap.add("Identical", createIdenticalLinkTemplate());
  myDiagram.nodeTemplateMap.add("TwinLabel", createTwinLabelTemplate());

  // Load data
  load();

  // Update stats
  updateStats();

  // Setup button handlers
  setupButtons();

  console.log("Family Chart initialized successfully!");
  console.log(`Total nodes: ${myDiagram.model.nodeDataArray.length}`);
  console.log(`Total links: ${myDiagram.model.linkDataArray.length}`);
}

/**
 * Load the genogram data into the diagram
 */
function load() {
  myDiagram.clear();
  myDiagram.model = go.Model.fromJson(JSON.stringify(genogramData));
  myDiagram.model.pointsDigits = 1;

  // Layout if no positions are stored
  if (!myDiagram.nodes.all(node => node.isLinkLabel || node.location.isReal())) {
    myDiagram.layoutDiagram(true);
  }

  // Setup identical twins connections
  setupIdenticalTwins(myDiagram);
}

/**
 * Setup identical twins visualization
 */
function setupIdenticalTwins(diagram) {
  const model = diagram.model;
  const nodeDataArray = model.nodeDataArray;

  for (let i = 0; i < nodeDataArray.length; i++) {
    const data1 = nodeDataArray[i];
    let identical = data1.identical;
    if (typeof identical === "string") identical = parseInt(identical);
    if (typeof identical === "number" && !isNaN(identical)) {
      const key1 = data1.key;
      const key2 = identical;
      const data2 = model.findNodeDataForKey(key2);
      if (data2 !== null && data1.mother === data2.mother && data1.father === data2.father) {
        const T1 = diagram.findNodeForKey(key1);
        const T2 = diagram.findNodeForKey(key2);
        const TPL1 = T1.findTreeParentLink();
        const TPL2 = T2.findTreeParentLink();
        if (TPL1 && TPL2) {
          const tlabtempl = diagram.nodeTemplateMap.get("TwinLabel");
          let TLN1 = TPL1.labelNodes.first();
          if (!TLN1) {
            TLN1 = tlabtempl.copy();
            TLN1.labeledLink = TPL1;
            diagram.add(TLN1);
          }
          let TLN2 = TPL2.labelNodes.first();
          if (!TLN2) {
            TLN2 = tlabtempl.copy();
            TLN2.labeledLink = TPL2;
            diagram.add(TLN2);
          }
          let TL = TLN1.findLinksBetween(TLN2).first();
          if (!TL) {
            const tlinktempl = diagram.linkTemplateMap.get("Identical");
            TL = tlinktempl.copy();
            TL.fromNode = TLN1;
            TL.toNode = TLN2;
            diagram.add(TL);
          }
        }
      }
    }
  }
}

/**
 * Update the inspector panel with node data
 */
function updateInspector(data) {
  const insp = document.getElementById("myInspectorDiv");
  if (!insp) return;

  let html = '<table>';
  if (data.name) html += `<tr><td>Name:</td><td>${data.name}</td></tr>`;
  if (data.sex) html += `<tr><td>Sex:</td><td>${data.sex === 'M' ? 'Male' : data.sex === 'F' ? 'Female' : 'Unknown'}</td></tr>`;
  if (data.birth) html += `<tr><td>Birth:</td><td>${data.birth}</td></tr>`;
  if (data.death) html += `<tr><td>Deceased:</td><td>${data.death === true ? 'Yes' : data.death}</td></tr>`;
  if (data.adopted) html += `<tr><td>Adopted:</td><td>${data.adopted}</td></tr>`;
  if (data.multiple) html += `<tr><td>Multiple birth:</td><td>${data.multiple}</td></tr>`;
  if (data.note) html += `<tr><td>Note:</td><td>${data.note}</td></tr>`;
  html += '</table>';

  insp.innerHTML = html;
}

/**
 * Update the statistics panel
 */
function updateStats() {
  const totalMembers = document.getElementById("totalMembers");
  const generations = document.getElementById("generations");
  const probandName = document.getElementById("probandName");

  if (totalMembers) {
    const personNodes = myDiagram.model.nodeDataArray.filter(n => !n.category);
    totalMembers.textContent = personNodes.length;
  }

  if (generations) {
    // Count generations by layer analysis
    const layers = new Set();
    myDiagram.nodes.each(node => {
      if (!node.isLinkLabel && node.data && !node.data.category) {
        // Simple heuristic: use Y position to estimate generation
        layers.add(Math.round(node.location.y / 100));
      }
    });
    generations.textContent = layers.size || '-';
  }

  if (probandName) {
    const probandKey = myDiagram.model.modelData.proband;
    const probandData = myDiagram.model.findNodeDataForKey(probandKey);
    probandName.textContent = probandData ? probandData.name : '-';
  }
}

/**
 * Setup button event handlers
 */
function setupButtons() {
  // Scroll to proband button
  const scrollBtn = document.getElementById("myScrollToProband");
  if (scrollBtn) {
    scrollBtn.addEventListener("click", () => {
      if (typeof myDiagram.model.modelData.proband === "number") {
        const node = myDiagram.findNodeForKey(myDiagram.model.modelData.proband);
        if (node) {
          myDiagram.select(node);
          myDiagram.commandHandler.scrollToPart(node);
        }
      }
    });
  }

  // Print button
  const printBtn = document.getElementById("myPrintButton");
  if (printBtn) {
    printBtn.addEventListener("click", () => {
      const svgWindow = window.open();
      if (!svgWindow) return;
      svgWindow.document.title = "Genogram";
      svgWindow.document.body.style.margin = "0px";
      const printSize = new go.Size(700, 960);
      const bnds = myDiagram.documentBounds;
      let x = bnds.x;
      let y = bnds.y;
      while (y < bnds.bottom) {
        while (x < bnds.right) {
          const svg = myDiagram.makeSvg({
            scale: 1.0,
            position: new go.Point(x, y),
            size: printSize,
            background: "white"
          });
          svgWindow.document.body.appendChild(svg);
          x += printSize.width;
        }
        x = bnds.x;
        y += printSize.height;
      }
      requestAnimationFrame(() => { svgWindow.print(); svgWindow.close(); });
    });
  }

  // Download SVG button
  const downloadBtn = document.getElementById("myDownloadButton");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      const svg = myDiagram.makeSvg({
        scale: 1.0,
        background: "white"
      });
      const svgStr = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgStr], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "genogram.svg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }
}

// Initialize when DOM is ready
window.addEventListener("DOMContentLoaded", init);

// Export for debugging
window.myDiagram = myDiagram;
