// PLACEHOLDER ARTISTS. Every name, city, line and work here is invented, to be replaced with the
// real artists of the Creative Corner. Nothing in this file is a claim about a real person.
//
// photo: a path to a real photograph (square, at least 400px). While it is null, the page draws a
// placeholder portrait instead. Swapping one in is the only change needed.
// art: which art form they are in. kind: what they do within it.
// works: up to four pieces, newest first. image: a path to a still of the work, or null for a
// placeholder drawn as what it is. With an image, give its ratio too (width over height, 1.5 for
// 3:2), so the wall can hang it before it loads; if it is left out or off, the picture's own shape
// is used once it has loaded, so nothing is ever cropped.

// the domains, in the order the index shows them. note: one line about the domain, ours.
export const ARTS = [
  { id: 'film', name: 'Film making', kinds: ['Directors', 'Cinematographers'], note: 'Directors and cinematographers on their first and second films.' },
  { id: 'editing', name: 'Video editing', kinds: ['Editors', 'Colourists', 'Motion'], note: 'The people who decide what stays in, and for how long.' },
  { id: 'graphic', name: 'Graphic design', kinds: ['Identity', 'Type', 'Posters'], note: 'Identities, type and posters, often for people who have never had a designer.' },
  { id: 'photography', name: 'Photography', kinds: ['Documentary', 'Portrait', 'Street'], note: 'Documentary, portrait and street, from inside the story.' },
  { id: 'illustration', name: 'Illustration', kinds: ['Illustrators', 'Comics'], note: 'Drawing, comics and the long art of the zine.' },
  { id: 'animation', name: 'Animation', kinds: ['2D', '3D', 'Stop motion'], note: 'Drawn, built and moulded, twelve times a second.' },
  { id: 'music', name: 'Music', kinds: ['Composers', 'Producers', 'Vocalists'], note: 'Composers, producers and voices, recorded mostly at home.' },
  { id: 'writing', name: 'Writing', kinds: ['Poets', 'Novelists', 'Essayists'], note: 'Poems, novels and essays, often in more than one language.' },
  { id: 'craft', name: 'Craft', kinds: ['Ceramics', 'Textiles', 'Woodwork'], note: 'Clay, cloth and wood, made by hand to be used.' },
];

export const ARTISTS = [
  // music
  { slug: 'ira-menon', art: 'music', kind: 'Composers', name: 'Ira Menon', city: 'Kochi', photo: null,
    line: 'Scores short films and the odd harbour festival. Everything starts on a harmonium.',
    works: [{ title: 'Monsoon Suite', kind: 'EP', year: 2025 }, { title: 'Backwater, Scored', kind: 'Film score', year: 2024 }, { title: 'Seven Evenings', kind: 'Live set', year: 2023 }] },
  { slug: 'kabir-sethi', art: 'music', kind: 'Producers', name: 'Kabir Sethi', city: 'Delhi', photo: null,
    line: 'Makes records out of field recordings from the city’s markets.',
    works: [{ title: 'Chandni Loops', kind: 'Album', year: 2025 }, { title: 'Metro Hymns', kind: 'EP', year: 2024 }, { title: 'Old Delhi Afternoons', kind: 'Single', year: 2023 }] },
  { slug: 'tara-dsouza', art: 'music', kind: 'Vocalists', name: 'Tara D’Souza', city: 'Goa', photo: null,
    line: 'Sings Konkani folk songs over slow electronic beats.',
    works: [{ title: 'Mando, Slowly', kind: 'Single', year: 2025 }, { title: 'Salt House', kind: 'EP', year: 2024 }, { title: 'Low Tide Sessions', kind: 'Live', year: 2023 }] },
  { slug: 'arjun-rao', art: 'music', kind: 'Composers', name: 'Arjun Rao', city: 'Bengaluru', photo: null,
    line: 'Writes for string quartets and video games, often in the same week.',
    works: [{ title: 'Quartet for a Server Room', kind: 'Composition', year: 2025 }, { title: 'Lantern Valley', kind: 'Game score', year: 2024 }, { title: 'Four Lakes', kind: 'Composition', year: 2022 }] },
  { slug: 'meher-gill', art: 'music', kind: 'Vocalists', name: 'Meher Gill', city: 'Amritsar', photo: null,
    line: 'Trained in Hindustani classical. Now writes pop songs about leaving home.',
    works: [{ title: 'Departures', kind: 'Album', year: 2025 }, { title: 'Phulkari', kind: 'Single', year: 2024 }, { title: 'Second City', kind: 'EP', year: 2023 }] },

  // film
  { slug: 'nikhil-barua', art: 'film', kind: 'Directors', name: 'Nikhil Barua', city: 'Guwahati', photo: null,
    line: 'Makes quiet documentaries about the river islands of Assam.',
    works: [{ title: 'Majuli, Receding', kind: 'Documentary', year: 2025 }, { title: 'Ferry Hours', kind: 'Short', year: 2024 }, { title: 'Sand Banks', kind: 'Short', year: 2022 }] },
  { slug: 'sana-qureshi', art: 'film', kind: 'Cinematographers', name: 'Sana Qureshi', city: 'Mumbai', photo: null,
    line: 'Shoots on film whenever someone will pay for the stock.',
    works: [{ title: 'Night Shift', kind: 'Short', year: 2025 }, { title: 'Laundry Lines', kind: 'Music video', year: 2024 }, { title: 'Colaba Postcards', kind: 'Short', year: 2023 }] },
  { slug: 'dev-malhotra', art: 'editing', kind: 'Editors', name: 'Dev Malhotra', city: 'Pune', photo: null,
    line: 'Cuts trailers by day and his own odd little films by night.',
    works: [{ title: 'Ten Seconds Early', kind: 'Short', year: 2025 }, { title: 'The Long Cut', kind: 'Feature, editor', year: 2024 }, { title: 'Deccan Rain', kind: 'Short', year: 2023 }] },
  { slug: 'anoushka-pillai', art: 'film', kind: 'Directors', name: 'Anoushka Pillai', city: 'Chennai', photo: null,
    line: 'Her first feature is about a woman who repairs typewriters.',
    works: [{ title: 'Carriage Return', kind: 'Feature, in progress', year: 2026 }, { title: 'Ribbon', kind: 'Short', year: 2024 }, { title: 'Madras Type', kind: 'Short', year: 2022 }] },
  { slug: 'farhan-ali', art: 'film', kind: 'Cinematographers', name: 'Farhan Ali', city: 'Lucknow', photo: null,
    line: 'Lights a scene the way old Lucknow lights its evenings: low, warm and late.',
    works: [{ title: 'Hazratganj, 11 pm', kind: 'Short', year: 2025 }, { title: 'Kite Season', kind: 'Short', year: 2024 }, { title: 'Chikan', kind: 'Documentary', year: 2023 }] },

// video editing
{ slug: 'ritu-shenoy', art: 'editing', kind: 'Colourists', name: 'Ritu Shenoy', city: 'Mumbai', photo: null,
  line: 'Grades films so that monsoon light looks like monsoon light.',
  works: [{ title: 'Wet Season', kind: 'Grade', year: 2025 }, { title: 'Platform Lights', kind: 'Music video', year: 2024 }, { title: 'Konkan Blue', kind: 'Short', year: 2023 }] },
{ slug: 'aman-grewal', art: 'editing', kind: 'Motion', name: 'Aman Grewal', city: 'Chandigarh', photo: null,
  line: 'Cuts music videos to the bass line, then takes out every third cut.',
  works: [{ title: 'Bhangra Lag', kind: 'Music video', year: 2025 }, { title: 'Twelve Frames', kind: 'Title sequence', year: 2024 }, { title: 'Late Bus', kind: 'Short', year: 2023 }] },
{ slug: 'shruti-venkat', art: 'editing', kind: 'Editors', name: 'Shruti Venkat', city: 'Chennai', photo: null,
  line: 'Edits documentaries, and keeps the silences longer than anyone asks.',
  works: [{ title: 'The Quiet Mill', kind: 'Documentary', year: 2025 }, { title: 'Tide Tables', kind: 'Short', year: 2024 }, { title: 'Seven Mornings', kind: 'Series', year: 2023 }] },

// graphic design
{ slug: 'neha-arora', art: 'graphic', kind: 'Identity', name: 'Neha Arora', city: 'Delhi', photo: null,
  line: 'Designs identities for small family businesses, starting from their oldest receipt.',
  works: [{ title: 'Kapoor and Sons', kind: 'Identity', year: 2025 }, { title: 'Halwai', kind: 'Packaging', year: 2024 }, { title: 'Ledger', kind: 'Identity', year: 2023 }] },
{ slug: 'yash-pandit', art: 'graphic', kind: 'Type', name: 'Yash Pandit', city: 'Pune', photo: null,
  line: 'Draws Devanagari typefaces, one matra at a time.',
  works: [{ title: 'Akshar Sans', kind: 'Typeface', year: 2025 }, { title: 'Wada Display', kind: 'Typeface', year: 2024 }, { title: 'Signs of the Peth', kind: 'Research', year: 2023 }] },
{ slug: 'mehak-bajwa', art: 'graphic', kind: 'Posters', name: 'Mehak Bajwa', city: 'Ludhiana', photo: null,
  line: 'Makes posters for film clubs, screen-printed at the back of a tailor’s shop.',
  works: [{ title: 'Night Show', kind: 'Poster', year: 2025 }, { title: 'Matinee', kind: 'Series', year: 2024 }, { title: 'Second Print', kind: 'Poster', year: 2023 }] },
{ slug: 'karan-desai', art: 'graphic', kind: 'Identity', name: 'Karan Desai', city: 'Ahmedabad', photo: null,
  line: 'Builds identities for old textile mills that are starting again.',
  works: [{ title: 'Mill No. 4', kind: 'Identity', year: 2025 }, { title: 'Indigo Works', kind: 'Identity', year: 2024 }, { title: 'Warp', kind: 'Book', year: 2023 }] },
{ slug: 'isha-nambiar', art: 'graphic', kind: 'Type', name: 'Isha Nambiar', city: 'Thiruvananthapuram', photo: null,
  line: 'Letters Malayalam book covers by hand, then turns the best into fonts.',
  works: [{ title: 'Akshara', kind: 'Lettering', year: 2025 }, { title: 'Monsoon Press', kind: 'Covers', year: 2024 }, { title: 'Round Letters', kind: 'Typeface', year: 2023 }] },

// animation
{ slug: 'siddhant-rao', art: 'animation', kind: '3D', name: 'Siddhant Rao', city: 'Hyderabad', photo: null,
  line: 'Builds small 3D worlds out of things found on a kitchen shelf.',
  works: [{ title: 'Spice Tin City', kind: 'Short', year: 2025 }, { title: 'Steel Glass', kind: 'Loop', year: 2024 }, { title: 'Tiffin', kind: 'Short', year: 2023 }] },
{ slug: 'lavanya-iyer', art: 'animation', kind: 'Stop motion', name: 'Lavanya Iyer', city: 'Bengaluru', photo: null,
  line: 'Animates clay, one thumbprint at a time.',
  works: [{ title: 'Clay Monsoon', kind: 'Short', year: 2025 }, { title: 'Pot Luck', kind: 'Short', year: 2024 }, { title: 'Kolam', kind: 'Loop', year: 2023 }] },
{ slug: 'rehan-siddiqui', art: 'animation', kind: '2D', name: 'Rehan Siddiqui', city: 'Lucknow', photo: null,
  line: 'Animates Urdu poetry, letter by letter.',
  works: [{ title: 'Ghazal in Motion', kind: 'Short', year: 2025 }, { title: 'Inkwell', kind: 'Loop', year: 2024 }, { title: 'Nastaliq', kind: 'Short', year: 2023 }] },

// illustration
  { slug: 'zoya-khan', art: 'illustration', kind: 'Illustrators', name: 'Zoya Khan', city: 'Hyderabad', photo: null,
    line: 'Draws Hyderabad’s old shopfronts before they are repainted.',
    works: [{ title: 'Shutters', kind: 'Series', year: 2025 }, { title: 'Irani Cafés', kind: 'Zine', year: 2024 }, { title: 'Morning Bazaar', kind: 'Prints', year: 2023 }] },
  { slug: 'rohan-iyer', art: 'illustration', kind: 'Comics', name: 'Rohan Iyer', city: 'Bengaluru', photo: null,
    line: 'Writes and draws a webcomic about a startup that never ships.',
    works: [{ title: 'Beta Forever', kind: 'Webcomic', year: 2025 }, { title: 'Standup', kind: 'Zine', year: 2024 }, { title: 'Seed Round', kind: 'Short comic', year: 2023 }] },
  { slug: 'pia-banerjee', art: 'animation', kind: '2D', name: 'Pia Banerjee', city: 'Kolkata', photo: null,
    line: 'Animates by hand, twelve drawings a second, no shortcuts.',
    works: [{ title: 'Tram 26', kind: 'Short', year: 2025 }, { title: 'Para Cats', kind: 'Loops', year: 2024 }, { title: 'Hand-Drawn Rain', kind: 'Short', year: 2023 }] },
  { slug: 'aditya-nair', art: 'illustration', kind: 'Illustrators', name: 'Aditya Nair', city: 'Kozhikode', photo: null,
    line: 'Paints spice markets in gouache, mostly from memory.',
    works: [{ title: 'Pepper Route', kind: 'Series', year: 2025 }, { title: 'Ginger and Gold', kind: 'Prints', year: 2024 }, { title: 'Malabar Ledger', kind: 'Book', year: 2023 }] },
  { slug: 'leela-fernandes', art: 'illustration', kind: 'Comics', name: 'Leela Fernandes', city: 'Margao', photo: null,
    line: 'Draws comics about her grandmother’s recipes, and the arguments over them.',
    works: [{ title: 'Sorpotel Wars', kind: 'Comic', year: 2025 }, { title: 'Kitchen Notes', kind: 'Zine', year: 2024 }, { title: 'Feast Day', kind: 'Short comic', year: 2023 }] },

  // photography
  { slug: 'vikram-chauhan', art: 'photography', kind: 'Documentary', name: 'Vikram Chauhan', city: 'Jaipur', photo: null,
    line: 'Has photographed the same stepwell every month for six years.',
    works: [{ title: 'One Stepwell', kind: 'Series', year: 2025 }, { title: 'Dry Season', kind: 'Series', year: 2024 }, { title: 'Water Ledger', kind: 'Book', year: 2022 }] },
  { slug: 'aisha-siddiqui', art: 'photography', kind: 'Portrait', name: 'Aisha Siddiqui', city: 'Delhi', photo: null,
    line: 'Photographs tailors, barbers and cobblers at work, never posed.',
    works: [{ title: 'Small Trades', kind: 'Series', year: 2025 }, { title: 'Thread', kind: 'Exhibition', year: 2024 }, { title: 'Hands', kind: 'Series', year: 2023 }] },
  { slug: 'kunal-shah', art: 'photography', kind: 'Street', name: 'Kunal Shah', city: 'Mumbai', photo: null,
    line: 'Shoots Mumbai through the windows of local trains.',
    works: [{ title: 'Window Seat', kind: 'Series', year: 2025 }, { title: 'Platform 4', kind: 'Zine', year: 2024 }, { title: 'Monsoon Glass', kind: 'Series', year: 2023 }] },
  { slug: 'nandini-reddy', art: 'photography', kind: 'Portrait', name: 'Nandini Reddy', city: 'Warangal', photo: null,
    line: 'Makes portraits of women who run small businesses, in the shops they built.',
    works: [{ title: 'Proprietor', kind: 'Series', year: 2025 }, { title: 'Counter', kind: 'Exhibition', year: 2024 }, { title: 'First Shop', kind: 'Series', year: 2023 }] },
  { slug: 'tenzin-dorjee', art: 'photography', kind: 'Documentary', name: 'Tenzin Dorjee', city: 'Gangtok', photo: null,
    line: 'Photographs mountain roads and the crews who keep them open.',
    works: [{ title: 'Switchbacks', kind: 'Series', year: 2025 }, { title: 'Road Crew', kind: 'Book', year: 2024 }, { title: 'Above the Cloud Line', kind: 'Series', year: 2023 }] },

  // writing
  { slug: 'mira-joshi', art: 'writing', kind: 'Poets', name: 'Mira Joshi', city: 'Pune', photo: null,
    line: 'Writes poems in Marathi and English, sometimes in the same line.',
    works: [{ title: 'Two Tongues', kind: 'Collection', year: 2025 }, { title: 'Wada', kind: 'Chapbook', year: 2024 }, { title: 'Letters to a Fort', kind: 'Poems', year: 2023 }] },
  { slug: 'siddharth-bose', art: 'writing', kind: 'Novelists', name: 'Siddharth Bose', city: 'Kolkata', photo: null,
    line: 'Is finishing a novel about a family that runs a failing printing press.',
    works: [{ title: 'The Last Proof', kind: 'Novel, in progress', year: 2026 }, { title: 'Composing Stick', kind: 'Story', year: 2024 }, { title: 'Ink on College Street', kind: 'Essay', year: 2023 }] },
  { slug: 'hina-mirza', art: 'writing', kind: 'Essayists', name: 'Hina Mirza', city: 'Bhopal', photo: null,
    line: 'Writes about lakes, libraries and the people who look after both.',
    works: [{ title: 'Upper Lake', kind: 'Essay', year: 2025 }, { title: 'Reading Room', kind: 'Essays', year: 2024 }, { title: 'Date Due', kind: 'Essay', year: 2023 }] },
  { slug: 'varun-kulkarni', art: 'writing', kind: 'Poets', name: 'Varun Kulkarni', city: 'Nagpur', photo: null,
    line: 'Writes very short poems on very long train journeys.',
    works: [{ title: 'Sleeper Class', kind: 'Collection', year: 2025 }, { title: 'Night Junction', kind: 'Chapbook', year: 2024 }, { title: 'Sixteen Stations', kind: 'Poems', year: 2023 }] },
  { slug: 'anna-kurian', art: 'writing', kind: 'Novelists', name: 'Anna Kurian', city: 'Kottayam', photo: null,
    line: 'Writes crime novels set on rubber estates.',
    works: [{ title: 'Latex', kind: 'Novel', year: 2025 }, { title: 'The Tapper’s Hour', kind: 'Story', year: 2024 }, { title: 'Monsoon Alibi', kind: 'Novella', year: 2023 }] },

  // craft
  { slug: 'ishaan-bhatt', art: 'craft', kind: 'Ceramics', name: 'Ishaan Bhatt', city: 'Ahmedabad', photo: null,
    line: 'Throws pots on a wheel his grandfather built from a bicycle.',
    works: [{ title: 'Cycle Wheel', kind: 'Series', year: 2025 }, { title: 'Indigo Glaze', kind: 'Tableware', year: 2024 }, { title: 'Water Pots', kind: 'Series', year: 2023 }] },
  { slug: 'gauri-sathe', art: 'craft', kind: 'Textiles', name: 'Gauri Sathe', city: 'Nashik', photo: null,
    line: 'Weaves Paithani borders into everyday cotton.',
    works: [{ title: 'Everyday Paithani', kind: 'Collection', year: 2025 }, { title: 'Peacock, Plain', kind: 'Saris', year: 2024 }, { title: 'Loom Notes', kind: 'Samples', year: 2023 }] },
  { slug: 'manav-arora', art: 'craft', kind: 'Woodwork', name: 'Manav Arora', city: 'Chandigarh', photo: null,
    line: 'Makes chairs from the teak of demolished government offices.',
    works: [{ title: 'Sector Chair', kind: 'Furniture', year: 2025 }, { title: 'Reclaimed', kind: 'Exhibition', year: 2024 }, { title: 'Office Teak', kind: 'Furniture', year: 2023 }] },
  { slug: 'riya-das', art: 'craft', kind: 'Textiles', name: 'Riya Das', city: 'Bhubaneswar', photo: null,
    line: 'Dyes cloth with marigolds collected from the city’s flower markets.',
    works: [{ title: 'Marigold Run', kind: 'Collection', year: 2025 }, { title: 'Ikat Studies', kind: 'Samples', year: 2024 }, { title: 'Market Colour', kind: 'Scarves', year: 2023 }] },
  { slug: 'omkar-patil', art: 'craft', kind: 'Ceramics', name: 'Omkar Patil', city: 'Kolhapur', photo: null,
    line: 'Makes tableware for restaurants, and one strange vase a month for himself.',
    works: [{ title: 'Monthly Vase', kind: 'Series', year: 2025 }, { title: 'Red Earth', kind: 'Tableware', year: 2024 }, { title: 'Kolhapur Plates', kind: 'Tableware', year: 2023 }] },
];

// what one of each kind is called, for an artist's own page
export const ONE = {
  Composers: 'Composer', Producers: 'Producer', Vocalists: 'Vocalist',
  Directors: 'Director', Cinematographers: 'Cinematographer', Editors: 'Editor',
  Colourists: 'Colourist', Motion: 'Motion editor',
  Identity: 'Identity designer', Type: 'Type designer', Posters: 'Poster designer',
  Illustrators: 'Illustrator', Comics: 'Comics artist',
  '2D': '2D animator', '3D': '3D animator', 'Stop motion': 'Stop-motion animator',
  Documentary: 'Documentary photographer', Portrait: 'Portrait photographer', Street: 'Street photographer',
  Poets: 'Poet', Novelists: 'Novelist', Essayists: 'Essayist',
  Ceramics: 'Ceramicist', Textiles: 'Textile artist', Woodwork: 'Woodworker',
};

// The picks: art of the day, of the week and of the month, chosen by the client. Each is a work,
// as '<artist slug>/<its number in their works, from 1>', under its date: the day itself, the
// Monday its week starts on, or the month. Any day, week or month left out takes a piece in turn
// by the date, so the page keeps changing until the real picks begin.
//   day:   { '2026-10-27': 'nikhil-barua/1' }
//   week:  { '2026-10-26': 'mira-joshi/1' }
//   month: { '2026-10': 'ira-menon/1' }
export const PICKS = { day: {}, week: {}, month: {} };

// What can be bought: '<artist slug>/<its number in their works, from 1>', with its status
// ('available' or 'sold') and its price in rupees. Leave the price out for "Price on request". A
// piece not listed here is not for sale, and shows no price. PLACEHOLDERS, like everything above.
export const FOR_SALE = {
  'zoya-khan/3': { status: 'available', price: 4800 },
  'aditya-nair/2': { status: 'available', price: 6500 },
  'mehak-bajwa/1': { status: 'available', price: 3200 },
  'mehak-bajwa/3': { status: 'sold', price: 2800 },
  'vikram-chauhan/1': { status: 'available', price: 42000 },
  'kunal-shah/3': { status: 'available' },
  'tenzin-dorjee/3': { status: 'available', price: 36000 },
  'ishaan-bhatt/2': { status: 'available', price: 14500 },
  'ishaan-bhatt/3': { status: 'sold', price: 22000 },
  'gauri-sathe/2': { status: 'available', price: 68000 },
  'manav-arora/1': { status: 'available', price: 1.25e5 },
  'riya-das/3': { status: 'available', price: 5400 },
  'omkar-patil/1': { status: 'available', price: 9800 },
  'omkar-patil/3': { status: 'sold', price: 12600 },
};

// ---------------------------------------------------------------- the stand-in work (14 Nov)
// Until the real submissions come, the studio's own designs (the user's "Insomniac Work" folder,
// copied web-sized into assets/corner/insomniac/) hang in place of the drawn placeholders, so the
// corner can be seen with real work on it. The titles and makers above stay the invented ones.
// Each domain takes work of its own shape first (film the wide stills, video editing the tall
// cuts, music the squares), no design twice in one domain, and the artists' newest pieces are all
// different. The three carousel strips in the folder (5:1, 4:1, 3:1) are left out.
// ?standin=off shows the drawn placeholders again. To retire it, empty STAND_IN.
// [file, width, height, twin: versions of one design, kept out of the same domain]
export const STAND_IN = [
  ['iw-01', 1280, 1600], ['iw-02', 1600, 1254], ['iw-03', 1600, 900], ['iw-04', 1200, 1600],
  ['iw-05', 900, 1600], ['iw-06', 1280, 1600], ['iw-07', 1600, 900], ['iw-09', 1280, 1600, 'drop'],
  ['iw-10', 1271, 1600], ['iw-11', 1280, 1600, 'drop'], ['iw-12', 1600, 1600, 'giveaway'], ['iw-13', 1600, 1600, 'giveaway'],
  ['iw-14', 1280, 1600, 'coast'], ['iw-15', 1280, 1600], ['iw-16', 1600, 899], ['iw-18', 1280, 1600],
  ['iw-19', 1280, 1600, 'summer'], ['iw-20', 1270, 1600], ['iw-21', 1280, 1600, 'coast'], ['iw-22', 1280, 1600, 'summer'],
  ['iw-23', 1280, 1600], ['iw-24', 1280, 1600], ['iw-25', 900, 1600], ['iw-26', 1280, 1600],
  ['iw-27', 900, 1600], ['iw-28', 1600, 1600], ['iw-29', 1280, 1600], ['iw-30', 1280, 1600],
  ['iw-31', 1280, 1600], ['iw-32', 1280, 1600], ['iw-33', 900, 1600], ['iw-34', 1281, 1600],
  ['iw-35', 1600, 1600], ['iw-36', 1280, 1600, 'du'], ['iw-37', 1280, 1600, 'du'], ['iw-38', 1280, 1600, 'du'],
  ['iw-39', 1280, 1600, 'du'], ['iw-41', 1600, 900], ['iw-42', 1600, 1600], ['iw-43', 1131, 1600],
  ['iw-44', 1280, 1600, 'safar'], ['iw-45', 1280, 1600], ['iw-46', 1280, 1600], ['iw-47', 1280, 1600],
  ['iw-48', 1280, 1600], ['iw-49', 900, 1600], ['iw-50', 1280, 1600], ['iw-51', 1280, 1600],
  ['iw-52', 1600, 1600], ['iw-53', 1279, 1600], ['iw-54', 1280, 1600, 'safar'], ['iw-55', 1279, 1600],
  ['iw-56', 1600, 900],
];
if (!/[?&]standin=off\b/.test(globalThis.location?.search || '')) {
  const shape = ([, w, h]) => (w / h > 1.5 ? 'wide' : w / h < 0.6 ? 'tall' : Math.abs(w / h - 1) < 0.02 ? 'square' : 'page');
  const PREFER = { film: 'wide', editing: 'tall', music: 'square' };
  const used = new Map(), mine = new Map();
  // the least hung design of a kind that this domain does not have yet
  const pick = (list, have) => list.filter((d) => !have.has(d[3] || d[0])).sort((x, y) => (used.get(x[0]) || 0) - (used.get(y[0]) || 0))[0];
  const n = Math.max(...ARTISTS.map((p) => p.works.length));
  for (let i = 0; i < n; i++) {
    ARTS.forEach((a) => ARTISTS.filter((p) => p.art === a.id && p.works[i]).forEach((p) => {
      if (!mine.has(a.id)) mine.set(a.id, new Set());
      const have = mine.get(a.id);
      const d = pick(STAND_IN.filter((s) => shape(s) === PREFER[a.id]), have) || pick(STAND_IN.filter((s) => shape(s) === 'page'), have) || pick(STAND_IN, have);
      if (!d) return;
      used.set(d[0], (used.get(d[0]) || 0) + 1);
      have.add(d[3] || d[0]);
      Object.assign(p.works[i], { image: `assets/corner/insomniac/${d[0]}.jpg`, ratio: d[1] / d[2] });
    }));
  }
}
