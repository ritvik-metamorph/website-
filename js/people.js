// PLACEHOLDER PEOPLE. Every name, role, line and answer here is invented, to be replaced with the
// real team. Nothing in this file is a claim about a real person.
//
// photo: a path to a real photograph (portrait, about 4:5, at least 800px tall). While it is null,
// the page draws a placeholder bust instead. Swapping one in is the only change needed.
// look: the placeholder bust's shape (hair 0 short, 1 long, 2 tied back; tilt; shoulders; tone).
// disciplines: the threads each person brings, in Light. Use names from DISCIPLINES.
// answers: the seven prompts, in order. Leave one out (null) and it simply isn't shown.
// since: the year they joined, struck where a coin carries its value. PLACEHOLDER years.
// Advisors are struck in bronze; the back of their coin carries what they did previously.

export const PROMPTS = [
  'What do you bring that no one else does?',
  'What pulls you to this work?',
  'What do you tell founders that they don’t want to hear?',
  'What do you see coming?',
  'Who shaped you?',
  'What do you make when no one is paying you?',
  'What are you afraid of?',
];

export const DISCIPLINES = ['economics', 'law', 'history', 'psychology', 'philosophy', 'sociology',
  'mathematics', 'design', 'engineering', 'geography', 'weather'];

export const PEOPLE = [
  {
    slug: 'aarav-khanna', since: 2019, founder: true, photo: null,
    name: 'Aarav Khanna', role: 'Co-founder, capital and transactions',
    before: 'Twelve years in audit and transaction advisory',
    now: 'Leads fundraising and deal structuring',
    bio: 'Works with founders from the first investor conversation to the signed term sheet, and stays for the board meetings after.',
    disciplines: ['economics', 'law', 'history', 'psychology'],
    look: { hair: 0, tilt: -0.04, shoulders: 1.0, tone: 0.62, suit: 0.22 },
    answers: [
      'I have sat on the auditor’s side of the table. I know which numbers an investor will press on before they do.',
      'The moment a founder stops defending a number and starts explaining it. That is when a company becomes investable.',
      'Your valuation is a conversation, not a fact. Raise what you need, from people you would hire.',
      'Capital will get patient again. The founders who kept clean books through the noise will be the ones it finds.',
      'My father, who ran a small trading firm and never once borrowed to grow faster than he could see.',
      'Long walks, and longer spreadsheets about cricket.',
      'Advising someone into a deal I would not sign myself.',
    ],
  },
  {
    slug: 'naina-bedi', since: 2019, founder: true, photo: null,
    name: 'Naina Bedi', role: 'Co-founder, strategy and family office',
    before: 'A decade in corporate strategy',
    now: 'Leads strategic consulting and the family office',
    bio: 'Helps founders decide what to build next, and families decide what to keep.',
    disciplines: ['philosophy', 'sociology', 'mathematics', 'design'],
    look: { hair: 1, tilt: 0.05, shoulders: 0.9, tone: 0.66, suit: 0.3 },
    answers: [
      'I can hold a five-year plan and a family’s fifty-year one in the same conversation.',
      'Watching a business find the one thing it should be known for.',
      'Most of your roadmap is a wish list. Pick the two things that would still matter if you raised nothing.',
      'Family offices will behave more like founders, and founders will need to think more like family offices.',
      'My grandmother, who kept the household accounts in a notebook and could tell you, to the rupee, what every decision had cost.',
      'Ceramics. Badly, and on purpose.',
      'That we get so good at the numbers we stop hearing the person behind them.',
    ],
  },
  {
    slug: 'kabir-malhotra', since: 2021, photo: null,
    name: 'Kabir Malhotra', role: 'Associate, financial modelling',
    before: 'Equity research', now: 'Builds the models investors test',
    disciplines: ['mathematics', 'economics', 'engineering'],
    look: { hair: 0, tilt: 0.03, shoulders: 1.05, tone: 0.58, suit: 0.2 },
    answers: [
      'A model that survives the first question from a sceptical investor.',
      'Turning a founder’s story into numbers that still sound like them.',
      'Your hockey stick needs a reason, not a steeper angle.',
    ],
  },
  {
    slug: 'meher-kapoor', since: 2022, photo: null,
    name: 'Meher Kapoor', role: 'Associate, investor relations',
    before: 'Venture capital analyst', now: 'Runs the investor network',
    disciplines: ['psychology', 'sociology', 'history'],
    look: { hair: 2, tilt: -0.05, shoulders: 0.88, tone: 0.7, suit: 0.34 },
    answers: [
      'I know which investor will say yes before the deck is finished.',
      'Introductions that turn into partnerships.',
      'Not every cheque is good money. Ask what else comes with it.',
    ],
  },
  {
    slug: 'vihaan-arora', since: 2023, photo: null,
    name: 'Vihaan Arora', role: 'Analyst, sector research',
    before: 'Management consulting', now: 'Writes the sector narratives',
    disciplines: ['geography', 'weather', 'economics'],
    look: { hair: 0, tilt: 0.06, shoulders: 1.0, tone: 0.55, suit: 0.26 },
    answers: [
      'I read sectors the way other people read novels.',
      'Seeing a trend early enough to be useful.',
      'Your market is smaller than your slide says. That is fine, if you know why.',
    ],
  },
  {
    slug: 'tara-sood', since: 2020, photo: null,
    name: 'Tara Sood', role: 'Manager, MIS and reporting',
    before: 'A chartered accountancy practice', now: 'Owns reporting for portfolio companies',
    disciplines: ['mathematics', 'law'],
    look: { hair: 1, tilt: -0.02, shoulders: 0.86, tone: 0.64, suit: 0.24 },
    answers: [
      'Monthly reports that a board actually reads.',
      'Order. Mostly other people’s.',
      'If you cannot close your books in a week, you cannot run your company in a quarter.',
    ],
  },
  {
    slug: 'reyansh-gill', since: 2022, photo: null,
    name: 'Reyansh Gill', role: 'Associate, due diligence',
    before: 'Forensic accounting', now: 'Prepares data rooms and diligence',
    disciplines: ['law', 'history', 'engineering'],
    look: { hair: 0, tilt: -0.06, shoulders: 1.08, tone: 0.5, suit: 0.18 },
    answers: [
      'A data room with nothing missing and nothing hidden.',
      'Finding the problem before the investor does.',
      'Diligence is coming whether you prepare or not.',
    ],
  },
  {
    slug: 'anaya-dhillon', since: 2024, photo: null,
    name: 'Anaya Dhillon', role: 'Analyst, family office',
    before: 'Private wealth', now: 'Looks after family portfolios',
    disciplines: ['philosophy', 'economics', 'design'],
    look: { hair: 2, tilt: 0.04, shoulders: 0.9, tone: 0.68, suit: 0.32 },
    answers: [
      'Patience with money that has to last three generations.',
      'Helping families agree on what wealth is for.',
      'Liquidity is a decision, not a windfall.',
    ],
  },
];

export const ADVISORS = [
  { slug: 'r-venkataraman', since: 2021, photo: null, name: 'R. Venkataraman', field: 'Capital markets', previously: 'Head of equity capital markets at a global bank', look: { hair: 0, tilt: 0.02, shoulders: 1.02, tone: 0.56, suit: 0.2 } },
  { slug: 'sunita-rao', since: 2021, photo: null, name: 'Sunita Rao', field: 'Governance', previously: 'Independent director on listed boards', look: { hair: 2, tilt: -0.03, shoulders: 0.88, tone: 0.62, suit: 0.3 } },
  { slug: 'harpreet-sandhu', since: 2023, photo: null, name: 'Harpreet Sandhu', field: 'Consumer brands', previously: 'Founder of a consumer goods company', look: { hair: 0, tilt: 0.05, shoulders: 1.06, tone: 0.52, suit: 0.24 } },
  { slug: 'dev-bhatia', since: 2024, photo: null, name: 'Dev Bhatia', field: 'Technology', previously: 'Chief technology officer at a payments company', look: { hair: 0, tilt: -0.04, shoulders: 0.98, tone: 0.6, suit: 0.22 } },
];
