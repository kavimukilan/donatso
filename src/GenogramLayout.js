import * as go from 'gojs';

/**
 * Custom GenogramLayout class extending LayeredDigraphLayout
 * Handles the specialized layout requirements for family trees/genograms
 */
export class GenogramLayout extends go.LayeredDigraphLayout {
  constructor(init) {
    super();
    this.MateCategory = "Mate";
    this.MateLabelCategory = "MateLabel";
    this.ChildCategory = "";
    this.initializeOption = go.LayeredDigraphInit.DepthFirstIn;
    this.spouseSpacing = 30;
    this.isRouting = false;
    if (init) Object.assign(this, init);
  }

  makeNetwork(coll) {
    const net = this.createNetwork();
    if (coll instanceof go.Diagram) {
      this.add(net, coll.nodes, true);
      this.add(net, coll.links, true);
    } else if (coll instanceof go.Group) {
      this.add(net, coll.memberParts, false);
    } else if (coll.iterator) {
      this.add(net, coll.iterator, false);
    }
    return net;
  }

  add(net, coll, nonmemberonly) {
    const horiz = this.direction == 0.0 || this.direction == 180.0;
    const multiSpousePeople = new go.Set();
    const it = coll.iterator;

    while (it.next()) {
      const node = it.value;
      if (!(node instanceof go.Node) || !node.data) continue;
      if (!node.isLayoutPositioned || !node.isVisible()) continue;
      if (nonmemberonly && node.containingGroup !== null) continue;

      if (node.isLinkLabel) {
        const link = node.labeledLink;
        if (link.category === this.MateCategory) {
          const spouseA = link.fromNode;
          const spouseB = link.toNode;
          const vertex = net.addNode(node);
          if (horiz) {
            vertex.height = spouseA.actualBounds.height + this.spouseSpacing + spouseB.actualBounds.height;
            vertex.width = Math.max(spouseA.actualBounds.width, spouseB.actualBounds.width);
            vertex.focus = new go.Point(vertex.width / 2, spouseA.actualBounds.height + this.spouseSpacing / 2);
          } else {
            vertex.width = spouseA.actualBounds.width + this.spouseSpacing + spouseB.actualBounds.width;
            vertex.height = Math.max(spouseA.actualBounds.height, spouseB.actualBounds.height);
            vertex.focus = new go.Point(spouseA.actualBounds.width + this.spouseSpacing / 2, vertex.height / 2);
          }
        }
      } else {
        let mates = this.countMates(node);
        if (mates === 0) {
          net.addNode(node);
        } else if (mates > 1) {
          multiSpousePeople.add(node);
        }
      }
    }

    it.reset();
    while (it.next()) {
      const link = it.value;
      if (!(link instanceof go.Link)) continue;
      if (!link.isLayoutPositioned || !link.isVisible()) continue;
      if (nonmemberonly && link.containingGroup !== null) continue;

      if (link.category === this.ChildCategory && link.data) {
        const parent = net.findVertex(link.fromNode);
        const child = net.findVertex(link.toNode);
        if (child !== null) {
          net.linkVertexes(parent, child, link);
        } else {
          link.toNode.linksConnected.each(l => {
            if (l.category !== this.MateCategory || !l.data) return;
            const mlab = l.labelNodes.first();
            const mlabvert = net.findVertex(mlab);
            if (mlabvert !== null) {
              net.linkVertexes(parent, mlabvert, link);
            }
          });
        }
      }
    }

    // Handle multiple spouses
    while (multiSpousePeople.count > 0) {
      const node = multiSpousePeople.first();
      const cohort = new go.Set();
      this.extendCohort(cohort, node);
      const sorted = cohort.toArray();
      sorted.sort((a, b) => this.countMates(b) - this.countMates(a));
      const start = sorted[0];
      const map = new go.Map();
      this.walkMates(start, false, 1000000000, 500000000, map);
      sorted.sort((a, b) => map.get(a) - map.get(b));
      const verts = [];
      const seen = new go.Set();

      for (let i = 0; i < sorted.length - 1; i++) {
        const n = sorted[i];
        n.linksConnected.each(l => {
          if (l.category === this.MateCategory) {
            const lab = l.labelNodes.first();
            if (lab) {
              const v = net.findVertex(lab);
              if (v && !seen.has(v)) {
                verts.push(v);
                seen.add(v);
              }
            }
          }
        });
      }

      const dummyvert = net.createVertex();
      net.addVertex(dummyvert);
      for (let i = 0; i < verts.length; i++) {
        const v = verts[i];
        net.linkVertexes(dummyvert, v, null);
        if (i > 0) {
          const w = verts[i - 1];
          const dummy = net.createVertex();
          net.addVertex(dummy);
          net.linkVertexes(dummy, w, null);
          net.linkVertexes(dummy, v, null);
          net.linkVertexes(dummy, w, null);
          net.linkVertexes(dummy, v, null);
        }
      }
      multiSpousePeople.removeAll(cohort);
    }
  }

  extendCohort(coll, node) {
    if (coll.has(node)) return;
    coll.add(node);
    node.linksConnected.each(l => {
      if (l.category === this.MateCategory) {
        this.extendCohort(coll, l.fromNode);
        this.extendCohort(coll, l.toNode);
      }
    });
  }

  countMates(node) {
    let count = 0;
    node.linksConnected.each(l => {
      if (l.category === this.MateCategory) count++;
    });
    return count;
  }

  walkMates(node, side, val, level, map) {
    if (map.has(node)) return;
    map.set(node, val);
    const count = this.countMates(node);
    level /= 2;
    let idx = 0;
    node.linksConnected.each(l => {
      if (l.category === this.MateCategory) {
        const other = l.getOtherNode(node);
        if (map.has(other)) return;
        idx++;
        const newside = (idx <= count / 2) ? side : !side;
        this.walkMates(other, newside, val + (newside ? level : -level), level, map);
      }
    });
  }

  assignLayers() {
    super.assignLayers();
    const horiz = this.direction == 0.0 || this.direction == 180.0;
    const maxsizes = [];
    this.network.vertexes.each(v => {
      const lay = v.layer;
      let max = maxsizes[lay];
      if (max === undefined) maxsizes[lay] = max = 0;
      const sz = (horiz ? v.width : v.height);
      if (sz > max) maxsizes[lay] = sz;
    });
    this.network.vertexes.each(v => {
      const lay = v.layer;
      const max = maxsizes[lay];
      if (horiz) {
        v.focus = new go.Point(0, v.height / 2);
        v.width = max;
      } else {
        v.focus = new go.Point(v.width / 2, 0);
        v.height = max;
      }
    });
  }

  initializeIndices() {
    super.initializeIndices();
    const vertical = this.direction === 90 || this.direction === 270;
    this.network.edges.each(e => {
      if (e.fromVertex.node && e.fromVertex.node.isLinkLabel) {
        e.portFromPos = vertical ? e.fromVertex.focusX : e.fromVertex.focusY;
      }
      if (e.toVertex.node && e.toVertex.node.isLinkLabel) {
        e.portToPos = vertical ? e.toVertex.focusX : e.toVertex.focusY;
      }
    });

    const layers = [];
    this.network.vertexes.each(v => {
      const lay = v.layer;
      if (layers[lay] === undefined) {
        layers[lay] = [v];
      } else {
        layers[lay].push(v);
      }
    });

    layers.forEach(a => {
      a.sort((v, w) => {
        const vbirth = this.findMultipleBirth(v);
        const wbirth = this.findMultipleBirth(w);
        if (vbirth < wbirth) return -1;
        if (vbirth > wbirth) return 1;
        return 0;
      });
      a.forEach((v, i) => v.index = i);
    });
  }

  findMultipleBirth(v) {
    const node = v.node;
    if (node && node.data) {
      if (node.category === this.MateLabelCategory) {
        const link = node.labeledLink;
        if (link) {
          const fn = link.fromNode;
          if (fn && fn.data && fn.data.multiple !== undefined) return fn.data.multiple;
          const tn = link.toNode;
          if (tn && tn.data && tn.data.multiple !== undefined) return tn.data.multiple;
        }
      } else {
        if (node.data.multiple !== undefined) return node.data.multiple;
      }
    }
    return 0;
  }

  commitNodes() {
    super.commitNodes();
    this.network.vertexes.each(v => {
      if (v.node !== null && !v.node.isLinkLabel) {
        v.node.position = new go.Point(v.x, v.y);
      }
    });

    const horiz = this.direction == 0.0 || this.direction == 180.0;
    this.network.vertexes.each(v => {
      if (v.node === null) return;
      if (!v.node.isLinkLabel) return;
      const labnode = v.node;
      const lablink = labnode.labeledLink;
      lablink.invalidateRoute();
      let spouseA = lablink.fromNode;
      let spouseB = lablink.toNode;

      if (spouseA.opacity > 0 && spouseB.opacity > 0) {
        const labA = this.findOtherMateLinkLabelNode(spouseA, lablink);
        const labB = this.findOtherMateLinkLabelNode(spouseB, lablink);
        if (labA) {
          const vA = this.network.findVertex(labA);
          if (vA && vA.x > v.x) {
            const temp = spouseA; spouseA = spouseB; spouseB = temp;
          }
        } else if (labB) {
          const vB = this.network.findVertex(labB);
          if (vB && vB.x < v.x) {
            const temp = spouseA; spouseA = spouseB; spouseB = temp;
          }
        }
        spouseA.moveTo(v.x, v.y);
        if (horiz) {
          spouseB.moveTo(v.x, v.y + spouseA.actualBounds.height + this.spouseSpacing);
        } else {
          spouseB.moveTo(v.x + spouseA.actualBounds.width + this.spouseSpacing, v.y);
        }
      } else if (spouseA.opacity === 0) {
        const pos = horiz
          ? new go.Point(v.x, v.centerY - spouseB.actualBounds.height / 2)
          : new go.Point(v.centerX - spouseB.actualBounds.width / 2, v.y);
        spouseB.move(pos);
        if (horiz) pos.y++; else pos.x++;
        spouseA.move(pos);
      } else if (spouseB.opacity === 0) {
        const pos = horiz
          ? new go.Point(v.x, v.centerY - spouseA.actualBounds.height / 2)
          : new go.Point(v.centerX - spouseA.actualBounds.width / 2, v.y);
        spouseA.move(pos);
        if (horiz) pos.y++; else pos.x++;
        spouseB.move(pos);
      }
    });
  }

  findOtherMateLinkLabelNode(node, link) {
    const it = node.linksConnected;
    while (it.next()) {
      const l = it.value;
      if (l.category === this.MateCategory && l !== link) return l.labelNodes.first();
    }
    return null;
  }
}

/**
 * Custom TwinLink class for handling twin connections
 */
export class TwinLink extends go.Link {
  computePoints() {
    const result = super.computePoints();
    const pts = this.points;
    if (pts.length >= 4) {
      const birthId = this.toNode.data["multiple"];
      if (birthId) {
        const parents = this.fromNode;
        let sameBirth = 0;
        let sumX = 0;
        const it = parents.findNodesOutOf();
        while (it.next()) {
          const child = it.value;
          if (child.data["multiple"] === birthId) {
            sameBirth++;
            sumX += child.location.x;
          }
        }
        if (sameBirth > 0 && !isNaN(sumX)) {
          const midX = sumX / sameBirth;
          const oldp = pts.elt(pts.length - 3);
          pts.setElt(pts.length - 3, new go.Point(midX, oldp.y));
          pts.setElt(pts.length - 2, pts.elt(pts.length - 1));
        }
      }
    }
    return result;
  }
}
