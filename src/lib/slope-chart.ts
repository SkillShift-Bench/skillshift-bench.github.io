import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { SlopeChartPayload } from "./slope";

echarts.use([
  LineChart,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  CanvasRenderer,
]);

const LINE_COLORS = ["#80FFA5", "#00DDFF", "#37A2FF", "#FF0087", "#FFBF00"];

const AREA_STOPS: Array<[string, string]> = [
  ["rgb(128, 255, 165)", "rgb(1, 191, 236)"],
  ["rgb(0, 221, 255)", "rgb(77, 119, 255)"],
  ["rgb(55, 162, 255)", "rgb(116, 21, 219)"],
  ["rgb(255, 0, 135)", "rgb(135, 0, 157)"],
  ["rgb(255, 191, 0)", "rgb(224, 62, 76)"],
];

function token(name: string, fallback: string): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return raw || fallback;
}

function theme() {
  return {
    ink: token("--ink", "#111111"),
    stamp: token("--stamp", "#3d2a80"),
    oxide: token("--oxide", "#e23a1a"),
    plate: token("--plate", "#f7f1e3"),
    socket: token("--socket", "#111111"),
  };
}

function fillFor(index: number) {
  const [from, to] = AREA_STOPS[index % AREA_STOPS.length];
  return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: from },
    { offset: 1, color: to },
  ]);
}

function execBands(index: number) {
  if (index !== 0) return undefined;
  return {
    silent: true,
    itemStyle: { color: "rgba(226, 58, 26, 0.10)" },
    data: [
      [{ xAxis: "src-exec" }, { xAxis: "src-exec" }],
      [{ xAxis: "tgt-exec" }, { xAxis: "tgt-exec" }],
    ],
  };
}

function yMax(payload: SlopeChartPayload) {
  const vals = payload.series.flatMap((s) =>
    s.data.filter((v): v is number => v != null),
  );
  const peak = vals.length ? Math.max(...vals) : 60;
  return Math.max(10, Math.ceil(peak / 10) * 10);
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function optionFor(
  payload: SlopeChartPayload,
  opts: { reveal: boolean; animate: boolean },
) {
  const t = theme();
  const reduced = prefersReducedMotion();
  const play = opts.animate && opts.reveal && !reduced;

  return {
    color: LINE_COLORS,
    backgroundColor: "transparent",
    animation: play,
    animationDuration: play ? 720 : 0,
    animationDurationUpdate: 0,
    animationEasing: "cubicOut" as const,
    textStyle: {
      color: t.ink,
      fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif",
    },
    title: {
      text: payload.title,
      left: 8,
      top: 4,
      textStyle: {
        fontSize: 14,
        fontWeight: 600,
        color: t.ink,
      },
    },
    tooltip: {
      trigger: "axis" as const,
      axisPointer: {
        type: "cross" as const,
        label: { backgroundColor: t.stamp },
      },
      valueFormatter: (v: unknown) =>
        typeof v === "number" ? `${v.toFixed(2)}%` : "Unmeasured",
    },
    legend: {
      data: payload.series.map((s) => s.name),
      top: 28,
      textStyle: { color: t.ink, fontSize: 12 },
    },
    toolbox: {
      feature: {
        saveAsImage: {
          name: payload.filename,
          backgroundColor: t.plate,
        },
      },
      iconStyle: { borderColor: t.ink },
    },
    grid: { left: 48, right: 24, top: 72, bottom: 40 },
    xAxis: [
      {
        type: "category" as const,
        boundaryGap: false,
        data: payload.conditions,
        axisLine: { lineStyle: { color: t.ink, width: 2 } },
        axisTick: { lineStyle: { color: t.ink } },
        axisLabel: {
          fontFamily: "IBM Plex Mono, ui-monospace, monospace",
          fontSize: 11,
          color: (value: string) =>
            String(value).endsWith("-exec") ? t.oxide : t.stamp,
        },
        splitLine: { show: false },
      },
    ],
    yAxis: [
      {
        type: "value" as const,
        name: "SR (%)",
        nameTextStyle: {
          color: t.stamp,
          fontFamily: "IBM Plex Mono, ui-monospace, monospace",
        },
        min: 0,
        max: yMax(payload),
        axisLine: { show: true, lineStyle: { color: t.ink, width: 2 } },
        axisLabel: {
          color: t.stamp,
          fontFamily: "IBM Plex Mono, ui-monospace, monospace",
        },
        splitLine: {
          lineStyle: { color: t.socket, opacity: 0.18, type: "dashed" as const },
        },
      },
    ],
    series: payload.series.map((s, i) => {
      const data = opts.reveal
        ? s.data.map((v) => (v === null ? null : Number(v.toFixed(2))))
        : [];
      return {
        name: s.name,
        type: "line" as const,
        smooth: !reduced,
        symbol: "circle",
        showSymbol: false,
        animationDelay: play ? i * 90 : 0,
        lineStyle: {
          width: 2.5,
          color: LINE_COLORS[i % LINE_COLORS.length],
        },
        areaStyle: {
          opacity: 0.45,
          color: fillFor(i),
        },
        emphasis: { focus: "series" as const },
        markArea: execBands(i),
        data,
      };
    }),
  };
}

type LiveChart = {
  el: HTMLElement;
  chart: ReturnType<typeof echarts.init>;
  ro: ResizeObserver;
  mo: MutationObserver;
  io: IntersectionObserver | null;
};

const liveCharts: LiveChart[] = [];

function disposeLiveCharts() {
  for (const item of liveCharts) {
    item.ro.disconnect();
    item.mo.disconnect();
    item.io?.disconnect();
    if (!item.chart.isDisposed()) item.chart.dispose();
    delete item.el.dataset.chartBound;
  }
  liveCharts.length = 0;
}

function bind(el: HTMLElement) {
  if (el.dataset.chartBound) return;
  el.dataset.chartBound = "1";
  const raw = el.dataset.slopeChart;
  if (!raw) return;
  const payload = JSON.parse(raw) as SlopeChartPayload;
  echarts.getInstanceByDom(el)?.dispose();
  const chart = echarts.init(el, undefined, { renderer: "canvas" });
  let revealed = false;

  const paint = (animate: boolean) => {
    if (chart.isDisposed()) return;
    chart.setOption(optionFor(payload, { reveal: revealed, animate }), true);
  };

  const reveal = () => {
    if (revealed) return;
    revealed = true;
    if (!chart.isDisposed()) chart.clear();
    paint(true);
  };

  let io: IntersectionObserver | null = null;
  const rect = el.getBoundingClientRect();
  const nearView =
    rect.top < window.innerHeight + 480 && rect.bottom > -80;

  if (prefersReducedMotion() || !("IntersectionObserver" in window) || nearView) {
    revealed = true;
    paint(!prefersReducedMotion() && nearView);
  } else {
    paint(false);
    io = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal();
          obs.unobserve(entry.target);
        }
      },
      { threshold: 0.01, rootMargin: "320px 0px 0px 0px" },
    );
    io.observe(el);
  }

  const ro = new ResizeObserver(() => {
    if (chart.isDisposed()) return;
    chart.resize();
  });
  ro.observe(el);

  const mo = new MutationObserver(() => paint(false));
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  liveCharts.push({ el, chart, ro, mo, io });
}

export function mountSlopeCharts() {
  disposeLiveCharts();
  document.querySelectorAll<HTMLElement>("[data-slope-chart]").forEach(bind);
}
