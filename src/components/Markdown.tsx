import { Fragment } from "react";

// Minimal, safe markdown renderer for AI reports (headings, bold, lists).
function renderInline(text: string, keyPrefix: string) {
  // split on **bold**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={`${keyPrefix}-${i}`} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>;
    }
    return <Fragment key={`${keyPrefix}-${i}`}>{p}</Fragment>;
  });
}

export function Markdown({ content, className }: { content: string; className?: string }) {
  const lines = (content || "").split("\n");
  const blocks: JSX.Element[] = [];
  let list: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = (key: string) => {
    if (!list.length) return;
    const items = list.map((li, i) => (
      <li key={`${key}-li-${i}`} className="leading-relaxed">{renderInline(li, `${key}-li-${i}`)}</li>
    ));
    blocks.push(
      listType === "ol" ? (
        <ol key={key} className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground my-2">{items}</ol>
      ) : (
        <ul key={key} className="list-disc pl-5 space-y-1 text-sm text-muted-foreground my-2">{items}</ul>
      ),
    );
    list = [];
    listType = null;
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    const key = `b-${idx}`;
    if (!line.trim()) { flushList(key); return; }

    if (/^###\s+/.test(line)) { flushList(key); blocks.push(<h4 key={key} className="text-sm font-bold mt-3 mb-1">{renderInline(line.replace(/^###\s+/, ""), key)}</h4>); return; }
    if (/^##\s+/.test(line)) { flushList(key); blocks.push(<h3 key={key} className="text-base font-bold mt-4 mb-1.5">{renderInline(line.replace(/^##\s+/, ""), key)}</h3>); return; }
    if (/^#\s+/.test(line)) { flushList(key); blocks.push(<h2 key={key} className="text-lg font-extrabold mt-4 mb-2">{renderInline(line.replace(/^#\s+/, ""), key)}</h2>); return; }

    const ol = line.match(/^\s*\d+[.)]\s+(.*)/);
    if (ol) { if (listType === "ul") flushList(key); listType = "ol"; list.push(ol[1]); return; }
    const ul = line.match(/^\s*[-*•]\s+(.*)/);
    if (ul) { if (listType === "ol") flushList(key); listType = "ul"; list.push(ul[1]); return; }

    flushList(key);
    blocks.push(<p key={key} className="text-sm text-muted-foreground leading-relaxed my-1.5">{renderInline(line, key)}</p>);
  });
  flushList("b-final");

  return <div className={className}>{blocks}</div>;
}
