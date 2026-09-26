// Everything guest-facing lives in two published Google Sheets, not in
// code. Edit the sheets to change what's on the page; edit this file only
// to change a URL, a wording rule, or a layout constant.

// The item list. Columns expected: Room, Item, Blurb, Link, Multiple, SortOrder.
export const ITEMS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSrc23Xb_w5tHJiaE-GLbMQ9rPaGd_1lQTeG8-PYydDymOqVYIki_qRZ0kWVHIoryPVxDJ2bQhTtHgT/pub?gid=619533425&single=true&output=csv";

// The Google Form that records a claim, and the responses sheet published
// as CSV so every visitor can see what's already taken. Leave FORM_URL
// empty to preview the page without either.
export const FORM_URL      = "https://docs.google.com/forms/d/e/1FAIpQLSeWVL5mlzHtPsGpulaXCtoU-vtHiCry53Kaix3duR2kXu0umg/formResponse";
export const ENTRY_ITEM    = "entry.468522525";
export const ENTRY_NAME    = "entry.1905366713";
export const ENTRY_NOTES   = "entry.1819125415";
export const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQn4-SZ7JhozDiIcdt-UnzqwP_S7ISGYS91qZ7rl0FrgQplcwOrh4aKyfq_FWwvBbR7wtTLCxVyIevY/pub?gid=2135754539&single=true&output=csv";

// The one room name that gets "chip in" wording instead of "get" wording.
export const FUND_GROUP = "Chip in fund";

// A guest's own claims are remembered on this device for this long, to
// bridge the delay before the published responses sheet catches up.
export const REMEMBER_KEY = "registry-mine-v2";
export const REMEMBER_MS  = 30 * 60 * 1000; // 30 minutes

// Room columns never get narrower than this, in CSS pixels, before another
// column is added. Must match the reserve baked into main's max-width in
// styles.css (currently 490 + 24 = 514, doubled for both sides).
export const MIN_COLUMN_WIDTH = 490;
export const COLUMN_GAP       = 24;
