import { FORM_URL, ENTRY_ITEM, ENTRY_NAME, ENTRY_NOTES, FUND_GROUP, REMEMBER_KEY, REMEMBER_MS } from "./config.js";

// Bridges the gap between submitting a claim and the published responses
// sheet catching up, so the guest who just claimed something sees it as
// Taken immediately. Wrapped in try/catch since some browsers block
// localStorage entirely (private browsing, disabled storage, etc).

export function readLocalClaims(){
  try {
    const stored = JSON.parse(localStorage.getItem(REMEMBER_KEY) || "{}");
    const now = Date.now();
    return Object.keys(stored).filter(id => now - stored[id] < REMEMBER_MS);
  } catch (e) {
    return [];
  }
}

function rememberLocalClaim(id){
  try {
    const stored = JSON.parse(localStorage.getItem(REMEMBER_KEY) || "{}");
    stored[id] = Date.now();
    localStorage.setItem(REMEMBER_KEY, JSON.stringify(stored));
  } catch (e) {
    // Nothing we can do; the guest just won't see their own claim as
    // Taken until the responses sheet updates.
  }
}

export function buttonLabel(item){
  if (item.group === FUND_GROUP) return "I'll chip in";
  return item.multi ? "I'll get one" : "I'll get this";
}

export function confirmationMessage(item){
  if (item.group === FUND_GROUP) return "Thank you. We have noted it.";
  if (item.multi) return `Thank you. We've noted you're getting a ${item.name.toLowerCase()}.`;
  return `Thank you. ${item.name} is marked as yours.`;
}

// Sends one claim to the Google Form. Mutates `claimed` optimistically
// (rolled back on failure) so the caller's next render() reflects it.
async function submitClaim(item, name, notes, claimed){
  if (!item.multi) claimed.add(item.id);

  if (!FORM_URL) return "ok"; // local preview mode: nothing to send

  try {
    const body = new URLSearchParams();
    body.set(ENTRY_ITEM, item.id);
    body.set(ENTRY_NAME, name);
    body.set(ENTRY_NOTES, notes);
    await fetch(FORM_URL, { method: "POST", mode: "no-cors", body });

    if (!item.multi) rememberLocalClaim(item.id);
    return "ok";
  } catch (e) {
    claimed.delete(item.id);
    return "error";
  }
}

// Replaces the "I'll get this" button with a small name/notes form.
// `ctx` = { claimed, say, rerender } — the shared state and callbacks
// owned by main.js, passed down rather than imported as globals.
export function openClaimForm(li, item, triggerButton, ctx){
  triggerButton.hidden = true;

  const form = document.createElement("form");
  form.innerHTML = `
    <input aria-label="Your name" placeholder="Your name" autocomplete="name">
    <textarea aria-label="A note for us (optional)" placeholder="A note for us (optional)"></textarea>
    <button class="solid" type="submit">Confirm</button>
    <button type="button">Cancel</button>`;

  const [nameInput, notesInput, confirmBtn, cancelBtn] = form.elements;

  cancelBtn.onclick = () => {
    form.remove();
    triggerButton.hidden = false;
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Saving";

    const result = await submitClaim(item, nameInput.value.trim(), notesInput.value.trim(), ctx.claimed);

    if (result === "ok"){
      ctx.say(confirmationMessage(item));
    } else if (result === "taken"){
      ctx.say(`Someone just claimed ${item.name}. Please pick another.`);
    } else {
      ctx.say("That did not save. Please try again in a moment.");
      form.remove();
      triggerButton.hidden = false;
      return;
    }
    ctx.rerender();
  };

  li.append(form);
  nameInput.focus();
}