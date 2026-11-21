// The Family Wealth Picture's arithmetic (17 Nov; the Investor Corner, both sites). From the client's
// Notion ("Earn, Spend, Invest and Save… create a spend, invest and save model") and the assumptions
// stated on the calculator they linked as a starting point (a Claude artifact, its animation to be
// bettered): earnings grow 8% a year from a salary, 11% from a business, 5% from rent; prices rise 6% a
// year and spending 7% (a lifestyle upgrade within it); saving and investing keep their share of what
// is earned, and shrink if spending leaves too little; safe savings earn 7%; investments 8, 11 or 14%
// by risk, with a wider range the higher the risk; unplanned money 3.5%; a shortfall comes out of what
// is held first, then becomes debt at 12%. Everything is shown in today's rupees, in lakh a year.
// An estimate from averages, not advice: the page says so.

export const RATES = {
  earn: { salary: 0.08, business: 0.11, rent: 0.05 },
  prices: 0.06,
  spend: 0.07,
  safe: 0.07,
  invest: { low: 0.08, medium: 0.11, high: 0.14 },
  spread: { low: 0.01, medium: 0.02, high: 0.035 }, // (how far either way the investments may land)
  idle: 0.035,
  debt: 0.12,
};

// what one household looks like before anyone touches it (placeholders the client may change)
export const START = {
  earn: 24, from: 'salary', risk: 'medium', held: 10, adults: 2, kids: 1,
  split: { spend: 0.55, save: 0.15, invest: 0.2, idle: 0.1 },
  mix: { utility: 0.6, experience: 0.25, royal: 0.15 },
};

// year by year, from today (t = 0) to `years`: what is earned and spent that year and what is held
// at its end, in today's rupees; `nudge` moves the investments' rate (for the range)
export function project({ earn, from, split, risk, held }, years = 10, nudge = 0) {
  const g = RATES.earn[from] ?? RATES.earn.salary, r = (RATES.invest[risk] ?? RATES.invest.medium) + nudge;
  const keep = split.save + split.invest;
  let S = held * (keep > 0 ? split.save / keep : 1), I = held * (keep > 0 ? split.invest / keep : 0), U = 0, D = 0;
  const out = [{ t: 0, earn, spend: earn * split.spend, safe: S, invested: I, idle: U, debt: D, wealth: S + I + U - D }];
  for (let t = 1; t <= years; t++) {
    const E = earn * Math.pow(1 + g, t - 1), Sp = earn * split.spend * Math.pow(1 + RATES.spend, t - 1);
    let s = E * split.save, i = E * split.invest, u = E * split.idle;
    const left = E - Sp, planned = s + i + u;
    if (left >= planned) u += left - planned; // (what is left over and not planned for sits idle)
    else if (left > 0) { const k = left / planned; s *= k; i *= k; u *= k; } // (spending leaves too little: all three shrink)
    else {
      // spending more than is earned: out of what sits idle, then the safe money, then the investments,
      // then borrowed
      s = i = u = 0;
      let short = -left;
      for (const take of ['U', 'S', 'I']) {
        const have = take === 'U' ? U : take === 'S' ? S : I, use = Math.min(have, short);
        if (take === 'U') U -= use; else if (take === 'S') S -= use; else I -= use;
        short -= use;
      }
      D += short;
    }
    S = S * (1 + RATES.safe) + s;
    I = I * (1 + r) + i;
    U = U * (1 + RATES.idle) + u;
    D = D * (1 + RATES.debt);
    // (debt is paid down first from what sits idle)
    if (D > 0 && U > 0) { const pay = Math.min(D, U); D -= pay; U -= pay; }
    const f = Math.pow(1 + RATES.prices, t); // (into today's rupees)
    out.push({ t, earn: E / f, spend: Sp / f, safe: S / f, invested: I / f, idle: U / f, debt: D / f, wealth: (S + I + U - D) / f });
  }
  return out;
}

// the picture at a year: the middle estimate and the range the investments' rate could give
export function picture(input, year) {
  const mid = project(input, year)[year];
  const spread = RATES.spread[input.risk] ?? RATES.spread.medium;
  return { ...mid, low: project(input, year, -spread)[year].wealth, high: project(input, year, spread)[year].wealth };
}

// rupees as an Indian reader says them: lakh, and crore past a hundred lakh
export function rupees(lakh) {
  const neg = lakh < 0, v = Math.abs(lakh);
  const s = v >= 100 ? `${(v / 100).toFixed(v >= 1000 ? 1 : 2).replace(/\.?0+$/, '')} crore` : `${v >= 10 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, '')} lakh`;
  return `${neg ? '−' : ''}₹${s}`;
}

// what the picture shows (19 Nov, the user: no rupee figures, "I want to address it pictorially"): after the
// client's own calculator, the home in five sizes, the vehicles in the drive and the pets, worked out from the
// chosen year's earnings, spending and wealth with the calculator's own steps; a home is weighed by how many live
// in it. `say` is the picture in one sentence, which stands where the figures were.
export const HOMES = ['a one-room home', 'a small house', 'a two-storey house', 'a villa with a wing', 'a grand home'];
const GARDENS = ['a kitchen garden', 'a young mango tree', 'a neem tree and marigolds', 'a fountain in the lawn', 'a pool in the garden'];
const VEHICLES = [['bicycle'], ['scooter'], ['hatchback'], ['suv'], ['suv', 'hatchback'], ['luxury', 'suv']];
const VEHICLE_SAY = ['a bicycle', 'a scooter', 'a hatchback', 'an SUV', 'an SUV and a hatchback', 'a luxury car and an SUV'];
const PETS = [[], ['cat'], ['dog'], ['dog', 'cat']];
const PET_SAY = ['', 'a cat', 'a dog', 'a dog and a cat'];
const COUNT = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const lvl = (v, steps) => steps.filter((x) => v >= x).length;

export function scene(input, p, year) {
  const adults = input.adults ?? 2, kids = input.kids ?? 0, people = Math.max(1, adults + kids);
  const spend = Math.max(0, p.spend), royal = spend * input.mix.royal, fun = spend * input.mix.experience;
  // (debt weighs on the home: what is owed comes off what it could be)
  const home = lvl((p.earn * 0.6 + Math.max(0, p.wealth) * 0.05 + royal * 0.5 - p.debt * 0.15) * Math.pow(4 / people, 0.35), [7, 14, 28, 60]);
  const car = lvl(royal, [0.3, 1.2, 3, 7, 14]);
  const pet = lvl(fun, [0.6, 1.8, 4]);
  const debt = p.debt > 0.05;
  // (the windows are lit by what is spent on living, the garden by what is spent on joy; debt puts them out)
  const lights = debt ? 0.25 : Math.min(1, 0.5 + spend / Math.max(1, p.earn));
  const lamps = debt ? 0 : Math.min(1, fun / Math.max(0.5, p.earn * 0.12));
  const when = year ? `In ${year === 5 ? 'five' : 'ten'} years` : 'Today';
  const bits = [`${HOMES[home]} with ${GARDENS[home]}`, `${VEHICLE_SAY[car]} in the drive`];
  if (pet) bits.push(PET_SAY[pet]);
  const us = people === 1 ? 'you' : `the ${COUNT[people] || people} of you`;
  const say = `${when}: ${bits.join(', ')}, and ${us}${debt ? ', under a debt that has begun to weigh on it' : ''}.`;
  return { home, vehicles: VEHICLES[car], pets: PETS[pet], adults, kids, debt, lights, lamps, say };
}

// ---------------------------------------------------------------- the family's money (19 Nov, the audit)
// After the client's newer calculator ("See what your money builds", the Notion's Family Wealth Picture), its
// concept kept whole and only the look ours: every earner with where their money comes from; the children today
// and those likely in the next five years (each adds upkeep from birth and school fees from three); living
// utility estimated from the home (owned, rented, on a loan), the city and the schooling; experiences from the
// lifestyle; royal spends from the vehicle and the big buys; each estimate can be set by hand instead; saving and
// investing as amounts a year, the investments' risk, and what is already held. The year by year and the steps
// of the picture are the client's own: the home, its interiors, its electronics, the vehicles, the pets, the
// garden, the children's lab, the opportunities, and the pot of what is held. The answer is still the picture
// and words, never a rupee figure (the user, 19 Nov).

export const CITY = { metro: 1.3, tier2: 1, town: 0.75 };
export const SCHOOL = { budget: 0.6, private: 1.8, intl: 5 };
export const RISK_SAY = {
  low: 'Debt and hybrid funds. Assumed about 8% a year, fairly steady.',
  medium: 'A mix led by equity mutual funds. Assumed about 11% a year, with ups and downs.',
  high: 'Mostly equity, small caps or own ventures. Assumed about 14% a year, with wide swings.',
};
const BAND = { low: 0.01, medium: 0.03, high: 0.06 };
// (the client's own starting household)
export const FAMILY = {
  earners: [{ from: 'salary', amt: 12 }], adults: 2, kidsNow: 0, kidsNext: 1,
  home: 'rent', city: 'tier2', school: 'private', life: 'balanced', vehicle: 'hatch', big: 'some',
  own: { utility: null, experience: null, royal: null },
  save: 1.5, invest: 1.5, risk: 'medium', held: 3, year: 0,
};
const r1 = (v) => Math.round(v * 10) / 10;
export const income = (f) => f.earners.reduce((a, m) => a + m.amt, 0);

// the spending the choices suggest, from averages and what the household earns
export function estimate(f) {
  const I = income(f), c = CITY[f.city] ?? 1;
  let u = 2.4 * c + 0.08 * I;
  u += f.home === 'own' ? 0.4 * c : f.home === 'rent' ? Math.max(1.2 * c, 0.15 * I * c) : Math.max(1.8 * c, 0.22 * I);
  u += f.kidsNow * (0.8 * c + (SCHOOL[f.school] ?? 1.8));
  const e = Math.max(0.2, ({ simple: 0.03, balanced: 0.07, lavish: 0.13 }[f.life] ?? 0.07) * I);
  const r = ({ none: 0, two: 0.45, hatch: 1.8, suv: 3.6, lux: Math.max(9, 0.08 * I) }[f.vehicle] ?? 0) + ({ rare: 0.005, some: 0.04, grand: 0.1 }[f.big] ?? 0) * I;
  return { utility: r1(u), experience: r1(e), royal: r1(r) };
}
// what is spent: the estimate, or the figure set by hand
export function spends(f) {
  const est = estimate(f), own = f.own || {};
  const s = { utility: own.utility ?? est.utility, experience: own.experience ?? est.experience, royal: own.royal ?? est.royal };
  return { ...s, total: s.utility + s.experience + s.royal, est };
}

// year by year to year N (the client's projection); `dr` moves the investments' rate, for the range
export function familyAt(f, N, dr = 0) {
  const sp = spends(f), E0 = income(f), sp0 = sp.total, c = CITY[f.city] ?? 1, sch = SCHOOL[f.school] ?? 1.8;
  const r = (RATES.invest[f.risk] ?? RATES.invest.medium) + dr;
  const g = E0 > 0 ? f.earners.reduce((a, m) => a + m.amt * (RATES.earn[m.from] ?? RATES.earn.salary), 0) / E0 : RATES.earn.salary;
  const tot = f.save + f.invest;
  let safe = tot > 0 ? (f.held * f.save) / tot : f.held, inv = f.held - safe, idle = 0;
  let E = E0, Sp = sp0, sv = f.save, iv = f.invest, kidCost = 0;
  // (the children likely in the next five years arrive spread across them)
  const born = [];
  for (let j = 1; j <= f.kidsNext; j++) born.push(Math.ceil(((j - 0.5) * 5) / f.kidsNext));
  for (let t = 1; t <= N; t++) {
    E = E0 * Math.pow(1 + g, t);
    kidCost = 0;
    born.forEach((a) => { if (t >= a) kidCost += (0.8 * c + (t - a >= 3 ? sch : 0)) * Math.pow(1 + RATES.spend, t); });
    Sp = sp0 * Math.pow(1 + RATES.spend, t) + kidCost;
    const dS = E0 > 0 ? (f.save / E0) * E : 0, dI = E0 > 0 ? (f.invest / E0) * E : 0, avail = E - Sp, want = dS + dI;
    safe *= 1 + RATES.safe; inv *= 1 + r; idle *= idle < 0 ? 1 + RATES.debt : 1 + RATES.idle;
    if (avail >= want) { sv = dS; iv = dI; idle += avail - want; }
    else if (avail > 0) { const k = avail / want; sv = dS * k; iv = dI * k; }
    else {
      // (spending more than is earned: out of what sits idle, then the safe money, then the investments, then owed)
      sv = 0; iv = 0;
      let sh = -avail, x;
      if (idle > 0) { x = Math.min(idle, sh); idle -= x; sh -= x; }
      x = Math.min(safe, sh); safe -= x; sh -= x;
      x = Math.min(inv, sh); inv -= x; sh -= x;
      idle -= sh;
    }
    safe += sv; inv += iv;
  }
  const d = Math.pow(1 + RATES.prices, N), cf = Math.pow(1 + RATES.spend, N);
  const newKids = born.filter((a) => a <= N).map((a) => N - a);
  return {
    E, Sp, sv, iv, safe, inv, idle, wealth: safe + inv + idle, d, newKids,
    rE: E / d, rUtil: (sp.utility * cf + kidCost) / d, rEnt: (sp.experience * cf) / d, rRoyal: (sp.royal * cf) / d,
    rW: (safe + inv + idle) / d, rSI: (sv + iv) / d, rSafe: safe / d, rInv: inv / d, rIdle: idle / d,
  };
}
export const familyRange = (f, N) => { const b = BAND[f.risk] ?? BAND.medium; return [familyAt(f, N, -b).wealth, familyAt(f, N, b).wealth]; };

// the client's names for each step of the picture
export const NAMES = {
  house: ['One-room home', 'Small house', 'Two-storey house', 'Villa with a wing', 'Mansion'],
  interior: ['Bare basics', 'Curtains and warm lights', 'Chandelier and styled rooms', 'Gold-trim luxury interiors'],
  elec: ['Basic appliances', 'TV and dish', 'TV, dish and an AC', 'Two ACs and solar panels', 'Smart home with solar'],
  cars: ['Bicycle', 'Scooter', 'Hatchback', 'SUV', 'SUV and hatchback', 'Luxury car and SUV'],
  pets: ['None yet', 'A cat', 'A dog', 'A dog and a cat'],
  garden: ['A potted plant', 'Shrubs and a small lawn', 'Tree and flower bed', 'Trees, flowers and a fountain', 'Landscaped garden with pool'],
  lab: ['Arrives with the kids', 'Workbench and cardboard rocket', 'Tinker shed with robot', 'Maker garage with drone'],
  opp: ['Building the first cushion', 'Emergency cushion, a small stall', 'Room for a shop or side venture', 'Could back a business or second property'],
};
const HOME_SAY = ['a one-room home', 'a small house', 'a two-storey house', 'a villa with a wing', 'a mansion'];
const CAR_SAY = ['a bicycle', 'a scooter', 'a hatchback', 'an SUV', 'an SUV and a hatchback', 'a luxury car and an SUV'];
const CARS = [['bicycle'], ['scooter'], ['hatchback'], ['suv'], ['suv', 'hatchback'], ['luxury', 'suv']];
const PET_LIST = [[], ['cat'], ['dog'], ['dog', 'cat']];

// the picture at year N, in the client's steps, and the words for it
export function familyScene(f, p, N) {
  const HL = lvl(p.rE * 0.6 + p.rW * 0.05 + p.rRoyal * 0.5, [7, 14, 28, 60]);
  const I = lvl(p.rRoyal + p.rEnt, [1.5, 4, 9]);
  const X = lvl(p.rUtil * 0.5 + p.rEnt + p.rRoyal * 0.3, [2, 4, 8, 16]);
  const C = lvl(p.rRoyal, [0.3, 1.2, 3, 7, 14]);
  const P = lvl(p.rEnt, [0.6, 1.8, 4]);
  const G = lvl(p.rE * 0.3 + p.rEnt + p.rRoyal * 0.5, [3, 7, 15, 35]);
  const ages = [];
  for (let i = 0; i < f.kidsNow; i++) ages.push(6 + i * 2 + N);
  p.newKids.forEach((a) => ages.push(a));
  const LAB = ages.length ? 1 + lvl(p.rSI * 0.5 + p.rEnt * 0.5 + p.rE * 0.05, [2.5, 7]) : 0;
  const debt = p.rW < 0;
  const PL = debt ? 0 : lvl(p.rW, [1, 10, 50, 200, 500]);
  const O = lvl(p.rW, [10, 50, 200]);
  const tags = [
    ['Home', NAMES.house[HL]], ['Interiors', NAMES.interior[I]], ['Electronics', NAMES.elec[X]], ['Vehicles', NAMES.cars[C]],
    ['Pets', NAMES.pets[P]], ['Garden', NAMES.garden[G]], ["Kids' lab", NAMES.lab[LAB]], ['Opportunities', NAMES.opp[O]],
  ];
  const people = (f.adults ?? 2) + ages.length;
  const when = N ? `In ${N === 5 ? 'five' : 'ten'} years` : 'Today';
  const bits = [HOME_SAY[HL], `${CAR_SAY[C]} in the drive`];
  if (P) bits.push(NAMES.pets[P].toLowerCase());
  const us = people === 1 ? 'you' : `the ${COUNT[people] || people} of you`;
  const say = `${when}: ${bits.join(', ')}, and ${us}${debt ? ', with a debt that has begun to weigh on it' : ''}.`;
  return {
    home: HL, interior: I, elec: X, garden: G, lab: LAB, opp: O, pot: PL, ages, tags, say, debt,
    vehicles: CARS[C], pets: PET_LIST[P], adults: f.adults ?? 2, kids: ages.length,
    lights: debt ? 0.25 : Math.min(1, 0.45 + I * 0.18), lamps: debt ? 0 : Math.min(1, p.rEnt / Math.max(0.5, p.rE * 0.12)),
  };
}
