import {
  SLOT_IDS,
  WEBSITES,
  type Cell,
  type Metric,
} from "./constants";

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function parseOverall(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed || trimmed === "—" || trimmed === "--" || trimmed === "–") {
    return null;
  }
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function visibleFaceplate(host: Element): HTMLElement | null {
  if (host.classList.contains("series-switch")) {
    const series = host.querySelector<HTMLInputElement>("input:checked")
      ?.dataset.series;
    if (!series) return null;
    return host.querySelector(
      `[data-series="${CSS.escape(series)}"] .faceplate`,
    );
  }
  const metric = host.querySelector<HTMLInputElement>("input:checked")?.value;
  if (!metric) return null;
  return host.querySelector(
    `[data-metric="${CSS.escape(metric)}"] .faceplate`,
  );
}

function overallEl(faceplate: HTMLElement) {
  return faceplate.querySelector<HTMLElement>(".overall-value:not(.is-blank)");
}

function rememberOverall(host: Element) {
  const faceplate = visibleFaceplate(host);
  if (!faceplate) return;
  const value = overallEl(faceplate);
  const n = value ? parseOverall(value.textContent || "") : null;
  if (n === null) host.removeAttribute("data-prev-overall");
  else host.setAttribute("data-prev-overall", String(n));
}

function countUp(el: HTMLElement, from: number, to: number) {
  if (reducedMotion() || from === to) {
    el.textContent = to.toFixed(2);
    return;
  }
  el.textContent = from.toFixed(2);
  const start = performance.now();
  const duration = 250;
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - t) * (1 - t);
    el.textContent = (from + (to - from) * eased).toFixed(2);
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function insertSockets(faceplate: HTMLElement) {
  const sockets = [...faceplate.querySelectorAll<HTMLElement>(".socket")];
  sockets.forEach((socket, i) => {
    socket.style.setProperty("--sock-i", String(i));
  });
  faceplate.classList.remove("is-insert");
  void faceplate.offsetWidth;
  if (reducedMotion()) return;
  faceplate.classList.add("is-insert");
  const done = 250 + sockets.length * 40 + 40;
  window.setTimeout(() => faceplate.classList.remove("is-insert"), done);
}

function onSwitchChange(host: Element) {
  (host as HTMLElement).classList.add("is-fp-swap");
  const faceplate = visibleFaceplate(host);
  if (!faceplate) return;
  const overall = overallEl(faceplate);
  const to = overall ? parseOverall(overall.textContent || "") : null;
  const prevRaw = host.getAttribute("data-prev-overall");
  const from = prevRaw === null ? null : Number(prevRaw);
  if (overall && to !== null && from !== null && Number.isFinite(from)) {
    countUp(overall, from, to);
  }
  insertSockets(faceplate);
  if (to !== null) host.setAttribute("data-prev-overall", String(to));
  else rememberOverall(host);
}

export function bindFaceplates() {
  document.querySelectorAll(".series-switch, .metric-switch").forEach((host) => {
    const el = host as HTMLElement;
    if (el.dataset.fpBound) return;
    el.dataset.fpBound = "1";
    rememberOverall(el);
    el.addEventListener("change", () => onSwitchChange(el));
  });
}

function applyFlag(el: HTMLElement, cell: Cell) {
  let flag = el.querySelector(".slot-flag");
  if (cell.kind === "sfr-unverified") {
    if (!flag) {
      flag = document.createElement("span");
      flag.className = "slot-flag";
      flag.textContent = "⚠︎ n unverified";
      el.append(flag);
    }
  } else {
    flag?.remove();
  }
}

function applyValue(el: HTMLElement, cell: Cell, overall: boolean) {
  if (overall) {
    const val = el.querySelector(".overall-value");
    if (!val) return;
    if (cell.kind === "unmeasured") {
      val.classList.add("is-blank");
      val.setAttribute("aria-hidden", "true");
      val.textContent = "—";
    } else {
      val.classList.remove("is-blank");
      val.removeAttribute("aria-hidden");
      val.textContent = cell.text;
    }
    return;
  }
  const val = el.querySelector(".slot-value");
  if (!val) return;
  if (cell.kind === "unmeasured") {
    val.classList.add("empty");
    val.setAttribute("aria-hidden", "true");
    val.textContent = "";
  } else {
    val.classList.remove("empty");
    val.removeAttribute("aria-hidden");
    val.classList.add("tabular");
    val.textContent = cell.text;
  }
}

export function applyFaceplate(
  root: HTMLElement,
  cells: Cell[],
  metric: Metric,
) {
  const kicker = root.querySelector(".overall-kicker");
  if (kicker) kicker.textContent = `Overall ${metric}`;

  SLOT_IDS.forEach((slot, i) => {
    const cell = cells[i];
    if (!cell) return;
    const el = root.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
    if (!el) return;
    el.classList.toggle("is-empty", cell.kind === "unmeasured");
    el.classList.toggle("is-na", cell.kind === "na");
    el.classList.toggle("is-warn", cell.kind === "sfr-unverified");
    el.setAttribute("aria-label", cell.a11y);
    applyValue(el, cell, slot === "overall");
    applyFlag(el, cell);
  });

  const siteUnmeasured = WEBSITES.every((id) => {
    const i = SLOT_IDS.indexOf(id);
    return cells[i]?.kind === "unmeasured";
  });
  root.querySelector(".faceplate-top")?.classList.toggle("is-bare", siteUnmeasured);
  const empty = root.querySelector<HTMLElement>(".sites-empty");
  const row = root.querySelector<HTMLElement>(".site-row");
  if (empty) empty.hidden = !siteUnmeasured;
  if (row) row.hidden = siteUnmeasured;
}

export function mountFaceplateFromTemplate(
  plates: HTMLElement,
  metric: Metric,
  cells: Cell[],
): HTMLElement | null {
  let panel = plates.querySelector<HTMLElement>(
    `[data-metric="${CSS.escape(metric)}"]`,
  );
  if (panel?.querySelector(".faceplate")) return panel;

  const tpl = document.getElementById(
    "faceplate-template",
  ) as HTMLTemplateElement | null;
  const source = tpl?.content.querySelector<HTMLElement>(".faceplate");
  if (!source) return null;

  if (!panel) {
    panel = document.createElement("div");
    panel.setAttribute("data-metric", metric);
    plates.append(panel);
  }
  const node = source.cloneNode(true) as HTMLElement;
  applyFaceplate(node, cells, metric);
  panel.replaceChildren(node);
  return panel;
}
