export type DecayMode =
  | 'stable'
  | 'beta_minus'
  | 'beta_plus'
  | 'alpha'
  | 'sf'
  | 'proton'
  | 'neutron';

export interface Nuclide {
  id: string; // `${z}-${n}`
  z: number;  // Protons
  n: number;  // Neutrons
  a: number;  // Mass number (z + n)
  symbol: string;
  elementName: string;
  decayMode: DecayMode;
  halfLifeText: string;
  halfLifeSeconds: number; // Infinity for stable
  daughterZ?: number | null;
  daughterN?: number | null;
  qValueMeV?: number;
  bindingEnergyPerNucleon?: number;
  isStable: boolean;
  notes?: string;
}

export type ColorMode = 'decay_mode' | 'half_life' | 'nz_ratio';

export type PresetFilter =
  | 'all'
  | 'stable_valley'
  | 'u238_series'
  | 'th232_series'
  | 'u235_series'
  | 'medical'
  | 'light_nuclei';

export type Theme = 'light' | 'dark';

export interface DecayStep {
  parent: Nuclide;
  mode: DecayMode;
  daughter: Nuclide;
  stepNumber: number;
}
