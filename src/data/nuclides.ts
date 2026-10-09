import { Nuclide, DecayMode, DecayStep } from '../types';
import { ELEMENT_MAP, MAGIC_NUMBERS } from './elements';
export { MAGIC_NUMBERS };

// Key verified stable nuclides across all elements Z=1 to 83
// [Z, N, abundanceOrNote]
const STABLE_ISOTOPES_DATA: [number, number, string][] = [
  // H (1)
  [1, 0, '99.98% abundance (Protium)'],
  [1, 1, '0.015% abundance (Deuterium)'],
  // He (2)
  [2, 1, '0.0001% abundance (He-3)'],
  [2, 2, '99.999% abundance (Alpha particle core)'],
  // Li (3)
  [3, 3, '7.59% abundance'],
  [3, 4, '92.41% abundance'],
  // Be (4)
  [4, 5, '100% abundance (Be-9)'],
  // B (5)
  [5, 5, '19.9% abundance'],
  [5, 6, '80.1% abundance'],
  // C (6)
  [6, 6, '98.93% abundance (Standard mass base)'],
  [6, 7, '1.07% abundance (NMR active)'],
  // N (7)
  [7, 7, '99.63% abundance'],
  [7, 8, '0.37% abundance'],
  // O (8) - Doubly magic (Z=8, N=8)
  [8, 8, '99.76% abundance (Doubly magic N=8)'],
  [8, 9, '0.04% abundance'],
  [8, 10, '0.20% abundance'],
  // F (9)
  [9, 10, '100% abundance (F-19)'],
  // Ne (10)
  [10, 10, '90.48% abundance'],
  [10, 11, '0.27% abundance'],
  [10, 12, '9.25% abundance'],
  // Na (11)
  [11, 12, '100% abundance (Na-23)'],
  // Mg (12)
  [12, 12, '78.99% abundance'],
  [12, 13, '10.00% abundance'],
  [12, 14, '11.01% abundance'],
  // Al (13)
  [13, 14, '100% abundance (Al-27)'],
  // Si (14)
  [14, 14, '92.23% abundance'],
  [14, 15, '4.68% abundance'],
  [14, 16, '3.09% abundance'],
  // P (15)
  [15, 16, '100% abundance (P-31)'],
  // S (16)
  [16, 16, '94.99% abundance'],
  [16, 17, '0.75% abundance'],
  [16, 18, '4.25% abundance'],
  [16, 20, '0.01% abundance'],
  // Cl (17)
  [17, 18, '75.76% abundance'],
  [17, 20, '24.24% abundance'],
  // Ar (18)
  [18, 18, '0.33% abundance'],
  [18, 20, '0.06% abundance'],
  [18, 22, '99.60% abundance'],
  // K (19)
  [19, 20, '93.26% abundance'],
  [19, 22, '6.73% abundance'],
  // Ca (20) - Doubly magic (Z=20, N=20 & N=28)
  [20, 20, '96.94% abundance (Doubly magic)'],
  [20, 22, '0.65% abundance'],
  [20, 23, '0.14% abundance'],
  [20, 24, '2.09% abundance'],
  [20, 26, '0.004% abundance'],
  [20, 28, '0.19% abundance (Doubly magic N=28)'],
  // Sc (21)
  [21, 24, '100% abundance (Sc-45)'],
  // Ti (22)
  [22, 24, '8.25% abundance'],
  [22, 25, '7.44% abundance'],
  [22, 26, '73.72% abundance'],
  [22, 27, '5.41% abundance'],
  [22, 28, '5.18% abundance'],
  // V (23)
  [23, 28, '99.75% abundance'],
  // Cr (24)
  [24, 26, '4.35% abundance'],
  [24, 28, '83.79% abundance'],
  [24, 29, '9.50% abundance'],
  [24, 30, '2.37% abundance'],
  // Mn (25)
  [25, 30, '100% abundance (Mn-55)'],
  // Fe (26) - Highest nuclear stability peak
  [26, 28, '5.85% abundance'],
  [26, 30, '91.75% abundance (Peak binding energy)'],
  [26, 31, '2.12% abundance'],
  [26, 32, '0.28% abundance'],
  // Co (27)
  [27, 32, '100% abundance (Co-59)'],
  // Ni (28) - Magic Z=28
  [28, 30, '68.08% abundance'],
  [28, 32, '26.22% abundance'],
  [28, 33, '1.14% abundance'],
  [28, 34, '3.63% abundance'],
  [28, 36, '0.93% abundance'],
  // Cu (29)
  [29, 34, '69.15% abundance'],
  [29, 36, '30.85% abundance'],
  // Zn (30)
  [30, 34, '49.17% abundance'],
  [30, 36, '27.73% abundance'],
  [30, 37, '4.04% abundance'],
  [30, 38, '18.45% abundance'],
  [30, 40, '0.61% abundance'],
  // Ga (31)
  [31, 38, '60.11% abundance'],
  [31, 40, '39.89% abundance'],
  // Ge (32)
  [32, 38, '20.57% abundance'],
  [32, 40, '27.45% abundance'],
  [32, 41, '7.75% abundance'],
  [32, 42, '36.50% abundance'],
  // As (33)
  [33, 42, '100% abundance (As-75)'],
  // Se (34)
  [34, 40, '0.86% abundance'],
  [34, 42, '9.23% abundance'],
  [34, 43, '7.60% abundance'],
  [34, 44, '23.69% abundance'],
  [34, 46, '49.80% abundance'],
  // Br (35)
  [35, 44, '50.69% abundance'],
  [35, 46, '49.31% abundance'],
  // Kr (36)
  [36, 42, '0.35% abundance'],
  [36, 44, '2.28% abundance'],
  [36, 46, '11.58% abundance'],
  [36, 47, '11.49% abundance'],
  [36, 48, '57.00% abundance'],
  [36, 50, '17.30% abundance (Magic N=50)'],
  // Rb (37)
  [37, 48, '72.17% abundance'],
  // Sr (38)
  [38, 46, '0.56% abundance'],
  [38, 48, '9.86% abundance'],
  [38, 49, '7.00% abundance'],
  [38, 50, '82.58% abundance (Magic N=50)'],
  // Y (39)
  [39, 50, '100% abundance (Magic N=50)'],
  // Zr (40)
  [40, 50, '51.45% abundance (Magic N=50)'],
  [40, 51, '11.22% abundance'],
  [40, 52, '17.15% abundance'],
  [40, 54, '17.38% abundance'],
  [40, 56, '2.80% abundance'],
  // Nb (41)
  [41, 52, '100% abundance (Nb-93)'],
  // Mo (42)
  [42, 50, '14.53% abundance'],
  [42, 52, '9.15% abundance'],
  [42, 53, '15.84% abundance'],
  [42, 54, '16.67% abundance'],
  [42, 55, '9.60% abundance'],
  [42, 56, '24.39% abundance'],
  // Ru (44)
  [44, 52, '5.54% abundance'],
  [44, 54, '1.87% abundance'],
  [44, 55, '12.76% abundance'],
  [44, 56, '12.60% abundance'],
  [44, 57, '17.06% abundance'],
  [44, 58, '31.55% abundance'],
  [44, 60, '18.62% abundance'],
  // Rh (45)
  [45, 58, '100% abundance (Rh-103)'],
  // Pd (46)
  [46, 56, '1.02% abundance'],
  [46, 58, '11.14% abundance'],
  [46, 59, '22.33% abundance'],
  [46, 60, '27.33% abundance'],
  [46, 62, '26.46% abundance'],
  [46, 64, '11.72% abundance'],
  // Ag (47)
  [47, 60, '51.84% abundance'],
  [47, 62, '48.16% abundance'],
  // Cd (48)
  [48, 58, '1.25% abundance'],
  [48, 62, '12.49% abundance'],
  [48, 63, '12.80% abundance'],
  [48, 64, '24.13% abundance'],
  [48, 66, '28.73% abundance'],
  // In (49)
  [49, 64, '4.29% abundance'],
  // Sn (50) - Magic Z=50 (Most stable isotopes of any element: 10!)
  [50, 62, '0.97% abundance'],
  [50, 64, '0.66% abundance'],
  [50, 65, '0.34% abundance'],
  [50, 66, '14.54% abundance'],
  [50, 67, '7.68% abundance'],
  [50, 68, '24.22% abundance'],
  [50, 69, '8.59% abundance'],
  [50, 70, '32.58% abundance'],
  [50, 72, '4.63% abundance'],
  [50, 74, '5.79% abundance'],
  // Sb (51)
  [51, 70, '57.21% abundance'],
  [51, 72, '42.79% abundance'],
  // Te (52)
  [52, 68, '0.09% abundance'],
  [52, 70, '2.55% abundance'],
  [52, 71, '0.89% abundance'],
  [52, 72, '4.74% abundance'],
  [52, 73, '7.07% abundance'],
  [52, 74, '18.84% abundance'],
  [52, 76, '31.74% abundance'],
  // I (53)
  [53, 74, '100% abundance (I-127)'],
  // Xe (54)
  [54, 72, '0.09% abundance'],
  [54, 74, '0.09% abundance'],
  [54, 75, '1.91% abundance'],
  [54, 76, '26.40% abundance'],
  [54, 77, '4.07% abundance'],
  [54, 78, '21.23% abundance (Magic N=78)'],
  [54, 80, '10.44% abundance'],
  [54, 82, '8.86% abundance (Magic N=82)'],
  // Cs (55)
  [55, 78, '100% abundance (Cs-133)'],
  // Ba (56)
  [56, 74, '0.11% abundance'],
  [56, 76, '0.10% abundance'],
  [56, 78, '2.42% abundance'],
  [56, 79, '6.59% abundance'],
  [56, 80, '7.85% abundance'],
  [56, 81, '11.23% abundance'],
  [56, 82, '71.70% abundance (Magic N=82)'],
  // La (57)
  [57, 82, '99.91% abundance (Magic N=82)'],
  // Ce (58)
  [58, 78, '0.19% abundance'],
  [58, 80, '0.25% abundance'],
  [58, 82, '88.45% abundance (Magic N=82)'],
  [58, 84, '11.11% abundance'],
  // Pr (59)
  [59, 82, '100% abundance (Pr-141, Magic N=82)'],
  // Nd (60)
  [60, 82, '27.15% abundance (Magic N=82)'],
  [60, 83, '12.17% abundance'],
  [60, 85, '17.19% abundance'],
  [60, 86, '5.62% abundance'],
  // Sm (62)
  [62, 82, '3.08% abundance (Magic N=82)'],
  [62, 87, '11.24% abundance'],
  [62, 88, '14.99% abundance'],
  [62, 90, '7.38% abundance'],
  [62, 92, '26.75% abundance'],
  // Eu (63)
  [63, 90, '52.19% abundance'],
  // Gd (64)
  [64, 90, '20.47% abundance'],
  [64, 92, '15.65% abundance'],
  [64, 93, '24.84% abundance'],
  [64, 94, '21.86% abundance'],
  [64, 96, '2.18% abundance'],
  // Tb (65)
  [65, 94, '100% abundance (Tb-159)'],
  // Dy (66)
  [66, 90, '0.06% abundance'],
  [66, 92, '0.10% abundance'],
  [66, 94, '2.34% abundance'],
  [66, 96, '24.90% abundance'],
  [66, 97, '28.20% abundance'],
  [66, 98, '25.50% abundance'],
  // Ho (67)
  [67, 98, '100% abundance (Ho-165)'],
  // Er (68)
  [68, 94, '0.14% abundance'],
  [68, 96, '1.60% abundance'],
  [68, 98, '33.50% abundance'],
  [68, 99, '22.87% abundance'],
  [68, 100, '26.98% abundance'],
  [68, 102, '14.91% abundance'],
  // Tm (69)
  [69, 100, '100% abundance (Tm-169)'],
  // Yb (70)
  [70, 98, '0.13% abundance'],
  [70, 100, '3.04% abundance'],
  [70, 101, '14.28% abundance'],
  [70, 102, '21.83% abundance'],
  [70, 103, '16.13% abundance'],
  [70, 104, '31.83% abundance'],
  [70, 106, '12.76% abundance'],
  // Lu (71)
  [71, 104, '97.41% abundance'],
  // Hf (72)
  [72, 104, '5.26% abundance'],
  [72, 105, '18.60% abundance'],
  [72, 106, '27.28% abundance'],
  [72, 107, '13.62% abundance'],
  [72, 108, '35.08% abundance'],
  // Ta (73)
  [73, 108, '99.99% abundance'],
  // W (74)
  [74, 108, '26.50% abundance'],
  [74, 109, '14.31% abundance'],
  [74, 110, '30.64% abundance'],
  [74, 112, '28.43% abundance'],
  // Re (75)
  [75, 110, '37.40% abundance'],
  // Os (76)
  [76, 111, '1.59% abundance'],
  [76, 112, '13.24% abundance'],
  [76, 113, '16.15% abundance'],
  [76, 114, '26.26% abundance'],
  [76, 116, '40.78% abundance'],
  // Ir (77)
  [77, 114, '37.30% abundance'],
  [77, 116, '62.70% abundance'],
  // Pt (78)
  [78, 116, '32.97% abundance'],
  [78, 117, '33.83% abundance'],
  [78, 118, '25.24% abundance'],
  [78, 120, '7.16% abundance'],
  // Au (79)
  [79, 118, '100% abundance (Au-197)'],
  // Hg (80)
  [80, 118, '0.15% abundance'],
  [80, 119, '9.97% abundance'],
  [80, 120, '16.87% abundance'],
  [80, 121, '23.10% abundance'],
  [80, 122, '29.86% abundance'],
  [80, 124, '6.87% abundance'],
  // Tl (81)
  [81, 122, '29.52% abundance'],
  [81, 124, '70.48% abundance'],
  // Pb (82) - Doubly magic Pb-208 (Z=82, N=126) End of stability!
  [82, 122, '1.40% abundance (Pb-204)'],
  [82, 124, '24.10% abundance (End of U-238 series Pb-206)'],
  [82, 125, '22.10% abundance (End of U-235 series Pb-207)'],
  [82, 126, '52.40% abundance (Doubly magic, End of Th-232 series Pb-208)'],
  // Bi (83) - Quasi-stable (T1/2 = 1.9e19 years, alpha)
  [83, 126, '100% abundance (Bi-209, Magic N=126, T1/2 = 2.01×10¹⁹ y)']
];

// Explicitly defined critical radionuclides with exact decay properties
export interface RadionuclideDef {
  z: number;
  n: number;
  decayMode: DecayMode;
  halfLifeText: string;
  halfLifeSeconds: number;
  daughterZ?: number | null;
  daughterN?: number | null;
  qValueMeV?: number;
  notes?: string;
}

const NOTABLE_RADIONUCLIDES: RadionuclideDef[] = [
  // Cosmogenic & Light Radionuclides
  { z: 1, n: 2, decayMode: 'beta_minus', halfLifeText: '12.32 y', halfLifeSeconds: 3.88e8, daughterZ: 2, daughterN: 1, qValueMeV: 0.0186, notes: 'Tritium, thermonuclear tracer & luminescent watch paint' },
  { z: 4, n: 3, decayMode: 'beta_plus', halfLifeText: '53.22 d', halfLifeSeconds: 4.6e6, daughterZ: 3, daughterN: 4, qValueMeV: 0.862, notes: 'Beryllium-7 (Electron capture), cosmogenic' },
  { z: 4, n: 6, decayMode: 'beta_minus', halfLifeText: '1.39 My', halfLifeSeconds: 4.38e13, daughterZ: 5, daughterN: 5, qValueMeV: 0.556, notes: 'Beryllium-10, geological dating' },
  { z: 6, n: 8, decayMode: 'beta_minus', halfLifeText: '5,730 y', halfLifeSeconds: 1.81e11, daughterZ: 7, daughterN: 7, qValueMeV: 0.156, notes: 'Carbon-14, archeological radiocarbon dating benchmark' },
  { z: 6, n: 5, decayMode: 'beta_plus', halfLifeText: '20.33 m', halfLifeSeconds: 1220, daughterZ: 5, daughterN: 6, qValueMeV: 1.982, notes: 'Carbon-11, PET medical imaging' },
  { z: 7, n: 6, decayMode: 'beta_plus', halfLifeText: '9.97 m', halfLifeSeconds: 598, daughterZ: 6, daughterN: 7, qValueMeV: 2.22, notes: 'Nitrogen-13, myocardial perfusion PET tracer' },
  { z: 8, n: 7, decayMode: 'beta_plus', halfLifeText: '122.2 s', halfLifeSeconds: 122.2, daughterZ: 7, daughterN: 8, qValueMeV: 2.75, notes: 'Oxygen-15, cerebral blood flow PET tracer' },
  { z: 9, n: 9, decayMode: 'beta_plus', halfLifeText: '109.8 m', halfLifeSeconds: 6588, daughterZ: 8, daughterN: 10, qValueMeV: 1.655, notes: 'Fluorine-18, FDG PET scan gold standard for oncology' },
  { z: 11, n: 11, decayMode: 'beta_plus', halfLifeText: '2.60 y', halfLifeSeconds: 8.2e7, daughterZ: 10, daughterN: 12, qValueMeV: 2.842, notes: 'Sodium-22, positron source' },
  { z: 11, n: 13, decayMode: 'beta_minus', halfLifeText: '14.96 h', halfLifeSeconds: 53856, daughterZ: 12, daughterN: 12, qValueMeV: 5.515, notes: 'Sodium-24, medical radiotracer' },
  { z: 15, n: 17, decayMode: 'beta_minus', halfLifeText: '14.26 d', halfLifeSeconds: 1.23e6, daughterZ: 16, daughterN: 16, qValueMeV: 1.71, notes: 'Phosphorus-32, molecular biology DNA/RNA probe' },
  { z: 15, n: 18, decayMode: 'beta_minus', halfLifeText: '25.34 d', halfLifeSeconds: 2.19e6, daughterZ: 16, daughterN: 17, qValueMeV: 0.249, notes: 'Phosphorus-33, radiolabeling' },
  { z: 16, n: 19, decayMode: 'beta_minus', halfLifeText: '87.51 d', halfLifeSeconds: 7.56e6, daughterZ: 17, daughterN: 18, qValueMeV: 0.167, notes: 'Sulfur-35, protein autoradiography' },
  { z: 17, n: 19, decayMode: 'beta_minus', halfLifeText: '301 ky', halfLifeSeconds: 9.5e12, daughterZ: 18, daughterN: 18, qValueMeV: 0.709, notes: 'Chlorine-36, groundwater hydrology tracer' },
  { z: 19, n: 21, decayMode: 'beta_minus', halfLifeText: '1.248 Gy', halfLifeSeconds: 3.94e16, daughterZ: 20, daughterN: 20, qValueMeV: 1.311, notes: 'Potassium-40, primordial natural radioactivity in rock & bananas (89% β⁻, 11% EC)' },
  { z: 20, n: 25, decayMode: 'beta_minus', halfLifeText: '162.6 d', halfLifeSeconds: 1.4e7, daughterZ: 21, daughterN: 24, qValueMeV: 0.258, notes: 'Calcium-45, calcium metabolism study' },
  { z: 24, n: 27, decayMode: 'beta_plus', halfLifeText: '27.70 d', halfLifeSeconds: 2.39e6, daughterZ: 23, daughterN: 28, qValueMeV: 0.753, notes: 'Chromium-51, red blood cell survival tracer' },
  { z: 26, n: 33, decayMode: 'beta_minus', halfLifeText: '44.50 d', halfLifeSeconds: 3.84e6, daughterZ: 27, daughterN: 32, qValueMeV: 1.565, notes: 'Iron-59, iron metabolism tracer' },
  { z: 27, n: 30, decayMode: 'beta_plus', halfLifeText: '271.8 d', halfLifeSeconds: 2.35e7, daughterZ: 26, daughterN: 31, qValueMeV: 0.836, notes: 'Cobalt-57, Mössbauer spectroscopy' },
  { z: 27, n: 31, decayMode: 'beta_plus', halfLifeText: '70.86 d', halfLifeSeconds: 6.12e6, daughterZ: 26, daughterN: 32, qValueMeV: 2.307, notes: 'Cobalt-58, radiotracer' },
  { z: 27, n: 33, decayMode: 'beta_minus', halfLifeText: '5.27 y', halfLifeSeconds: 1.66e8, daughterZ: 28, daughterN: 32, qValueMeV: 2.824, notes: 'Cobalt-60, intense industrial & medical radiotherapy gamma emitter' },
  { z: 28, n: 35, decayMode: 'beta_minus', halfLifeText: '100.1 y', halfLifeSeconds: 3.16e9, daughterZ: 29, daughterN: 34, qValueMeV: 0.067, notes: 'Nickel-63, electron capture detector in gas chromatography' },
  { z: 31, n: 36, decayMode: 'beta_plus', halfLifeText: '3.26 d', halfLifeSeconds: 2.82e5, daughterZ: 30, daughterN: 37, qValueMeV: 1.001, notes: 'Gallium-67, tumor & infection scintigraphy' },
  { z: 31, n: 37, decayMode: 'beta_plus', halfLifeText: '67.71 m', halfLifeSeconds: 4062, daughterZ: 30, daughterN: 38, qValueMeV: 2.921, notes: 'Gallium-68, neuroendocrine tumor PET imaging' },
  { z: 37, n: 45, decayMode: 'beta_plus', halfLifeText: '1.27 m', halfLifeSeconds: 76.2, daughterZ: 36, daughterN: 46, qValueMeV: 3.381, notes: 'Rubidium-82, cardiac PET imaging' },
  { z: 37, n: 50, decayMode: 'beta_minus', halfLifeText: '49.7 Gy', halfLifeSeconds: 1.57e18, daughterZ: 38, daughterN: 49, qValueMeV: 0.283, notes: 'Rubidium-87, primordial geochronology' },
  { z: 38, n: 52, decayMode: 'beta_minus', halfLifeText: '28.90 y', halfLifeSeconds: 9.12e8, daughterZ: 39, daughterN: 51, qValueMeV: 0.546, notes: 'Strontium-90, major nuclear fission byproduct, bone seeker' },
  { z: 39, n: 51, decayMode: 'beta_minus', halfLifeText: '64.05 h', halfLifeSeconds: 230580, daughterZ: 40, daughterN: 50, qValueMeV: 2.28, notes: 'Yttrium-90, daughter of Sr-90, cancer targeted radioimmunotherapy' },
  { z: 42, n: 57, decayMode: 'beta_minus', halfLifeText: '65.94 h', halfLifeSeconds: 237384, daughterZ: 43, daughterN: 56, qValueMeV: 1.357, notes: 'Molybdenum-99, parent of Tc-99m used in 80% of world medical scans' },
  { z: 43, n: 56, decayMode: 'beta_minus', halfLifeText: '6.01 h', halfLifeSeconds: 21636, daughterZ: 44, daughterN: 55, qValueMeV: 0.142, notes: 'Technetium-99m, world most used medical diagnostic isotope' },
  { z: 43, n: 54, decayMode: 'beta_plus', halfLifeText: '2.6 My', halfLifeSeconds: 8.2e13, daughterZ: 42, daughterN: 55, qValueMeV: 0.32, notes: 'Technetium-97, long-lived technetium' },
  { z: 43, n: 55, decayMode: 'beta_minus', halfLifeText: '4.2 My', halfLifeSeconds: 1.33e14, daughterZ: 44, daughterN: 54, qValueMeV: 1.79, notes: 'Technetium-98, long-lived' },
  { z: 43, n: 57, decayMode: 'beta_minus', halfLifeText: '211.1 ky', halfLifeSeconds: 6.66e12, daughterZ: 44, daughterN: 55, qValueMeV: 0.294, notes: 'Technetium-99 ground state, fission product' },
  { z: 44, n: 62, decayMode: 'beta_minus', halfLifeText: '373.6 d', halfLifeSeconds: 3.23e7, daughterZ: 45, daughterN: 61, qValueMeV: 0.039, notes: 'Ruthenium-106, eye plaque brachytherapy' },
  { z: 46, n: 57, decayMode: 'beta_plus', halfLifeText: '16.96 d', halfLifeSeconds: 1.46e6, daughterZ: 45, daughterN: 58, qValueMeV: 0.564, notes: 'Palladium-103, prostate brachytherapy' },
  { z: 49, n: 62, decayMode: 'beta_plus', halfLifeText: '2.80 d', halfLifeSeconds: 241920, daughterZ: 48, daughterN: 63, qValueMeV: 0.865, notes: 'Indium-111, leukocyte tagging imaging' },
  { z: 53, n: 70, decayMode: 'beta_plus', halfLifeText: '13.22 h', halfLifeSeconds: 47592, daughterZ: 52, daughterN: 71, qValueMeV: 1.23, notes: 'Iodine-123, thyroid SPECT scan' },
  { z: 53, n: 72, decayMode: 'beta_plus', halfLifeText: '59.40 d', halfLifeSeconds: 5.13e6, daughterZ: 52, daughterN: 73, qValueMeV: 0.177, notes: 'Iodine-125, prostate brachytherapy seed' },
  { z: 53, n: 78, decayMode: 'beta_minus', halfLifeText: '8.02 d', halfLifeSeconds: 6.93e5, daughterZ: 54, daughterN: 77, qValueMeV: 0.971, notes: 'Iodine-131, thyroid cancer therapy and nuclear fallout indicator' },
  { z: 54, n: 79, decayMode: 'beta_minus', halfLifeText: '5.24 d', halfLifeSeconds: 4.53e5, daughterZ: 55, daughterN: 78, qValueMeV: 0.427, notes: 'Xenon-133, pulmonary ventilation imaging' },
  { z: 55, n: 82, decayMode: 'beta_minus', halfLifeText: '30.17 y', halfLifeSeconds: 9.52e8, daughterZ: 56, daughterN: 81, qValueMeV: 1.176, notes: 'Caesium-137, major Chernobyl & Fukushima fission marker' },
  { z: 55, n: 79, decayMode: 'beta_minus', halfLifeText: '2.06 y', halfLifeSeconds: 6.5e7, daughterZ: 56, daughterN: 78, qValueMeV: 2.059, notes: 'Caesium-134, fission indicator' },
  { z: 61, n: 86, decayMode: 'beta_minus', halfLifeText: '2.62 y', halfLifeSeconds: 8.27e7, daughterZ: 62, daughterN: 85, qValueMeV: 0.224, notes: 'Promethium-147, atomic battery & luminous paint' },
  { z: 62, n: 91, decayMode: 'beta_minus', halfLifeText: '46.5 h', halfLifeSeconds: 167400, daughterZ: 63, daughterN: 90, qValueMeV: 0.808, notes: 'Samarium-153, bone metastasis pain relief' },
  { z: 68, n: 101, decayMode: 'beta_minus', halfLifeText: '9.40 d', halfLifeSeconds: 812160, daughterZ: 69, daughterN: 100, qValueMeV: 0.353, notes: 'Erbium-169, radiation synovectomy' },
  { z: 71, n: 106, decayMode: 'beta_minus', halfLifeText: '6.65 d', halfLifeSeconds: 574560, daughterZ: 72, daughterN: 105, qValueMeV: 0.498, notes: 'Lutetium-177, targeted radionuclide therapy for prostate cancer' },
  { z: 75, n: 111, decayMode: 'beta_minus', halfLifeText: '3.72 d', halfLifeSeconds: 321408, daughterZ: 76, daughterN: 110, qValueMeV: 1.071, notes: 'Rhenium-186, bone cancer palliative therapy' },
  { z: 77, n: 115, decayMode: 'beta_minus', halfLifeText: '73.83 d', halfLifeSeconds: 6.38e6, daughterZ: 78, daughterN: 114, qValueMeV: 1.455, notes: 'Iridium-192, industrial weld radiography' },
  { z: 81, n: 120, decayMode: 'beta_plus', halfLifeText: '72.91 h', halfLifeSeconds: 262476, daughterZ: 80, daughterN: 121, qValueMeV: 0.505, notes: 'Thallium-201, myocardial imaging' },

  // ==========================================
  // URANIUM-238 SERIES (4n + 2 Radium Series)
  // U-238 -> Th-234 -> Pa-234 -> U-234 -> Th-230 -> Ra-226 -> Rn-222 -> Po-218 -> Pb-214 -> Bi-214 -> Po-214 -> Pb-210 -> Bi-210 -> Po-210 -> Pb-206
  // ==========================================
  { z: 92, n: 146, decayMode: 'alpha', halfLifeText: '4.468 Gy', halfLifeSeconds: 1.41e17, daughterZ: 90, daughterN: 144, qValueMeV: 4.27, notes: 'Uranium-238: Primary primordial isotope (99.27% nat. abundance), head of Radium series' },
  { z: 90, n: 144, decayMode: 'beta_minus', halfLifeText: '24.10 d', halfLifeSeconds: 2.08e6, daughterZ: 91, daughterN: 143, qValueMeV: 0.273, notes: 'Thorium-234: First daughter of U-238 decay' },
  { z: 91, n: 143, decayMode: 'beta_minus', halfLifeText: '6.70 h', halfLifeSeconds: 24120, daughterZ: 92, daughterN: 142, qValueMeV: 2.195, notes: 'Protactinium-234: Beta decays back to Uranium-234' },
  { z: 92, n: 142, decayMode: 'alpha', halfLifeText: '245.5 ky', halfLifeSeconds: 7.75e12, daughterZ: 90, daughterN: 140, qValueMeV: 4.859, notes: 'Uranium-234: Secular equilibrium companion of U-238' },
  { z: 90, n: 140, decayMode: 'alpha', halfLifeText: '75.38 ky', halfLifeSeconds: 2.38e12, daughterZ: 88, daughterN: 138, qValueMeV: 4.77, notes: 'Thorium-230 (Ionium): Alpha decays into Radium-226' },
  { z: 88, n: 138, decayMode: 'alpha', halfLifeText: '1,600 y', halfLifeSeconds: 5.05e10, daughterZ: 86, daughterN: 136, qValueMeV: 4.871, notes: 'Radium-226: Marie Curie classic radioactive element, emits Radon gas' },
  { z: 86, n: 136, decayMode: 'alpha', halfLifeText: '3.82 d', halfLifeSeconds: 3.3e5, daughterZ: 84, daughterN: 134, qValueMeV: 5.59, notes: 'Radon-222: Dense radioactive noble gas, indoor environmental health hazard' },
  { z: 84, n: 134, decayMode: 'alpha', halfLifeText: '3.10 m', halfLifeSeconds: 186, daughterZ: 82, daughterN: 132, qValueMeV: 6.115, notes: 'Polonium-218 (Radium A): Short-lived radon progeny' },
  { z: 82, n: 132, decayMode: 'beta_minus', halfLifeText: '26.8 m', halfLifeSeconds: 1608, daughterZ: 83, daughterN: 131, qValueMeV: 1.024, notes: 'Lead-214 (Radium B): Beta decays to Bismuth-214' },
  { z: 83, n: 131, decayMode: 'beta_minus', halfLifeText: '19.9 m', halfLifeSeconds: 1194, daughterZ: 84, daughterN: 130, qValueMeV: 3.272, notes: 'Bismuth-214 (Radium C): High energy gamma-ray emitter' },
  { z: 84, n: 130, decayMode: 'alpha', halfLifeText: '164.3 μs', halfLifeSeconds: 0.000164, daughterZ: 82, daughterN: 128, qValueMeV: 7.883, notes: 'Polonium-214 (Radium C prime): Ultra fast alpha burst' },
  { z: 82, n: 128, decayMode: 'beta_minus', halfLifeText: '22.3 y', halfLifeSeconds: 7.03e8, daughterZ: 83, daughterN: 127, qValueMeV: 0.063, notes: 'Lead-210 (Radium D): Useful for dating recent sediment layers' },
  { z: 83, n: 127, decayMode: 'beta_minus', halfLifeText: '5.01 d', halfLifeSeconds: 4.33e5, daughterZ: 84, daughterN: 126, qValueMeV: 1.163, notes: 'Bismuth-210 (Radium E): Beta decays into Polonium-210' },
  { z: 84, n: 126, decayMode: 'alpha', halfLifeText: '138.38 d', halfLifeSeconds: 1.2e7, daughterZ: 82, daughterN: 124, qValueMeV: 5.407, notes: 'Polonium-210: Notorious intense alpha emitter, decays to stable Pb-206' },

  // ==========================================
  // THORIUM-232 SERIES (4n Series)
  // Th-232 -> Ra-228 -> Ac-228 -> Th-228 -> Ra-224 -> Rn-220 -> Po-216 -> Pb-212 -> Bi-212 -> Po-212 -> Pb-208
  // ==========================================
  { z: 90, n: 142, decayMode: 'alpha', halfLifeText: '14.05 Gy', halfLifeSeconds: 4.43e17, daughterZ: 88, daughterN: 140, qValueMeV: 4.081, notes: 'Thorium-232: Primordial isotope (100% nat. Th), older than universe age' },
  { z: 88, n: 140, decayMode: 'beta_minus', halfLifeText: '5.75 y', halfLifeSeconds: 1.81e8, daughterZ: 89, daughterN: 139, qValueMeV: 0.046, notes: 'Radium-228 (Mesothorium 1)' },
  { z: 89, n: 139, decayMode: 'beta_minus', halfLifeText: '6.15 h', halfLifeSeconds: 22140, daughterZ: 90, daughterN: 138, qValueMeV: 2.127, notes: 'Actinium-228 (Mesothorium 2)' },
  { z: 90, n: 138, decayMode: 'alpha', halfLifeText: '1.91 y', halfLifeSeconds: 6.03e7, daughterZ: 88, daughterN: 136, qValueMeV: 5.52, notes: 'Thorium-228 (Radiothorium)' },
  { z: 88, n: 136, decayMode: 'alpha', halfLifeText: '3.63 d', halfLifeSeconds: 313632, daughterZ: 86, daughterN: 134, qValueMeV: 5.789, notes: 'Radium-224 (Thorium X)' },
  { z: 86, n: 134, decayMode: 'alpha', halfLifeText: '55.6 s', halfLifeSeconds: 55.6, daughterZ: 84, daughterN: 132, qValueMeV: 6.405, notes: 'Radon-220 (Thoron): Thorium chain noble gas' },
  { z: 84, n: 132, decayMode: 'alpha', halfLifeText: '0.145 s', halfLifeSeconds: 0.145, daughterZ: 82, daughterN: 130, qValueMeV: 6.906, notes: 'Polonium-216 (Thorium A)' },
  { z: 82, n: 130, decayMode: 'beta_minus', halfLifeText: '10.64 h', halfLifeSeconds: 38304, daughterZ: 83, daughterN: 129, qValueMeV: 0.574, notes: 'Lead-212 (Thorium B)' },
  { z: 83, n: 129, decayMode: 'beta_minus', halfLifeText: '60.55 m', halfLifeSeconds: 3633, daughterZ: 84, daughterN: 128, qValueMeV: 2.254, notes: 'Bismuth-212 (Thorium C): 64% β⁻ to Po-212, 36% α to Tl-208' },
  { z: 84, n: 128, decayMode: 'alpha', halfLifeText: '299 ns', halfLifeSeconds: 2.99e-7, daughterZ: 82, daughterN: 126, qValueMeV: 8.954, notes: 'Polonium-212: Decays to doubly magic Lead-208' },
  { z: 81, n: 127, decayMode: 'beta_minus', halfLifeText: '3.05 m', halfLifeSeconds: 183, daughterZ: 82, daughterN: 126, qValueMeV: 5.001, notes: 'Thallium-208: 2.6 MeV gamma emitter branch of Th-232 chain' },

  // ==========================================
  // URANIUM-235 SERIES (4n + 3 Actinium Series)
  // U-235 -> Th-231 -> Pa-231 -> Ac-227 -> Th-227 -> Ra-223 -> Rn-219 -> Po-215 -> Pb-211 -> Bi-211 -> Tl-207 -> Pb-207
  // ==========================================
  { z: 92, n: 143, decayMode: 'alpha', halfLifeText: '703.8 My', halfLifeSeconds: 2.22e16, daughterZ: 90, daughterN: 141, qValueMeV: 4.678, notes: 'Uranium-235: Natural fissile isotope used for nuclear reactors and weapons' },
  { z: 90, n: 141, decayMode: 'beta_minus', halfLifeText: '25.52 h', halfLifeSeconds: 91872, daughterZ: 91, daughterN: 140, qValueMeV: 0.391, notes: 'Thorium-231: Daughter of U-235' },
  { z: 91, n: 140, decayMode: 'alpha', halfLifeText: '32.76 ky', halfLifeSeconds: 1.03e12, daughterZ: 89, daughterN: 138, qValueMeV: 5.15, notes: 'Protactinium-231' },
  { z: 89, n: 138, decayMode: 'beta_minus', halfLifeText: '21.77 y', halfLifeSeconds: 6.87e8, daughterZ: 90, daughterN: 137, qValueMeV: 0.045, notes: 'Actinium-227: Head of actinium nomenclature' },
  { z: 90, n: 137, decayMode: 'alpha', halfLifeText: '18.72 d', halfLifeSeconds: 1.62e6, daughterZ: 88, daughterN: 135, qValueMeV: 6.147, notes: 'Thorium-227' },
  { z: 88, n: 135, decayMode: 'alpha', halfLifeText: '11.43 d', halfLifeSeconds: 987552, daughterZ: 86, daughterN: 133, qValueMeV: 5.979, notes: 'Radium-223: Targeted alpha therapy (Xofigo) for bone metastases' },
  { z: 86, n: 133, decayMode: 'alpha', halfLifeText: '3.96 s', halfLifeSeconds: 3.96, daughterZ: 84, daughterN: 131, qValueMeV: 6.946, notes: 'Radon-219 (Actinon)' },
  { z: 84, n: 131, decayMode: 'alpha', halfLifeText: '1.78 ms', halfLifeSeconds: 0.00178, daughterZ: 82, daughterN: 129, qValueMeV: 7.527, notes: 'Polonium-215 (Actinium A)' },
  { z: 82, n: 129, decayMode: 'beta_minus', halfLifeText: '36.1 m', halfLifeSeconds: 2166, daughterZ: 83, daughterN: 128, qValueMeV: 1.367, notes: 'Lead-211 (Actinium B)' },
  { z: 83, n: 128, decayMode: 'alpha', halfLifeText: '2.14 m', halfLifeSeconds: 128.4, daughterZ: 81, daughterN: 126, qValueMeV: 6.751, notes: 'Bismuth-211 (Actinium C)' },
  { z: 81, n: 126, decayMode: 'beta_minus', halfLifeText: '4.77 m', halfLifeSeconds: 286.2, daughterZ: 82, daughterN: 125, qValueMeV: 1.418, notes: 'Thallium-207 (Actinium C prime)' },

  // ==========================================
  // TRANSURANIC ACTINIDES & KEY FISSION ELEMENTS
  // ==========================================
  { z: 93, n: 144, decayMode: 'alpha', halfLifeText: '2.144 My', halfLifeSeconds: 6.77e13, daughterZ: 91, daughterN: 142, qValueMeV: 4.959, notes: 'Neptunium-237: Head of the missing 4n+1 decay chain' },
  { z: 94, n: 144, decayMode: 'alpha', halfLifeText: '87.7 y', halfLifeSeconds: 2.77e9, daughterZ: 92, daughterN: 142, qValueMeV: 5.593, notes: 'Plutonium-238: RTG power source for Voyager, Curiosity, & Perseverance rovers' },
  { z: 94, n: 145, decayMode: 'alpha', halfLifeText: '24,110 y', halfLifeSeconds: 7.61e11, daughterZ: 92, daughterN: 143, qValueMeV: 5.244, notes: 'Plutonium-239: Primary fissile nuclear weapons and MOX reactor fuel' },
  { z: 94, n: 146, decayMode: 'alpha', halfLifeText: '6,561 y', halfLifeSeconds: 2.07e11, daughterZ: 92, daughterN: 144, qValueMeV: 5.256, notes: 'Plutonium-240: Spontaneous fission background in reactor-grade Pu' },
  { z: 94, n: 147, decayMode: 'beta_minus', halfLifeText: '14.29 y', halfLifeSeconds: 4.51e8, daughterZ: 95, daughterN: 146, qValueMeV: 0.021, notes: 'Plutonium-241: Decays into Americium-241' },
  { z: 95, n: 146, decayMode: 'alpha', halfLifeText: '432.2 y', halfLifeSeconds: 1.36e10, daughterZ: 93, daughterN: 144, qValueMeV: 5.638, notes: 'Americium-241: Household smoke detector ionization source' },
  { z: 96, n: 146, decayMode: 'alpha', halfLifeText: '162.8 d', halfLifeSeconds: 1.41e7, daughterZ: 94, daughterN: 144, qValueMeV: 6.216, notes: 'Curium-242: Intense alpha emitter' },
  { z: 96, n: 148, decayMode: 'alpha', halfLifeText: '18.10 y', halfLifeSeconds: 5.71e8, daughterZ: 94, daughterN: 146, qValueMeV: 5.902, notes: 'Curium-244: Alpha particle X-ray spectrometer on Mars missions' },
  { z: 98, n: 154, decayMode: 'sf', halfLifeText: '2.645 y', halfLifeSeconds: 8.35e7, daughterZ: 0, daughterN: 0, qValueMeV: 210, notes: 'Californium-252: Powerful commercial neutron emitter via spontaneous fission (3.1%)' },
  { z: 100, n: 157, decayMode: 'alpha', halfLifeText: '100.5 d', halfLifeSeconds: 8.68e6, daughterZ: 98, daughterN: 155, qValueMeV: 7.22, notes: 'Fermium-257: Heaviest nuclide produced by neutron capture in explosions' },
  // ==========================================
  // SUPERHEAVY ELEMENTS (Transactinides Z = 104 to 118)
  // ==========================================
  { z: 104, n: 163, decayMode: 'sf', halfLifeText: '1.3 h', halfLifeSeconds: 4680, daughterZ: 0, daughterN: 0, qValueMeV: 215, notes: 'Rutherfordium-267: Longest-lived Rf isotope, spontaneous fission' },
  { z: 105, n: 163, decayMode: 'sf', halfLifeText: '29 h', halfLifeSeconds: 104400, daughterZ: 0, daughterN: 0, qValueMeV: 215, notes: 'Dubnium-268: Longest-lived dubnium isotope' },
  { z: 106, n: 163, decayMode: 'alpha', halfLifeText: '3.1 m', halfLifeSeconds: 186, daughterZ: 104, daughterN: 161, qValueMeV: 8.56, notes: 'Seaborgium-269: Named after Glenn Seaborg' },
  { z: 107, n: 167, decayMode: 'alpha', halfLifeText: '54 s', halfLifeSeconds: 54, daughterZ: 105, daughterN: 165, qValueMeV: 8.87, notes: 'Bohrium-274: Named after Niels Bohr' },
  { z: 108, n: 162, decayMode: 'alpha', halfLifeText: '22 s', halfLifeSeconds: 22, daughterZ: 106, daughterN: 160, qValueMeV: 9.02, notes: 'Hassium-270: Deformed doubly-magic nucleus (Z=108, N=162)' },
  { z: 109, n: 169, decayMode: 'alpha', halfLifeText: '7.6 s', halfLifeSeconds: 7.6, daughterZ: 107, daughterN: 167, qValueMeV: 9.48, notes: 'Meitnerium-278: Named after Lise Meitner' },
  { z: 110, n: 171, decayMode: 'alpha', halfLifeText: '12.7 s', halfLifeSeconds: 12.7, daughterZ: 108, daughterN: 169, qValueMeV: 9.68, notes: 'Darmstadtium-281: Discovered at GSI Darmstadt' },
  { z: 111, n: 171, decayMode: 'alpha', halfLifeText: '2.1 s', halfLifeSeconds: 2.1, daughterZ: 109, daughterN: 169, qValueMeV: 9.90, notes: 'Roentgenium-282: Named after Wilhelm Röntgen' },
  { z: 112, n: 173, decayMode: 'alpha', halfLifeText: '29 s', halfLifeSeconds: 29, daughterZ: 110, daughterN: 171, qValueMeV: 9.15, notes: 'Copernicium-285: Volatile noble-like metal, named after Copernicus' },
  { z: 113, n: 173, decayMode: 'alpha', halfLifeText: '9.5 s', halfLifeSeconds: 9.5, daughterZ: 111, daughterN: 171, qValueMeV: 10.12, notes: 'Nihonium-286: First element synthesized in Asia (RIKEN, Japan)' },
  { z: 114, n: 175, decayMode: 'alpha', halfLifeText: '2.6 s', halfLifeSeconds: 2.6, daughterZ: 112, daughterN: 173, qValueMeV: 9.82, notes: 'Flerovium-289: Center of the hypothesized Island of Stability (Z=114)' },
  { z: 115, n: 174, decayMode: 'alpha', halfLifeText: '220 ms', halfLifeSeconds: 0.22, daughterZ: 113, daughterN: 172, qValueMeV: 10.31, notes: 'Moscovium-289: Alpha decays to Nihonium' },
  { z: 116, n: 177, decayMode: 'alpha', halfLifeText: '53 ms', halfLifeSeconds: 0.053, daughterZ: 114, daughterN: 175, qValueMeV: 10.54, notes: 'Livermorium-293: Named after Lawrence Livermore National Lab' },
  { z: 117, n: 177, decayMode: 'alpha', halfLifeText: '78 ms', halfLifeSeconds: 0.078, daughterZ: 115, daughterN: 175, qValueMeV: 10.81, notes: 'Tennessine-294: Halogen group superheavy element' },
  { z: 118, n: 176, decayMode: 'alpha', halfLifeText: '0.7 ms', halfLifeSeconds: 0.0007, daughterZ: 116, daughterN: 174, qValueMeV: 11.65, notes: 'Oganesson-294: Heaviest known element on the periodic table (Z=118)' }
];

// Helper to determine approximate binding energy per nucleon (Bethe-Weizsäcker liquid drop semi-empirical mass formula)
export function calculateBindingEnergyPerNucleon(z: number, n: number): number {
  const a = z + n;
  if (a === 0) return 0;
  // Coefficients in MeV
  const aV = 15.76;  // Volume
  const aS = 17.81;  // Surface
  const aC = 0.711;  // Coulomb
  const aA = 23.70;  // Asymmetry
  // Pairing term
  let delta = 0;
  if (z % 2 === 0 && n % 2 === 0) delta = 11.18 / Math.sqrt(a);
  else if (z % 2 !== 0 && n % 2 !== 0) delta = -11.18 / Math.sqrt(a);

  const b = aV * a - aS * Math.pow(a, 2/3) - aC * (z * (z - 1)) / Math.pow(a, 1/3) - aA * Math.pow(n - z, 2) / a + delta;
  return Math.max(0, Math.min(8.8, b / a));
}

// Generate the complete realistic Segrè Chart of Nuclides
// Includes all known stable isotopes, explicit radionuclides, and systematically filled
// boundaries of the valley of stability from Z=1 to Z=100.
function buildNuclideDatabase(): Map<string, Nuclide> {
  const map = new Map<string, Nuclide>();

  // 1. Insert known stable isotopes
  for (const [z, n, note] of STABLE_ISOTOPES_DATA) {
    const el = ELEMENT_MAP.get(z);
    if (!el) continue;
    const id = `${z}-${n}`;
    const nuclide: Nuclide = {
      id,
      z,
      n,
      a: z + n,
      symbol: el.symbol,
      elementName: el.name,
      decayMode: 'stable',
      halfLifeText: 'Stable',
      halfLifeSeconds: Infinity,
      daughterZ: null,
      daughterN: null,
      qValueMeV: 0,
      bindingEnergyPerNucleon: Number(calculateBindingEnergyPerNucleon(z, n).toFixed(3)),
      isStable: true,
      notes: note
    };
    map.set(id, nuclide);
  }

  // 2. Insert verified radionuclides (overriding any auto data)
  for (const r of NOTABLE_RADIONUCLIDES) {
    const el = ELEMENT_MAP.get(r.z);
    if (!el) continue;
    const id = `${r.z}-${r.n}`;
    const nuclide: Nuclide = {
      id,
      z: r.z,
      n: r.n,
      a: r.z + r.n,
      symbol: el.symbol,
      elementName: el.name,
      decayMode: r.decayMode,
      halfLifeText: r.halfLifeText,
      halfLifeSeconds: r.halfLifeSeconds,
      daughterZ: r.daughterZ ?? null,
      daughterN: r.daughterN ?? null,
      qValueMeV: r.qValueMeV ?? 0,
      bindingEnergyPerNucleon: Number(calculateBindingEnergyPerNucleon(r.z, r.n).toFixed(3)),
      isStable: false,
      notes: r.notes
    };
    map.set(id, nuclide);
  }

  // 3. Systematically populate the nuclear landscape around the valley of stability
  // Standard nuclear stability line: N ≈ Z + 0.006 * A^(5/3) or Green's formula: N ≈ Z * (1 + 0.0077 * A^(2/3))
  for (let z = 1; z <= 118; z++) {
    const el = ELEMENT_MAP.get(z);
    if (!el) continue;

    // Determine center of valley for this Z
    // For light elements N ≈ Z, for heavy elements N ≈ 1.5 * Z
    const nCenter = Math.round(z <= 20 ? z : z * (1 + 0.006 * Math.pow(2 * z, 2/3)));
    // Width of known isotopes on either side of center
    const span = z < 10 ? 4 : z < 40 ? 7 : z < 80 ? 9 : 10;
    const nMin = Math.max(0, nCenter - span);
    const nMax = nCenter + span;

    for (let n = nMin; n <= nMax; n++) {
      const id = `${z}-${n}`;
      if (map.has(id)) continue; // Already explicitly defined

      const a = z + n;
      // Determine physical decay mode based on position relative to valley and Z
      let decayMode: DecayMode = 'beta_minus';
      let daughterZ: number | null = null;
      let daughterN: number | null = null;
      let halfLifeText = 'Minutes';
      let halfLifeSeconds = 120;
      let qValue = 1.5;

      const deltaN = n - nCenter;

      if (z >= 84) {
        // Heavy nuclei beyond Pb/Bi predominantly alpha decay or SF
        if (z >= 96 && deltaN > 6) {
          decayMode = 'sf';
          halfLifeText = 'Milliseconds';
          halfLifeSeconds = 0.05;
        } else if (deltaN < -4) {
          decayMode = 'alpha';
          daughterZ = z - 2;
          daughterN = n - 2;
          halfLifeText = 'Milliseconds';
          halfLifeSeconds = 0.01;
        } else if (deltaN > 4) {
          decayMode = 'beta_minus';
          daughterZ = z + 1;
          daughterN = n - 1;
          halfLifeText = 'Hours';
          halfLifeSeconds = 3600;
        } else {
          decayMode = 'alpha';
          daughterZ = z - 2;
          daughterN = n - 2;
          halfLifeText = 'Days';
          halfLifeSeconds = 86400 * 30;
        }
      } else if (deltaN < -2) {
        // Proton-rich side of the valley -> Beta plus / Electron Capture
        if (deltaN < -6 && z > 20) {
          decayMode = 'proton';
          daughterZ = z - 1;
          daughterN = n;
          halfLifeText = 'Microseconds';
          halfLifeSeconds = 0.0001;
        } else {
          decayMode = 'beta_plus';
          daughterZ = z - 1;
          daughterN = n + 1;
          const dist = Math.abs(deltaN);
          halfLifeSeconds = Math.max(0.1, 10000 / Math.pow(dist, 3));
          halfLifeText = formatHalfLifeSeconds(halfLifeSeconds);
        }
      } else if (deltaN > 2) {
        // Neutron-rich side of the valley -> Beta minus
        if (deltaN > 7 && z > 10) {
          decayMode = 'neutron';
          daughterZ = z;
          daughterN = n - 1;
          halfLifeText = 'Milliseconds';
          halfLifeSeconds = 0.005;
        } else {
          decayMode = 'beta_minus';
          daughterZ = z + 1;
          daughterN = n - 1;
          const dist = Math.abs(deltaN);
          halfLifeSeconds = Math.max(0.1, 10000 / Math.pow(dist, 3));
          halfLifeText = formatHalfLifeSeconds(halfLifeSeconds);
        }
      } else {
        // Close to valley center, radionuclides or quasi-stable
        if (deltaN < 0) {
          decayMode = 'beta_plus';
          daughterZ = z - 1;
          daughterN = n + 1;
          halfLifeSeconds = 86400 * 20;
          halfLifeText = 'Days to Years';
        } else {
          decayMode = 'beta_minus';
          daughterZ = z + 1;
          daughterN = n - 1;
          halfLifeSeconds = 86400 * 15;
          halfLifeText = 'Days to Years';
        }
      }

      const nuclide: Nuclide = {
        id,
        z,
        n,
        a,
        symbol: el.symbol,
        elementName: el.name,
        decayMode,
        halfLifeText,
        halfLifeSeconds,
        daughterZ,
        daughterN,
        qValueMeV: qValue,
        bindingEnergyPerNucleon: Number(calculateBindingEnergyPerNucleon(z, n).toFixed(3)),
        isStable: false,
        notes: `Isotope of ${el.name} (${decayMode === 'beta_minus' ? 'β⁻ decay' : decayMode === 'beta_plus' ? 'β⁺/EC decay' : decayMode === 'alpha' ? 'α decay' : decayMode})`
      };
      map.set(id, nuclide);
    }
  }

  return map;
}

function formatHalfLifeSeconds(s: number): string {
  if (s === Infinity) return 'Stable';
  if (s < 0.001) return `${(s * 1000000).toFixed(1)} μs`;
  if (s < 1) return `${(s * 1000).toFixed(1)} ms`;
  if (s < 60) return `${s.toFixed(1)} s`;
  if (s < 3600) return `${(s / 60).toFixed(1)} m`;
  if (s < 86400) return `${(s / 3600).toFixed(1)} h`;
  if (s < 3.15e7) return `${(s / 86400).toFixed(1)} d`;
  if (s < 3.15e10) return `${(s / 3.15e7).toFixed(1)} y`;
  if (s < 3.15e13) return `${(s / 3.15e10).toFixed(1)} ky`;
  if (s < 3.15e16) return `${(s / 3.15e13).toFixed(1)} My`;
  return `${(s / 3.15e16).toFixed(2)} Gy`;
}

// Global cached database of all nuclides
export const NUCLIDE_MAP = buildNuclideDatabase();
export const ALL_NUCLIDES = Array.from(NUCLIDE_MAP.values());

// Helper to find a nuclide
export function getNuclide(z: number, n: number): Nuclide | undefined {
  return NUCLIDE_MAP.get(`${z}-${n}`);
}

// Helper to simulate full radioactive decay path down to stability
export function traceDecayPath(startZ: number, startN: number, maxSteps = 25): DecayStep[] {
  const steps: DecayStep[] = [];
  let current = getNuclide(startZ, startN);
  if (!current || current.isStable) return steps;

  const visited = new Set<string>();
  visited.add(current.id);

  let stepNumber = 1;
  while (current && !current.isStable && stepNumber <= maxSteps) {
    let dZ = current.daughterZ;
    let dN = current.daughterN;

    // Fallback if daughter not explicitly stored
    if (dZ === undefined || dN === undefined || dZ === null || dN === null) {
      if (current.decayMode === 'alpha') {
        dZ = current.z - 2;
        dN = current.n - 2;
      } else if (current.decayMode === 'beta_minus') {
        dZ = current.z + 1;
        dN = current.n - 1;
      } else if (current.decayMode === 'beta_plus') {
        dZ = current.z - 1;
        dN = current.n + 1;
      } else if (current.decayMode === 'proton') {
        dZ = current.z - 1;
        dN = current.n;
      } else if (current.decayMode === 'neutron') {
        dZ = current.z;
        dN = current.n - 1;
      } else {
        break; // Spontaneous fission or terminal
      }
    }

    if (dZ <= 0 || dN < 0) break;
    const daughter = getNuclide(dZ, dN);
    if (!daughter) break;

    steps.push({
      parent: current,
      mode: current.decayMode,
      daughter,
      stepNumber: stepNumber++
    });

    if (daughter.isStable || visited.has(daughter.id)) {
      break;
    }

    visited.add(daughter.id);
    current = daughter;
  }

  return steps;
}

// Famous predefined chains for quick jumping
export const PRESET_CHAINS = {
  u238: { z: 92, n: 146, name: 'Uranium-238 (Radium Series)' },
  th232: { z: 90, n: 142, name: 'Thorium-232 Series' },
  u235: { z: 92, n: 143, name: 'Uranium-235 (Actinium Series)' },
  og294: { z: 118, n: 176, name: 'Oganesson-294 (Heaviest Element Z=118)' },
  fl289: { z: 114, n: 175, name: 'Flerovium-289 (Island of Stability Z=114)' },
  c14: { z: 6, n: 8, name: 'Carbon-14' },
  cs137: { z: 55, n: 82, name: 'Caesium-137' },
  i131: { z: 53, n: 78, name: 'Iodine-131' },
  tc99m: { z: 43, n: 56, name: 'Technetium-99m' },
  co60: { z: 27, n: 33, name: 'Cobalt-60' },
  h3: { z: 1, n: 2, name: 'Tritium (H-3)' },
  fe56: { z: 26, n: 30, name: 'Iron-56 (Stability Peak)' }
};

// Summary statistics
export const NUCLIDE_STATS = {
  totalCount: ALL_NUCLIDES.length,
  stableCount: ALL_NUCLIDES.filter(n => n.isStable).length,
  betaMinusCount: ALL_NUCLIDES.filter(n => n.decayMode === 'beta_minus').length,
  betaPlusCount: ALL_NUCLIDES.filter(n => n.decayMode === 'beta_plus').length,
  alphaCount: ALL_NUCLIDES.filter(n => n.decayMode === 'alpha').length,
  sfCount: ALL_NUCLIDES.filter(n => n.decayMode === 'sf').length
};
