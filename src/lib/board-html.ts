import type { BoardEntryPayload } from "./board-payload";
import { BOARD_METRICS } from "./board-payload";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function scoreBarHtml(entry: BoardEntryPayload): string {
  if (!entry.bar) {
    return `<span class="score-bar-empty" aria-label="Execution drop unmeasured">—</span>`;
  }
  return `<div class="score-bar" role="img" aria-label="${escapeHtml(entry.bar.label)}"><span class="score-bar-track"><span class="score-bar-src" style="width: ${entry.bar.srcPct}%"></span><span class="score-bar-exec" style="width: ${entry.bar.execPct}%"></span></span></div>`;
}

export function rowIdFor(listingId: string, entry: BoardEntryPayload): string {
  return `${listingId}--${entry.fileId}`;
}

export function rowHtml(
  listingId: string,
  entry: BoardEntryPayload,
  rank: number,
): string {
  const rowId = rowIdFor(listingId, entry);
  const detailId = `${rowId}-detail`;
  const radios = BOARD_METRICS.map(
    (metric, i) =>
      `<label class="min-h-11 cursor-pointer border border-socket px-3 py-2 text-sm"><input type="radio" name="m-${escapeHtml(rowId)}" value="${metric}"${i === 0 ? " checked" : ""} /> ${metric}</label>`,
  ).join("");
  const paper = entry.paperUrl
    ? `<p class="mt-3 text-sm"><a class="text-steel underline underline-offset-2" href="${escapeHtml(entry.paperUrl)}">Method paper</a></p>`
    : "";
  return `<tbody id="${escapeHtml(rowId)}" data-entry data-slug="${escapeHtml(entry.slug)}" data-bank="${escapeHtml(entry.bank)}" data-model="${escapeHtml(entry.model)}" data-sr="${escapeHtml(entry.sr)}" data-as="${escapeHtml(entry.as)}" data-asc="${escapeHtml(entry.asc)}">
              <tr class="board-main">
                <td class="col-rank tabular" data-rank>${rank}</td>
                <th scope="row" class="col-method">
                  <button type="button" class="row-toggle" aria-expanded="false" aria-controls="${escapeHtml(detailId)}">${escapeHtml(entry.name)}</button>
                  <div class="method-meta">
                    <span class="model-id">${escapeHtml(entry.modelId)}</span>
                    <span class="sticker">${escapeHtml(entry.label)}</span>
                  </div>
                </th>
                <td class="col-num is-sort-col tabular">
                  <span data-overall="sr">${escapeHtml(entry.srText)}</span>
                  <span data-overall="as" hidden>${escapeHtml(entry.asText)}</span>
                  <span data-overall="asc" hidden>${escapeHtml(entry.ascText)}</span>
                </td>
                <td class="col-num tabular">${escapeHtml(entry.srcText)}</td>
                <td class="col-num col-exec is-exec tabular">${escapeHtml(entry.execText)}</td>
                <td class="col-num col-delta tabular is-${entry.deltaKind}">${escapeHtml(entry.deltaText)}</td>
                <td class="col-bar">${scoreBarHtml(entry)}</td>
              </tr>
              <tr class="board-detail" id="${escapeHtml(detailId)}" inert>
                <td colspan="7">
                  <div class="expand-clip">
                    <div class="expand-inner">
                  <div class="expand-body">
                    <fieldset class="metric-switch">
                      <legend class="text-xs uppercase tracking-wide text-stamp">
                        Metric readout
                      </legend>
                      <div class="mt-2 flex flex-wrap gap-2">
                        ${radios}
                      </div>
                      <div class="metric-plates mt-3"></div>
                    </fieldset>
                    <dl class="mt-4 grid gap-2 text-sm md:grid-cols-2">
                      <div>
                        <dt class="text-stamp">Source</dt>
                        <dd>${escapeHtml(entry.source)}</dd>
                      </div>
                      <div>
                        <dt class="text-stamp">Harness</dt>
                        <dd class="tabular">${escapeHtml(entry.harness)}</dd>
                      </div>
                      <div>
                        <dt class="text-stamp">n websites</dt>
                        <dd class="tabular">${escapeHtml(entry.nWebsites)}</dd>
                      </div>
                      <div>
                        <dt class="text-stamp">skill_calls</dt>
                        <dd class="tabular">${escapeHtml(entry.skillCalls)}</dd>
                      </div>
                    </dl>
                    <p class="sticker is-plate mt-4">${escapeHtml(entry.receipt)}</p>
                    ${paper}
                    <p class="mt-3 text-sm">${escapeHtml(entry.notes)}</p>
                  </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>`;
}
