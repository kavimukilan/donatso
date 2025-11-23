/**
 * Genogram Data in donatso/family-chart format
 * Converted from GoJS genogram sample data
 */

// Proband (focal individual)
export const PROBAND_ID = 'bill';

/**
 * Relationship statuses between couples
 * Key format: 'person1-person2' (alphabetically sorted)
 */
export const relationshipStatus = {
  'claire-claire-ex': 'divorced'  // Claire and Mark are divorced
};

/**
 * Family data in donatso format
 * Each person has: id, data (personal info), rels (relationships)
 */
export const genogramData = [
  // Generation 1 - Great-great grandparents
  {
    id: 'maternal-great-great-f',
    data: { 'first name': 'Martha', gender: 'F', birthday: '1890', deceased: true, attributes: ['D68'] },
    rels: { spouses: ['maternal-great-great-m'], children: ['maternal-great-f'] }
  },
  {
    id: 'maternal-great-great-m',
    data: { 'first name': 'George', gender: 'M', birthday: '1888', deceased: true, attributes: ['E568'] },
    rels: { spouses: ['maternal-great-great-f'], children: ['maternal-great-f'] }
  },

  // Generation 2 - Great grandparents
  {
    id: 'paternal-great-m',
    data: { 'first name': 'Henry', gender: 'M', birthday: '1900', deceased: true, attributes: ['F0834'] },
    rels: { spouses: ['paternal-great-f'], children: ['paternal-grandfather'] }
  },
  {
    id: 'paternal-great-f',
    data: { 'first name': 'Margaret', gender: 'F', birthday: '1902', deceased: true, attributes: ['G294'] },
    rels: { spouses: ['paternal-great-m'], children: ['paternal-grandfather', 'great-uncle-p', 'great-aunt-p'] }
  },
  {
    id: 'maternal-great-m',
    data: { 'first name': 'William', gender: 'M', birthday: '1895', deceased: true, attributes: ['H34'] },
    rels: { spouses: ['maternal-great-f'], children: ['maternal-grandmother', 'great-uncle-m', 'great-aunt-m'] }
  },
  {
    id: 'maternal-great-f',
    data: { 'first name': 'Rose', gender: 'F', birthday: '1898', deceased: true, attributes: ['A34'] },
    rels: { spouses: ['maternal-great-m'], children: ['maternal-grandmother', 'great-uncle-m', 'great-aunt-m'], parents: ['maternal-great-great-f', 'maternal-great-great-m'] }
  },

  // Generation 3 - Grandparents
  {
    id: 'paternal-grandfather',
    data: { 'first name': 'James', gender: 'M', birthday: '1925', deceased: true, attributes: ['D02934', 'G4'] },
    rels: { spouses: ['paternal-grandmother'], children: ['aaron', 'uncle-p'], parents: ['paternal-great-m', 'paternal-great-f'] }
  },
  {
    id: 'paternal-grandmother',
    data: { 'first name': 'Dorothy', gender: 'F', birthday: '1928', deceased: true, attributes: ['E5690'] },
    rels: { spouses: ['paternal-grandfather'], children: ['aaron', 'uncle-p'] }
  },
  {
    id: 'maternal-grandfather',
    data: { 'first name': 'Robert', gender: 'M', birthday: '1930', attributes: ['C23894'] },
    rels: { spouses: ['maternal-grandmother'], children: ['alice', 'aunt-m'] }
  },
  {
    id: 'maternal-grandmother',
    data: { 'first name': 'Helen', gender: 'F', birthday: '1932', attributes: ['D23'] },
    rels: { spouses: ['maternal-grandfather'], children: ['alice', 'aunt-m'], parents: ['maternal-great-m', 'maternal-great-f'] }
  },
  {
    id: 'great-uncle-p',
    data: { 'first name': 'Great Uncle', gender: 'M', birthday: '1922', deceased: true, attributes: ['H45069', 'G4'] },
    rels: { parents: ['paternal-great-m', 'paternal-great-f'] }
  },
  {
    id: 'great-aunt-p',
    data: { 'first name': 'Great Aunt', gender: 'F', birthday: '1924', deceased: true, attributes: ['A2'] },
    rels: { parents: ['paternal-great-m', 'paternal-great-f'] }
  },
  {
    id: 'great-uncle-m',
    data: { 'first name': 'Great Uncle', gender: 'M', birthday: '1920', deceased: true, attributes: ['B997'] },
    rels: { parents: ['maternal-great-m', 'maternal-great-f'] }
  },
  {
    id: 'great-aunt-m',
    data: { 'first name': 'Great Aunt', gender: 'F', birthday: '1923', attributes: ['C09568'] },
    rels: { parents: ['maternal-great-m', 'maternal-great-f'] }
  },

  // Generation 4 - Parents & Aunts/Uncles
  {
    id: 'aaron',
    data: { 'first name': 'Aaron', gender: 'M', birthday: '1955', attributes: ['A123', 'B74', 'D85', 'G4'] },
    rels: { spouses: ['alice'], children: ['bob', 'bill', 'claire', 'carol', 'chloe'], parents: ['paternal-grandfather', 'paternal-grandmother'] }
  },
  {
    id: 'alice',
    data: { 'first name': 'Alice', gender: 'F', birthday: '1958', attributes: ['B74', 'C12', 'D85', 'V4'] },
    rels: { spouses: ['aaron'], children: ['bob', 'bill', 'claire', 'carol', 'chloe'], parents: ['maternal-grandfather', 'maternal-grandmother'] }
  },
  {
    id: 'uncle-p',
    data: { 'first name': 'Uncle', gender: 'M', birthday: '1952', attributes: ['B5408', 'G4'] },
    rels: { parents: ['paternal-grandfather', 'paternal-grandmother'] }
  },
  {
    id: 'aunt-m',
    data: { 'first name': 'Aunt', gender: 'F', birthday: '1960', attributes: ['E3405'] },
    rels: { spouses: ['uncle-m2'], children: ['cousin'], parents: ['maternal-grandfather', 'maternal-grandmother'] }
  },
  {
    id: 'uncle-m2',
    data: { 'first name': 'Uncle', gender: 'M', birthday: '1958', attributes: ['F5408'] },
    rels: { spouses: ['aunt-m'], children: ['cousin'] }
  },
  {
    id: 'cousin',
    data: { 'first name': 'Cousin', gender: 'M', birthday: '1985', attributes: ['G2173'] },
    rels: { parents: ['aunt-m', 'uncle-m2'] }
  },

  // Generation 5 - Proband's generation
  {
    id: 'bob',
    data: { 'first name': 'Bob', gender: 'M', birthday: '1980', attributes: ['E92', 'F4'] },
    rels: { spouses: ['barbara'], children: ['ellie', 'dan', 'elsbeth', 'daneel', 'tweedledee', 'tweedledum', 'tweedledoe'], parents: ['aaron', 'alice'] }
  },
  {
    id: 'barbara',
    data: { 'first name': 'Barbara', gender: 'F', birthday: '1982', attributes: ['D99', 'M23'] },
    rels: { spouses: ['bob'], children: ['ellie', 'dan', 'elsbeth', 'daneel', 'tweedledee', 'tweedledum', 'tweedledoe'] }
  },
  {
    id: 'bill',
    data: { 'first name': 'Bill', gender: 'M', birthday: '1982', attributes: ['A6', 'B3'] },
    rels: { spouses: ['brooke'], children: ['david', 'emma', 'diana'], parents: ['aaron', 'alice'] }
  },
  {
    id: 'brooke',
    data: { 'first name': 'Brooke', gender: 'F', birthday: '1984', attributes: ['A2'] },
    rels: { spouses: ['bill'], children: ['david', 'emma', 'diana'] }
  },
  {
    id: 'claire',
    data: { 'first name': 'Claire', gender: 'F', birthday: '1985', attributes: ['B34', 'G4'] },
    rels: { spouses: ['claire-ex'], parents: ['aaron', 'alice'] }
  },
  {
    id: 'claire-ex',
    data: { 'first name': 'Mark', gender: 'M', birthday: '1983', attributes: ['H23'] },
    rels: { spouses: ['claire'] }
  },
  {
    id: 'carol',
    data: { 'first name': 'Carol', gender: 'F', birthday: '1987', attributes: ['C23123', 'G4'] },
    rels: { parents: ['aaron', 'alice'] }
  },
  {
    id: 'chloe',
    data: { 'first name': 'Chloe', gender: 'F', birthday: '1989', attributes: ['A123', 'D97', 'G4'] },
    rels: { spouses: ['chris'], children: ['evan', 'ethan', 'emily'], parents: ['aaron', 'alice'] }
  },
  {
    id: 'chris',
    data: { 'first name': 'Chris', gender: 'M', birthday: '1988', attributes: ['C23123', 'E234', 'H54'] },
    rels: { spouses: ['chloe'], children: ['evan', 'ethan', 'emily'] }
  },

  // Generation 6 - Children
  {
    id: 'ellie',
    data: { 'first name': 'Ellie', gender: 'F', birthday: '2005', attributes: ['D99', 'F4', 'G0594'] },
    rels: { parents: ['bob', 'barbara'] }
  },
  {
    id: 'dan',
    data: { 'first name': 'Dan', gender: 'M', birthday: '2007', attributes: ['F4', 'G1212'] },
    rels: { parents: ['bob', 'barbara'] }
  },
  // Twins - Elsbeth & Daneel (fraternal)
  {
    id: 'elsbeth',
    data: { 'first name': 'Elsbeth', gender: 'F', birthday: '2010', attributes: ['F4', 'D99', 'G0584'], multiple: 1 },
    rels: { parents: ['bob', 'barbara'] }
  },
  {
    id: 'daneel',
    data: { 'first name': 'Daneel', gender: 'M', birthday: '2010', attributes: ['F4', 'G4', 'H567'], multiple: 1 },
    rels: { parents: ['bob', 'barbara'] }
  },
  // Triplets - Tweedledee, Tweedledum (identical), Tweedledoe
  {
    id: 'tweedledee',
    data: { 'first name': 'Tweedledee', gender: 'M', birthday: '2012', attributes: ['F4', 'A37'], multiple: 2 },
    rels: { parents: ['bob', 'barbara'] }
  },
  {
    id: 'tweedledum',
    data: { 'first name': 'Tweedledum', gender: 'M', birthday: '2012', attributes: ['F4', 'B54'], multiple: 2, identical: 'tweedledee' },
    rels: { parents: ['bob', 'barbara'] }
  },
  {
    id: 'tweedledoe',
    data: { 'first name': 'Tweedledoe', gender: 'F', birthday: '2012', attributes: ['F4', 'D99', 'C305'], multiple: 2 },
    rels: { parents: ['bob', 'barbara'] }
  },
  // Bill's children
  {
    id: 'david',
    data: { 'first name': 'David', gender: 'M', birthday: '2008', attributes: ['A2342', 'B3'] },
    rels: { spouses: ['elizabeth'], children: ['felicia', 'frank', 'castor', 'nestor', 'flora', 'aurora'], parents: ['bill', 'brooke'] }
  },
  // Identical twins - Emma & Diana
  {
    id: 'emma',
    data: { 'first name': 'Emma', gender: 'F', birthday: '2010', attributes: ['B3'], multiple: 3 },
    rels: { parents: ['bill', 'brooke'] }
  },
  {
    id: 'diana',
    data: { 'first name': 'Diana', gender: 'F', birthday: '2010', attributes: ['B3', 'A45'], multiple: 3, identical: 'emma' },
    rels: { parents: ['bill', 'brooke'] }
  },
  // Chloe's children - Identical twins Evan & Ethan
  {
    id: 'evan',
    data: { 'first name': 'Evan', gender: 'M', birthday: '2012', attributes: ['A123', 'C9569'], multiple: 4 },
    rels: { parents: ['chloe', 'chris'] }
  },
  {
    id: 'ethan',
    data: { 'first name': 'Ethan', gender: 'M', birthday: '2012', attributes: ['A123', 'D343', 'G4'], multiple: 4, identical: 'evan' },
    rels: { spouses: ['eve'], children: ['fred', 'faith'], parents: ['chloe', 'chris'] }
  },
  {
    id: 'emily',
    data: { 'first name': 'Emily', gender: 'F', birthday: '2015', attributes: ['F68', 'G', 'H'] },
    rels: { parents: ['chloe', 'chris'] }
  },
  {
    id: 'eve',
    data: { 'first name': 'Eve', gender: 'F', birthday: '2014', attributes: ['E509468'] },
    rels: { spouses: ['ethan'], children: ['fred', 'faith'] }
  },

  // Generation 7 - Grandchildren
  {
    id: 'elizabeth',
    data: { 'first name': 'Elizabeth', gender: 'F', birthday: '2010', attributes: ['H'] },
    rels: { spouses: ['david'], children: ['felicia', 'frank', 'castor', 'nestor', 'flora', 'aurora'] }
  },
  {
    id: 'felicia',
    data: { 'first name': 'Felicia', gender: 'F', birthday: '2030', attributes: ['B3', 'A549'] },
    rels: { parents: ['david', 'elizabeth'] }
  },
  {
    id: 'frank',
    data: { 'first name': 'Frank', gender: 'M', birthday: '2032', attributes: ['B349058', 'E867'] },
    rels: { parents: ['david', 'elizabeth'] }
  },
  {
    id: 'castor',
    data: { 'first name': 'Castor', gender: '?', birthday: '', deceased: true, attributes: ['B3', 'C23'] },
    rels: { parents: ['david', 'elizabeth'] }
  },
  {
    id: 'nestor',
    data: { 'first name': 'Nestor', gender: '?', birthday: '', deceased: true, attributes: ['D456'] },
    rels: { parents: ['david', 'elizabeth'] }
  },
  {
    id: 'flora',
    data: { 'first name': 'Flora', gender: 'F', birthday: '2035', adopted: true, attributes: ['E766'] },
    rels: { parents: ['david', 'elizabeth'] }
  },
  {
    id: 'aurora',
    data: { 'first name': 'Aurora', gender: 'F', birthday: '2036', adopted: 'out', attributes: ['B3', 'F345'] },
    rels: { parents: ['david', 'elizabeth'] }
  },
  // Fraternal twins - Fred & Faith
  {
    id: 'fred',
    data: { 'first name': 'Fred', gender: 'M', birthday: '2035', attributes: ['C56', 'G345'], multiple: 5 },
    rels: { parents: ['ethan', 'eve'] }
  },
  {
    id: 'faith',
    data: { 'first name': 'Faith', gender: 'F', birthday: '2035', attributes: ['H0452'], multiple: 5 },
    rels: { parents: ['ethan', 'eve'] }
  }
];
