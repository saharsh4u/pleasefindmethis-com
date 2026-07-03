const DATA_URL = "./data/agents.json";
const ACQUISITION_URL = "./data/poster-acquisition.json";
const refreshMs = 5000;

const state = {
  acquisition: null,
  data: null,
};

const $ = (selector) => document.querySelector(selector);

function statusClass(status) {
  const normalized = String(status).toLowerCase();
  if (normalized.includes("run")) return "running";
  if (normalized.includes("block")) return "blocked";
  return "";
}

function formatTime() {
  const date = new Date();
  return `Checked ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
}

function renderMetrics(data) {
  const agents = data.agents ?? [];
  const complete = agents.filter((agent) => agent.status.toLowerCase() === "complete").length;
  $("#metric-agents").textContent = String(agents.length);
  $("#metric-complete").textContent = String(complete);
  $("#metric-posting").textContent = String(data.summary?.postingWithoutApproval ?? 0);
  $("#metric-blockers").textContent = String(data.blockers?.length ?? 0);
  $("#last-updated").textContent = formatTime();
}

function renderAgents(data) {
  const rows = $("#agent-rows");
  rows.innerHTML = "";

  for (const agent of data.agents ?? []) {
    const row = document.createElement("div");
    row.className = "agent-card";

    const initials = agent.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    row.innerHTML = `
      <span class="agent-name">
        <span class="avatar" aria-hidden="true">${initials}</span>
        <span>
          <span class="agent-title">${agent.name}</span>
          <span class="agent-id">${agent.shortId}</span>
        </span>
      </span>
      <span class="status-pill ${statusClass(agent.status)}">${agent.status}</span>
      <span class="now-text"><span><strong>${agent.focus}</strong> - ${agent.now}</span></span>
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

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Updated just now";
  return `Updated ${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function renderAcquisition(data) {
  const summary = data.summary ?? {};
  $("#acq-goal").textContent = String(data.goal ?? 100);
  $("#acq-acquired").textContent = String(summary.acquired ?? 0);
  $("#acq-direct").textContent = String(summary.directTargets ?? 0);
  $("#acq-approval").textContent = String(summary.approvalRequired ?? 0);
  $("#acquisition-updated").textContent = formatDateTime(data.updatedAt);

  const targets = $("#acquisition-targets");
  targets.innerHTML = "";
  for (const target of data.topTargets ?? []) {
    const item = document.createElement("article");
    item.className = `target-card ${target.priority}`;
    item.innerHTML = `
      <div class="target-card-top">
        <strong>${target.id} - ${target.segment}</strong>
        <span>${target.priority}</span>
      </div>
      <p>${target.signal}</p>
      <small>${target.surface} - ${target.status}</small>
      <a href="${target.url}" target="_blank" rel="noreferrer">Open source</a>
      <em>${target.nextAction}</em>
    `;
    targets.appendChild(item);
  }

  const approvals = $("#acquisition-approvals");
  approvals.innerHTML = "";
  for (const action of data.approvalQueue ?? []) {
    const item = document.createElement("li");
    item.textContent = action;
    approvals.appendChild(item);
  }
}

function render(data) {
  renderMetrics(data);
  renderAgents(data);
  renderBlockers(data);
  renderNextActions(data);
  renderOutputs(data);
}

async function loadAcquisitionData() {
  try {
    const response = await fetch(`${ACQUISITION_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.acquisition = await response.json();
    renderAcquisition(state.acquisition);
  } catch (error) {
    $("#acquisition-updated").textContent = "Acquisition data unavailable";
    console.error(error);
  }
}

async function loadData() {
  try {
    const response = await fetch(`${DATA_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.data = await response.json();
    render(state.data);
    await loadAcquisitionData();
  } catch (error) {
    $("#last-updated").textContent = "Data file unavailable";
    console.error(error);
  }
}

$("#refresh-button").addEventListener("click", loadData);

loadData();
window.setInterval(loadData, refreshMs);
