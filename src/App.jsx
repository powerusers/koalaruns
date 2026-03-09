import { useState, useRef } from "react";

/*
 * Koala Runs — Australian Delivery Management Platform
 * Design: Industrial-utilitarian SaaS. Dark chrome header, dense data,
 * amber accent (warehouse/safety), monospace numerics, no decoration.
 */

// ─── Data Layer ──────────────────────────────────────────────────────
const ROLES = { ADMIN: "admin", OPERATOR: "operator", DRIVER: "driver" };

const STATUS_MAP = {
  pending:    { label: "Pending",    fg: "#78716c", bg: "#f5f5f4", dot: "#a8a29e" },
  assigned:   { label: "Assigned",   fg: "#1d4ed8", bg: "#dbeafe", dot: "#3b82f6" },
  in_transit: { label: "In Transit", fg: "#b45309", bg: "#fef3c7", dot: "#f59e0b" },
  delivered:  { label: "Delivered",  fg: "#15803d", bg: "#dcfce7", dot: "#22c55e" },
  failed:     { label: "Failed",     fg: "#b91c1c", bg: "#fee2e2", dot: "#ef4444" },
};

const OPERATORS = [
  { id: "op1", name: "Murray Transport", abn: "51 824 753 556", phone: "0412 345 678", drivers: ["d1", "d2"] },
  { id: "op2", name: "Outback Freight", abn: "37 616 290 443", phone: "0423 456 789", drivers: ["d3"] },
];

const DRIVERS = [
  { id: "d1", name: "Jack Wilson", phone: "0434 111 222", operatorId: "op1", rego: "ABC-123", truck: "Isuzu FRR" },
  { id: "d2", name: "Emma Chen", phone: "0434 333 444", operatorId: "op1", rego: "DEF-456", truck: "Hino 500" },
  { id: "d3", name: "Liam O'Brien", phone: "0434 555 666", operatorId: "op2", rego: "GHI-789", truck: "Fuso Fighter" },
];

const INITIAL_DELIVERIES = [
  { id: "RUN-0417-001", customer: "Sarah Thompson", phone: "0401 222 333", address: "42 Collins St, Melbourne VIC 3000", suburb: "Melbourne", items: "King Size Mattress + Base", pieces: 2, weight: 85, payment: "cod_cash", amount: 1299.00, status: "pending", operatorId: null, driverId: null, notes: "Ground floor unit — wide doorway confirmed", window: "09:00–12:00", signature: null, collectedAmt: 0, deliveredAt: null },
  { id: "RUN-0417-002", customer: "Mike Patel", phone: "0402 444 555", address: "15 Bourke Rd, Alexandria NSW 2015", suburb: "Alexandria", items: "3-Seater Sofa (Grey Linen)", pieces: 1, weight: 62, payment: "prepaid", amount: 899.00, status: "pending", operatorId: null, driverId: null, notes: "2nd floor, no lift. Call on arrival.", window: "12:00–15:00", signature: null, collectedAmt: 0, deliveredAt: null },
  { id: "RUN-0417-003", customer: "Jenny Liu", phone: "0403 666 777", address: "8 Pacific Hwy, Chatswood NSW 2067", suburb: "Chatswood", items: "Dining Table 8-seat + 8× Chairs", pieces: 9, weight: 120, payment: "cod_card", amount: 2450.00, status: "pending", operatorId: null, driverId: null, notes: "Loading dock at rear. Concierge has access.", window: "09:00–12:00", signature: null, collectedAmt: 0, deliveredAt: null },
  { id: "RUN-0417-004", customer: "Tom Richards", phone: "0404 888 999", address: "230 Plenty Rd, Bundoora VIC 3083", suburb: "Bundoora", items: "Queen Bed Frame + 2× Bedside Tables", pieces: 3, weight: 55, payment: "cod_cash", amount: 749.00, status: "pending", operatorId: null, driverId: null, notes: "Leave at garage if not home — authority to leave signed.", window: "13:00–17:00", signature: null, collectedAmt: 0, deliveredAt: null },
  { id: "RUN-0417-005", customer: "Priya Sharma", phone: "0405 000 111", address: "99 George St, Brisbane QLD 4000", suburb: "Brisbane CBD", items: "Washing Machine 10kg Front Load", pieces: 1, weight: 78, payment: "prepaid", amount: 1150.00, status: "pending", operatorId: null, driverId: null, notes: "Install included. Plumbing access confirmed.", window: "09:00–12:00", signature: null, collectedAmt: 0, deliveredAt: null },
  { id: "RUN-0417-006", customer: "David Brown", phone: "0406 222 333", address: "5 Flinders Ln, Melbourne VIC 3000", suburb: "Melbourne", items: "Refrigerator 680L French Door", pieces: 1, weight: 110, payment: "cod_cash", amount: 2899.00, status: "pending", operatorId: null, driverId: null, notes: "Remove old unit — customer confirmed. Dolly required.", window: "12:00–15:00", signature: null, collectedAmt: 0, deliveredAt: null },
];

// ─── Signature Pad ───────────────────────────────────────────────────
const SignaturePad = ({ onConfirm, onCancel }) => {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [touched, setTouched] = useState(false);
  const pos = (e) => { const r = canvasRef.current.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return [t.clientX - r.left, t.clientY - r.top]; };
  const down = (e) => { e.preventDefault(); const ctx = canvasRef.current.getContext("2d"); const [x,y] = pos(e); ctx.beginPath(); ctx.moveTo(x,y); drawing.current = true; };
  const move = (e) => { if (!drawing.current) return; e.preventDefault(); const ctx = canvasRef.current.getContext("2d"); const [x,y] = pos(e); ctx.lineTo(x,y); ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke(); setTouched(true); };
  const up = () => { drawing.current = false; };
  const clear = () => { canvasRef.current.getContext("2d").clearRect(0,0,canvasRef.current.width,canvasRef.current.height); setTouched(false); };
  return (
    <div style={{ border: "1px solid #d4d4d4", borderRadius: 4, padding: 12, background: "#fafafa" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#737373", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontFamily: "var(--f-body)" }}>Customer Signature</div>
      <canvas ref={canvasRef} width={320} height={140} style={{ display: "block", width: "100%", height: 140, border: "1px dashed #d4d4d4", borderRadius: 3, background: "#fff", cursor: "crosshair", touchAction: "none" }}
        onMouseDown={down} onMouseMove={move} onMouseUp={up} onMouseLeave={up} onTouchStart={down} onTouchMove={move} onTouchEnd={up} />
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button onClick={clear} className="dm-btn" style={{ flex: 1, background: "#e5e5e5", color: "#525252" }}>Clear</button>
        <button onClick={onCancel} className="dm-btn" style={{ flex: 1, background: "#fff", color: "#737373", border: "1px solid #d4d4d4" }}>Cancel</button>
        <button onClick={() => touched && onConfirm(canvasRef.current.toDataURL())} disabled={!touched} className="dm-btn" style={{ flex: 1, background: touched ? "#16a34a" : "#d4d4d4", color: "#fff" }}>Confirm</button>
      </div>
    </div>
  );
};

// ─── Main Application ───────────────────────────────────────────────
export default function KoalaRuns() {
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [deliveries, setDeliveries] = useState(INITIAL_DELIVERIES);
  const [view, setView] = useState("dashboard");
  const [selected, setSelected] = useState(null);
  const [sigMode, setSigMode] = useState(false);
  const [filterSt, setFilterSt] = useState("all");
  const [search, setSearch] = useState("");
  const [cashModal, setCashModal] = useState(null);
  const [cashVal, setCashVal] = useState("");
  const [toast, setToast] = useState(null);

  const flash = (msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2800); };

  // ── Login ───────────────────────────────────────────────────────
  if (!role) {
    return (
      <div style={{ "--f-display": "'Source Serif 4', Georgia, serif", "--f-body": "'IBM Plex Sans', system-ui, sans-serif", "--f-mono": "'IBM Plex Mono', monospace" }}>
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=Source+Serif+4:wght@600;700;800&display=swap" rel="stylesheet" />
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#171717", padding: 24 }}>
          <div style={{ position: "fixed", inset: 0, opacity: 0.025, backgroundImage: "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 44px), repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 44px)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1, maxWidth: 400, width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
              <div style={{ width: 40, height: 40, background: "#f59e0b", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#171717" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#fafafa", fontFamily: "var(--f-display)", letterSpacing: "-0.02em" }}>Koala Runs</div>
                <div style={{ fontSize: 11, color: "#737373", fontFamily: "var(--f-mono)", fontWeight: 500, letterSpacing: "0.05em" }}>DELIVERY MANAGEMENT</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#a3a3a3", marginBottom: 20, fontFamily: "var(--f-body)", lineHeight: 1.5 }}>Select your role to access the platform.</div>
            {[
              { r: ROLES.ADMIN, title: "Warehouse / Back Office", desc: "Run sheets, operator assignment, reconciliation", kbd: "W" },
              { r: ROLES.OPERATOR, title: "Truck Operator", desc: "Manage assigned deliveries, distribute to drivers", kbd: "O" },
              { r: ROLES.DRIVER, title: "Driver", desc: "Run sheet, POD capture, payment collection", kbd: "D" },
            ].map(({ r, title, desc, kbd }, i) => (
              <button key={r} onClick={() => { setRole(r); if (r === ROLES.OPERATOR) setUser(OPERATORS[0]); if (r === ROLES.DRIVER) setUser(DRIVERS[0]); setView("dashboard"); }}
                className="dm-login-btn"
                style={{ display: "flex", alignItems: "center", width: "100%", padding: "16px 18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, cursor: "pointer", textAlign: "left", marginBottom: 8, fontFamily: "var(--f-body)", animationName: "fadeUp", animationDuration: "0.4s", animationFillMode: "both", animationDelay: `${i * 0.08}s` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#e5e5e5" }}>{title}</div>
                  <div style={{ fontSize: 12, color: "#737373", marginTop: 3 }}>{desc}</div>
                </div>
                <div style={{ width: 28, height: 28, borderRadius: 3, border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontFamily: "var(--f-mono)", color: "#737373", fontWeight: 600, flexShrink: 0 }}>{kbd}</div>
              </button>
            ))}
            <div style={{ marginTop: 32, fontSize: 11, color: "#525252", fontFamily: "var(--f-mono)", textAlign: "center" }}>v2.4.1 · AU Eastern · {new Date().toLocaleDateString("en-AU")}</div>
          </div>
        </div>
        <style>{`
          @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
          .dm-login-btn:hover { background: rgba(245,158,11,0.08) !important; border-color: rgba(245,158,11,0.25) !important; }
        `}</style>
      </div>
    );
  }

  // ── Data helpers ────────────────────────────────────────────────
  const myDeliveries = role === ROLES.ADMIN ? deliveries : role === ROLES.OPERATOR ? deliveries.filter(d => d.operatorId === user?.id) : deliveries.filter(d => d.driverId === user?.id);
  const filtered = (() => { let list = [...myDeliveries]; if (filterSt !== "all") list = list.filter(d => d.status === filterSt); if (search) { const q = search.toLowerCase(); list = list.filter(d => d.customer.toLowerCase().includes(q) || d.address.toLowerCase().includes(q) || d.id.toLowerCase().includes(q)); } return list; })();
  const counts = Object.fromEntries(Object.keys(STATUS_MAP).map(s => [s, myDeliveries.filter(d => d.status === s).length]));
  const codItems = myDeliveries.filter(d => d.payment !== "prepaid");
  const codExpected = codItems.reduce((s,d) => s + d.amount, 0);
  const codCollected = codItems.filter(d => d.status === "delivered").reduce((s,d) => s + d.collectedAmt, 0);

  // ── Mutations ───────────────────────────────────────────────────
  const mut = (id, patch) => { setDeliveries(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d)); setSelected(prev => prev?.id === id ? { ...prev, ...patch } : prev); };
  const assignOp = (id, opId) => { mut(id, { operatorId: opId, status: "assigned" }); flash("Assigned to operator"); };
  const assignDr = (id, drId) => { mut(id, { driverId: drId, status: "assigned" }); flash("Assigned to driver"); };
  const startDel = (id) => { mut(id, { status: "in_transit" }); flash("Delivery started"); };
  const completeDel = (id, sig) => { const d = deliveries.find(x=>x.id===id); mut(id, { status: "delivered", signature: sig, deliveredAt: new Date().toLocaleString("en-AU"), collectedAmt: d.payment !== "prepaid" ? d.amount : 0 }); setSigMode(false); flash("Delivery completed"); };
  const failDel = (id) => { mut(id, { status: "failed" }); flash("Marked as failed", "err"); };
  const collectCash = (id, amt) => { mut(id, { collectedAmt: parseFloat(amt) }); setCashModal(null); flash(`$${parseFloat(amt).toFixed(2)} recorded`); };
  const bulkAssignOp = (opId) => { setDeliveries(prev => prev.map(d => d.status === "pending" ? { ...d, operatorId: opId, status: "assigned" } : d)); flash("All pending assigned"); };

  const nav = { admin: [{ id: "dashboard", label: "Dashboard" }, { id: "deliveries", label: "Deliveries" }, { id: "operators", label: "Operators" }, { id: "reconcile", label: "Reconciliation" }], operator: [{ id: "dashboard", label: "Dashboard" }, { id: "deliveries", label: "Deliveries" }, { id: "drivers", label: "Drivers" }], driver: [{ id: "dashboard", label: "Overview" }, { id: "runsheet", label: "Run Sheet" }] };
  const accentColor = role === ROLES.ADMIN ? "#f59e0b" : role === ROLES.OPERATOR ? "#3b82f6" : "#22c55e";

  // ── Components ──────────────────────────────────────────────────
  const Badge = ({ status }) => { const c = STATUS_MAP[status]; return ( <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 3, fontSize: 11, fontWeight: 600, color: c.fg, background: c.bg, fontFamily: "var(--f-body)", letterSpacing: "0.02em" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />{c.label}</span> ); };

  const Metric = ({ label, value, sub, accent }) => (
    <div style={{ padding: "14px 16px", background: "#fff", border: "1px solid #e5e5e5", borderRadius: 4, borderTop: accent ? `3px solid ${accent}` : "1px solid #e5e5e5" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--f-body)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: "#171717", fontFamily: "var(--f-mono)", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#737373", marginTop: 4, fontFamily: "var(--f-body)" }}>{sub}</div>}
    </div>
  );

  const DeliveryCard = ({ d }) => (
    <div onClick={() => setSelected(d)} className="dm-card"
      style={{ padding: "14px 16px", background: "#fff", border: "1px solid #e5e5e5", borderRadius: 4, cursor: "pointer", borderLeft: `3px solid ${STATUS_MAP[d.status].dot}`, marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#171717", fontFamily: "var(--f-body)" }}>{d.customer}</div>
          <div style={{ fontSize: 11, color: "#a3a3a3", fontFamily: "var(--f-mono)", marginTop: 1 }}>{d.id}</div>
        </div>
        <Badge status={d.status} />
      </div>
      <div style={{ fontSize: 13, color: "#525252", marginBottom: 4, fontFamily: "var(--f-body)", lineHeight: 1.4 }}>{d.address}</div>
      <div style={{ fontSize: 12, color: "#737373", marginBottom: 6 }}>{d.items}</div>
      <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#a3a3a3", fontFamily: "var(--f-mono)" }}>
        <span>{d.window}</span>
        <span>{d.weight}kg · {d.pieces}pc</span>
        {d.payment !== "prepaid" && <span style={{ color: "#b45309", fontWeight: 600 }}>{d.payment === "cod_cash" ? "COD CASH" : "COD CARD"} ${d.amount.toFixed(2)}</span>}
      </div>
    </div>
  );

  const DeliveryRow = ({ d }) => (
    <div onClick={() => setSelected(d)} className="dm-row"
      style={{ display: "grid", gridTemplateColumns: "100px 1.5fr 2fr 1fr 90px 80px", alignItems: "center", padding: "12px 16px", background: "#fff", borderBottom: "1px solid #f0f0f0", cursor: "pointer", fontSize: 13, fontFamily: "var(--f-body)" }}>
      <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, fontWeight: 500, color: "#737373" }}>{d.id.split("-").slice(-1)[0]}</span>
      <span style={{ fontWeight: 600, color: "#262626", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.customer}</span>
      <span style={{ color: "#525252", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>{d.address}</span>
      <span style={{ fontFamily: "var(--f-mono)", fontSize: 12, color: d.payment === "prepaid" ? "#737373" : "#b45309", fontWeight: 500 }}>{d.payment === "prepaid" ? "Prepaid" : `$${d.amount.toFixed(2)}`}</span>
      <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "#a3a3a3" }}>{d.window}</span>
      <Badge status={d.status} />
    </div>
  );

  // ── Detail Panel ────────────────────────────────────────────────
  const DetailPanel = () => {
    if (!selected) return null;
    const d = deliveries.find(x => x.id === selected.id) || selected;
    const isDriver = role === ROLES.DRIVER;
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", justifyContent: "flex-end" }} onClick={() => { setSelected(null); setSigMode(false); }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />
        <div style={{ position: "relative", width: "100%", maxWidth: 460, background: "#fff", borderLeft: "1px solid #e5e5e5", overflowY: "auto", animation: "slideIn 0.2s ease" }} onClick={e => e.stopPropagation()}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e5e5", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fafaf9" }}>
            <div>
              <div style={{ fontSize: 11, fontFamily: "var(--f-mono)", color: "#a3a3a3", fontWeight: 500 }}>{d.id}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#171717", fontFamily: "var(--f-display)", marginTop: 2 }}>{d.customer}</div>
            </div>
            <button onClick={() => { setSelected(null); setSigMode(false); }} className="dm-btn" style={{ padding: 6, background: "transparent", color: "#a3a3a3", fontSize: 18, lineHeight: 1 }}>✕</button>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 16 }}><Badge status={d.status} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px", marginBottom: 20 }}>
              {[
                ["Address", d.address, true], ["Phone", d.phone], ["Items", `${d.items} (${d.pieces}pc, ${d.weight}kg)`, true], ["Window", d.window],
                ["Payment", d.payment === "prepaid" ? "Prepaid" : `${d.payment === "cod_cash" ? "COD Cash" : "COD Card"} — $${d.amount.toFixed(2)}`],
                d.notes && ["Notes", d.notes, true], d.operatorId && ["Operator", OPERATORS.find(o => o.id === d.operatorId)?.name],
                d.driverId && ["Driver", DRIVERS.find(dr => dr.id === d.driverId)?.name], d.deliveredAt && ["Completed", d.deliveredAt],
                d.collectedAmt > 0 && ["Collected", `$${d.collectedAmt.toFixed(2)}`],
              ].filter(Boolean).map(([label, value, full], i) => (
                <div key={i} style={{ gridColumn: full ? "1 / -1" : undefined }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3, fontFamily: "var(--f-body)" }}>{label}</div>
                  <div style={{ fontSize: 13, color: "#262626", fontFamily: "var(--f-body)", lineHeight: 1.4 }}>{value}</div>
                </div>
              ))}
            </div>
            {d.signature && <div style={{ marginBottom: 16 }}><div style={{ fontSize: 10, fontWeight: 600, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Signature</div><img src={d.signature} alt="sig" style={{ width: "100%", border: "1px solid #e5e5e5", borderRadius: 3 }} /></div>}
            {sigMode && <div style={{ marginBottom: 16 }}><SignaturePad onConfirm={(sig) => completeDel(d.id, sig)} onCancel={() => setSigMode(false)} /></div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
              {role === ROLES.ADMIN && d.status === "pending" && <div><div style={{ fontSize: 11, fontWeight: 600, color: "#737373", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Assign to Operator</div><div style={{ display: "flex", gap: 6 }}>{OPERATORS.map(op => <button key={op.id} onClick={() => assignOp(d.id, op.id)} className="dm-btn" style={{ flex: 1, background: "#171717", color: "#fafafa" }}>{op.name}</button>)}</div></div>}
              {role === ROLES.OPERATOR && ["pending","assigned"].includes(d.status) && !d.driverId && <div><div style={{ fontSize: 11, fontWeight: 600, color: "#737373", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Assign to Driver</div><div style={{ display: "flex", gap: 6 }}>{DRIVERS.filter(dr => dr.operatorId === user?.id).map(dr => <button key={dr.id} onClick={() => assignDr(d.id, dr.id)} className="dm-btn" style={{ flex: 1, background: "#171717", color: "#fafafa" }}>{dr.name}</button>)}</div></div>}
              {isDriver && d.status === "assigned" && <button onClick={() => startDel(d.id)} className="dm-btn" style={{ background: "#f59e0b", color: "#171717", padding: 14, fontWeight: 700, width: "100%" }}>Start Delivery</button>}
              {isDriver && d.status === "in_transit" && !sigMode && <>
                {d.payment === "cod_cash" && d.collectedAmt === 0 && <button onClick={() => { setCashModal(d.id); setCashVal(d.amount.toFixed(2)); }} className="dm-btn" style={{ background: "#fef3c7", color: "#92400e", padding: 13, fontWeight: 600, width: "100%", border: "1px solid #fde68a" }}>Collect Cash — ${d.amount.toFixed(2)}</button>}
                {d.payment === "cod_card" && d.collectedAmt === 0 && <button onClick={() => collectCash(d.id, d.amount)} className="dm-btn" style={{ background: "#dbeafe", color: "#1e40af", padding: 13, fontWeight: 600, width: "100%", border: "1px solid #93c5fd" }}>Card Payment — ${d.amount.toFixed(2)}</button>}
                <button onClick={() => setSigMode(true)} className="dm-btn" style={{ background: "#16a34a", color: "#fff", padding: 14, fontWeight: 700, width: "100%" }}>Capture Signature &amp; Complete</button>
                <button onClick={() => failDel(d.id)} className="dm-btn" style={{ background: "#fff", color: "#b91c1c", padding: 12, border: "1px solid #fecaca", width: "100%" }}>Failed — No access / Not home</button>
              </>}
              <button onClick={() => flash("Call: " + d.phone)} className="dm-btn" style={{ background: "#f5f5f4", color: "#525252", padding: 12, width: "100%" }}>Call Customer · {d.phone}</button>
              {isDriver && ["assigned","in_transit"].includes(d.status) && <button onClick={() => flash("Opening maps...")} className="dm-btn" style={{ background: "#f5f5f4", color: "#525252", padding: 12, width: "100%" }}>Navigate · Google Maps</button>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Cash Modal ──────────────────────────────────────────────────
  const CashModalView = () => {
    if (!cashModal) return null;
    const d = deliveries.find(x => x.id === cashModal); if (!d) return null;
    const change = parseFloat(cashVal || 0) - d.amount;
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setCashModal(null)}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
        <div style={{ position: "relative", background: "#fff", borderRadius: 6, padding: 24, maxWidth: 360, width: "100%", border: "1px solid #e5e5e5" }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#171717", fontFamily: "var(--f-display)", marginBottom: 4 }}>Cash Collection</div>
          <div style={{ fontSize: 13, color: "#737373", marginBottom: 16 }}>Due: <span style={{ fontFamily: "var(--f-mono)", fontWeight: 600, color: "#171717" }}>${d.amount.toFixed(2)}</span></div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Received</label>
          <input type="number" value={cashVal} onChange={e => setCashVal(e.target.value)} style={{ width: "100%", padding: "12px 14px", border: "1px solid #d4d4d4", borderRadius: 4, fontSize: 24, fontFamily: "var(--f-mono)", fontWeight: 600, textAlign: "center", boxSizing: "border-box", outline: "none", marginBottom: 12 }} />
          {change > 0 && <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 4, padding: 12, textAlign: "center", marginBottom: 12 }}><div style={{ fontSize: 10, fontWeight: 600, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.06em" }}>Change to return</div><div style={{ fontSize: 28, fontWeight: 600, color: "#b45309", fontFamily: "var(--f-mono)" }}>${change.toFixed(2)}</div></div>}
          {change < 0 && <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 4, padding: 10, textAlign: "center", marginBottom: 12, fontSize: 13, color: "#b91c1c", fontWeight: 600 }}>Short by ${Math.abs(change).toFixed(2)}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setCashModal(null)} className="dm-btn" style={{ flex: 1, background: "#f5f5f4", color: "#525252" }}>Cancel</button>
            <button onClick={() => change >= 0 && collectCash(d.id, d.amount)} disabled={change < 0} className="dm-btn" style={{ flex: 1, background: change >= 0 ? "#16a34a" : "#d4d4d4", color: "#fff" }}>Confirm</button>
          </div>
        </div>
      </div>
    );
  };

  // ── Views ───────────────────────────────────────────────────────
  const DashboardView = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#171717", fontFamily: "var(--f-display)" }}>{role === ROLES.ADMIN ? "Warehouse Dashboard" : role === ROLES.OPERATOR ? "Operator Overview" : "Today's Run"}</h2>
        <span style={{ fontSize: 12, color: "#a3a3a3", fontFamily: "var(--f-mono)" }}>{new Date().toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 24 }}>
        <Metric label="Total" value={myDeliveries.length} accent="#737373" />
        <Metric label="Delivered" value={counts.delivered || 0} accent="#22c55e" sub={myDeliveries.length ? `${Math.round(((counts.delivered||0) / myDeliveries.length) * 100)}% complete` : "—"} />
        <Metric label="In Transit" value={counts.in_transit || 0} accent="#f59e0b" />
        <Metric label="Pending" value={(counts.pending||0) + (counts.assigned||0)} accent="#a8a29e" />
      </div>
      {(role === ROLES.ADMIN || role === ROLES.DRIVER) && codItems.length > 0 && (
        <div style={{ border: "1px solid #e5e5e5", borderRadius: 4, padding: "14px 16px", marginBottom: 20, background: "#fff" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Cash on Delivery</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <div><div style={{ fontSize: 10, color: "#a3a3a3", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Expected</div><div style={{ fontSize: 20, fontFamily: "var(--f-mono)", fontWeight: 600, color: "#171717" }}>${codExpected.toFixed(0)}</div></div>
            <div><div style={{ fontSize: 10, color: "#16a34a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Collected</div><div style={{ fontSize: 20, fontFamily: "var(--f-mono)", fontWeight: 600, color: "#16a34a" }}>${codCollected.toFixed(0)}</div></div>
            <div><div style={{ fontSize: 10, color: "#b45309", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Outstanding</div><div style={{ fontSize: 20, fontFamily: "var(--f-mono)", fontWeight: 600, color: "#b45309" }}>${(codExpected - codCollected).toFixed(0)}</div></div>
          </div>
          <div style={{ marginTop: 10, height: 4, background: "#f0f0f0", borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", background: "#16a34a", borderRadius: 2, width: codExpected > 0 ? `${(codCollected/codExpected)*100}%` : "0%", transition: "width 0.4s" }} /></div>
        </div>
      )}
      {role === ROLES.ADMIN && (counts.pending || 0) > 0 && (
        <div style={{ border: "1px solid #e5e5e5", borderRadius: 4, padding: "14px 16px", marginBottom: 20, background: "#fff" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Quick Assign — {counts.pending} pending</div>
          <div style={{ display: "flex", gap: 6 }}>{OPERATORS.map(op => <button key={op.id} onClick={() => bulkAssignOp(op.id)} className="dm-btn" style={{ flex: 1, background: "#171717", color: "#fafafa" }}>{op.name}</button>)}</div>
        </div>
      )}
      <div style={{ fontSize: 11, fontWeight: 600, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Recent</div>
      {myDeliveries.slice(0, 4).map(d => <DeliveryCard key={d.id} d={d} />)}
    </div>
  );

  const DeliveriesView = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#171717", fontFamily: "var(--f-display)" }}>{role === ROLES.DRIVER ? "Run Sheet" : "Deliveries"}</h2>
        <span style={{ fontSize: 12, color: "#a3a3a3", fontFamily: "var(--f-mono)" }}>{filtered.length} items</span>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 160, padding: "8px 12px", border: "1px solid #d4d4d4", borderRadius: 4, fontSize: 13, fontFamily: "var(--f-body)", outline: "none", boxSizing: "border-box" }} />
        <select value={filterSt} onChange={e => setFilterSt(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #d4d4d4", borderRadius: 4, fontSize: 13, fontFamily: "var(--f-body)", background: "#fff", outline: "none" }}>
          <option value="all">All</option>
          {Object.entries(STATUS_MAP).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 14, overflowX: "auto" }}>
        {[{ key: "all", label: "All", count: myDeliveries.length }, ...Object.entries(STATUS_MAP).map(([k,v]) => ({ key: k, label: v.label, count: counts[k] || 0 }))].map(t => (
          <button key={t.key} onClick={() => setFilterSt(t.key)} className="dm-btn" style={{ padding: "6px 12px", fontSize: 12, borderRadius: 3, whiteSpace: "nowrap", background: filterSt === t.key ? "#171717" : "#f5f5f4", color: filterSt === t.key ? "#fafafa" : "#737373" }}>
            {t.label} <span style={{ opacity: 0.6, marginLeft: 4, fontFamily: "var(--f-mono)" }}>{t.count}</span>
          </button>
        ))}
      </div>
      {role === ROLES.DRIVER ? (
        filtered.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: "#a3a3a3" }}>No deliveries match.</div> : filtered.map(d => <DeliveryCard key={d.id} d={d} />)
      ) : (
        <div style={{ border: "1px solid #e5e5e5", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "100px 1.5fr 2fr 1fr 90px 80px", padding: "8px 16px", background: "#fafaf9", borderBottom: "1px solid #e5e5e5", fontSize: 10, fontWeight: 600, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--f-body)" }}>
            <span>ID</span><span>Customer</span><span>Address</span><span>COD</span><span>Window</span><span>Status</span>
          </div>
          {filtered.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: "#a3a3a3" }}>No deliveries match.</div> : filtered.map(d => <DeliveryRow key={d.id} d={d} />)}
        </div>
      )}
    </div>
  );

  const OperatorsView = () => (
    <div>
      <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 700, color: "#171717", fontFamily: "var(--f-display)" }}>Operators</h2>
      {OPERATORS.map(op => { const opDels = deliveries.filter(d => d.operatorId === op.id); const done = opDels.filter(d => d.status === "delivered").length; return (
        <div key={op.id} style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 4, padding: "16px 18px", marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div><div style={{ fontSize: 16, fontWeight: 700, color: "#171717" }}>{op.name}</div><div style={{ fontSize: 12, color: "#a3a3a3", fontFamily: "var(--f-mono)", marginTop: 2 }}>ABN {op.abn} · {op.phone}</div></div>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 24, fontWeight: 600, color: "#171717", fontFamily: "var(--f-mono)" }}>{opDels.length}</div><div style={{ fontSize: 10, color: "#a3a3a3", fontWeight: 600, textTransform: "uppercase" }}>assigned</div></div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
            {DRIVERS.filter(dr => dr.operatorId === op.id).map(dr => <span key={dr.id} style={{ padding: "4px 10px", background: "#f5f5f4", borderRadius: 3, fontSize: 12, color: "#525252", fontWeight: 500 }}>{dr.name} · {dr.rego}</span>)}
          </div>
          {opDels.length > 0 && <div style={{ marginTop: 10, height: 3, background: "#f0f0f0", borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", background: "#22c55e", width: `${(done/opDels.length)*100}%`, transition: "width 0.4s" }} /></div>}
        </div>
      ); })}
    </div>
  );

  const DriversView = () => (
    <div>
      <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 700, color: "#171717", fontFamily: "var(--f-display)" }}>Drivers</h2>
      {DRIVERS.filter(dr => dr.operatorId === user?.id).map(dr => { const drDels = deliveries.filter(d => d.driverId === dr.id); return (
        <div key={dr.id} style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 4, padding: "14px 16px", marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontSize: 15, fontWeight: 600, color: "#171717" }}>{dr.name}</div><div style={{ fontSize: 12, color: "#a3a3a3", fontFamily: "var(--f-mono)", marginTop: 2 }}>{dr.phone} · {dr.truck} · {dr.rego}</div></div>
            <div style={{ padding: "4px 10px", background: "#f5f5f4", borderRadius: 3, fontSize: 13, fontFamily: "var(--f-mono)", fontWeight: 600, color: "#525252" }}>{drDels.length} jobs</div>
          </div>
        </div>
      ); })}
    </div>
  );

  const ReconcileView = () => {
    const cod = deliveries.filter(d => d.payment !== "prepaid");
    const expected = cod.reduce((s,d) => s + d.amount, 0);
    const collected = cod.filter(d => d.status === "delivered").reduce((s,d) => s + d.collectedAmt, 0);
    return (
      <div>
        <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 700, color: "#171717", fontFamily: "var(--f-display)" }}>Reconciliation</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          <Metric label="Expected" value={`$${expected.toFixed(0)}`} accent="#737373" />
          <Metric label="Collected" value={`$${collected.toFixed(0)}`} accent="#22c55e" />
          <Metric label="Outstanding" value={`$${(expected - collected).toFixed(0)}`} accent="#f59e0b" />
        </div>
        <div style={{ border: "1px solid #e5e5e5", borderRadius: 4, overflow: "hidden", marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "90px 1.5fr 70px 90px 90px 80px", padding: "8px 14px", background: "#fafaf9", borderBottom: "1px solid #e5e5e5", fontSize: 10, fontWeight: 600, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            <span>ID</span><span>Customer</span><span>Type</span><span>Expected</span><span>Collected</span><span>Status</span>
          </div>
          {cod.map(d => (
            <div key={d.id} style={{ display: "grid", gridTemplateColumns: "90px 1.5fr 70px 90px 90px 80px", padding: "10px 14px", borderBottom: "1px solid #f5f5f4", fontSize: 13, alignItems: "center" }}>
              <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "#a3a3a3" }}>{d.id.split("-").slice(-1)[0]}</span>
              <span style={{ fontWeight: 500, color: "#262626" }}>{d.customer}</span>
              <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, fontWeight: 600, color: d.payment === "cod_cash" ? "#b45309" : "#1d4ed8" }}>{d.payment === "cod_cash" ? "CASH" : "CARD"}</span>
              <span style={{ fontFamily: "var(--f-mono)", fontWeight: 500 }}>${d.amount.toFixed(2)}</span>
              <span style={{ fontFamily: "var(--f-mono)", fontWeight: 500, color: d.collectedAmt >= d.amount ? "#16a34a" : "#a3a3a3" }}>${d.collectedAmt.toFixed(2)}</span>
              <Badge status={d.status} />
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>By Operator</div>
        {OPERATORS.map(op => { const opCod = cod.filter(d => d.operatorId === op.id); const opCol = opCod.filter(d => d.status === "delivered").reduce((s,d) => s + d.collectedAmt, 0); const opExp = opCod.reduce((s,d) => s + d.amount, 0); return (
          <div key={op.id} style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 4, padding: "12px 16px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontWeight: 600, color: "#171717", fontSize: 14 }}>{op.name}</div><div style={{ fontSize: 12, color: "#a3a3a3", fontFamily: "var(--f-mono)" }}>{opCod.length} COD items</div></div>
            <div style={{ fontFamily: "var(--f-mono)", fontWeight: 600, fontSize: 15, color: opCol >= opExp && opExp > 0 ? "#16a34a" : "#525252" }}>${opCol.toFixed(0)} / ${opExp.toFixed(0)}</div>
          </div>
        ); })}
      </div>
    );
  };

  const renderView = () => { switch (view) { case "dashboard": return <DashboardView />; case "deliveries": case "runsheet": return <DeliveriesView />; case "operators": return <OperatorsView />; case "drivers": return <DriversView />; case "reconcile": return <ReconcileView />; default: return <DashboardView />; } };

  // ── Layout ──────────────────────────────────────────────────────
  return (
    <div style={{ "--f-display": "'Source Serif 4', Georgia, serif", "--f-body": "'IBM Plex Sans', system-ui, sans-serif", "--f-mono": "'IBM Plex Mono', monospace", fontFamily: "var(--f-body)", minHeight: "100vh", background: "#f5f5f4" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=Source+Serif+4:wght@600;700;800&display=swap" rel="stylesheet" />
      {toast && <div style={{ position: "fixed", top: 16, right: 16, zIndex: 2000, padding: "10px 18px", borderRadius: 4, fontSize: 13, fontWeight: 600, background: toast.type === "err" ? "#fee2e2" : "#dcfce7", color: toast.type === "err" ? "#991b1b" : "#166534", border: `1px solid ${toast.type === "err" ? "#fecaca" : "#bbf7d0"}`, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", animation: "fadeUp 0.25s ease" }}>{toast.msg}</div>}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 52, background: "#171717", borderBottom: "1px solid #2a2a2a", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: accentColor, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#171717" strokeWidth="2.5" strokeLinecap="round"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#fafafa", fontFamily: "var(--f-display)", letterSpacing: "-0.01em" }}>Koala Runs</span>
          <span style={{ fontSize: 11, color: "#525252", fontFamily: "var(--f-mono)", marginLeft: 4 }}>{role === ROLES.ADMIN ? "WAREHOUSE" : user?.name?.toUpperCase()}</span>
        </div>
        <button onClick={() => { setRole(null); setUser(null); setView("dashboard"); setFilterSt("all"); setSearch(""); }} className="dm-btn" style={{ padding: "5px 10px", background: "rgba(255,255,255,0.06)", color: "#a3a3a3", fontSize: 12, border: "1px solid rgba(255,255,255,0.1)" }}>Switch Role</button>
      </header>
      <nav style={{ display: "flex", gap: 0, padding: "0 20px", background: "#fff", borderBottom: "1px solid #e5e5e5", position: "sticky", top: 52, zIndex: 99, overflowX: "auto" }}>
        {nav[role].map(item => (
          <button key={item.id} onClick={() => setView(item.id)} className="dm-btn" style={{ borderRadius: 0, padding: "12px 16px", fontSize: 13, background: "transparent", color: view === item.id ? "#171717" : "#a3a3a3", fontWeight: view === item.id ? 700 : 500, borderBottom: view === item.id ? `2px solid ${accentColor}` : "2px solid transparent", marginBottom: -1 }}>{item.label}</button>
        ))}
      </nav>
      <main style={{ maxWidth: 860, margin: "0 auto", padding: "20px 20px 60px" }}>{renderView()}</main>
      <DetailPanel />
      <CashModalView />
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { transform:translateX(30px); opacity:0; } to { transform:translateX(0); opacity:1; } }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        .dm-btn { border: none; border-radius: 4px; padding: 9px 14px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: var(--f-body); transition: opacity 0.15s; }
        .dm-btn:hover { opacity: 0.85; }
        .dm-btn:active { transform: scale(0.98); }
        .dm-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .dm-row:hover { background: #fafaf9 !important; }
        input:focus { border-color: #a3a3a3 !important; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #d4d4d4; border-radius: 2px; }
      `}</style>
    </div>
  );
}
