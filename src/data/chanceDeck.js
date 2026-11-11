export const CHANCE_CARDS = [
  {
    id: "jail-free",
    title: "Get Out of Jail Free",
    desc: "Keep this card until needed, use it to walk out of Jail for free, or trade it to another player.",
    type: "jail_free"
  },
  {
    id: "festival-village",
    title: "Village Festival",
    desc: "Own a whole village set (Brown, Sky, or Pink) and hold a festival for 3× rent on all of it for 6 rounds or until you pass Launch.",
    type: "festival"
  },
  {
    id: "advance-launch",
    title: "Advance to Launch",
    desc: "Board the express rocket and travel directly to Launch. Collect your salary immediately!",
    type: "move",
    target: 0
  },
  {
    id: "it-refund",
    title: "Income Tax Refund",
    desc: "A government audit concluded in your favor. Collect 10% bonus on your cash holding (at least ₹150).",
    type: "cash_pct",
    percent: 10,
    min: 150
  },
  {
    id: "metro-expansion",
    title: "Metro Expansion",
    desc: "Pune Metro pays you dividends on transit integration. Collect ₹100 from the Bank.",
    type: "cash_flat",
    amount: 100
  },
  {
    id: "street-repairs",
    title: "Property Assessment",
    desc: "City council assesses road paving costs. Pay 2% of your cash holding per property owned.",
    type: "property_fee",
    percentPerProp: 2
  },
  {
    id: "speeding-fine",
    title: "Speed Trap Fine",
    desc: "Caught speeding on the Pune-Mumbai Expressway! Pay ₹80 traffic levy.",
    type: "cash_flat",
    amount: -80
  },
  {
    id: "go-jail",
    title: "Go to Jail",
    desc: "Go directly to Jail. Do not pass Launch, do not collect salary.",
    type: "go_jail"
  },
  {
    id: "tech-dividend",
    title: "Hinjawadi Tech Dividend",
    desc: "Your tech campus investment hit new quarterly highs. Collect ₹200.",
    type: "cash_flat",
    amount: 200
  },
  {
    id: "birthday-treat",
    title: "It's Your Birthday!",
    desc: "Everyone at the table chips in for your celebration. Collect ₹50 from every active player.",
    type: "all_pay_me",
    amount: 50
  }
];

