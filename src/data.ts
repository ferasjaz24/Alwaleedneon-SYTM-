export interface Product {
  name: string;
  features: string[];
}

export const products: Product[] = [
  {
    name: "Gate Valves",
    features: ["Ductile Iron Construction", "Underground Network Ready", "High Pressure Resistance"],
  },
  {
    name: "Butterfly Valves",
    features: ["Compact Design", "Efficient Flow Control", "Long Service Life"],
  },
  {
    name: "Check Valves",
    features: ["Backflow Prevention", "Reliable Performance", "Minimal Maintenance"],
  },
  {
    name: "Pipe Fittings",
    features: ["Flexible Installation", "Network Compatibility", "Heavy-Duty Construction"],
  },
  {
    name: "Hydraulic Couplings",
    features: ["Fast Assembly", "Leak Prevention", "Infrastructure Grade"],
  },
];

export const industries = [
  "Water Infrastructure",
  "Wastewater Systems",
  "Stormwater Networks",
  "Utilities",
  "Industrial Facilities",
  "Municipal Projects",
  "Energy Infrastructure",
  "Construction Contractors",
];
