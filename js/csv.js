// Small hand-rolled CSV parser (handles quoted fields and escaped quotes)
// since both sheets are fetched as plain CSV text with no library.

export function parseCSV(text){
  const rows = [];
  let row = [], field = "", inQuotes = false;

  for (let i = 0; i < text.length; i++){
    const ch = text[i];
    if (inQuotes){
      if (ch === '"'){
        if (text[i + 1] === '"'){ field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"'){
      inQuotes = true;
    } else if (ch === ","){
      row.push(field); field = "";
    } else if (ch === "\n"){
      row.push(field); rows.push(row); row = []; field = "";
    } else if (ch !== "\r"){
      field += ch;
    }
  }
  if (field || row.length){ row.push(field); rows.push(row); }
  return rows;
}

// Turns an item name into a short, stable id: "Rubber Duck" -> "rubberduck".
// Kept stable across re-imports as long as the name doesn't change, so
// existing claims in the responses sheet keep matching.
export function slugify(name){
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 40) || "item";
}

// Only allow http(s) links through to an href, in case a Sheet cell ever
// contains something else (e.g. a stray "javascript:" or "data:" value).
export function isSafeUrl(url){
  try { return ["http:", "https:"].includes(new URL(url).protocol); }
  catch(e){ return false; }
}

// Parses the published items sheet into a flat, ordered list of items:
// [{ group, id, name, note?, link?, multi? }, ...]
export function parseItemsCSV(text){
  const rows   = parseCSV(text);
  const header = rows[0].map(h => h.trim().toLowerCase());
  const colIndex = name => header.indexOf(name);

  const col = {
    room:  colIndex("room"),
    item:  colIndex("item"),
    blurb: colIndex("blurb"),
    link:  colIndex("link"),
    multi: colIndex("multiple"),
    sort:  colIndex("sortorder"),
  };

  const roomOrder = new Map(); // room name -> lowest SortOrder seen for it
  const seenIds   = new Map(); // id -> how many times we've generated it, so duplicates get suffixed
  const parsed    = [];

  for (const r of rows.slice(1)){
    const name = (r[col.item] || "").trim();
    if (!name) continue; // blank Item cell: skip the row entirely

    const room  = (r[col.room] || "").trim() || "Other";
    const blurb = (r[col.blurb] || "").trim();
    const link  = (r[col.link] || "").trim();
    const multi = (r[col.multi] || "").trim().toUpperCase() === "TRUE";

    const sortValue = parseFloat(r[col.sort]);
    const order = Number.isNaN(sortValue) ? 9999 : sortValue;
    if (!roomOrder.has(room) || order < roomOrder.get(room)) roomOrder.set(room, order);

    let id = slugify(name);
    const count = (seenIds.get(id) || 0) + 1;
    seenIds.set(id, count);
    if (count > 1) id += "-" + count;

    const item = { group: room, id, name };
    if (blurb) item.note = blurb;
    if (link && isSafeUrl(link)) item.link = link;
    if (multi) item.multi = true;
    parsed.push(item);
  }

  // Stable sort: keeps each room's items in sheet order, just reorders the rooms.
  parsed.sort((a, b) => roomOrder.get(a.group) - roomOrder.get(b.group));
  return parsed;
}
