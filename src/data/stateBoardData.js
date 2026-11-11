// State-to-City & District Mapping for Dynamic Board Setup

export const STATE_REGIONS = {
  maharashtra: {
    id: "maharashtra",
    name: "Maharashtra (Pune & Mumbai)",
    badge: "MH",
    description: "From serene Sahyadri getaways to Mumbai & Pune prime estates",
    cities: {
      brown: [
        { name: "Mulshi", price: 80, rent: [12, 36, 90, 240, 400, 600] },
        { name: "Kamshet", price: 100, rent: [15, 45, 120, 300, 500, 750] }
      ],
      sky: [
        { name: "Dehu", price: 80, rent: [8, 24, 70, 200, 350, 550] },
        { name: "Alandi", price: 80, rent: [8, 24, 70, 200, 350, 550] },
        { name: "Jejuri", price: 100, rent: [10, 30, 90, 250, 420, 650] }
      ],
      pink: [
        { name: "Lavasa", price: 120, rent: [12, 36, 110, 300, 500, 750] },
        { name: "Khandala", price: 120, rent: [12, 36, 110, 300, 500, 750] },
        { name: "Lonavala", price: 140, rent: [14, 42, 130, 350, 600, 900] }
      ],
      orange: [
        { name: "Akurdi", price: 160, rent: [16, 50, 150, 450, 750, 1050] },
        { name: "Nigdi", price: 160, rent: [16, 50, 150, 450, 750, 1050] },
        { name: "Pimpri", price: 180, rent: [18, 60, 180, 500, 850, 1200] }
      ],
      red: [
        { name: "Ravet", price: 200, rent: [20, 60, 200, 600, 950, 1350] },
        { name: "Saudagar", price: 200, rent: [20, 60, 200, 600, 950, 1350] },
        { name: "Wakad", price: 220, rent: [22, 70, 220, 650, 1050, 1500] }
      ],
      yellow: [
        { name: "Katraj", price: 240, rent: [24, 75, 240, 720, 1150, 1650] },
        { name: "Warje", price: 240, rent: [24, 75, 240, 720, 1150, 1650] },
        { name: "Wagholi", price: 260, rent: [26, 80, 260, 780, 1250, 1750] }
      ],
      green: [
        { name: "Pashan", price: 280, rent: [28, 90, 280, 850, 1350, 1900] },
        { name: "Kharadi", price: 280, rent: [28, 90, 280, 850, 1350, 1900] },
        { name: "Kothrud", price: 300, rent: [30, 100, 300, 900, 1450, 2000] }
      ],
      blue: [
        { name: "Aundh", price: 320, rent: [32, 110, 330, 1000, 1600, 2200] },
        { name: "Viman", price: 320, rent: [32, 110, 330, 1000, 1600, 2200] },
        { name: "Baner", price: 340, rent: [34, 120, 360, 1100, 1750, 2400] }
      ],
      purple: [
        { name: "Camp", price: 360, rent: [36, 130, 400, 1200, 1900, 2600] },
        { name: "Deccan", price: 360, rent: [36, 130, 400, 1200, 1900, 2600] },
        { name: "Kalyani", price: 380, rent: [38, 140, 420, 1280, 2000, 2800] }
      ],
      black: [
        { name: "Boat Club", price: 400, rent: [50, 180, 500, 1500, 2300, 3200] },
        { name: "Koregaon", price: 400, rent: [50, 180, 500, 1500, 2300, 3200] }
      ]
    },
    stations: [
      { name: "Pune Stn", icon: "train-front", price: 200 },
      { name: "Pimpri Stn", icon: "train-front", price: 200 },
      { name: "Swargate", icon: "train-front", price: 200 },
      { name: "Lohegaon", icon: "plane", price: 200 }
    ],
    utilities: [
      { name: "Tata Power", icon: "zap", price: 150 },
      { name: "MTNL Telecom", icon: "wifi", price: 150 }
    ]
  },

  karnataka: {
    id: "karnataka",
    name: "Karnataka (Bengaluru & Heritage Hubs)",
    badge: "KA",
    description: "From Silk City Ramanagara to Indiranagar & UB City skyscrapers",
    cities: {
      brown: [
        { name: "Ramanagara", price: 80, rent: [12, 36, 90, 240, 400, 600] },
        { name: "Channapatna", price: 100, rent: [15, 45, 120, 300, 500, 750] }
      ],
      sky: [
        { name: "Bidadi", price: 80, rent: [8, 24, 70, 200, 350, 550] },
        { name: "Kengeri", price: 80, rent: [8, 24, 70, 200, 350, 550] },
        { name: "Nelamangala", price: 100, rent: [10, 30, 90, 250, 420, 650] }
      ],
      pink: [
        { name: "Devanahalli", price: 120, rent: [12, 36, 110, 300, 500, 750] },
        { name: "Yelahanka", price: 120, rent: [12, 36, 110, 300, 500, 750] },
        { name: "Hosakote", price: 140, rent: [14, 42, 130, 350, 600, 900] }
      ],
      orange: [
        { name: "Electronic City", price: 160, rent: [16, 50, 150, 450, 750, 1050] },
        { name: "Whitefield", price: 160, rent: [16, 50, 150, 450, 750, 1050] },
        { name: "Marathahalli", price: 180, rent: [18, 60, 180, 500, 850, 1200] }
      ],
      red: [
        { name: "HSR Layout", price: 200, rent: [20, 60, 200, 600, 950, 1350] },
        { name: "BTM Layout", price: 200, rent: [20, 60, 200, 600, 950, 1350] },
        { name: "JP Nagar", price: 220, rent: [22, 70, 220, 650, 1050, 1500] }
      ],
      yellow: [
        { name: "Jayanagar", price: 240, rent: [24, 75, 240, 720, 1150, 1650] },
        { name: "Basavanagudi", price: 240, rent: [24, 75, 240, 720, 1150, 1650] },
        { name: "Malleshwaram", price: 260, rent: [26, 80, 260, 780, 1250, 1750] }
      ],
      green: [
        { name: "Bellandur", price: 280, rent: [28, 90, 280, 850, 1350, 1900] },
        { name: "Sarjapur", price: 280, rent: [28, 90, 280, 850, 1350, 1900] },
        { name: "Koramangala", price: 300, rent: [30, 100, 300, 900, 1450, 2000] }
      ],
      blue: [
        { name: "Indiranagar", price: 320, rent: [32, 110, 330, 1000, 1600, 2200] },
        { name: "Richmond Town", price: 320, rent: [32, 110, 330, 1000, 1600, 2200] },
        { name: "Lavelle Road", price: 340, rent: [34, 120, 360, 1100, 1750, 2400] }
      ],
      purple: [
        { name: "Cunningham Rd", price: 360, rent: [36, 130, 400, 1200, 1900, 2600] },
        { name: "Vasanth Nagar", price: 360, rent: [36, 130, 400, 1200, 1900, 2600] },
        { name: "Sadashivanagar", price: 380, rent: [38, 140, 420, 1280, 2000, 2800] }
      ],
      black: [
        { name: "UB City", price: 400, rent: [50, 180, 500, 1500, 2300, 3200] },
        { name: "Doll's Colony", price: 400, rent: [50, 180, 500, 1500, 2300, 3200] }
      ]
    },
    stations: [
      { name: "KSR Majestic", icon: "train-front", price: 200 },
      { name: "Yeshvantpur", icon: "train-front", price: 200 },
      { name: "Cantonment", icon: "train-front", price: 200 },
      { name: "Kempegowda Int", icon: "plane", price: 200 }
    ],
    utilities: [
      { name: "BESCOM Power", icon: "zap", price: 150 },
      { name: "Jio Fiber", icon: "wifi", price: 150 }
    ]
  },

  tamilnadu: {
    id: "tamilnadu",
    name: "Tamil Nadu (Chennai & Coastal Corridors)",
    badge: "TN",
    description: "From historic Mahabalipuram to T. Nagar & Poes Garden estates",
    cities: {
      brown: [
        { name: "Mahabalipuram", price: 80, rent: [12, 36, 90, 240, 400, 600] },
        { name: "Kanchipuram", price: 100, rent: [15, 45, 120, 300, 500, 750] }
      ],
      sky: [
        { name: "Chengalpattu", price: 80, rent: [8, 24, 70, 200, 350, 550] },
        { name: "Tambaram", price: 80, rent: [8, 24, 70, 200, 350, 550] },
        { name: "Chromepet", price: 100, rent: [10, 30, 90, 250, 420, 650] }
      ],
      pink: [
        { name: "Guindy", price: 120, rent: [12, 36, 110, 300, 500, 750] },
        { name: "Velachery", price: 120, rent: [12, 36, 110, 300, 500, 750] },
        { name: "Thiruvanmiyur", price: 140, rent: [14, 42, 130, 350, 600, 900] }
      ],
      orange: [
        { name: "Kodambakkam", price: 160, rent: [16, 50, 150, 450, 750, 1050] },
        { name: "Vadapalani", price: 160, rent: [16, 50, 150, 450, 750, 1050] },
        { name: "T. Nagar", price: 180, rent: [18, 60, 180, 500, 850, 1200] }
      ],
      red: [
        { name: "Anna Nagar", price: 200, rent: [20, 60, 200, 600, 950, 1350] },
        { name: "Kilpauk", price: 200, rent: [20, 60, 200, 600, 950, 1350] },
        { name: "Chetpet", price: 220, rent: [22, 70, 220, 650, 1050, 1500] }
      ],
      yellow: [
        { name: "Mylapore", price: 240, rent: [24, 75, 240, 720, 1150, 1650] },
        { name: "Mandaveli", price: 240, rent: [24, 75, 240, 720, 1150, 1650] },
        { name: "Alwarpet", price: 260, rent: [26, 80, 260, 780, 1250, 1750] }
      ],
      green: [
        { name: "Besant Nagar", price: 280, rent: [28, 90, 280, 850, 1350, 1900] },
        { name: "Adyar", price: 280, rent: [28, 90, 280, 850, 1350, 1900] },
        { name: "Kotturpuram", price: 300, rent: [30, 100, 300, 900, 1450, 2000] }
      ],
      blue: [
        { name: "Nungambakkam", price: 320, rent: [32, 110, 330, 1000, 1600, 2200] },
        { name: "Gopalapuram", price: 320, rent: [32, 110, 330, 1000, 1600, 2200] },
        { name: "Egmore", price: 340, rent: [34, 120, 360, 1100, 1750, 2400] }
      ],
      purple: [
        { name: "RA Puram", price: 360, rent: [36, 130, 400, 1200, 1900, 2600] },
        { name: "Bishop Garden", price: 360, rent: [36, 130, 400, 1200, 1900, 2600] },
        { name: "Boat Club Rd", price: 380, rent: [38, 140, 420, 1280, 2000, 2800] }
      ],
      black: [
        { name: "Poes Garden", price: 400, rent: [50, 180, 500, 1500, 2300, 3200] },
        { name: "Wallace Garden", price: 400, rent: [50, 180, 500, 1500, 2300, 3200] }
      ]
    },
    stations: [
      { name: "Chennai Central", icon: "train-front", price: 200 },
      { name: "Chennai Egmore", icon: "train-front", price: 200 },
      { name: "Tambaram Jn", icon: "train-front", price: 200 },
      { name: "Meenambakkam", icon: "plane", price: 200 }
    ],
    utilities: [
      { name: "TANGEDCO Grid", icon: "zap", price: 150 },
      { name: "Airtel Chennai", icon: "wifi", price: 150 }
    ]
  },

  delhi_ncr: {
    id: "delhi_ncr",
    name: "Delhi / NCR (Capital & Lutyens)",
    badge: "DL",
    description: "From Sohna & Manesar to Golf Links & Lutyens' Bungalow Zone",
    cities: {
      brown: [
        { name: "Manesar", price: 80, rent: [12, 36, 90, 240, 400, 600] },
        { name: "Sohna", price: 100, rent: [15, 45, 120, 300, 500, 750] }
      ],
      sky: [
        { name: "Greater Noida", price: 80, rent: [8, 24, 70, 200, 350, 550] },
        { name: "Kundli", price: 80, rent: [8, 24, 70, 200, 350, 550] },
        { name: "Bahadurgarh", price: 100, rent: [10, 30, 90, 250, 420, 650] }
      ],
      pink: [
        { name: "Dwarka", price: 120, rent: [12, 36, 110, 300, 500, 750] },
        { name: "Rohini", price: 120, rent: [12, 36, 110, 300, 500, 750] },
        { name: "Janakpuri", price: 140, rent: [14, 42, 130, 350, 600, 900] }
      ],
      orange: [
        { name: "Noida Sec 18", price: 160, rent: [16, 50, 150, 450, 750, 1050] },
        { name: "Cyber Hub", price: 160, rent: [16, 50, 150, 450, 750, 1050] },
        { name: "Golf Course Ext", price: 180, rent: [18, 60, 180, 500, 850, 1200] }
      ],
      red: [
        { name: "Saket", price: 200, rent: [20, 60, 200, 600, 950, 1350] },
        { name: "Hauz Khas", price: 200, rent: [20, 60, 200, 600, 950, 1350] },
        { name: "Green Park", price: 220, rent: [22, 70, 220, 650, 1050, 1500] }
      ],
      yellow: [
        { name: "South Ext", price: 240, rent: [24, 75, 240, 720, 1150, 1650] },
        { name: "Lajpat Nagar", price: 240, rent: [24, 75, 240, 720, 1150, 1650] },
        { name: "Defence Colony", price: 260, rent: [26, 80, 260, 780, 1250, 1750] }
      ],
      green: [
        { name: "Greater Kailash", price: 280, rent: [28, 90, 280, 850, 1350, 1900] },
        { name: "Vasant Vihar", price: 280, rent: [28, 90, 280, 850, 1350, 1900] },
        { name: "Chanakyapuri", price: 300, rent: [30, 100, 300, 900, 1450, 2000] }
      ],
      blue: [
        { name: "Connaught Place", price: 320, rent: [32, 110, 330, 1000, 1600, 2200] },
        { name: "Barakhamba", price: 320, rent: [32, 110, 330, 1000, 1600, 2200] },
        { name: "Sundar Nagar", price: 340, rent: [34, 120, 360, 1100, 1750, 2400] }
      ],
      purple: [
        { name: "Golf Links", price: 360, rent: [36, 130, 400, 1200, 1900, 2600] },
        { name: "Jor Bagh", price: 360, rent: [36, 130, 400, 1200, 1900, 2600] },
        { name: "Prithviraj Rd", price: 380, rent: [38, 140, 420, 1280, 2000, 2800] }
      ],
      black: [
        { name: "Amrita Shergill", price: 400, rent: [50, 180, 500, 1500, 2300, 3200] },
        { name: "Lutyens Zone", price: 400, rent: [50, 180, 500, 1500, 2300, 3200] }
      ]
    },
    stations: [
      { name: "New Delhi Stn", icon: "train-front", price: 200 },
      { name: "Old Delhi Stn", icon: "train-front", price: 200 },
      { name: "Nizamuddin", icon: "train-front", price: 200 },
      { name: "IGI Airport", icon: "plane", price: 200 }
    ],
    utilities: [
      { name: "BSES Power", icon: "zap", price: 150 },
      { name: "Delhi Metro Net", icon: "wifi", price: 150 }
    ]
  }
};

/**
 * Builds the full 48-space board array dynamically for any selected state.
 * Fixed positions (GO/Launch, Jail, Break, Go to Jail, Taxes, Chance, Market)
 * remain preserved, while property names, sets, prices, and rents are updated.
 */
export function generateBoardForState(stateId = "maharashtra") {
  const stateData = STATE_REGIONS[stateId] || STATE_REGIONS.maharashtra;
  const { cities, stations, utilities } = stateData;

  return [
    // Bottom row (moving right to left: 0 to 12)
    { id: 0, kind: "launch", name: "Launch", icon: "rocket", subtitle: "Collect salary" },
    { id: 1, kind: "city", name: cities.brown[0].name, set: "brown", price: cities.brown[0].price, rent: cities.brown[0].rent },
    { id: 2, kind: "city", name: cities.brown[1].name, set: "brown", price: cities.brown[1].price, rent: cities.brown[1].rent },
    { id: 3, kind: "chance", name: "Chance", icon: "circle-help" },
    { id: 4, kind: "city", name: cities.sky[0].name, set: "sky", price: cities.sky[0].price, rent: cities.sky[0].rent },
    { id: 5, kind: "city", name: cities.sky[1].name, set: "sky", price: cities.sky[1].price, rent: cities.sky[1].rent },
    { id: 6, kind: "city", name: cities.sky[2].name, set: "sky", price: cities.sky[2].price, rent: cities.sky[2].rent },
    { id: 7, kind: "rail", name: stations[0].name, icon: stations[0].icon, price: stations[0].price },
    { id: 8, kind: "levy", name: "Income Tax", icon: "receipt", pct: 10 },
    { id: 9, kind: "city", name: cities.pink[0].name, set: "pink", price: cities.pink[0].price, rent: cities.pink[0].rent },
    { id: 10, kind: "city", name: cities.pink[1].name, set: "pink", price: cities.pink[1].price, rent: cities.pink[1].rent },
    { id: 11, kind: "city", name: cities.pink[2].name, set: "pink", price: cities.pink[2].price, rent: cities.pink[2].rent },

    // Left row (moving bottom to top: 12 to 24)
    { id: 12, kind: "jail", name: "Jail", icon: "lock-keyhole", subtitle: "Just visiting" },
    { id: 13, kind: "city", name: cities.orange[0].name, set: "orange", price: cities.orange[0].price, rent: cities.orange[0].rent },
    { id: 14, kind: "city", name: cities.orange[1].name, set: "orange", price: cities.orange[1].price, rent: cities.orange[1].rent },
    { id: 15, kind: "city", name: cities.orange[2].name, set: "orange", price: cities.orange[2].price, rent: cities.orange[2].rent },
    { id: 16, kind: "market", name: "Market", icon: "trending-up" },
    { id: 17, kind: "utility", name: utilities[0].name, icon: utilities[0].icon, price: utilities[0].price },
    { id: 18, kind: "rail", name: stations[1].name, icon: stations[1].icon, price: stations[1].price },
    { id: 19, kind: "chance", name: "Chance", icon: "circle-help" },
    { id: 20, kind: "city", name: cities.red[0].name, set: "red", price: cities.red[0].price, rent: cities.red[0].rent },
    { id: 21, kind: "city", name: cities.red[1].name, set: "red", price: cities.red[1].price, rent: cities.red[1].rent },
    { id: 22, kind: "city", name: cities.red[2].name, set: "red", price: cities.red[2].price, rent: cities.red[2].rent },
    { id: 23, kind: "market", name: "Market", icon: "trending-up" },

    // Top row (moving left to right: 24 to 36)
    { id: 24, kind: "break", name: "Take a Break", icon: "coffee", subtitle: "Free rest" },
    { id: 25, kind: "city", name: cities.yellow[0].name, set: "yellow", price: cities.yellow[0].price, rent: cities.yellow[0].rent },
    { id: 26, kind: "city", name: cities.yellow[1].name, set: "yellow", price: cities.yellow[1].price, rent: cities.yellow[1].rent },
    { id: 27, kind: "city", name: cities.yellow[2].name, set: "yellow", price: cities.yellow[2].price, rent: cities.yellow[2].rent },
    { id: 28, kind: "chance", name: "Chance", icon: "circle-help" },
    { id: 29, kind: "rail", name: stations[2].name, icon: stations[2].icon, price: stations[2].price },
    { id: 30, kind: "utility", name: utilities[1].name, icon: utilities[1].icon, price: utilities[1].price },
    { id: 31, kind: "market", name: "Market", icon: "trending-up" },
    { id: 32, kind: "city", name: cities.green[0].name, set: "green", price: cities.green[0].price, rent: cities.green[0].rent },
    { id: 33, kind: "city", name: cities.green[1].name, set: "green", price: cities.green[1].price, rent: cities.green[1].rent },
    { id: 34, kind: "city", name: cities.green[2].name, set: "green", price: cities.green[2].price, rent: cities.green[2].rent },
    { id: 35, kind: "chance", name: "Chance", icon: "circle-help" },

    // Right row (moving top to bottom: 36 to 47)
    { id: 36, kind: "gojail", name: "Go to Jail", icon: "siren", subtitle: "Direct to lockup" },
    { id: 37, kind: "city", name: cities.blue[0].name, set: "blue", price: cities.blue[0].price, rent: cities.blue[0].rent },
    { id: 38, kind: "city", name: cities.blue[1].name, set: "blue", price: cities.blue[1].price, rent: cities.blue[1].rent },
    { id: 39, kind: "city", name: cities.blue[2].name, set: "blue", price: cities.blue[2].price, rent: cities.blue[2].rent },
    { id: 40, kind: "market", name: "Market", icon: "trending-up" },
    { id: 41, kind: "rail", name: stations[3].name, icon: stations[3].icon, price: stations[3].price },
    { id: 42, kind: "city", name: cities.purple[0].name, set: "purple", price: cities.purple[0].price, rent: cities.purple[0].rent },
    { id: 43, kind: "city", name: cities.purple[1].name, set: "purple", price: cities.purple[1].price, rent: cities.purple[1].rent },
    { id: 44, kind: "city", name: cities.purple[2].name, set: "purple", price: cities.purple[2].price, rent: cities.purple[2].rent },
    { id: 45, kind: "levy", name: "Luxury Tax", icon: "receipt", pct: 20 },
    { id: 46, kind: "city", name: cities.black[0].name, set: "black", price: cities.black[0].price, rent: cities.black[0].rent },
    { id: 47, kind: "city", name: cities.black[1].name, set: "black", price: cities.black[1].price, rent: cities.black[1].rent }
  ];
}

