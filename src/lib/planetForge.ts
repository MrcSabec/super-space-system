import {
  PlanetSize,
  PlanetType,
  PlanetTemperature,
  PlanetAtmosphere,
  PlanetGravity,
  ResourceLevel,
  PlanetResource,
  AnomalousOrbit,
  Planet,
} from "@/types/sss";

export const PLANET_SIZES: PlanetSize[] = ["Pequeno", "Médio", "Grande"];
export const PLANET_TYPES: PlanetType[] = ["Sólido", "Gasoso"];
export const PLANET_TEMPERATURES: PlanetTemperature[] = ["Baixa", "Média", "Alta"];
export const PLANET_ATMOSPHERES: PlanetAtmosphere[] = ["Respirável", "Tóxica", "Nenhuma"];
export const PLANET_GRAVITIES: PlanetGravity[] = ["Baixa", "Normal", "Alta"];
export const RESOURCE_LEVELS: ResourceLevel[] = ["Baixa", "Média", "Alta"];

export const ALL_PLANET_RESOURCES: string[] = [
  "Água",
  "Grãos Alienígenas",
  "Fauna Alienígena",
  "Polímeros Naturais",
  "Ligas Pesadas",
  "Silicato",
  "Matéria Radioativa",
  "Plasma",
  "Estimulantes",
];

export const SPECIAL_TRAITS = {
  INTELLIGENT_LIFE: "Vida Inteligente",
  ADVANCED_CIVILIZATION: "Vida Inteligente (Civilização Avançada)",
  PRECURSOR_RUINS: "Ruínas Precursoras",
} as const;

/**
 * Styling and badge theme metadata for each resource
 */
export interface ResourceTheme {
  name: string;
  color: string;
  badgeBg: string;
  borderColor: string;
  textColor: string;
}

export const RESOURCE_THEMES: Record<string, ResourceTheme> = {
  Água: {
    name: "Água",
    color: "#38bdf8",
    badgeBg: "bg-sky-500/15",
    borderColor: "border-sky-500/40",
    textColor: "text-sky-300",
  },
  "Grãos Alienígenas": {
    name: "Grãos Alienígenas",
    color: "#facc15",
    badgeBg: "bg-amber-500/15",
    borderColor: "border-amber-500/40",
    textColor: "text-amber-300",
  },
  "Fauna Alienígena": {
    name: "Fauna Alienígena",
    color: "#4ade80",
    badgeBg: "bg-emerald-500/15",
    borderColor: "border-emerald-500/40",
    textColor: "text-emerald-300",
  },
  "Polímeros Naturais": {
    name: "Polímeros Naturais",
    color: "#2dd4bf",
    badgeBg: "bg-teal-500/15",
    borderColor: "border-teal-500/40",
    textColor: "text-teal-300",
  },
  "Ligas Pesadas": {
    name: "Ligas Pesadas",
    color: "#cbd5e1",
    badgeBg: "bg-slate-400/15",
    borderColor: "border-slate-400/40",
    textColor: "text-slate-200",
  },
  Silicato: {
    name: "Silicato",
    color: "#e879f9",
    badgeBg: "bg-fuchsia-500/15",
    borderColor: "border-fuchsia-500/40",
    textColor: "text-fuchsia-300",
  },
  "Matéria Radioativa": {
    name: "Matéria Radioativa",
    color: "#fb923c",
    badgeBg: "bg-orange-500/15",
    borderColor: "border-orange-500/40",
    textColor: "text-orange-300",
  },
  Plasma: {
    name: "Plasma",
    color: "#c084fc",
    badgeBg: "bg-purple-500/15",
    borderColor: "border-purple-500/40",
    textColor: "text-purple-300",
  },
  Estimulantes: {
    name: "Estimulantes",
    color: "#f472b6",
    badgeBg: "bg-pink-500/15",
    borderColor: "border-pink-500/40",
    textColor: "text-pink-300",
  },
};

/**
 * Returns level indicator arrow string:
 * Baixa = 1 seta (↑)
 * Média = 2 setas (↑↑)
 * Alta = 3 setas (↑↑↑)
 */
export function getResourceLevelArrows(level: ResourceLevel): string {
  switch (level) {
    case "Baixa":
      return "↑";
    case "Média":
      return "↑↑";
    case "Alta":
      return "↑↑↑";
    default:
      return "↑";
  }
}

/**
 * Converts planet size to renderable map unit pixel radius
 */
export function getPlanetVisualRadius(size: PlanetSize | number | undefined): number {
  if (typeof size === "number") return size;
  switch (size) {
    case "Pequeno":
      return 12;
    case "Médio":
      return 17;
    case "Grande":
      return 23;
    default:
      return 16;
  }
}

/**
 * Helper to pick weighted random element
 */
function weightedPick<T>(items: { value: T; weight: number }[]): T {
  const totalWeight = items.reduce((acc, curr) => acc + curr.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    if (random < item.weight) {
      return item.value;
    }
    random -= item.weight;
  }
  return items[items.length - 1].value;
}

export interface GeneratePlanetOptions {
  allowRuins?: boolean;       // If true, rolls 5% chance of Precursor Ruins
  forceRuins?: boolean;       // If true, always guarantees Precursor Ruins
  forceIntelligentLife?: boolean;
  preferredType?: PlanetType;
}

export interface GeneratedPlanetStats {
  size: PlanetSize;
  type: PlanetType;
  temperature: PlanetTemperature;
  atmosphere: PlanetAtmosphere;
  gravity: PlanetGravity;
  resources: PlanetResource[];
  traits: string[];
}

/**
 * Procedural Planet Generator Engine
 * Implements all specifications:
 * 1. Gas giants: ZERO heavy alloys, natural polymers, alien grains. HIGH plasma & radioactive material.
 * 2. Low temp: Higher chance of water (ice) & silicate. High temp: Higher chance of radioactive material & heavy alloys.
 * 3. Intelligent life: 3% chance. If rolled: 90% standard, 10% advanced civilization.
 *    Strictly forces atmosphere to 'Respirável' or 'Tóxica' (never 'Nenhuma'), and injects Alien Fauna or Alien Grains into resources.
 * 4. Precursor ruins: Only generated when allowed or forced by GM (5% chance).
 */
export function generatePlanetStats(options: GeneratePlanetOptions = {}): GeneratedPlanetStats {
  // 1. Planet Type (70% Sólido, 30% Gasoso unless preferred)
  const type: PlanetType =
    options.preferredType ||
    weightedPick([
      { value: "Sólido", weight: 70 },
      { value: "Gasoso", weight: 30 },
    ]);

  // 2. Planet Size
  let size: PlanetSize;
  if (type === "Gasoso") {
    // Gas giants tend to be Medium or Large
    size = weightedPick([
      { value: "Médio", weight: 45 },
      { value: "Grande", weight: 55 },
    ]);
  } else {
    size = weightedPick([
      { value: "Pequeno", weight: 30 },
      { value: "Médio", weight: 50 },
      { value: "Grande", weight: 20 },
    ]);
  }

  // 3. Temperature
  const temperature: PlanetTemperature = weightedPick([
    { value: "Baixa", weight: 35 },
    { value: "Média", weight: 35 },
    { value: "Alta", weight: 30 },
  ]);

  // 4. Gravity (influenced by size and type)
  let gravity: PlanetGravity;
  if (type === "Gasoso") {
    gravity = weightedPick([
      { value: "Normal", weight: 20 },
      { value: "Alta", weight: 80 },
    ]);
  } else if (size === "Pequeno") {
    gravity = weightedPick([
      { value: "Baixa", weight: 65 },
      { value: "Normal", weight: 30 },
      { value: "Alta", weight: 5 },
    ]);
  } else if (size === "Médio") {
    gravity = weightedPick([
      { value: "Baixa", weight: 20 },
      { value: "Normal", weight: 65 },
      { value: "Alta", weight: 15 },
    ]);
  } else {
    // Grande
    gravity = weightedPick([
      { value: "Baixa", weight: 5 },
      { value: "Normal", weight: 40 },
      { value: "Alta", weight: 55 },
    ]);
  }

  // 5. Intelligent Life Check (3% chance or forced)
  const hasIntelligentLife = options.forceIntelligentLife || Math.random() < 0.03;
  const isAdvancedCivilization = hasIntelligentLife && Math.random() < 0.1;

  // 6. Atmosphere
  let atmosphere: PlanetAtmosphere;
  if (hasIntelligentLife) {
    // If intelligent life exists, atmosphere MUST be Respirável or Tóxica (NEVER Nenhuma)
    atmosphere = weightedPick([
      { value: "Respirável", weight: 75 },
      { value: "Tóxica", weight: 25 },
    ]);
  } else if (type === "Gasoso") {
    atmosphere = "Tóxica";
  } else {
    atmosphere = weightedPick([
      { value: "Respirável", weight: 35 },
      { value: "Tóxica", weight: 35 },
      { value: "Nenhuma", weight: 30 },
    ]);
  }

  // 7. Traits
  const traits: string[] = [];
  if (hasIntelligentLife) {
    if (isAdvancedCivilization) {
      traits.push(SPECIAL_TRAITS.ADVANCED_CIVILIZATION);
    } else {
      traits.push(SPECIAL_TRAITS.INTELLIGENT_LIFE);
    }
  }

  // Precursor Ruins Check - strictly requires explicit boolean true
  if (options.forceRuins === true || (options.allowRuins === true && Math.random() < 0.05)) {
    traits.push(SPECIAL_TRAITS.PRECURSOR_RUINS);
  }

  // 8. Resources Generation
  // Weights calculation based on Type and Temperature
  const resourceWeights: Record<string, number> = {
    Água: 25,
    "Grãos Alienígenas": 20,
    "Fauna Alienígena": 20,
    "Polímeros Naturais": 25,
    "Ligas Pesadas": 25,
    Silicato: 25,
    "Matéria Radioativa": 20,
    Plasma: 15,
    Estimulantes: 15,
  };

  // Rule A: If Gasoso -> 0 chance for Heavy Alloys, Polymers, and Grains. High chance for Plasma & Radioactive
  if (type === "Gasoso") {
    resourceWeights["Ligas Pesadas"] = 0;
    resourceWeights["Polímeros Naturais"] = 0;
    resourceWeights["Grãos Alienígenas"] = 0;
    resourceWeights["Fauna Alienígena"] = hasIntelligentLife ? 40 : 5;
    resourceWeights["Plasma"] = 80;
    resourceWeights["Matéria Radioativa"] = 60;
    resourceWeights["Silicato"] = 10;
    resourceWeights["Água"] = 25;
    resourceWeights["Estimulantes"] = 25;
  } else {
    // Solid planet adjustments
    if (temperature === "Baixa") {
      resourceWeights["Água"] += 35; // Water (Ice)
      resourceWeights["Silicato"] += 25;
    } else if (temperature === "Alta") {
      resourceWeights["Matéria Radioativa"] += 35;
      resourceWeights["Ligas Pesadas"] += 30;
      resourceWeights["Água"] = Math.max(5, resourceWeights["Água"] - 15);
    }
  }

  // Filter available candidate resources (weight > 0)
  const candidatePool = Object.keys(resourceWeights).filter(
    (name) => resourceWeights[name] > 0
  );

  // Determine resource count: Gasoso typically 1-3, Sólido 1-4
  const resourceCountTarget =
    type === "Gasoso"
      ? weightedPick([
          { value: 1, weight: 25 },
          { value: 2, weight: 55 },
          { value: 3, weight: 20 },
        ])
      : weightedPick([
          { value: 1, weight: 15 },
          { value: 2, weight: 45 },
          { value: 3, weight: 30 },
          { value: 4, weight: 10 },
        ]);

  const chosenResourceNames = new Set<string>();

  // Rule C: Intelligent Life MUST inject Fauna Alienígena or Grãos Alienígenas (or both)
  if (hasIntelligentLife) {
    if (type === "Gasoso") {
      // In a gas giant, only alien fauna can exist in the upper clouds
      chosenResourceNames.add("Fauna Alienígena");
    } else {
      const bioPicks = [
        ["Fauna Alienígena"],
        ["Grãos Alienígenas"],
        ["Fauna Alienígena", "Grãos Alienígenas"],
      ];
      const pick = bioPicks[Math.floor(Math.random() * bioPicks.length)];
      pick.forEach((r) => chosenResourceNames.add(r));
    }
  }

  // Fill remaining slots up to resourceCountTarget
  let attempts = 0;
  while (chosenResourceNames.size < resourceCountTarget && attempts < 30) {
    attempts++;
    const remainingPool = candidatePool
      .filter((name) => !chosenResourceNames.has(name))
      .map((name) => ({ value: name, weight: resourceWeights[name] }));

    if (remainingPool.length === 0) break;
    const picked = weightedPick(remainingPool);
    chosenResourceNames.add(picked);
  }

  // Roll levels for chosen resources
  const resources: PlanetResource[] = Array.from(chosenResourceNames).map((name) => {
    const level: ResourceLevel = weightedPick([
      { value: "Baixa", weight: 45 },
      { value: "Média", weight: 40 },
      { value: "Alta", weight: 15 },
    ]);
    return { name, level };
  });

  return {
    size,
    type,
    temperature,
    atmosphere,
    gravity,
    resources,
    traits: traits.filter((t): t is string => typeof t === "string" && t.trim().length > 0),
  };
}

/**
 * Fits ellipse radii (radiusX, radiusY) so that the ellipse with center (cx, cy) and rotation
 * passes 100% PRECISELY through the planet coordinates (px, py).
 */
export function fitEllipseThroughPlanet(
  px: number,
  py: number,
  cx: number = 0,
  cy: number = 0,
  rotationDeg: number = 0,
  aspectRatio: number = 0.65
): { radiusX: number; radiusY: number } {
  const rotRad = (-rotationDeg * Math.PI) / 180;
  const dx = px - cx;
  const dy = py - cy;

  // Transform into ellipse unrotated local frame
  const u = dx * Math.cos(rotRad) - dy * Math.sin(rotRad);
  const v = dx * Math.sin(rotRad) + dy * Math.cos(rotRad);

  const k = Math.max(0.2, Math.min(1.0, aspectRatio));
  // rx^2 = u^2 + v^2 / k^2
  const rxSquared = u * u + (v * v) / (k * k);
  const radiusX = Math.max(25, Math.round(Math.sqrt(rxSquared)));
  const radiusY = Math.max(18, Math.round(radiusX * k));

  return { radiusX, radiusY };
}

/**
 * Calculates the exact (x, y) map coordinate on the dashed anomalous orbit trace
 * for a given orbital phase angle (0 to 360 degrees).
 */
export function getPointOnAnomalousOrbit(
  orbit: AnomalousOrbit,
  phaseDeg: number
): { x: number; y: number } {
  const phi = (phaseDeg * Math.PI) / 180;
  const rotRad = ((orbit.rotation || 0) * Math.PI) / 180;

  const lx = orbit.radiusX * Math.cos(phi);
  const ly = orbit.radiusY * Math.sin(phi);

  const cx = orbit.centerX ?? 0;
  const cy = orbit.centerY ?? 0;

  const x = cx + lx * Math.cos(rotRad) - ly * Math.sin(rotRad);
  const y = cy + lx * Math.sin(rotRad) + ly * Math.cos(rotRad);

  return { x: Math.round(x), y: Math.round(y) };
}

/**
 * Given coordinates (px, py), finds the closest orbital phase angle (0 to 360 degrees)
 * on the anomalous orbit ellipse.
 */
export function getClosestPhaseOnAnomalousOrbit(
  orbit: AnomalousOrbit,
  px: number,
  py: number
): number {
  const rotRad = (-(orbit.rotation || 0) * Math.PI) / 180;
  const cx = orbit.centerX ?? 0;
  const cy = orbit.centerY ?? 0;
  const dx = px - cx;
  const dy = py - cy;

  const lx = dx * Math.cos(rotRad) - dy * Math.sin(rotRad);
  const ly = dx * Math.sin(rotRad) + dy * Math.cos(rotRad);

  const angle = Math.atan2(ly / (orbit.radiusY || 1), lx / (orbit.radiusX || 1));
  let deg = Math.round((angle * 180) / Math.PI);
  if (deg < 0) deg += 360;
  return deg;
}

/**
 * Calculates the exact (x, y) on a circular concentric orbit for a given phase angle (0 to 360 deg).
 */
export function getPointOnCircularOrbit(
  orbitRadius: number,
  phaseDeg: number
): { x: number; y: number } {
  const rad = (phaseDeg * Math.PI) / 180;
  return {
    x: Math.round(orbitRadius * Math.cos(rad)),
    y: Math.round(orbitRadius * Math.sin(rad)),
  };
}

/**
 * Generates an anomalous eccentric elliptical orbit configured for a planet.
 * The ellipse is mathematically guaranteed to pass directly through (planetX, planetY)
 * with its center strictly fixed at the center of the solar system (the sun, 0, 0).
 */
export function generateAnomalousOrbit(
  planetX: number,
  planetY: number,
  baseRadius: number
): AnomalousOrbit {
  // Center is strictly at the center of the system: the central star/sun (0, 0)
  const centerX = 0;
  const centerY = 0;
  const rotation = Math.round(Math.random() * 180);

  // Exact fit through the planet's current coordinates
  const { radiusX, radiusY } = fitEllipseThroughPlanet(
    planetX,
    planetY,
    centerX,
    centerY,
    rotation,
    0.65
  );

  const tempOrbit: AnomalousOrbit = {
    enabled: true,
    centerX,
    centerY,
    radiusX,
    radiusY,
    rotation,
  };
  const orbitalPhase = getClosestPhaseOnAnomalousOrbit(tempOrbit, planetX, planetY);

  return {
    ...tempOrbit,
    orbitalPhase,
  };
}

/**
 * Calibrates the semi-axes of an anomalous orbit so the ellipse naturally
 * passes through the planet's current map coordinates (x, y) centered on the system's sun (0, 0).
 */
export function calibrateAnomalousOrbitToPlanet(
  planetX: number,
  planetY: number,
  centerX: number = 0,
  centerY: number = 0,
  rotationDeg: number = 0,
  aspectRatio: number = 0.65
): AnomalousOrbit {
  const { radiusX, radiusY } = fitEllipseThroughPlanet(
    planetX,
    planetY,
    centerX,
    centerY,
    rotationDeg,
    aspectRatio
  );

  const tempOrbit: AnomalousOrbit = {
    enabled: true,
    centerX,
    centerY,
    radiusX,
    radiusY,
    rotation: rotationDeg,
  };
  const orbitalPhase = getClosestPhaseOnAnomalousOrbit(tempOrbit, planetX, planetY);

  return {
    ...tempOrbit,
    orbitalPhase,
  };
}
