/**
 * Utility functions for handling multiple births (twins, triplets, etc.)
 * in the GoJS genogram
 */

// Counter for generating unique multiple birth IDs
let multipleBirthCounter = 100;

/**
 * Generate a unique multiple birth ID
 * @returns {number} Unique ID for grouping siblings born together
 */
export function generateMultipleBirthId() {
  return multipleBirthCounter++;
}

/**
 * Create a set of twins
 * @param {Object} options - Configuration for twins
 * @param {number} options.startKey - Starting key for the first twin
 * @param {number} options.mother - Mother's key
 * @param {number} options.father - Father's key
 * @param {Array} options.twins - Array of twin info [{name, sex, attributes, identical?}]
 * @returns {Object} { nodes: [], multipleBirthId: number }
 */
export function createTwins({ startKey, mother, father, twins }) {
  const multipleBirthId = generateMultipleBirthId();
  const nodes = [];

  twins.forEach((twin, index) => {
    const node = {
      key: startKey + index,
      name: twin.name,
      sex: twin.sex,
      mother: mother,
      father: father,
      birth: twin.birth || "",
      death: twin.death || "",
      note: twin.note || "",
      multiple: multipleBirthId,
      a: twin.attributes || []
    };

    // If identical to another twin, reference them
    if (twin.identicalTo !== undefined) {
      node.identical = startKey + twin.identicalTo;
    }

    nodes.push(node);
  });

  return { nodes, multipleBirthId };
}

/**
 * Create identical twins
 * @param {Object} options - Configuration
 * @param {number} options.startKey - Starting key
 * @param {number} options.mother - Mother's key
 * @param {number} options.father - Father's key
 * @param {string} options.name1 - First twin's name
 * @param {string} options.name2 - Second twin's name
 * @param {string} options.sex - Sex of both twins (M or F)
 * @param {Array} options.attributes1 - First twin's attributes
 * @param {Array} options.attributes2 - Second twin's attributes
 * @returns {Object} { nodes: [], multipleBirthId: number }
 */
export function createIdenticalTwins({ startKey, mother, father, name1, name2, sex, attributes1 = [], attributes2 = [] }) {
  return createTwins({
    startKey,
    mother,
    father,
    twins: [
      { name: name1, sex, attributes: attributes1 },
      { name: name2, sex, attributes: attributes2, identicalTo: 0 }
    ]
  });
}

/**
 * Create fraternal twins
 * @param {Object} options - Configuration
 * @param {number} options.startKey - Starting key
 * @param {number} options.mother - Mother's key
 * @param {number} options.father - Father's key
 * @param {string} options.name1 - First twin's name
 * @param {string} options.name2 - Second twin's name
 * @param {string} options.sex1 - First twin's sex
 * @param {string} options.sex2 - Second twin's sex
 * @param {Array} options.attributes1 - First twin's attributes
 * @param {Array} options.attributes2 - Second twin's attributes
 * @returns {Object} { nodes: [], multipleBirthId: number }
 */
export function createFraternalTwins({ startKey, mother, father, name1, name2, sex1, sex2, attributes1 = [], attributes2 = [] }) {
  return createTwins({
    startKey,
    mother,
    father,
    twins: [
      { name: name1, sex: sex1, attributes: attributes1 },
      { name: name2, sex: sex2, attributes: attributes2 }
    ]
  });
}

/**
 * Create triplets
 * @param {Object} options - Configuration
 * @param {number} options.startKey - Starting key
 * @param {number} options.mother - Mother's key
 * @param {number} options.father - Father's key
 * @param {Array} options.triplets - Array of triplet info [{name, sex, attributes, identicalTo?}]
 * @returns {Object} { nodes: [], multipleBirthId: number }
 */
export function createTriplets({ startKey, mother, father, triplets }) {
  return createTwins({ startKey, mother, father, twins: triplets });
}

/**
 * Create quadruplets
 * @param {Object} options - Configuration
 * @param {number} options.startKey - Starting key
 * @param {number} options.mother - Mother's key
 * @param {number} options.father - Father's key
 * @param {Array} options.quads - Array of quad info [{name, sex, attributes, identicalTo?}]
 * @returns {Object} { nodes: [], multipleBirthId: number }
 */
export function createQuadruplets({ startKey, mother, father, quads }) {
  return createTwins({ startKey, mother, father, twins: quads });
}

/**
 * Generate parent-child links for multiple birth children
 * @param {number} parentMateLabelKey - The key of the MateLabel node (parent pair)
 * @param {Array} childKeys - Array of child keys
 * @returns {Array} Array of link objects
 */
export function createParentChildLinks(parentMateLabelKey, childKeys) {
  return childKeys.map(childKey => ({
    from: parentMateLabelKey,
    to: childKey
  }));
}

/**
 * Multiple birth types enumeration
 */
export const MultipleBirthType = {
  TWINS: 2,
  TRIPLETS: 3,
  QUADRUPLETS: 4,
  QUINTUPLETS: 5,
  SEXTUPLETS: 6
};

/**
 * Helper to add multiple birth nodes to existing data
 * @param {Object} genogramData - The existing genogram data object
 * @param {Object} options - Configuration for the multiple birth
 * @param {number} options.parentMateLabelKey - Key of the parent's MateLabel
 * @param {Array} options.children - Array of child data
 * @param {Array<number>} options.identicalPairs - Array of index pairs that are identical
 * @returns {Object} Updated genogramData with new nodes and links
 */
export function addMultipleBirth(genogramData, { parentMateLabelKey, children, identicalPairs = [] }) {
  const multipleBirthId = generateMultipleBirthId();
  const startKey = Math.max(...genogramData.nodeDataArray.filter(n => !n.category).map(n => n.key)) + 1;

  // Create nodes for each child
  const newNodes = children.map((child, index) => {
    const node = {
      key: startKey + index,
      name: child.name,
      sex: child.sex,
      mother: child.mother,
      father: child.father,
      birth: child.birth || "",
      death: child.death || "",
      note: child.note || "",
      multiple: multipleBirthId,
      a: child.attributes || []
    };

    return node;
  });

  // Add identical links
  identicalPairs.forEach(([idx1, idx2]) => {
    if (idx2 > idx1) {
      newNodes[idx2].identical = startKey + idx1;
    } else {
      newNodes[idx1].identical = startKey + idx2;
    }
  });

  // Create parent-child links
  const newLinks = newNodes.map(node => ({
    from: parentMateLabelKey,
    to: node.key
  }));

  // Return updated data
  return {
    ...genogramData,
    nodeDataArray: [...genogramData.nodeDataArray, ...newNodes],
    linkDataArray: [...genogramData.linkDataArray, ...newLinks]
  };
}
