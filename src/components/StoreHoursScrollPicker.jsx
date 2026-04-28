import React, { useCallback, useEffect, useRef, useState } from "react";
import "../styles/registrationForm.css";

const ITEM_HEIGHT = 40;
const VISIBLE_ROWS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;
const PAD = (PICKER_HEIGHT - ITEM_HEIGHT) / 2;

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = [0, 15, 30, 45];
const PERIODS = ["AM", "PM"];

export const DEFAULT_STORE_HOURS = "9:00 AM – 5:00 PM";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function snapMinute(m) {
  const allowed = MINUTES;
  return allowed.reduce((best, x) =>
    Math.abs(x - m) < Math.abs(best - m) ? x : best
  );
}

const STORE_HOURS_PARSE_RE =
  /^(\d{1,2})\s*:\s*(\d{2})\s*(AM|PM)\s*[–-]\s*(\d{1,2})\s*:\s*(\d{2})\s*(AM|PM)$/i;

export function isStoreHoursFormat(str) {
  return typeof str === "string" && STORE_HOURS_PARSE_RE.test(str.trim());
}

function parseStoreHours(str) {
  if (!str || typeof str !== "string") {
    return { oh: 9, om: 0, op: "AM", ch: 5, cm: 0, cp: "PM", matched: false };
  }
  const m = str.trim().match(STORE_HOURS_PARSE_RE);
  if (!m) {
    return { oh: 9, om: 0, op: "AM", ch: 5, cm: 0, cp: "PM", matched: false };
  }
  let oh = Math.min(12, Math.max(1, parseInt(m[1], 10)));
  let om = snapMinute(Math.min(59, Math.max(0, parseInt(m[2], 10))));
  const op = m[3].toUpperCase() === "PM" ? "PM" : "AM";
  let ch = Math.min(12, Math.max(1, parseInt(m[4], 10)));
  let cm = snapMinute(Math.min(59, Math.max(0, parseInt(m[5], 10))));
  const cp = m[6].toUpperCase() === "PM" ? "PM" : "AM";
  return { oh, om, op, ch, cm, cp, matched: true };
}

function formatStoreHours({ oh, om, op, ch, cm, cp }) {
  return `${oh}:${pad2(om)} ${op} – ${ch}:${pad2(cm)} ${cp}`;
}

function ScrollNumberColumn({ values, selected, onSelect, width, format }) {
  const ref = useRef(null);
  const scrollEnd = useRef(null);

  const scrollToIndex = useCallback(
    (index, smooth) => {
      const el = ref.current;
      if (!el) return;
      const i = Math.max(0, Math.min(values.length - 1, index));
      el.scrollTo({ top: i * ITEM_HEIGHT, behavior: smooth ? "smooth" : "auto" });
    },
    [values.length]
  );

  useEffect(() => {
    const idx = values.indexOf(selected);
    if (idx < 0) return;
    scrollToIndex(idx, false);
  }, [selected, values, scrollToIndex]);

  const handleScroll = () => {
    const el = ref.current;
    if (!el) return;
    if (scrollEnd.current) clearTimeout(scrollEnd.current);
    scrollEnd.current = setTimeout(() => {
      const raw = el.scrollTop / ITEM_HEIGHT;
      const idx = Math.round(raw);
      const clamped = Math.max(0, Math.min(values.length - 1, idx));
      el.scrollTo({ top: clamped * ITEM_HEIGHT, behavior: "smooth" });
      if (values[clamped] !== undefined && values[clamped] !== selected) {
        onSelect(values[clamped]);
      }
    }, 120);
  };

  return (
    <div
      className="reg-scroll-column"
      style={{
        width,
        height: PICKER_HEIGHT,
        position: "relative"
      }}
    >
      <div
        aria-hidden
        className="reg-scroll-column-window"
        style={{
          top: PAD,
          height: ITEM_HEIGHT
        }}
      />
      <div
        ref={ref}
        onScroll={handleScroll}
        style={{
          height: PICKER_HEIGHT,
          overflowY: "auto",
          scrollSnapType: "y mandatory",
          scrollbarWidth: "thin"
        }}
      >
        <div style={{ height: PAD }} />
        {values.map((v) => {
          const active = v === selected;
          return (
            <div
              key={String(v)}
              onClick={() => {
                onSelect(v);
                scrollToIndex(values.indexOf(v), true);
              }}
              style={{
                height: ITEM_HEIGHT,
                scrollSnapAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: active ? 17 : 15,
                fontWeight: active ? 600 : 500,
                color: active ? "#2a2620" : "#9a948a",
                cursor: "pointer",
                userSelect: "none"
              }}
            >
              {format ? format(v) : v}
            </div>
          );
        })}
        <div style={{ height: PAD }} />
      </div>
    </div>
  );
}

const StoreHoursScrollPicker = ({ value, onChange, id }) => {
  const initial = parseStoreHours(value);
  const [oh, setOh] = useState(initial.oh);
  const [om, setOm] = useState(initial.om);
  const [op, setOp] = useState(initial.op);
  const [ch, setCh] = useState(initial.ch);
  const [cm, setCm] = useState(initial.cm);
  const [cp, setCp] = useState(initial.cp);
  const [legacyHint, setLegacyHint] = useState(
    Boolean(value && !parseStoreHours(value).matched)
  );

  useEffect(() => {
    const p = parseStoreHours(value);
    setOh(p.oh);
    setOm(p.om);
    setOp(p.op);
    setCh(p.ch);
    setCm(p.cm);
    setCp(p.cp);
    setLegacyHint(Boolean(value && !p.matched));
  }, [value]);

  const emit = useCallback(
    (next) => {
      onChange(formatStoreHours(next));
    },
    [onChange]
  );

  const setPart = (patch) => {
    const next = { oh, om, op, ch, cm, cp, ...patch };
    if (patch.oh !== undefined) setOh(patch.oh);
    if (patch.om !== undefined) setOm(patch.om);
    if (patch.op !== undefined) setOp(patch.op);
    if (patch.ch !== undefined) setCh(patch.ch);
    if (patch.cm !== undefined) setCm(patch.cm);
    if (patch.cp !== undefined) setCp(patch.cp);
    setLegacyHint(false);
    emit(next);
  };

  return (
    <div id={id} style={{ width: "100%" }}>
      <p className="reg-section-label" style={{ marginTop: 16 }}>
        Store hours
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 8,
          flexWrap: "wrap"
        }}
      >
        <div>
          <div className="reg-open-close-label">Open</div>
          <div style={{ display: "flex", gap: 4, alignItems: "flex-end" }}>
            <ScrollNumberColumn
              values={HOURS_12}
              selected={oh}
              onSelect={(v) => setPart({ oh: v })}
              width={44}
            />
            <ScrollNumberColumn
              values={MINUTES}
              selected={om}
              onSelect={(v) => setPart({ om: v })}
              width={44}
              format={(m) => pad2(m)}
            />
            <ScrollNumberColumn
              values={PERIODS}
              selected={op}
              onSelect={(v) => setPart({ op: v })}
              width={52}
            />
          </div>
        </div>
        <div
          style={{
            paddingBottom: PAD + 6,
            fontSize: 18,
            color: "#b8b0a3",
            fontWeight: 600
          }}
        >
          –
        </div>
        <div>
          <div className="reg-open-close-label">Close</div>
          <div style={{ display: "flex", gap: 4, alignItems: "flex-end" }}>
            <ScrollNumberColumn
              values={HOURS_12}
              selected={ch}
              onSelect={(v) => setPart({ ch: v })}
              width={44}
            />
            <ScrollNumberColumn
              values={MINUTES}
              selected={cm}
              onSelect={(v) => setPart({ cm: v })}
              width={44}
              format={(m) => pad2(m)}
            />
            <ScrollNumberColumn
              values={PERIODS}
              selected={cp}
              onSelect={(v) => setPart({ cp: v })}
              width={52}
            />
          </div>
        </div>
      </div>
      <div className="reg-store-hours-summary">
        {formatStoreHours({ oh, om, op, ch, cm, cp })}
      </div>
      {legacyHint && (
        <p className="reg-hint" style={{ marginTop: 10, textAlign: "center" }}>
          Saved hours used a different format. Scroll a column to replace them with the
          times above.
        </p>
      )}
    </div>
  );
};

export default StoreHoursScrollPicker;
