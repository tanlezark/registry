import { ITEMS_CSV_URL, SHEET_CSV_URL, MIN_COLUMN_WIDTH, COLUMN_GAP } from "./config.js";
import { parseCSV, parseItemsCSV } from "./csv.js";
import { renderRooms } from "./render.js";
import { readLocalClaims } from "./claim.js";

const list     = document.getElementById("list");
const statusEl = document.getElementById("status");

let items   = [];        // parsed from ITEMS_CSV_URL
let claimed = new Set();  // ids currently taken, from the responses sheet + this device
let roomEls = [];         // rendered <section class="room"> elements, before layout() packs them

function say(message){
  statusEl.textContent = message;
}

// CSS multi-column layout can leave an awkward strip of empty space at
// certain widths instead of smoothly adding a column, so columns are
// packed here in JS instead: measure the available width, work out how
// many MIN_COLUMN_WIDTH-or-wider columns fit, then drop each room into
// whichever column is currently shortest.
function layout(){
  const available = list.getBoundingClientRect().width || window.innerWidth;
  const columnCount = Math.max(
    1,
    Math.floor((available + COLUMN_GAP) / (MIN_COLUMN_WIDTH + COLUMN_GAP))
  );

  list.innerHTML = "";
  const columns = Array.from({ length: columnCount }, () => {
    const el = document.createElement("div");
    el.className = "col";
    list.append(el);
    return { el, height: 0 };
  });

  for (const room of roomEls){
    const shortest = columns.reduce((a, b) => (b.height < a.height ? b : a));
    shortest.el.append(room);
    shortest.height += room.offsetHeight;
  }
}

// Re-runs layout() on resize, debounced so a dragged window edge doesn't
// thrash the DOM on every intermediate frame.
let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(layout, 150);
});

function render(){
  const ctx = { claimed, say, rerender: render };
  roomEls = renderRooms(items, ctx);
  layout();
}

async function loadItems(){
  const text = await (await fetch(ITEMS_CSV_URL)).text();
  items = parseItemsCSV(text);
}

async function loadClaimed(){
  if (!SHEET_CSV_URL) return;
  // Cache-bust so a guest doesn't see a stale copy of who's claimed what.
  const url = SHEET_CSV_URL + (SHEET_CSV_URL.includes("?") ? "&" : "?") + "t=" + Date.now();
  const rows = parseCSV(await (await fetch(url)).text()).slice(1);
  const sheetIds = rows.map(r => (r[1] || "").trim()).filter(Boolean);
  claimed = new Set([...readLocalClaims(), ...sheetIds]);
}

async function init(){
  claimed = new Set(readLocalClaims());

  try {
    await loadItems();
  } catch (e) {
    say("Could not load the item list. Please refresh.");
    return;
  }
  render();

  try {
    await loadClaimed();
    render();
  } catch (e) {
    say("Could not check what has been taken. Please refresh.");
  }
}

init();