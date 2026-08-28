import { rowHtml, rowIdFor } from "./board-html";
import {
  bindFaceplates,
  mountFaceplateFromTemplate,
} from "./faceplate-client";
import type {
  BoardEntryPayload,
  BoardPayload,
} from "./board-payload";
import type { Metric } from "./constants";

let payloadCache: BoardPayload | null | undefined;

function getPayload(): BoardPayload | null {
  if (payloadCache !== undefined) return payloadCache;
  const el = document.getElementById("board-data");
  if (!el?.textContent) {
    payloadCache = null;
    return payloadCache;
  }
  try {
    payloadCache = JSON.parse(el.textContent) as BoardPayload;
  } catch {
    payloadCache = null;
  }
  return payloadCache;
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function listingIds(): string[] {
  const data = getPayload();
  if (data) return data.listings.map((listing) => listing.id);
  return [...document.querySelectorAll<HTMLElement>("[data-listing]")].map(
    (el) => el.dataset.listing || "",
  );
}

function currentSection(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-listing]");
}

function findEntry(token: string): BoardEntryPayload | undefined {
  const data = getPayload();
  if (!data) return undefined;
  if (data.entries[token]) return data.entries[token];
  return Object.values(data.entries).find(
    (entry) => entry.fileId === token || entry.slug === token,
  );
}

function listingHasSlug(listingId: string, slug: string): boolean {
  return Boolean(
    getPayload()?.listings.find((listing) => listing.id === listingId)?.slugs.includes(
      slug,
    ),
  );
}

function mountCheckedFaceplate(row: HTMLElement) {
  const data = getPayload();
  if (!data) return;
  const slug = row.dataset.slug;
  const entry = slug ? data.entries[slug] : undefined;
  if (!entry) return;
  const plates = row.querySelector<HTMLElement>(".metric-plates");
  const metric = (row.querySelector<HTMLInputElement>(
    ".metric-switch input:checked",
  )?.value || "SR") as Metric;
  if (!plates) return;
  mountFaceplateFromTemplate(plates, metric, entry.cells[metric]);
  bindFaceplates();
}

function setOpen(row: HTMLElement, open: boolean, instant = false) {
  const btn = row.querySelector<HTMLButtonElement>(".row-toggle");
  const detail = row.querySelector<HTMLElement>(".board-detail");
  if (!btn || !detail) return;
  row.classList.toggle("is-instant", instant);
  btn.setAttribute("aria-expanded", String(open));
  row.classList.toggle("is-open", open);
  if (open) {
    mountCheckedFaceplate(row);
    detail.removeAttribute("inert");
  } else {
    detail.setAttribute("inert", "");
  }
}

function paintListing(listingId: string) {
  const data = getPayload();
  if (!data) return;
  const listing = data.listings.find((item) => item.id === listingId);
  const section = currentSection();
  if (!listing || !section) return;
  if (section.dataset.listing === listingId && section.querySelector("[data-entry]")) {
    return;
  }
  section.id = `listing-${listingId}`;
  section.dataset.listing = listingId;
  const title = section.querySelector("h2");
  const lede = section.querySelector("p");
  if (title) title.textContent = listing.title;
  if (lede) lede.textContent = listing.lede;
  const table = section.querySelector("table.board-table");
  if (!table) return;
  table.querySelectorAll("tbody").forEach((row) => row.remove());
  const markup = listing.slugs
    .map((slug, i) => {
      const entry = data.entries[slug];
      return entry ? rowHtml(listingId, entry, i + 1) : "";
    })
    .join("");
  table.insertAdjacentHTML("beforeend", markup);
}

function resolveHash(
  hash: string,
): { listingId: string; entry: BoardEntryPayload } | null {
  const data = getPayload();
  if (!data || !hash) return null;
  const ids = [...listingIds()].sort((a, b) => b.length - a.length);
  for (const id of ids) {
    const prefix = `${id}--`;
    if (!hash.startsWith(prefix)) continue;
    const rest = hash.slice(prefix.length);
    const entry = findEntry(rest);
    if (entry && listingHasSlug(id, entry.slug)) {
      return { listingId: id, entry };
    }
  }
  const entry = findEntry(hash);
  if (!entry) return null;
  const current = currentSection()?.dataset.listing || "";
  const listingId =
    (listingHasSlug(current, entry.slug) && current) ||
    data.listings.find((listing) => listing.slugs.includes(entry.slug))?.id;
  if (!listingId) return null;
  return { listingId, entry };
}

function openFromHash() {
  const hash = location.hash.slice(1);
  if (!hash) return;
  const decoded = decodeURIComponent(hash);
  let target = document.getElementById(decoded);
  if (!target?.hasAttribute("data-entry")) {
    const resolved = resolveHash(decoded);
    if (resolved) {
      paintListing(resolved.listingId);
      const url = new URL(location.href);
      if (url.searchParams.get("model") !== resolved.listingId) {
        url.searchParams.set("model", resolved.listingId);
        url.searchParams.delete("bank");
        history.replaceState(null, "", url);
      }
      applyBoard({ flip: false });
      target =
        document.getElementById(rowIdFor(resolved.listingId, resolved.entry)) ||
        document.querySelector(
          `[data-entry][data-slug="${CSS.escape(resolved.entry.slug)}"]`,
        );
    }
  }
  if (!target?.hasAttribute("data-entry")) {
    target = document.querySelector(
      `[data-entry][data-slug="${CSS.escape(decoded)}"]`,
    );
  }
  if (!target?.hasAttribute("data-entry")) return;
  setOpen(target, true, true);
  target.scrollIntoView({ block: "start" });
}

function num(el: Element, key: string): number | null {
  const raw = (el as HTMLElement).dataset[key];
  if (raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseBoardState() {
  const params = new URLSearchParams(location.search);
  const ignored = document.getElementById("sfr-ignored");
  let sort = (params.get("sort") || "sr").toLowerCase();
  if (sort === "sfr") {
    ignored?.removeAttribute("hidden");
    sort = "sr";
  } else {
    ignored?.setAttribute("hidden", "");
  }
  if (!["sr", "as", "asc"].includes(sort)) sort = "sr";
  const dir = params.get("dir") === "asc" ? "asc" : "desc";
  const ids = listingIds();
  let model = params.get("model") || "";
  const legacyBank = params.get("bank") || "";
  if (!model) {
    if (legacyBank === "mini") model = "gpt-5-mini";
    else model = "per-model";
  }
  if (!ids.includes(model)) model = ids[0] || "per-model";
  return { sort, dir, model };
}

function sortHost(host: Element, sort: string, dir: string) {
  const rows = [...host.querySelectorAll("[data-entry]")];
  rows.sort((a, b) => {
    const av = num(a, sort);
    const bv = num(b, sort);
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    return dir === "desc" ? bv - av : av - bv;
  });
  rows.forEach((row, i) => {
    host.append(row);
    const rank = row.querySelector("[data-rank]");
    if (rank) rank.textContent = String(i + 1);
  });
}

function flipSort(host: Element, sort: string, dir: string) {
  const rows = [...host.querySelectorAll<HTMLElement>("[data-entry]")];
  if (reducedMotion() || rows.length === 0) {
    sortHost(host, sort, dir);
    return;
  }
  const tops = new Map(rows.map((row) => [row, row.getBoundingClientRect().top]));
  sortHost(host, sort, dir);
  rows.forEach((row) => {
    const from = tops.get(row);
    if (from === undefined) return;
    const dy = from - row.getBoundingClientRect().top;
    if (Math.abs(dy) < 0.5) return;
    row.classList.add("is-flip");
    row.style.transition = "none";
    row.style.transform = `translateY(${dy}px)`;
    void row.offsetWidth;
    row.style.transition = "";
    row.style.transform = "";
    const done = (event: TransitionEvent) => {
      if (event.propertyName !== "transform") return;
      row.classList.remove("is-flip");
      row.removeEventListener("transitionend", done);
    };
    row.addEventListener("transitionend", done);
  });
}

function replayScoreBars(scope: ParentNode) {
  scope.querySelectorAll(".score-bar").forEach((bar) => {
    bar.classList.remove("is-in");
  });
  document.dispatchEvent(new Event("ssb:reveal-bars"));
}

function applyBoard(opts: { flip: boolean }) {
  const { sort, dir, model } = parseBoardState();
  paintListing(model);

  document.querySelectorAll(".board-table").forEach((host) => {
    if (opts.flip) flipSort(host, sort, dir);
    else sortHost(host, sort, dir);
  });

  document.querySelectorAll<HTMLElement>("[data-overall]").forEach((el) => {
    el.hidden = el.dataset.overall !== sort;
  });
  document.querySelectorAll("[data-overall-head]").forEach((el) => {
    el.textContent = sort.toUpperCase();
    el.setAttribute("aria-sort", dir === "asc" ? "ascending" : "descending");
  });

  document.querySelectorAll<HTMLAnchorElement>("[data-q]").forEach((a) => {
    const [k, v] = (a.dataset.q || "=").split("=");
    a.classList.remove("is-active");
    a.removeAttribute("aria-current");
    if (k === "sort" && v === sort) {
      a.classList.add("is-active");
      a.setAttribute("aria-current", "true");
    }
    if (k === "model" && v === model) {
      a.classList.add("is-active");
      a.setAttribute("aria-current", "true");
    }
  });

  const visibleListing = currentSection();
  if (visibleListing) {
    bindFaceplates();
    replayScoreBars(visibleListing);
  }
}

export function initBoard() {
  const board = document.getElementById("board");
  if (!board) return;

  if (!board.dataset.bound) {
    board.dataset.bound = "1";

    board.addEventListener("click", (event) => {
      const btn = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>(
        ".row-toggle",
      );
      if (!btn || !board.contains(btn)) return;
      const row = btn.closest<HTMLElement>("[data-entry]");
      if (!row) return;
      const open = btn.getAttribute("aria-expanded") !== "true";
      setOpen(row, open);
    });

    board.addEventListener(
      "change",
      (event) => {
        const input = event.target as HTMLInputElement | null;
        if (!input || input.type !== "radio" || !input.closest(".metric-switch")) {
          return;
        }
        const row = input.closest<HTMLElement>("[data-entry]");
        if (row) mountCheckedFaceplate(row);
      },
      true,
    );

    document.querySelectorAll<HTMLAnchorElement>("[data-q]").forEach((a) => {
      a.addEventListener("click", (event) => {
        event.preventDefault();
        const [k, v] = (a.dataset.q || "=").split("=");
        if (k === "sort" && v === "sfr") return;
        const url = new URL(location.href);
        url.searchParams.set(k, v);
        if (k === "model") url.searchParams.delete("bank");
        history.replaceState(null, "", url);
        applyBoard({ flip: k === "sort" });
      });
    });
  }

  applyBoard({ flip: false });
  openFromHash();

  const w = window as Window & { __ssbBoardHash?: boolean };
  if (!w.__ssbBoardHash) {
    w.__ssbBoardHash = true;
    window.addEventListener("hashchange", openFromHash);
  }
}
