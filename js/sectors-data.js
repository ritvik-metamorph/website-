// The Sectors page's words from the founder's grid ("Twenty-Seven into Forty-Eight", My
// Experiments with Truth), beside js/atlas-data.js, which holds the grid itself. Extracted from the
// artifact; the founder's four em dashes are set as a colon or a comma, as the site's copy has none.
//
// - NOTES: each sector's line in the founder's words, and the short name its column carries.
// - LAYERS: the six layers of life the disciplines furnish, the grid's rows.
// - FINDINGS: what the founder reads out of the grid as a whole (the first three are counted from
//   the grid when the page is drawn).
// - NARRATIVE: the rest of each sector's page, from the Notion's "Narrative Page" and "Narrative
//   Dashboard" (key trends, key highlights, headline numbers, levers of the industry; the levers
//   are the grid's own disciplines), and strategic consulting's founder's journey, drawn per
//   sector. For Metamorph to fill. Nothing in it is invented: a part with nothing in it is listed
//   under "Still to come" on the sector's page, and appears in full as soon as it has content.
//   The shape, for one sector:
//
//   banking: {
//     blurb: 'A paragraph about the industry, in Metamorph\'s words.',
//     numbers: [{ label: 'Industry size', value: '…', note: 'FY25', source: 'RBI' }],
//     highlights: ['One thing worth knowing, in a sentence.', '…'],
//     trends: [{ title: '…', text: 'What is moving, and why it matters.' }],
//     players: [{ name: '…', thesis: 'Their strategy and thesis, in a sentence or two.' }],
//     disruptors: [{ name: '…', move: 'What they do differently, and to whom.' }],
//     journey: [{ stage: 'The first cheque', problem: 'Credibility and trust' }],   (in order, along the road)
//     futures: [{ title: '…', text: 'One way the sector could go.' }],   (each gets a vote)
//     news: [{ date: '2026-10-30', title: '…', source: '…', url: 'https://…' }],
//     books: [{ title: '…', by: '…', kind: 'Book', url: 'https://…' }],
//   },
//
//   The Notion's founder's problems, for the journey: credibility and trust, product-market fit,
//   capital and runway, team and execution, regulatory and compliance, sales and distribution,
//   focus and prioritisation, risk management, financial alignment.
// - WORKED: where Metamorph has worked, for the Notion's "Areas and companies we worked upon".
//   Empty until it arrives; then the sectors are marked on the loom and on their pages, and the
//   companies are listed under the findings.

export const NOTES = {
  agriculture: { short: "Agriculture", note: "Half the country’s workforce producing a sixth of its output: the sector every other one is downstream of." },
  foodproc: { short: "Food Processing", note: "The bridge between a perishable harvest and a tradable good, and India’s largest missed margin." },
  waste: { short: "Waste", note: "A cost centre pretending not to be a materials industry." },
  realestate: { short: "Real Estate", note: "The country’s largest store of household wealth, built on a title system that is presumptive rather than conclusive." },
  infra: { short: "Infrastructure", note: "Where public money becomes physical, and where most of it is won or lost in the contract rather than the concrete." },
  power: { short: "Power", note: "Generation was never the bottleneck. Distribution’s balance sheet was." },
  renew: { short: "Renewable", note: "The fastest price collapse in industrial history, and a grid that was not designed for it." },
  oilgas: { short: "Oil & Gas", note: "An energy business that is mostly a foreign-policy instrument wearing a refinery." },
  battery: { short: "Battery", note: "The component that decides whether the entire electrification story is affordable." },
  metals: { short: "Metals & Mining", note: "India’s mineral belt sits almost exactly on top of its tribal belt, and that is the sector’s real story." },
  steel: { short: "Steel", note: "Seven percent of global emissions, with no drop-in fix available." },
  cement: { short: "Cement", note: "A commodity that cannot travel, which makes it a set of regional monopolies rather than a market." },
  chemical: { short: "Chemical", note: "The invisible input industry sitting under pharma, agriculture, textiles and electronics." },
  autos: { short: "Automobiles", note: "India’s largest manufacturing employer, and a category where the profit lives entirely in the mix." },
  autocomp: { short: "Auto Compo", note: "A standards business disguised as a parts business." },
  ev: { short: "Electric Vehicle", note: "A demand curve that policy is currently holding up with both hands." },
  railways: { short: "Railways", note: "The largest cross-subsidy in Indian economic life, running on steel wheels." },
  roads: { short: "Roads", note: "Built fast, and killing about a hundred and seventy thousand people a year." },
  ports: { short: "Ports", note: "Where a country’s trade competitiveness is decided in metres of water depth." },
  aviation: { short: "Aviation", note: "Traffic growing at double digits inside an industry with structurally hostile economics." },
  manufacturing: { short: "Manufacturing", note: "Stuck at about a sixth of GDP for three decades, with a diagnosis that keeps being mistaken for a machinery problem." },
  capgoods: { short: "Capital Goods", note: "A derived-demand sector that only exists when somebody else is confident." },
  esdm: { short: "ESDM", note: "Assembly has arrived. Design, where the money is, has not." },
  defence: { short: "Defence Mfg", note: "A sector where the buyer is one customer with strategic rather than commercial objectives." },
  textiles: { short: "Textiles", note: "The country’s second-largest employer, losing share to smaller countries with better trade access." },
  paper: { short: "Paper & Pkg", note: "A materials business whose raw material is a crop and whose regulation is a design brief." },
  healthcare: { short: "Healthcare", note: "World-class islands surrounded by the highest out-of-pocket spending of any large economy." },
  pharma: { short: "Pharmaceuticals", note: "The world’s pharmacy: a position built on patent law as much as on chemistry." },
  meddev: { short: "Medical Devices", note: "Roughly eighty percent imported, and structured so the machine is not where the money is." },
  biotech: { short: "Biotechnology", note: "Scientific capability well ahead of the regulatory and social permission to use it." },
  ayush: { short: "AYUSH", note: "A large domestic market with a small evidence base and a growing regulatory collision." },
  banking: { short: "Banking", note: "An industry that manufactures money and can be destroyed by a rumour." },
  finserv: { short: "Financial Svcs", note: "Where mathematics that assumes a bell curve meets a world that does not have one." },
  insurance: { short: "Insurance", note: "A protection gap that persists at prices people can afford." },
  msme: { short: "MSME", note: "Most Indian enterprises, most Indian employment, and the least legible part of the economy." },
  itbpm: { short: "IT & BPM", note: "A fifty-year arbitrage built on language, timezone and cost, with two of the three now under attack." },
  ai: { short: "AI", note: "A general-purpose technology whose hardest questions have stopped being technical." },
  telecom: { short: "Telecom", note: "The world’s cheapest data, and balance sheets that never recovered from paying for it." },
  scitech: { short: "Science & Tech", note: "Strong output, weak translation, and an incentive system that rewards the wrong artefact." },
  services: { short: "Services", note: "Over half of GDP, and the part of the economy that productivity growth reaches last." },
  fmcg: { short: "FMCG", note: "No product secret, and one of the most durable moats in the economy." },
  retail: { short: "Retail", note: "Modern trade has been about to displace the kirana for twenty-five years." },
  ecom: { short: "Ecommerce", note: "An industry structure that is largely a legal artefact." },
  durables: { short: "Consumer Durables", note: "Where climate, credit and aspiration meet on a shop floor." },
  gems: { short: "Gems & Jewellery", note: "A kinship institution that trades on a commodity exchange." },
  education: { short: "Education", note: "Enrolment solved. Learning not." },
  media: { short: "Media & Ent", note: "Not one market, but a dozen language markets with different star systems and different economics." },
  tourism: { short: "Tourism", note: "India’s largest travel segment is religious, and it is barely counted as tourism." },
};

export const LAYERS = {
  G: { n: 'I', name: 'The Ground' },
  L: { n: 'II', name: 'The Lens' },
  W: { n: 'III', name: 'The World' },
  M: { n: 'IV', name: 'The Making' },
  O: { n: 'V', name: 'The Order' },
  E: { n: 'VI', name: 'The Expression' },
};

// the founder's findings; {top}, {forces} and {narrow} are counted from the grid
export const FINDINGS = [
  { h: 'Four disciplines carry the economy', p: ['{top} and Law appear across nearly every family. They are the general-purpose disciplines, not because they are deeper, but because allocation, rule, matter and delivery are problems every sector has.', 'If you only ever learn four of the twenty-seven for commercial purposes, these are the four. That is also the argument for not stopping there.'] },
  { h: 'The effect mix is not what you would guess', p: ['{forces}', 'Disciplines are usually sold as enablers. Across forty-eight real sectors they turn out to spend at least as much time setting ceilings, moving costs and deciding who is believed. The romantic reading of knowledge as pure unlocking does not survive the grid.'] },
  { h: 'The narrow disciplines are the sharp ones', p: ['{narrow} land in exactly one sector each, and in that one, they are decisive rather than merely useful. Astronomy sets the capacity factor of every solar asset in the country. Spirituality is the actual demand driver behind India’s largest travel segment.', 'Low reach is not low value. It is specificity, and it is where an outsider can still see something the incumbents have stopped noticing.'] },
  { h: 'Where the humanities are load-bearing', p: ['Anthropology decides whether a mine gets consent, whether a handloom premium holds, whether a sachet sells and what a wedding buys. Sociology explains the missing middle, the kirana’s survival, the waste economy’s recovery rate and the road-death figure.', 'These are not soft additions to a hard analysis. In each case they are the binding constraint, and in each case they are the variable that the sector’s own models leave out.'] },
  { h: 'Six sectors are decided by law before anything else', p: ['Real Estate, Pharmaceuticals, Ecommerce, Metals and Mining, Biotechnology and Defence run on legal architecture. Their industry structure is not a market outcome: it is a statute, and it could have been otherwise.', 'For anyone trying to read Indian business, this is the highest-leverage observation on the page: when a sector’s shape looks strange, check the Act before you check the strategy.'] },
  { h: 'How to use this on the road', p: ['Take one sector and one discipline you would not have paired, and go and look. The grid is a set of hypotheses, not findings: every cell is a claim that could be tested by a week in the right place with the right person.', 'The most productive cells are the ones that surprised you. Those are where the received account of a sector and its actual mechanics have come apart.'] },
];

// Metamorph's own content for each sector's page (see the shape above). Empty until it arrives.
export const NARRATIVE = {
};

// Where Metamorph has worked (see the shape above). Empty until it arrives.
//   sectors: ['banking', …]
//   companies: [{ name: '…', sector: 'banking', what: 'Series A, 2025', url: 'https://…' }]
export const WORKED = { sectors: [], companies: [] };
