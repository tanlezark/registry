import { buttonLabel, openClaimForm } from "./claim.js";

export function isTaken(item, claimed){
  return !item.multi && claimed.has(item.id);
}

function groupByRoom(items){
  const rooms = [];
  for (const item of items){
    let room = rooms.find(r => r.name === item.group);
    if (!room){ room = { name: item.group, items: [] }; rooms.push(room); }
    room.items.push(item);
  }
  return rooms;
}

function renderItemRow(item, claimed, ctx){
  const li = document.createElement("li");
  const taken = isTaken(item, claimed);
  if (taken) li.className = "taken";

  li.innerHTML = `
    <div class="row">
      <div class="info">
        <div class="name"></div>
        <p class="note"></p>
      </div>
    </div>`;

  li.querySelector(".name").textContent = item.name;

  const noteEl = li.querySelector(".note");
  if (item.note) noteEl.textContent = item.note;
  else noteEl.remove();

  if (item.link){
    const a = document.createElement("a");
    a.className = "link";
    a.href = item.link;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = "The one we have in mind";
    li.querySelector(".info").append(a);
  }

  const row = li.querySelector(".row");
  if (taken){
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = "Taken";
    row.append(tag);
  } else {
    const btn = document.createElement("button");
    btn.textContent = buttonLabel(item);
    btn.onclick = () => openClaimForm(li, item, btn, ctx);
    row.append(btn);
  }

  return li;
}

function renderRoom(room, claimed, ctx){
  const takenCount = room.items.filter(item => isTaken(item, claimed)).length;
  const allTaken = takenCount === room.items.length;

  const section = document.createElement("section");
  section.className = "room" + (allTaken ? " done" : "");

  const head = document.createElement("div");
  head.className = "room-head";

  const heading = document.createElement("h2");
  heading.textContent = room.name;

  const count = document.createElement("span");
  count.className = "count";
  count.textContent = allTaken ? "All taken" : `${takenCount} of ${room.items.length} taken`;

  head.append(heading, count);
  section.append(head);

  const ul = document.createElement("ul");
  for (const item of room.items) ul.append(renderItemRow(item, claimed, ctx));
  section.append(ul);

  return section;
}

// Builds one <section class="room"> element per room, ready to be handed
// to layout.js. Does not touch the DOM tree itself beyond creating these
// elements — layout.js decides where they end up.
// `ctx` = { claimed, say, rerender }, threaded down to the claim form.
export function renderRooms(items, ctx){
  return groupByRoom(items).map(room => renderRoom(room, ctx.claimed, ctx));
}
