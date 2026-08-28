import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

function classList(node) {
  const raw = node.properties?.className;
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") return raw.split(/\s+/).filter(Boolean);
  return [];
}

function el(tagName, properties, children = []) {
  return { type: "element", tagName, properties, children };
}

function text(value) {
  return { type: "text", value };
}

function languageOf(pre) {
  const data = pre.properties?.dataLanguage;
  let lang = data ? String(data) : "";
  if (!lang) {
    const code = pre.children?.find((child) => child.tagName === "code");
    const hit = classList(code || {}).find((name) => name.startsWith("language-"));
    lang = hit ? hit.slice("language-".length) : "";
  }
  if (!lang || lang === "plaintext" || lang === "text" || lang === "txt") {
    return "code";
  }
  return lang;
}

function wrapPre(pre) {
  const lang = languageOf(pre);
  return el("figure", { className: ["code-window"] }, [
    el("header", { className: ["code-titlebar"] }, [
      el("span", { className: ["os-lights"], ariaHidden: "true" }, [
        el("i", { className: ["is-stop"] }),
        el("i", { className: ["is-wait"] }),
        el("i", { className: ["is-go"] }),
      ]),
      el("span", { className: ["code-file"] }, [text(lang)]),
      el(
        "button",
        {
          type: "button",
          className: ["code-copy"],
          ariaLabel: "Copy code",
        },
        [text("Copy")],
      ),
    ]),
    pre,
  ]);
}

function rehypeCodeWindow() {
  return (tree) => {
    const visit = (node) => {
      const kids = node.children;
      if (!Array.isArray(kids)) return;
      const parentIsWindow = classList(node).includes("code-window");
      for (const child of kids) visit(child);
      if (parentIsWindow) return;
      for (let i = 0; i < kids.length; i++) {
        const child = kids[i];
        if (child?.type === "element" && child.tagName === "pre") {
          kids[i] = wrapPre(child);
        }
      }
    };
    visit(tree);
  };
}

export default defineConfig({
  site: "https://skillshift-bench.github.io",
  base: "/",
  output: "static",
  trailingSlash: "never",
  devToolbar: {
    enabled: false,
  },
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: "min-light",
        dark: "min-dark",
      },
    },
    rehypePlugins: [rehypeCodeWindow],
  },
});
