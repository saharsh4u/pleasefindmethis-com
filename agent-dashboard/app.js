const DATA_URL = "./data/agents.json";
const refreshMs = 5000;

const state = {
  data: null,
};

const $ = (selector) => document.querySelector(selector);

function statusClass(status) {
  const normalized = String(status).toLowerCase();
  if (normalized.includes("run")) return "running";
  if (normalized.includes("block")) return "blocked";
  return "";
}

function formatTime(value) {
  if (!value) return "Not loaded yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `Updated ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
}

function renderMetrics(data) {
  const agents = data.agents ?? [];
  const complete = agents.filter((agent) => agent.status.toLowerCase() === "complete").length;
  $("#metric-agents").textContent = String(agents.length);
  $("#metric-complete").textContent = String(complete);
  $("#metric-posting").textContent = String(data.summary?.postingWithoutApproval ?? 0);
  $("#metric-blockers").textContent = String(data.blockers?.length ?? 0);
  $("#last-updated").textContent = formatTime(data.updatedAt);
}

function renderAgents(data) {
  const rows = $("#agent-rows");
  rows.innerHTML = "";

  for (const agent of data.agents ?? []) {
    const row = document.createElement("div");
    row.className = "table-row";
    row.setAttribute("role", "row");

    const initials = agent.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    row.innerHTML = `
      <span class="agent-name" role="cell">
        <span class="avatar" aria-hidden="true">${initials}</span>
        <span>
          <span class="agent-title">${agent.name}</span>
          <span class="agent-id">${agent.shortId}</span>
        </span>
      </span>
      <span class="focus-text" role="cell">${agent.focus}</span>
      <span class="now-text" role="cell">
        <span>${agent.now}</span>
        <span class="progress-track" aria-label="${agent.progress}% complete">
          <span class="progress-fill" style="width: ${agent.progress}%"></span>
        </span>
      </span>
      <span role="cell"><span class="status-pill ${statusClass(agent.status)}">${agent.status}</span></span>
    `;
    rows.appendChild(row);
  }
}

function renderBlockers(data) {
  const list = $("#blocker-list");
  list.innerHTML = "";

  for (const blocker of data.blockers ?? []) {
    const item = document.createElement("article");
    item.className = `blocker-item ${blocker.level}`;
    item.innerHTML = `
      <strong>${blocker.title}</strong>
      <p>${blocker.detail}</p>
    `;
    list.appendChild(item);
  }
}

function renderNextActions(data) {
  const list = $("#next-actions");
  list.innerHTML = "";

  for (const action of data.nextActions ?? []) {
    const item = document.createElement("li");
    item.textContent = action;
    list.appendChild(item);
  }
}

function renderOutputs(data) {
  const list = $("#outputs-list");
  list.innerHTML = "";

  for (const output of data.outputs ?? []) {
    const item = document.createElement("article");
    item.className = "output-item";
    item.innerHTML = `
      <strong>${output.title}</strong>
      <p>${output.detail}</p>
      <a class="output-link" href="${output.path}" target="_blank" rel="noreferrer">Open file</a>
    `;
    list.appendChild(item);
  }
}

function render(data) {
  renderMetrics(data);
  renderAgents(data);
  renderBlockers(data);
  renderNextActions(data);
  renderOutputs(data);
}

async function loadData() {
  try {
    const response = await fetch(`${DATA_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.data = await response.json();
    render(state.data);
  } catch (error) {
    $("#last-updated").textContent = "Data file unavailable";
    console.error(error);
  }
}

$("#refresh-button").addEventListener("click", loadData);

loadData();
window.setInterval(loadData, refreshMs);
