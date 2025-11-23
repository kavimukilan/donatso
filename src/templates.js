import * as go from 'gojs';
import { TwinLink } from './GenogramLayout.js';

/**
 * Compute fill color based on attribute
 */
export function computeFill(attr) {
  switch (attr[0].toUpperCase()) {
    case "A": return '#5d8cc1';
    case "B": return '#775a4a';
    case "C": return '#94251e';
    case "D": return '#ca6958';
    case "E": return '#68bfaf';
    case "F": return '#23848a';
    case "G": return '#cfdf41';
    case "H": return '#717c42';
    case "V": return '#332d31';
    default: return "white";
  }
}

/**
 * Compute alignment for attribute indicators in quadrants
 */
export function computeAlignment(idx) {
  return new go.Spot(0.5, 0.5, (idx & 1) === 0 ? -12.5 : 12.5, (idx & 2) === 0 ? -12.5 : 12.5);
}

/**
 * Check if person is deceased
 */
export function isDead(data) {
  return !!data.death ? 1 : 0;
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
 * Find children of a node (optionally with a specific mate)
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
 * Highlight ancestors of a node
 */
function highlightAncestors(node, parts, layout) {
  const parents = findParents(node, layout);
  parts.addAll(parents);
  if (node.data.adopted === "in") return;
  parents.forEach(parent => highlightAncestors(parent, parts, layout));
}

/**
 * Highlight descendants of a node
 */
function highlightDependents(node, parts, layout) {
  const children = findChildren(node, layout);
  children.forEach(child => {
    if (child.data.adopted === "in") return;
    parts.add(child);
    highlightDependents(child, parts, layout);
  });
}

/**
 * Highlight related nodes on mouse enter/leave
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
 * Create the main person node template
 */
export function createNodeTemplate(layout) {
  return new go.Node("Spot", {
    locationSpot: go.Spot.Center,
    layoutConditions: go.LayoutConditions.Standard & ~go.LayoutConditions.NodeSized,
    mouseEnter: (e, node) => highlightRelated(node, true, layout),
    mouseLeave: (e, node) => highlightRelated(node, false, layout)
  })
    .bindTwoWay("location", "loc", go.Point.parse, go.Point.stringifyFixed(1))
    .add(
      // Main shape (square for male, circle for female, triangle for unknown)
      new go.Shape({
        name: "ICON",
        width: 50, height: 50,
        fill: "white", stroke: "black", strokeWidth: 1,
        portId: ""
      })
        .bind("figure", "sex", s => s === "M" ? "Square" : (s === "F" ? "Circle" : "Triangle"))
        .bind("fill"),

      // Attribute indicators panel (genetic markers)
      new go.Panel("Spot", {
        isClipping: true,
        width: 49, height: 49,
        itemTemplate:
          new go.Panel()
            .bindObject("alignment", "itemIndex", computeAlignment)
            .add(
              new go.Shape({
                width: 25, height: 25, strokeWidth: 0,
                toolTip:
                  go.GraphObject.build("ToolTip")
                    .add(
                      new go.TextBlock()
                        .bind("text", "")
                    )
              })
                .bind("fill", "", computeFill)
            )
      })
        .bind("itemArray", "a")
        .add(
          new go.Shape({ width: 49, height: 49, strokeWidth: 0 })
            .bind("figure", "sex", s => s === "M" ? "Square" : (s === "F" ? "Circle" : "Triangle"))
        ),

      // Proband indicator (arrow)
      new go.Shape({
        alignment: go.Spot.BottomLeft, alignmentFocus: go.Spot.TopRight,
        fill: "darkorange", stroke: "darkorange", strokeWidth: 3, scale: 2,
        geometryString: "F1 M20 0 L14.5 5.5 12 1z M18 1 L0 10"
      })
        .bindModel("visible", "proband", (key, shp) => shp.part.key === key),

      // Highlight border
      new go.Shape({ fill: null, stroke: null, strokeWidth: 4, width: 55, height: 55 })
        .bindObject("stroke", "isHighlighted", h => h ? "lightcoral" : null),

      // Deceased indicator (diagonal line)
      new go.Shape({ opacity: 0, geometryString: "M60 0 L0 60" })
        .bind("opacity", "", data => (isDead(data) && (!data.reproduction || data.reproduction === "T" || data.reproduction === "SB")) ? 1 : 0),

      // Adopted indicator (brackets)
      new go.Shape({ opacity: 0, width: 55, height: 55, geometryString: "M10 0 L0 0 0 55 10 55 M45 0 L55 0 55 55 45 55" })
        .bind("opacity", "adopted", ad => (ad === "in" || ad === "out") ? 1 : 0),

      // Name label
      new go.TextBlock({
        alignment: go.Spot.Bottom, alignmentFocus: new go.Spot(0.5, 0, 0, -5),
        height: 28,
        font: "bold 10pt sans-serif",
        textAlign: "center",
        maxSize: new go.Size(85, NaN),
        background: "rgba(255,255,255,0.75)",
        editable: true
      })
        .bindTwoWay("text", "name")
    );
}

/**
 * Create the parent-child link template
 */
export function createLinkTemplate() {
  return new TwinLink({
    selectable: false,
    routing: go.Routing.Orthogonal, fromEndSegmentLength: 50,
    fromSpot: go.Spot.Bottom, toSpot: go.Spot.Top,
    layerName: "Background"
  })
    .bindTwoWay("points")
    .add(
      new go.Shape({ stroke: "black", strokeWidth: 2, strokeMiterLimit: 1 })
        .bindObject("strokeDashArray", "toNode", child => child.data.adopted === "in" ? [6, 4] : null)
        .bindObject("stroke", "isHighlighted", h => h ? "green" : "black")
    );
}

/**
 * Create the mate (marriage/partnership) link template
 */
export function createMateLinkTemplate() {
  return new go.Link({
    selectable: false,
    routing: go.Routing.AvoidsNodes,
    fromSpot: go.Spot.LeftRightSides, toSpot: go.Spot.LeftRightSides,
    isTreeLink: false, layerName: "Background"
  })
    .bindTwoWay("points")
    .add(
      new go.Shape({ strokeWidth: 2, stroke: "blue" })
        .bindObject("stroke", "isHighlighted", h => h ? "green" : "blue"),
      new go.Shape({ visible: false, geometryString: "M12 0 L0 16 M16 0 L 4 16", segmentIndex: 1 })
        .bind("visible", "divorced")
    );
}

/**
 * Create the MateLabel node template (invisible node at center of mate link)
 */
export function createMateLabelTemplate() {
  return new go.Node({
    selectable: false,
    width: 1, height: 1,
    locationSpot: go.Spot.Center
  })
    .bindTwoWay("location", "loc", go.Point.parse, go.Point.stringifyFixed(1));
}

/**
 * Create the Identical twin link template
 */
export function createIdenticalLinkTemplate() {
  return new go.Link({
    selectable: false, isLayoutPositioned: false,
    isTreeLink: false, layerName: "Background"
  })
    .add(
      new go.Shape({ strokeWidth: 2, stroke: "slateblue" })
    );
}

/**
 * Create the TwinLabel node template
 */
export function createTwinLabelTemplate() {
  return new go.Node({
    selectable: false, isLayoutPositioned: false,
    width: 1, height: 1,
    segmentIndex: -2, segmentFraction: 0.333
  });
}
