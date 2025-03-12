// Define standard attribute ranges (min, max, distribution)
export const AttributeRanges = {
  // Physical attributes
  STRENGTH: {
    median: 1250, // Stronger than average
    ranges: [450, 950, 1150, 1250, 1350, 1550, 2250],
    category: "Physical",
  },
  AGILITY: {
    median: 900, // Less agile than average
    ranges: [150, 600, 800, 900, 1000, 1100, 1500],
    category: "Physical",
  },
  TOUGHNESS: {
    median: 1250, // Tougher than average
    ranges: [450, 950, 1150, 1250, 1350, 1550, 2250],
    category: "Physical",
  },
  ENDURANCE: {
    median: 1000, // Average endurance
    ranges: [200, 700, 900, 1000, 1100, 1300, 2000],
    category: "Physical",
  },
  RECUPERATION: {
    median: 1000, // Average healing
    ranges: [200, 700, 900, 1000, 1100, 1300, 2000],
    category: "Physical",
  },
  DISEASE_RESISTANCE: {
    median: 1000, // Average disease resistance
    ranges: [200, 700, 900, 1000, 1100, 1300, 2000],
    category: "Physical",
  },

  // Mental attributes
  ANALYTICAL_ABILITY: {
    median: 1250, // Above average intellect
    ranges: [450, 950, 1150, 1250, 1350, 1550, 2250],
    category: "Mental",
  },
  FOCUS: {
    median: 1500, // Much better focus
    ranges: [700, 1200, 1400, 1500, 1600, 1800, 2500],
    category: "Mental",
  },
  WILLPOWER: {
    median: 1000, // Average willpower
    ranges: [200, 800, 900, 1000, 1100, 1300, 2000],
    category: "Mental",
  },
  CREATIVITY: {
    median: 1250, // Above average creativity
    ranges: [450, 950, 1150, 1250, 1350, 1550, 2250],
    category: "Mental",
  },
  INTUITION: {
    median: 1000, // Average intuition
    ranges: [200, 800, 900, 1000, 1100, 1300, 2000],
    category: "Mental",
  },
  PATIENCE: {
    median: 1250, // Above average patience
    ranges: [450, 950, 1150, 1250, 1350, 1550, 2250],
    category: "Mental",
  },
  MEMORY: {
    median: 1250, // Above average memory
    ranges: [450, 950, 1150, 1250, 1350, 1550, 2250],
    category: "Mental",
  },
  LINGUISTIC_ABILITY: {
    median: 1000, // Average linguistic ability
    ranges: [200, 800, 900, 1000, 1100, 1300, 2000],
    category: "Mental",
  },
  SPATIAL_SENSE: {
    median: 1500, // Much better spatial sense
    ranges: [700, 1200, 1400, 1500, 1600, 1800, 2500],
    category: "Mental",
  },
  MUSICALITY: {
    median: 1000, // Average musicality
    ranges: [200, 800, 900, 1000, 1100, 1300, 2000],
    category: "Mental",
  },
  KINESTHETIC_SENSE: {
    median: 1000, // Average body awareness
    ranges: [200, 800, 900, 1000, 1100, 1300, 2000],
    category: "Mental",
  },
  EMPATHY: {
    median: 1000, // Average empathy
    ranges: [200, 800, 900, 1000, 1100, 1300, 2000],
    category: "Mental",
  },
  SOCIAL_AWARENESS: {
    median: 1000, // Average social awareness
    ranges: [200, 800, 900, 1000, 1100, 1300, 2000],
    category: "Mental",
  },
};

// Function to generate random attribute value from range
export function generateAttributeValue(attributeName: string): number {
  const attributeInfo =
    AttributeRanges[attributeName as keyof typeof AttributeRanges];
  if (!attributeInfo) return 1000; // Default for unknown attributes

  const ranges = attributeInfo.ranges;

  // Pick a random range bracket (6 ranges)
  const rangeBracket = Math.floor(Math.random() * 6);
  const minValue = ranges[rangeBracket];
  const maxValue = ranges[rangeBracket + 1];

  // Return random value within that range
  return Math.floor(minValue + Math.random() * (maxValue - minValue));
}

// Generate a complete set of attributes
export function generateAttributes(): Record<string, number> {
  const attributes: Record<string, number> = {};

  for (const key in AttributeRanges) {
    attributes[key] = generateAttributeValue(key);
  }

  return attributes;
}
