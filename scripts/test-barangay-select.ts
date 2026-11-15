import assert from 'node:assert/strict';
import { normalizeBarangay } from '../src/utils/resumeExtractorCore';
import { ROXAS_BARANGAYS } from '../src/constants/municipal';

console.log('Testing Barangay selection normalization logic...');

// Test 1: User explicitly selects "Dangay", but address contains "Brgy. Bagumbayan"
// With the buggy implementation, "Bagumbayan" (index 0) was found in `${extractedBarangay} ${address}`
// and returned instead of the selected "Dangay", causing the selection to flicker and revert/disappear.
const selectedBarangay = 'Dangay';
const addressWithBagumbayan = 'Sitio Riverside, Brgy. Bagumbayan, Roxas, Oriental Mindoro';

const normalized = normalizeBarangay(selectedBarangay, addressWithBagumbayan);
console.log(`Input: barangay="${selectedBarangay}", address="${addressWithBagumbayan}" -> Result: "${normalized}"`);

assert.equal(
  normalized,
  'Dangay',
  'When a user selects Dangay, normalizeBarangay must preserve Dangay, NOT override it with Bagumbayan from the address string'
);

// Test 2: User explicitly selects "San Mariano", but address contains "Dangay"
const selectedSanMariano = 'San Mariano';
const addressWithDangay = 'Brgy. Dangay, Roxas, Oriental Mindoro';
const normalizedSanMariano = normalizeBarangay(selectedSanMariano, addressWithDangay);
console.log(`Input: barangay="${selectedSanMariano}", address="${addressWithDangay}" -> Result: "${normalizedSanMariano}"`);

assert.equal(
  normalizedSanMariano,
  'San Mariano',
  'When a user selects San Mariano, normalizeBarangay must preserve San Mariano, NOT override it with Dangay from the address string'
);

// Test 3: Fallback when barangay is empty string, should extract from address
const fallbackFromAddress = normalizeBarangay('', 'Purok 2, San Vicente, Roxas');
console.log(`Input: barangay="", address="Purok 2, San Vicente, Roxas" -> Result: "${fallbackFromAddress}"`);
assert.equal(
  fallbackFromAddress,
  'San Vicente',
  'When barangay is empty, normalizeBarangay should extract San Vicente from address'
);

// Test 4: When both are empty
const emptyResult = normalizeBarangay('', '');
assert.equal(emptyResult, '', 'When both are empty, should return empty string');

console.log('All Barangay selection tests passed successfully! 🎉');
