"use client";

import React, { useMemo } from "react";

export type WdicAction = {
  street: string;
  lineNo: number;
  actor?: string;
  verb: string;
  amount?: number | null;
  raw: string;
};

type Props = {
  actions: WdicAction[];
  heroName?: string; // default: "Hero"
  defaultExpandRaw?: boolean; // default: false
  actorAliasMap?: Record<string, string>;

};

const STREET_ORDER = ["PREFLOP", "FLOP", "TURN", "RIVER", "SHOWDOWN", "SUMMARY", "UNKNOWN"];

const IMPORTANT_VERBS = new Set(["calls", "raises", "bets", "all-in", "allin"]);
const DIM_VERBS = new Set(["checks", "posts"]);

function norm(s?: string) {
  return (s ?? "").trim().toLowerCase();
}

function prettyVerb(verb: string) {
  const v = norm(verb);
  if (v === "allin") return "all-in";
  return v;
}

function fmtAmount(n?: number | null) {
  if (typeof n !== "number") return "";
  try {
    return n.toLocaleString();
  } catch {
    return String(n);
  }
}

function isHeroAction(a: WdicAction, heroName: string) {
  const actor = norm(a.actor);
  const hero = norm(heroName);
  return actor !== "" && actor === hero;
}

function actionImportance(a: WdicAction) {
  const v = prettyVerb(a.verb);
  if (IMPORTANT_VERBS.has(v)) return "important";
  if (DIM_VERBS.has(v)) return "dim";
  return "normal";
}

export default function HandActionTimeline({
  actions,
  heroName = "Hero",
  defaultExpandRaw = false,
  actorAliasMap
}: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, WdicAction[]>();
    for (const a of actions ?? []) {
      const street = (a.street || "UNKNOWN").toUpperCase();
      if (!map.has(street)) map.set(street, []);
      map.get(street)!.push(a);
    }

    // keep original order inside each street (lineNo asc)
    for (const [k, list] of map) {
      list.sort((x, y) => (x.lineNo ?? 0) - (y.lineNo ?? 0));
      map.set(k, list);
    }

    return map;
  }, [actions]);

  const orderedStreets = useMemo(() => {
    const existing = new Set([...grouped.keys()]);
    const inOrder = STREET_ORDER.filter((s) => existing.has(s));
    const extras = [...existing].filter((s) => !STREET_ORDER.includes(s)).sort();
    return [...inOrder, ...extras];
  }, [grouped]);

  if (!actions?.length) {
    return (
      <div style={card()}>
        <div style={{ fontWeight: 800 }}>Actions</div>
        <div style={{ opacity: 0.7, marginTop: 6 }}>ไม่มี actions ที่ parse ได้</div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {orderedStreets.map((street) => {
        const list = grouped.get(street) ?? [];
        if (!list.length) return null;

        const heroDecisions = list.filter(
          (a) => isHeroAction(a, heroName) && IMPORTANT_VERBS.has(prettyVerb(a.verb))
        ).length;

        return (
          <section key={street} style={card()}>
            <header style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 900, letterSpacing: 0.2 }}>{street}</div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
                  {list.length} events
                  {heroDecisions ? ` • hero decisions: ${heroDecisions}` : ""}
                </div>
              </div>
            </header>

            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              {list.map((a, idx) => (
                <ActionRow
                  key={`${a.lineNo}-${idx}`}
                  a={a}
                  heroName={heroName}
                  defaultExpandRaw={defaultExpandRaw}
                  actorAliasMap={actorAliasMap}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ActionRow({
  a,
  heroName,
  defaultExpandRaw,
  actorAliasMap,
}: {
  a: WdicAction;
  heroName: string;
  defaultExpandRaw: boolean;
  actorAliasMap?: Record<string, string>;
}) {
  const hero = isHeroAction(a, heroName);
  const verb = prettyVerb(a.verb);
  const amt = fmtAmount(a.amount);
  const importance = actionImportance(a);
  const actorRaw = a.actor ?? "?";
  const actorShown = actorAliasMap?.[actorRaw] ?? actorRaw;

  const isWhyDidICall = hero && verb === "calls";

  const rowStyle: React.CSSProperties = {
    border: "1px solid #e6e6e6",
    borderRadius: 14,
    padding: 10,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    background: hero ? "#fff5f5" : "#fff",
  };

  const leftBar: React.CSSProperties = {
    width: 4,
    borderRadius: 999,
    background: hero ? "#d9114a" : "transparent",
    flex: "0 0 auto",
    marginRight: 10,
  };

  const mainOpacity =
    importance === "important" ? 1 : importance === "dim" ? 0.55 : 0.8;

  const verbStyle: React.CSSProperties = {
    fontWeight: importance === "important" ? 900 : 700,
    opacity: mainOpacity,
  };

  return (
    <div style={rowStyle}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 0, flex: 1 }}>
        <div style={leftBar} />

        <div style={{ flex: 1 }}>
          {/* Human-readable line */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 900 }} title={actorRaw}>
              {actorShown}
            </span>
            <span style={verbStyle}>{verb}</span>
            {amt && <span style={{ fontWeight: 800, opacity: 0.85 }}>{amt}</span>}

            {isWhyDidICall && (
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 12,
                  fontWeight: 900,
                  color: "#d9114a",
                  opacity: 0.95,
                }}
                title="WDIC marker"
              >
                ← why did I call
              </span>
            )}
          </div>

          {/* Raw line (collapsible) */}
          <details style={{ marginTop: 6 }} open={defaultExpandRaw}>
            <summary style={{ fontSize: 12, opacity: 0.55, cursor: "pointer" }}>
              raw (L{a.lineNo})
            </summary>
            <pre
              style={{
                marginTop: 6,
                padding: 10,
                borderRadius: 12,
                background: "#f7f7f7",
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                fontSize: 12,
              }}
            >
              {a.raw}
            </pre>
          </details>
        </div>
      </div>

      {/* Small meta */}
      <div style={{ fontSize: 12, opacity: 0.5, flex: "0 0 auto" }}>L{a.lineNo}</div>
    </div>
  );
}

function card(): React.CSSProperties {
  return {
    border: "1px solid #e6e6e6",
    borderRadius: 16,
    padding: 14,
    background: "#fff",
  };
}
