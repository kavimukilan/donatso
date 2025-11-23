import * as go from 'gojs';
import { TwinLink } from './GenogramLayout.js';

/**
 * GoJS Genogram Node Templates
 * Based on the official GoJS genogram sample
 */

// Standard genogram colors for attributes
const ATTRIBUTE_COLORS = {
  'A': '#5d8cc1',  // Blue
  'B': '#775a4a',  // Brown
  'C': '#94251e',  // Dark Red
  'D': '#ca6958',  // Coral
  'E': '#68bfaf',  // Teal
  'F': '#23848a',  // Dark Teal
  'G': '#cfdf41',  // Yellow-Green
  'H': '#717c42',  // Olive
  'V': '#332d31',  // Dark Gray
  'M': '#9b59b6',  // Purple
  'default': 'white'
};

/**
 * Get fill color for an attribute code
 */
export function computeFill(attr) {
  if (!attr || attr.length === 0) return ATTRIBUTE_COLORS.default;
  const code = attr[0].toUpperCase();
  return ATTRIBUTE_COLORS[code] || ATTRIBUTE_COLORS.default;
}

/**
 * Compute quadrant alignment for attribute indicators
 * Creates a 2x2 grid pattern for up to 4 attributes
 */
export function computeAlignment(idx) {
  // Position attributes in quadrants: TL, TR, BL, BR
  const xOffset = (idx & 1) === 0 ? -12.5 : 12.5;
  const yOffset = (idx & 2) === 0 ? -12.5 : 12.5;
  return new go.Spot(0.5, 0.5, xOffset, yOffset);
}

/**
 * Check if person is deceased
 */
export function isDead(data) {
  return !!data.death;
}

/**
 * Get figure based on sex
 * Male = Square, Female = Circle, Unknown = Diamond
 */
export function getSexFigure(sex) {
  switch (sex) {
    case 'M': return 'Square';
    case 'F': return 'Circle';
    default: return 'Diamond';  // Unknown sex uses diamond in standard genograms
  }
}

/**
 * Find parents of a node
 */
export function findParents(node, layout) {
  const parents = [];
  if (!(node instanceof go.Node)) return parents;
  const parent = node.findTreeParentNode();
  if (parent && parent.category === layout.MateLabelCategory) {
    const link = parent.labeledLink;
    if (link) {
      const from = link.fromNode;
      if (from) parents.push(from);
      const to = link.toNode;
      if (to) parents.push(to);
    }
  }
  return parents;
}

/**
 * Find mates/spouses of a node
 */
export function findMates(node, layout) {
  const mates = [];
  if (!(node instanceof go.Node)) return mates;
  node.findLinksConnected().each(link => {
    if (link.category === layout.MateCategory) {
      mates.push(link.getOtherNode(node));
    }
  });
  return mates;
}

/**
 * Find children of a node
 */
export function findChildren(node, layout, mate) {
  const children = [];
  node.findLinksConnected().each(link => {
    if (link.category === layout.MateCategory &&
      (!mate || link.getOtherNode(node) === mate)) {
      link.labelNodes.each(label => {
        if (label.category === layout.MateLabelCategory) {
          label.findNodesOutOf().each(child => {
            children.push(child);
          });
        }
      });
    }
  });
  return children;
}

/**
 * Highlight ancestors recursively
 */
function highlightAncestors(node, parts, layout) {
  const parents = findParents(node, layout);
  parts.addAll(parents);
  if (node.data && node.data.adopted === "in") return;
  parents.forEach(parent => highlightAncestors(parent, parts, layout));
}

/**
 * Highlight descendants recursively
 */
function highlightDependents(node, parts, layout) {
  const children = findChildren(node, layout);
  children.forEach(child => {
    if (child.data && child.data.adopted === "in") return;
    parts.add(child);
    highlightDependents(child, parts, layout);
  });
}

/**
 * Highlight related nodes on hover
 */
export function highlightRelated(node, show, layout) {
  if (show) {
    const parts = new go.Set();
    highlightAncestors(node, parts, layout);
    highlightDependents(node, parts, layout);
    if (node.diagram) node.diagram.highlightCollection(parts);
  } else {
    if (node.diagram) node.diagram.clearHighlighteds();
  }
}

/**
 * Create the main person node template (GoJS Genogram style)
 */
export function createNodeTemplate(layout) {
  const nodeSize = 50;

  return new go.Node("Spot", {
    locationSpot: go.Spot.Center,
    locationObjectName: "ICON",
    selectionObjectName: "ICON",
    layoutConditions: go.LayoutConditions.Standard & ~go.LayoutConditions.NodeSized,
    mouseEnter: (e, node) => highlightRelated(node, true, layout),
    mouseLeave: (e, node) => highlightRelated(node, false, layout),
    toolTip: go.GraphObject.build("ToolTip")
      .add(
        new go.Panel("Vertical")
          .add(
            new go.TextBlock({ margin: 4, font: "bold 12pt sans-serif" })
              .bind("text", "name"),
            new go.TextBlock({ margin: 2 })
              .bind("text", "sex", s => s === 'M' ? 'Male' : s === 'F' ? 'Female' : 'Unknown'),
            new go.TextBlock({ margin: 2 })
              .bind("text", "birth", b => b ? `Birth: ${b}` : ""),
            new go.TextBlock({ margin: 2 })
              .bind("text", "death", d => d === true ? "Deceased" : d ? `Death: ${d}` : "")
          )
      )
  })
    .bindTwoWay("location", "loc", go.Point.parse, go.Point.stringifyFixed(1))
    .add(
      // Main shape - Square for male, Circle for female, Diamond for unknown
      new go.Shape({
        name: "ICON",
        width: nodeSize,
        height: nodeSize,
        fill: "white",
        stroke: "#333",
        strokeWidth: 2,
        portId: ""
      })
        .bind("figure", "sex", getSexFigure)
        .bind("fill"),

      // Attribute indicators panel - colored quadrants
      new go.Panel("Spot", {
        isClipping: true,
        width: nodeSize - 1,
        height: nodeSize - 1,
        itemTemplate:
          new go.Panel()
            .bindObject("alignment", "itemIndex", computeAlignment)
            .add(
              new go.Shape({
                width: 25,
                height: 25,
                strokeWidth: 0,
                toolTip:
                  go.GraphObject.build("ToolTip")
                    .add(
                      new go.TextBlock({ margin: 3 })
                        .bind("text", "")
                    )
              })
                .bind("fill", "", computeFill)
            )
      })
        .bind("itemArray", "a")
        .add(
          new go.Shape({
            width: nodeSize - 1,
            height: nodeSize - 1,
            strokeWidth: 0,
            fill: "transparent"
          })
            .bind("figure", "sex", getSexFigure)
        ),

      // Proband indicator (arrow pointing to the focal individual)
      new go.Shape({
        alignment: go.Spot.BottomLeft,
        alignmentFocus: go.Spot.TopRight,
        fill: "darkorange",
        stroke: "darkorange",
        strokeWidth: 3,
        scale: 2,
        geometryString: "F1 M20 0 L14.5 5.5 12 1z M18 1 L0 10"
      })
        .bindModel("visible", "proband", (key, shp) => shp.part.key === key),

      // Selection/highlight border
      new go.Shape({
        fill: null,
        stroke: null,
        strokeWidth: 4,
        width: nodeSize + 6,
        height: nodeSize + 6
      })
        .bind("figure", "sex", getSexFigure)
        .bindObject("stroke", "isHighlighted", h => h ? "lightcoral" : null)
        .bindObject("stroke", "isSelected", s => s ? "#3498db" : null),

      // Deceased indicator (diagonal line through shape)
      new go.Shape({
        stroke: "#333",
        strokeWidth: 2,
        opacity: 0,
        geometryString: "M0 0 L60 60"
      })
        .bind("opacity", "", data =>
          (isDead(data) && (!data.reproduction || data.reproduction === "T" || data.reproduction === "SB")) ? 1 : 0
        ),

      // Stillbirth indicator (small filled shape)
      new go.Shape({
        width: 15,
        height: 15,
        fill: "#333",
        stroke: null,
        opacity: 0
      })
        .bind("figure", "sex", getSexFigure)
        .bind("opacity", "reproduction", r => r === "SB" ? 1 : 0),

      // Adopted indicator - brackets
      new go.Shape({
        stroke: "#333",
        strokeWidth: 2,
        opacity: 0,
        width: nodeSize + 6,
        height: nodeSize + 6,
        geometryString: "M10 0 L0 0 0 56 10 56 M46 0 L56 0 56 56 46 56"
      })
        .bind("opacity", "adopted", ad => (ad === "in" || ad === "out") ? 1 : 0),

      // Multiple birth indicator (shows twin/triplet number)
      new go.TextBlock({
        alignment: new go.Spot(1, 0, 5, 0),
        alignmentFocus: go.Spot.TopLeft,
        font: "9pt sans-serif",
        stroke: "#666",
        visible: false
      })
        .bind("visible", "multiple", m => m !== undefined && m > 0)
        .bind("text", "multiple", m => m ? `×${m}` : ""),

      // Name label below the node
      new go.TextBlock({
        alignment: go.Spot.Bottom,
        alignmentFocus: new go.Spot(0.5, 0, 0, -8),
        maxSize: new go.Size(90, 40),
        font: "bold 11pt sans-serif",
        textAlign: "center",
        wrap: go.Wrap.DesiredSize,
        overflow: go.TextOverflow.Ellipsis,
        editable: true,
        background: "rgba(255,255,255,0.85)"
      })
        .bindTwoWay("text", "name")
    );
}

/**
 * Create the parent-child link template with twin support
 */
export function createLinkTemplate() {
  return new TwinLink({
    selectable: false,
    routing: go.Routing.Orthogonal,
    fromEndSegmentLength: 4,
    toEndSegmentLength: 20,
    fromSpot: go.Spot.Bottom,
    toSpot: go.Spot.Top,
    layerName: "Background"
  })
    .bindTwoWay("points")
    .add(
      new go.Shape({
        stroke: "#333",
        strokeWidth: 2,
        strokeMiterLimit: 1
      })
        .bindObject("strokeDashArray", "toNode", child =>
          child.data && child.data.adopted === "in" ? [6, 4] : null
        )
        .bindObject("stroke", "isHighlighted", h => h ? "#27ae60" : "#333")
    );
}

/**
 * Create the mate (marriage/partnership) link template
 */
export function createMateLinkTemplate() {
  return new go.Link({
    selectable: false,
    routing: go.Routing.AvoidsNodes,
    fromSpot: go.Spot.LeftRightSides,
    toSpot: go.Spot.LeftRightSides,
    isTreeLink: false,
    layerName: "Background"
  })
    .bindTwoWay("points")
    .add(
      // Main marriage line
      new go.Shape({
        strokeWidth: 2,
        stroke: "#2980b9"
      })
        .bindObject("stroke", "isHighlighted", h => h ? "#27ae60" : "#2980b9"),

      // Divorce indicator (double slash marks)
      new go.Shape({
        visible: false,
        stroke: "#c0392b",
        strokeWidth: 2,
        geometryString: "M12 0 L0 16 M16 0 L4 16",
        segmentIndex: 1,
        segmentFraction: 0.5
      })
        .bind("visible", "divorced"),

      // Separated indicator (single slash)
      new go.Shape({
        visible: false,
        stroke: "#e67e22",
        strokeWidth: 2,
        geometryString: "M8 0 L0 12",
        segmentIndex: 1,
        segmentFraction: 0.5
      })
        .bind("visible", "separated")
    );
}

/**
 * Create the MateLabel node template (invisible node at center of mate link)
 */
export function createMateLabelTemplate() {
  return new go.Node({
    selectable: false,
    width: 1,
    height: 1,
    locationSpot: go.Spot.Center
  })
    .bindTwoWay("location", "loc", go.Point.parse, go.Point.stringifyFixed(1));
}

/**
 * Create the identical twin link template (horizontal line between twins)
 */
export function createIdenticalLinkTemplate() {
  return new go.Link({
    selectable: false,
    isLayoutPositioned: false,
    isTreeLink: false,
    layerName: "Background"
  })
    .add(
      new go.Shape({
        strokeWidth: 2,
        stroke: "#8e44ad"  // Purple for identical twins
      })
    );
}

/**
 * Create the TwinLabel node template (for connecting twin lines)
 */
export function createTwinLabelTemplate() {
  return new go.Node({
    selectable: false,
    isLayoutPositioned: false,
    width: 1,
    height: 1,
    segmentIndex: -2,
    segmentFraction: 0.333
  });
}
