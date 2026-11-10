/**
 * eHANAP — Municipal & Geographic Domain Constants
 * Municipality of Roxas, Oriental Mindoro | PESO
 */

export const ROXAS_MUNICIPALITY = "Roxas, Oriental Mindoro" as const;

/**
 * The 16 Official Barangays of the Municipality of Roxas, Oriental Mindoro
 */
export const ROXAS_BARANGAYS = [
  "Bagumbayan",
  "Cantil",
  "Dangay",
  "Happy Valley",
  "Libertad",
  "Mabuhay",
  "Marugdug",
  "Odiong",
  "Paclasan",
  "San Aquilino",
  "San Isidro",
  "San Jose",
  "San Mariano",
  "San Rafael",
  "San Vicente",
  "Victoria"
] as const;

export type RoxasBarangay = (typeof ROXAS_BARANGAYS)[number];

/**
 * Single active municipality array for current Roxas PESO pilot scope
 */
export const ORIENTAL_MINDORO_MUNICIPALITIES = [
  "Roxas"
] as const;

export type OrientalMindoroMunicipality = (typeof ORIENTAL_MINDORO_MUNICIPALITIES)[number];

/**
 * All Municipalities in Oriental Mindoro Province
 */
export const ALL_ORIENTAL_MINDORO_MUNICIPALITIES = [
  "Roxas",
  "Mansalay",
  "Bongabong",
  "Bulalacao",
  "Calapan",
  "Pinamalayan",
  "Gloria",
  "Bansud",
  "Pola",
  "Socorro",
  "Victoria",
  "Naujan",
  "Baco",
  "San Teodoro",
  "Puerto Galera"
] as const;

export const MINDORO_MUNICIPALITIES = ALL_ORIENTAL_MINDORO_MUNICIPALITIES;
