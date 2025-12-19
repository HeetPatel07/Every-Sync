let lastSeen = 0;
let filters = [];                 // array of strings
const groups = new Map();         // category -> { unread, logs, open }

const input = document.getElementById("filterInput");
const filtersDiv = document.getElementById("filters");
const groupsDiv = document.getElementById("groups");
const clearAllBtn = document.getElementById("clearAll");

const toast = document.getElementById("toast");
const toastText = document.getElementById("toastText");

const POLL_MS = 3000;

/* ---------- Filters ---------- */

input.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const v = input.value.trim();
  if (!v) return;
  addFilter(v);
  input.value = "";
});

clearAllBtn.addEventListener("click", () => {
  filters = [];
  renderFilters();
});

function addFilter(text) {
  if (filters.includes(text)) return;
  filters.push(text);
  renderFilters();
}

function removeFilter(text) {
  filters = filters.filter(f => f !== text);
  renderFilters();
}

function renderFilters() {
  filtersDiv.innerHTML = "";
  if (filters.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No watch filters. Add one to enable notifications.";
    filtersDiv.appendChild(empty);
    return;
  }

  filters.forEach(f => {
    const tag = document.createElement("button");
    tag.className = "tag";
    tag.innerHTML = `<span>${escapeHtml(f)}</span><span class="x">×</span>`;
    tag.onclick = () => removeFilter(f);
    filtersDiv.appendChild(tag);
  });
}

function matches(category) {
  if (filters.length === 0) return false; // IMPORTANT: no filters => no notifications
  const c = category.toLowerCase();
  return filters.some(f => c.includes(f.toLowerCase()));
}

/* ---------- Toast ---------- */

let toastTimer = null;

function showToast(category) {
  toastText.textContent = category;
  toast.classList.remove("hidden");

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 2000);
}

/* ---------- Polling ---------- */

async function poll() {
  const res = await fetch(`/api/logs?since=${lastSeen}`);
  const logs = await res.json();

  // Defensive: if backend returns an error object
  if (!Array.isArray(logs)) return;

  let notifiedCategory = null;

  for (const log of logs) {
    lastSeen = log.id;

    const category = log.category || "UNIDENTIFIED";
    const message = log.message || "";
    const created = log.created_at || "";

    if (!groups.has(category)) {
      groups.set(category, { unread: 0, logs: [], open: false });
    }

    const g = groups.get(category);
    g.logs.push({ id: log.id, message, created_at: created });

    // Only count unread + notify when it matches AND group isn't open
    if (matches(category) && !g.open) {
      g.unread += 1;
      notifiedCategory = category;
    }
  }

  renderGroups();

  if (notifiedCategory) {
    showToast(notifiedCategory);
  }
}

setInterval(poll, POLL_MS);
poll(); // initial load

/* ---------- Groups UI ---------- */

function renderGroups() {
  groupsDiv.innerHTML = "";

  if (groups.size === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No logs yet. Run your bash script to emit simulated logs.";
    groupsDiv.appendChild(empty);
    return;
  }

  // Sort categories alphabetically
  const cats = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b));

  for (const cat of cats) {
    const g = groups.get(cat);

    const card = document.createElement("div");
    card.className = "group";

    const head = document.createElement("button");
    head.className = "groupHead";
    head.innerHTML = `
      <div class="left">
        <div class="cat">${escapeHtml(cat)}</div>
        <div class="meta">${g.logs.length} total</div>
      </div>
      <div class="right">
        ${g.unread > 0 ? `<span class="badge">${g.unread}</span>` : ``}
        <span class="chev">${g.open ? "▾" : "▸"}</span>
      </div>
    `;

    const body = document.createElement("div");
    body.className = "groupBody" + (g.open ? "" : " hidden");

    // newest first inside group
    const last = g.logs.slice(-50).reverse();
    for (const item of last) {
      const row = document.createElement("div");
      row.className = "row";

      row.innerHTML = `
        <div class="time">${escapeHtml(item.created_at)}</div>
        <pre class="msg">${escapeHtml(item.message)}</pre>
      `;
      body.appendChild(row);
    }

    head.onclick = () => {
      g.open = !g.open;
      if (g.open) g.unread = 0;
      renderGroups();
    };

    card.appendChild(head);
    card.appendChild(body);
    groupsDiv.appendChild(card);
  }
}

/* ---------- Utils ---------- */

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
