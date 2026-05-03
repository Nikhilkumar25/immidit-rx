export const LAB_TUBE_MAPPING: Record<string, { tube: string; color: string; instructions: string }> = {
  'CBC (Complete Blood Count)': { tube: 'Purple Top (EDTA)', color: '#800080', instructions: 'Gently invert 8-10 times' },
  'Lipid Profile': { tube: 'Yellow Top (SST)', color: '#FFD700', instructions: 'Allow to clot for 30 mins' },
  'HbA1c': { tube: 'Purple Top (EDTA)', color: '#800080', instructions: 'Gently invert 8-10 times' },
  'Liver Function Test (LFT)': { tube: 'Yellow Top (SST)', color: '#FFD700', instructions: 'Allow to clot for 30 mins' },
  'Kidney Function Test (KFT)': { tube: 'Yellow Top (SST)', color: '#FFD700', instructions: 'Allow to clot for 30 mins' },
  'Thyroid Profile (T3/T4/TSH)': { tube: 'Yellow Top (SST)', color: '#FFD700', instructions: 'Allow to clot for 30 mins' },
  'Blood Sugar (Fasting/PP)': { tube: 'Grey Top (Fluoride)', color: '#808080', instructions: 'Invert 8-10 times' },
  'Electrolytes (Na/K/Cl)': { tube: 'Yellow Top (SST)', color: '#FFD700', instructions: 'Allow to clot for 30 mins' },
  'Coagulation Profile (PT/INR)': { tube: 'Light Blue Top (Citrate)', color: '#ADD8E6', instructions: 'Must fill to exact mark' },
  'D-Dimer': { tube: 'Light Blue Top (Citrate)', color: '#ADD8E6', instructions: 'Invert 3-4 times gently' },
  'Vitamin B12 / D3': { tube: 'Yellow Top (SST)', color: '#FFD700', instructions: 'Protect from light if possible' },
  'Blood Culture': { tube: 'Culture Bottle', color: '#FFFFFF', instructions: 'Clean skin with chlorhexidine' },
};

export const STANDARD_LAB_TESTS = Object.keys(LAB_TUBE_MAPPING);
