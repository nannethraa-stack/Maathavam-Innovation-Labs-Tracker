import React, { useState, useMemo, useEffect } from "react";
import { Plus, X, Pencil, Trash2, Wallet, LayoutGrid, ChevronRight, Building2, User, Circle, ClipboardList, LayoutDashboard, ShieldCheck, ShieldAlert, ShieldQuestion, Upload, Paperclip, FileText } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const LOGO_URI = "/logo.jpg";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');`;

const STATUSES = [
  { key: "idea", label: "Idea", color: "#8B7355" },
  { key: "validating", label: "Validating", color: "#B45309" },
  { key: "building", label: "Building", color: "#1D4E5F" },
  { key: "testing", label: "Testing", color: "#0F766E" },
  { key: "launched", label: "Launched", color: "#15803D" },
  { key: "paused", label: "Paused / Killed", color: "#6B7280" },
];

const PATENT_STATUSES = ["Not started", "Drafting", "Filed", "Published", "Granted", "Not applicable"];

const seedConcepts = [
  { id: "c1", name: "Cradle Project", description: "Smart bassinet with sleep monitoring for new parents.", domain: "Consumer Hardware / IoT", patentStatus: "Filed", plannedOrgForPOC: "Sunrise Hospitals", status: "building", eta: "2026-11-15", requiresSensor: "Yes", artifacts: [], createdAt: "2026-05-02" },
  { id: "c2", name: "PantryPal", description: "App that tracks pantry stock and suggests recipes.", domain: "Consumer Software", patentStatus: "Not applicable", plannedOrgForPOC: "—", status: "idea", eta: "2026-12-01", requiresSensor: "No", artifacts: [], createdAt: "2026-07-14" },
  { id: "c3", name: "RouteWise", description: "Delivery route optimizer for small local couriers.", domain: "Logistics / SaaS", patentStatus: "Drafting", plannedOrgForPOC: "Metro Courier Co.", status: "testing", eta: "2026-10-05", requiresSensor: "No", artifacts: [], createdAt: "2026-03-20" },
];

const seedExpenses = [
  { id: "e1", conceptId: "c1", description: "Bassinet frame prototype (3D print + materials)", amount: 6200, paidBy: "Ananya", source: "Out of pocket", date: "2026-05-10" },
  { id: "e2", conceptId: "c1", description: "Sleep sensor module x10", amount: 5300, paidBy: "Company card", source: "Company", date: "2026-06-02" },
  { id: "e3", conceptId: "c1", description: "User research incentives", amount: 2500, paidBy: "Ravi", source: "Out of pocket", date: "2026-06-18" },
  { id: "e4", conceptId: "c3", description: "Mapbox API credits", amount: 1800, paidBy: "Company card", source: "Company", date: "2026-04-01" },
];

function patentBucket(status) {
  if (status === "Granted") return "Patented";
  if (status === "Filed" || status === "Published") return "Provisional Patented";
  return "Not Patented";
}

const WHEEL_COLORS = ["#1D4E5F", "#0F766E", "#B45309", "#8B7355", "#6B7280", "#15803D", "#7C3AED", "#B42318"];

function currency(n) {
  return "₹" + (n || 0).toLocaleString("en-IN");
}

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function uid(prefix) {
  return prefix + Math.random().toString(36).slice(2, 9);
}

function slugify(label) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || uid("status");
}

function addStatusOption(label) {
  const clean = label.trim();
  if (!clean) return null;
  const existing = STATUSES.find((s) => s.label.toLowerCase() === clean.toLowerCase());
  if (existing) return existing.key;
  let key = slugify(clean);
  if (STATUSES.some((s) => s.key === key)) key = key + "-" + uid("");
  const color = WHEEL_COLORS[STATUSES.length % WHEEL_COLORS.length];
  STATUSES.push({ key, label: clean, color });
  return key;
}

function StatusPill({ statusKey }) {
  const s = STATUSES.find((x) => x.key === statusKey) || STATUSES[0];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontSize: 12.5, fontWeight: 500, color: s.color,
      background: s.color + "16", padding: "4px 10px", borderRadius: 20,
      fontFamily: "'IBM Plex Sans', sans-serif", whiteSpace: "nowrap"
    }}>
      <Circle size={7} fill={s.color} stroke="none" />
      {s.label}
    </span>
  );
}

function StatusSelect({ value, onChange, style }) {
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  function commitNew() {
    const key = addStatusOption(newLabel);
    if (key) onChange(key);
    setAdding(false);
    setNewLabel("");
  }

  if (adding) {
    return (
      <div style={{ display: "flex", gap: 6, ...style }}>
        <input
          autoFocus
          style={{ ...inputStyle, flex: 1 }}
          placeholder="New status name"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commitNew(); }
            if (e.key === "Escape") { setAdding(false); setNewLabel(""); }
          }}
        />
        <button type="button" style={{ ...btnPrimary, padding: "9px 12px" }} onClick={commitNew}>Add</button>
        <button type="button" style={{ ...btnGhost, padding: "9px 12px" }} onClick={() => { setAdding(false); setNewLabel(""); }}>Cancel</button>
      </div>
    );
  }

  return (
    <select
      style={{ ...inputStyle, ...style }}
      value={value}
      onChange={(e) => {
        if (e.target.value === "__add_new__") setAdding(true);
        else onChange(e.target.value);
      }}
    >
      {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
      <option value="__add_new__">+ Add new status…</option>
    </select>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(20,20,18,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FAFAF7", borderRadius: 10, width: wide ? 560 : 440,
          maxWidth: "100%", maxHeight: "88vh", overflowY: "auto",
          boxShadow: "0 20px 60px rgba(20,20,18,0.25)", border: "1px solid #E5E2D9"
        }}
      >
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 22px", borderBottom: "1px solid #EAE7DC"
        }}>
          <h3 style={{
            fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 19,
            color: "#1B1F2A", margin: 0
          }}>{title}</h3>
          <button onClick={onClose} style={{
            border: "none", background: "transparent", cursor: "pointer",
            color: "#8A8776", padding: 4, display: "flex"
          }}><X size={18} /></button>
        </div>
        <div style={{ padding: "20px 22px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: "block", fontSize: 12.5, fontWeight: 600, color: "#6B6858",
        marginBottom: 6, fontFamily: "'IBM Plex Sans', sans-serif"
      }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "9px 11px", borderRadius: 6,
  border: "1px solid #DAD6C8", fontSize: 14.5, fontFamily: "'IBM Plex Sans', sans-serif",
  color: "#1B1F2A", background: "#fff", boxSizing: "border-box", outline: "none"
};

function ConceptForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [domain, setDomain] = useState(initial?.domain || "");
  const [patentStatus, setPatentStatus] = useState(initial?.patentStatus || PATENT_STATUSES[0]);
  const [plannedOrgForPOC, setPlannedOrgForPOC] = useState(initial?.plannedOrgForPOC || "");
  const [status, setStatus] = useState(initial?.status || "idea");
  const [eta, setEta] = useState(initial?.eta || "");
  const [requiresSensor, setRequiresSensor] = useState(initial?.requiresSensor || "No");
  const [artifacts, setArtifacts] = useState(initial?.artifacts || []);
  const fileInputRef = React.useRef(null);

  function handleFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setArtifacts((prev) => [...prev, { id: uid("a"), name: file.name, type: file.type, size: file.size, dataUrl: reader.result, uploadedAt: new Date().toISOString().slice(0, 10) }]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div>
      <Field label="Project name">
        <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cradle Project" />
      </Field>
      <Field label="Description">
        <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this concept about?" />
      </Field>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Field label="Domain">
            <input style={inputStyle} value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="e.g. Consumer Hardware" />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Provisional patent filed status">
            <select style={inputStyle} value={patentStatus} onChange={(e) => setPatentStatus(e.target.value)}>
              {PATENT_STATUSES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        </div>
      </div>
      <Field label="Planned organisation for POC">
        <input style={inputStyle} value={plannedOrgForPOC} onChange={(e) => setPlannedOrgForPOC(e.target.value)} placeholder="e.g. Sunrise Hospitals" />
      </Field>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Field label="Status">
            <StatusSelect value={status} onChange={setStatus} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="ETA">
            <input style={inputStyle} type="date" value={eta} onChange={(e) => setEta(e.target.value)} />
          </Field>
        </div>
      </div>
      <Field label="Requires sensor">
        <div style={{ display: "flex", gap: 10 }}>
          {["Yes", "No"].map((opt) => (
            <button
              key={opt}
              onClick={() => setRequiresSensor(opt)}
              style={{
                flex: 1, padding: "9px 10px", borderRadius: 6, cursor: "pointer",
                border: requiresSensor === opt ? "1.5px solid #1D4E5F" : "1px solid #DAD6C8",
                background: requiresSensor === opt ? "#1D4E5F10" : "#fff",
                color: requiresSensor === opt ? "#1D4E5F" : "#6B6858",
                fontWeight: 600, fontSize: 13.5, fontFamily: "'IBM Plex Sans', sans-serif"
              }}
            >{opt}</button>
          ))}
        </div>
      </Field>

      <Field label="Artifacts">
        <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileSelected} />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{ ...btnGhost, display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", marginBottom: artifacts.length ? 10 : 0 }}
          type="button"
        >
          <Upload size={14} /> Upload artifact
        </button>
        {artifacts.length > 0 && (
          <div style={{ border: "1px solid #E5E2D9", borderRadius: 8, overflow: "hidden" }}>
            {artifacts.map((a, i) => (
              <div key={a.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "9px 12px", borderTop: i === 0 ? "none" : "1px solid #EFEDE3"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <FileText size={14} color="#8A8776" style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: "#8A8776" }}>{formatSize(a.size)}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <IconBtn onClick={() => setPreviewArtifact(a)} title="View">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </IconBtn>
                  <IconBtn onClick={() => { const link = document.createElement("a"); link.href = a.url || a.dataUrl; link.download = a.name; document.body.appendChild(link); link.click(); document.body.removeChild(link); }} title="Download">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </IconBtn>
                  <IconBtn onClick={() => setArtifacts(artifacts.filter((x) => x.id !== a.id))}><Trash2 size={12} /></IconBtn>
                </div>
              </div>
            ))}
          </div>
        )}
      </Field>

      <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={btnGhost}>Cancel</button>
        <button
          onClick={async () => { if (name.trim()) await onSave({ name: name.trim(), description, domain, patentStatus, plannedOrgForPOC, status, eta, requiresSensor, artifacts }); }}
          style={btnPrimary}
        >{initial ? "Save changes" : "Add concept"}</button>
      </div>
    </div>
  );
}

function ExpenseForm({ initial, concepts, defaultConceptId, onSave, onCancel }) {
  const [conceptId, setConceptId] = useState(initial?.conceptId || defaultConceptId || (concepts[0]?.id ?? ""));
  const [description, setDescription] = useState(initial?.description || "");
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [source, setSource] = useState(initial?.source || "Out of pocket");
  const [paidBy, setPaidBy] = useState(initial?.paidBy || "");
  const [date, setDate] = useState(initial?.date || new Date().toISOString().slice(0, 10));

  return (
    <div>
      <Field label="Linked concept">
        <select style={inputStyle} value={conceptId} onChange={(e) => setConceptId(e.target.value)}>
          {concepts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="What was it for">
        <input style={inputStyle} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Sensor module x10" />
      </Field>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Field label="Amount (₹)">
            <input style={inputStyle} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Date">
            <input style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
      </div>
      <Field label="Funding source">
        <div style={{ display: "flex", gap: 10 }}>
          {["Out of pocket", "Company"].map((opt) => (
            <button
              key={opt}
              onClick={() => setSource(opt)}
              style={{
                flex: 1, padding: "9px 10px", borderRadius: 6, cursor: "pointer",
                border: source === opt ? "1.5px solid #1D4E5F" : "1px solid #DAD6C8",
                background: source === opt ? "#1D4E5F10" : "#fff",
                color: source === opt ? "#1D4E5F" : "#6B6858",
                fontWeight: 600, fontSize: 13.5, fontFamily: "'IBM Plex Sans', sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6
              }}
            >
              {opt === "Company" ? <Building2 size={14} /> : <User size={14} />}
              {opt}
            </button>
          ))}
        </div>
      </Field>
      <Field label={source === "Company" ? "Paid via (card / account)" : "Paid by (person)"}>
        <input style={inputStyle} value={paidBy} onChange={(e) => setPaidBy(e.target.value)} placeholder={source === "Company" ? "e.g. Company card" : "e.g. Ananya"} />
      </Field>
      <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={btnGhost}>Cancel</button>
        <button
          onClick={async () => {
            if (!description.trim() || !amount || !conceptId) return;
            await onSave({ conceptId, description: description.trim(), amount: Number(amount), source, paidBy: paidBy.trim(), date });
          }}
          style={btnPrimary}
        >{initial ? "Save changes" : "Add expense"}</button>
      </div>
    </div>
  );
}

const btnPrimary = {
  padding: "9px 16px", borderRadius: 6, border: "none", background: "#1D4E5F",
  color: "#fff", fontWeight: 600, fontSize: 13.5, cursor: "pointer",
  fontFamily: "'IBM Plex Sans', sans-serif"
};
const btnGhost = {
  padding: "9px 16px", borderRadius: 6, border: "1px solid #DAD6C8", background: "transparent",
  color: "#5B5847", fontWeight: 600, fontSize: 13.5, cursor: "pointer",
  fontFamily: "'IBM Plex Sans', sans-serif"
};

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [concepts, setConcepts] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/concepts").then((r) => r.json()),
      fetch("/api/expenses").then((r) => r.json()),
    ]).then(([conceptsData, expensesData]) => {
      setConcepts(conceptsData);
      setExpenses(expensesData);
    }).catch(() => {
      setConcepts(seedConcepts);
      setExpenses(seedExpenses);
    });
  }, []);

  const [conceptModal, setConceptModal] = useState(null);
  const [expenseModal, setExpenseModal] = useState(null);
  const [detailConcept, setDetailConcept] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [previewArtifact, setPreviewArtifact] = useState(null);
  const [expenseFilter, setExpenseFilter] = useState("all");

  useEffect(() => {
    fetch("/api/concepts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(concepts),
    }).catch(() => {});
  }, [concepts]);

  useEffect(() => {
    fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expenses),
    }).catch(() => {});
  }, [expenses]);

  const expenseTotals = useMemo(() => {
    const map = {};
    for (const e of expenses) map[e.conceptId] = (map[e.conceptId] || 0) + e.amount;
    return map;
  }, [expenses]);

  const totalSpentOverall = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  const domainBreakdown = useMemo(() => {
    const map = {};
    for (const c of concepts) {
      const key = (c.domain || "Unspecified").trim();
      if (!map[key]) map[key] = { domain: key, count: 0, spend: 0 };
      map[key].count += 1;
      map[key].spend += expenseTotals[c.id] || 0;
    }
    return Object.values(map).sort((a, b) => b.spend - a.spend);
  }, [concepts, expenseTotals]);

  const patentBreakdown = useMemo(() => {
    const buckets = { "Patented": 0, "Provisional Patented": 0, "Not Patented": 0 };
    for (const c of concepts) buckets[patentBucket(c.patentStatus)] += 1;
    return buckets;
  }, [concepts]);

  const wheelData = useMemo(() => {
    return concepts
      .map((c) => ({ name: c.name, value: expenseTotals[c.id] || 0 }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [concepts, expenseTotals]);

  async function saveConcept(data) {
    const payload = conceptModal && conceptModal.id ? { ...data, id: conceptModal.id } : { ...data, id: uid("c"), createdAt: new Date().toISOString().slice(0, 10), artifacts: data.artifacts || [] };
    const saved = await fetch("/api/concepts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => r.json());

    setConcepts((prev) => {
      if (prev.find((c) => c.id === saved.id)) return prev.map((c) => c.id === saved.id ? saved : c);
      return [saved, ...prev];
    });
    setConceptModal(null);
  }

  async function saveExpense(data) {
    const payload = expenseModal && expenseModal.id ? { ...data, id: expenseModal.id } : { ...data, id: uid("e") };
    const saved = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => r.json());

    setExpenses((prev) => {
      if (prev.find((e) => e.id === saved.id)) return prev.map((e) => e.id === saved.id ? saved : e);
      return [saved, ...prev];
    });
    setExpenseModal(null);
  }

  async function addArtifact(conceptId, file) {
    const reader = new FileReader();
    const artifact = await new Promise((resolve) => {
      reader.onload = () => {
        resolve({
          id: uid("a"),
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: reader.result,
          uploadedAt: new Date().toISOString().slice(0, 10),
        });
      };
      reader.readAsDataURL(file);
    });

    setConcepts((prev) => {
      const updated = prev.map((c) => c.id === conceptId ? { ...c, artifacts: [...(c.artifacts || []), artifact] } : c);
      const concept = updated.find((c) => c.id === conceptId);
      if (concept) {
        fetch("/api/concepts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(concept),
        }).catch(() => {});
      }
      return updated;
    });
  }

  async function deleteArtifact(conceptId, artifactId) {
    setConcepts((prev) => {
      const updated = prev.map((c) => c.id === conceptId ? { ...c, artifacts: (c.artifacts || []).filter((a) => a.id !== artifactId) } : c);
      const concept = updated.find((c) => c.id === conceptId);
      if (concept) {
        fetch("/api/concepts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(concept),
        }).catch(() => {});
      }
      return updated;
    });
  }

  async function doDelete() {
    if (!confirmDelete) return;
    if (confirmDelete.type === "concept") {
      await fetch(`/api/concepts/${confirmDelete.id}`, { method: "DELETE" });
      setConcepts((prev) => prev.filter((c) => c.id !== confirmDelete.id));
      setExpenses((prev) => prev.filter((e) => e.conceptId !== confirmDelete.id));
      if (detailConcept?.id === confirmDelete.id) setDetailConcept(null);
    } else {
      await fetch(`/api/expenses/${confirmDelete.id}`, { method: "DELETE" });
      setExpenses((prev) => prev.filter((e) => e.id !== confirmDelete.id));
    }
    setConfirmDelete(null);
  }

  const conceptName = (id) => concepts.find((c) => c.id === id)?.name || "—";
  const visibleExpenses = expenseFilter === "all" ? expenses : expenses.filter((e) => e.conceptId === expenseFilter);
  const totalOutOfPocket = expenses.filter((e) => e.source === "Out of pocket").reduce((s, e) => s + e.amount, 0);
  const totalCompany = expenses.filter((e) => e.source === "Company").reduce((s, e) => s + e.amount, 0);

  return (
    <div style={{
      fontFamily: "'IBM Plex Sans', sans-serif", background: "#F3F1EA", minHeight: "100vh",
      color: "#1B1F2A", display: "flex"
    }}>
      <style>{FONT_IMPORT}{`
        * { box-sizing: border-box; }
        ::placeholder { color: #A9A48E; }
        button:hover { opacity: 0.92; }
        table { border-collapse: collapse; width: 100%; }
      `}</style>

      {/* Sidebar */}
      <div style={{
        width: 230, minHeight: "100vh", background: "#1B1F2A", color: "#E7E5DC",
        padding: "26px 16px", flexShrink: 0
      }}>
        <div style={{ marginBottom: 26 }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 10, marginBottom: 12 }}>
            <img src={LOGO_URI} alt="Maathavam Innovation Labs" style={{ width: "100%", display: "block" }} />
          </div>
          <div style={{
            fontSize: 11.5, fontWeight: 800, color: "#D4A24E", textAlign: "center",
            letterSpacing: 1.4, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase"
          }}>
            Innovate to Impact Lives
          </div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { key: "concepts", label: "Concepts", icon: LayoutGrid },
            { key: "summary", label: "Status Summary", icon: ClipboardList },
            { key: "expenses", label: "Expenses", icon: Wallet },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => { setTab(item.key); setDetailConcept(null); }}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                borderRadius: 7, border: "none", cursor: "pointer", textAlign: "left",
                background: tab === item.key ? "#2B3140" : "transparent",
                color: tab === item.key ? "#fff" : "#B5B2A5",
                fontSize: 14, fontWeight: 500, fontFamily: "'IBM Plex Sans', sans-serif"
              }}
            >
              <item.icon size={16} /> {item.label}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid #333A4A" }}>
          <div style={{ fontSize: 11.5, color: "#8B8878", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10 }}>Spend summary</div>
          <div style={{ fontSize: 12.5, display: "flex", justifyContent: "space-between", marginBottom: 6, color: "#C7C4B6" }}>
            <span>Out of pocket</span><span>{currency(totalOutOfPocket)}</span>
          </div>
          <div style={{ fontSize: 12.5, display: "flex", justifyContent: "space-between", color: "#C7C4B6" }}>
            <span>Company</span><span>{currency(totalCompany)}</span>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: "34px 40px", maxWidth: 1100 }}>
        {tab === "dashboard" && (
          <>
            <div style={{ marginBottom: 26 }}>
              <h1 style={{
                fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 34, margin: 0,
                background: "linear-gradient(90deg, #1D4E5F 0%, #0F766E 45%, #B45309 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                letterSpacing: 0.2
              }}>From Spark to Spend.</h1>
              <p style={{ margin: "8px 0 0", color: "#6B6858", fontSize: 15, fontWeight: 500 }}>Ideas, patents, POCs, and every rupee spent — all synced, all in view.</p>
            </div>

            {/* Total concepts captured */}
            <div style={{ marginBottom: 14, maxWidth: 220 }}>
              <KpiCard label="Total concepts captured" value={concepts.length} accent="#1D4E5F" />
            </div>

            {/* Concepts by domain — grouped totals */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 22 }}>
              {domainBreakdown.length === 0 ? (
                <EmptyState text="No domains tracked yet." />
              ) : (
                domainBreakdown.map((d) => (
                  <KpiCard key={d.domain} label={d.domain} value={d.count} accent="#1D4E5F" />
                ))
              )}
            </div>

            {/* Patent breakdown */}
            <div style={{ marginBottom: 16 }}>
              <Panel title="By patent status">
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 180 }}><PatentRow icon={ShieldCheck} color="#15803D" label="Patented" value={patentBreakdown["Patented"]} /></div>
                  <div style={{ flex: 1, minWidth: 180 }}><PatentRow icon={ShieldQuestion} color="#B45309" label="Provisional Patented" value={patentBreakdown["Provisional Patented"]} /></div>
                  <div style={{ flex: 1, minWidth: 180 }}><PatentRow icon={ShieldAlert} color="#8A8776" label="Not Patented" value={patentBreakdown["Not Patented"]} /></div>
                </div>
              </Panel>
            </div>

            {/* Concept-wise project summary */}
            <div style={{ marginBottom: 16 }}>
              <Panel title="Project summary — concept wise">
                {concepts.length === 0 ? <EmptyState text="No concepts yet." /> : (
                  <div style={{ overflow: "auto" }}>
                    <table>
                      <thead>
                        <tr style={{ textAlign: "left" }}>
                          {["Project Name", "Domain", "Provisional Patent Filed Status", "Planned Organisation for POC", "Status", "ETA", "Sensor", "Total Spent"].map((h) => (
                            <th key={h} style={{ padding: "6px 14px 10px 0", fontSize: 12, color: "#8A8776", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3, whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {concepts.map((c) => (
                          <tr
                            key={c.id}
                            style={{ borderTop: "1px solid #EFEDE3", cursor: "pointer" }}
                            onClick={() => { setTab("concepts"); setDetailConcept(c); }}
                          >
                            <td style={{ padding: "10px 14px 10px 0", fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap" }}>{c.name}</td>
                            <td style={{ padding: "10px 14px 10px 0", fontSize: 13.5, color: "#4C4A3E", whiteSpace: "nowrap" }}>{c.domain || "—"}</td>
                            <td style={{ padding: "10px 14px 10px 0", whiteSpace: "nowrap" }}>
                              <span style={{
                                fontSize: 12, fontWeight: 600, padding: "3px 9px", borderRadius: 20,
                                background: c.patentStatus === "Filed" || c.patentStatus === "Granted" ? "#0F766E14" : "#8A877614",
                                color: c.patentStatus === "Filed" || c.patentStatus === "Granted" ? "#0F766E" : "#6B6858",
                              }}>{c.patentStatus || "Not started"}</span>
                            </td>
                            <td style={{ padding: "10px 14px 10px 0", fontSize: 13.5, color: "#4C4A3E", whiteSpace: "nowrap" }}>{c.plannedOrgForPOC || "—"}</td>
                            <td style={{ padding: "10px 14px 10px 0", whiteSpace: "nowrap" }}><StatusPill statusKey={c.status} /></td>
                            <td style={{ padding: "10px 14px 10px 0", fontSize: 13.5, color: "#4C4A3E", whiteSpace: "nowrap" }}>{c.eta || "—"}</td>
                            <td style={{ padding: "10px 14px 10px 0", whiteSpace: "nowrap" }}>
                              <span style={{
                                fontSize: 12, fontWeight: 600, padding: "3px 9px", borderRadius: 20,
                                background: c.requiresSensor === "Yes" ? "#B4530914" : "#8A877614",
                                color: c.requiresSensor === "Yes" ? "#B45309" : "#6B6858",
                              }}>{c.requiresSensor || "No"}</span>
                            </td>
                            <td style={{ padding: "10px 14px 10px 0", fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap" }}>{currency(expenseTotals[c.id] || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>
            </div>

            {/* Project-wise total spend (simple table) */}
            <div style={{ marginBottom: 16 }}>
            <Panel title="Total spend — project wise">
              {wheelData.length === 0 ? <EmptyState text="No expenses recorded yet." /> : (
                <table>
                  <thead>
                    <tr style={{ textAlign: "left" }}>
                      <th style={{ padding: "6px 10px 10px 0", fontSize: 12, color: "#8A8776", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>Project</th>
                      <th style={{ padding: "6px 10px 10px 0", fontSize: 12, color: "#8A8776", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3, textAlign: "right" }}>Total spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wheelData.map((d) => (
                      <tr key={d.name} style={{ borderTop: "1px solid #EFEDE3" }}>
                        <td style={{ padding: "9px 10px 9px 0", fontSize: 13.5, fontWeight: 500 }}>{d.name}</td>
                        <td style={{ padding: "9px 10px 9px 0", fontSize: 13.5, fontWeight: 600, textAlign: "right" }}>{currency(d.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: "1.5px solid #E5E2D9" }}>
                      <td style={{ padding: "10px 10px 4px 0", fontSize: 13, fontWeight: 700 }}>Total</td>
                      <td style={{ padding: "10px 10px 4px 0", fontSize: 14, fontWeight: 700, textAlign: "right" }}>{currency(totalSpentOverall)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </Panel>
            </div>

            {/* Flywheel - project-wise spend */}
            <Panel title="Project-wise spend">
              {wheelData.length === 0 ? <EmptyState text="No expenses recorded yet — the flywheel fills in once spend is logged." /> : (
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ width: 280, height: 280, flexShrink: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={wheelData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={70}
                          outerRadius={130}
                          paddingAngle={2}
                          startAngle={90}
                          endAngle={-270}
                        >
                          {wheelData.map((entry, i) => (
                            <Cell key={entry.name} fill={WHEEL_COLORS[i % WHEEL_COLORS.length]} stroke="#FAFAF7" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => currency(v)} contentStyle={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, borderRadius: 8, border: "1px solid #E5E2D9" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ flex: 1, minWidth: 220, display: "flex", flexDirection: "column", gap: 9 }}>
                    {wheelData.map((d, i) => (
                      <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 3, background: WHEEL_COLORS[i % WHEEL_COLORS.length], display: "inline-block" }} />
                          {d.name}
                        </span>
                        <span style={{ fontWeight: 600 }}>{currency(d.value)} <span style={{ color: "#8A8776", fontWeight: 400 }}>({Math.round((d.value / totalSpentOverall) * 100)}%)</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Panel>
          </>
        )}

        {tab === "concepts" && !detailConcept && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 26 }}>
              <div>
                <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 30, margin: 0, color: "#1B1F2A" }}>Concepts</h1>
                <p style={{ margin: "6px 0 0", color: "#6B6858", fontSize: 14.5 }}>Every idea your team is exploring, with its current status.</p>
              </div>
              <button style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6 }} onClick={() => setConceptModal("new")}>
                <Plus size={16} /> Add concept
              </button>
            </div>

            {concepts.length === 0 ? (
              <EmptyState text="No concepts yet. Add your team's first idea to start tracking it." />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {concepts.map((c) => (
                  <div key={c.id} style={{
                    background: "#fff", border: "1px solid #E5E2D9", borderRadius: 10,
                    padding: 18, cursor: "pointer", display: "flex", flexDirection: "column", gap: 10
                  }} onClick={() => setDetailConcept(c)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 17.5, margin: 0 }}>{c.name}</h3>
                      <ChevronRight size={16} color="#A9A48E" />
                    </div>
                    <p style={{ fontSize: 13.5, color: "#6B6858", margin: 0, lineHeight: 1.5 }}>{c.description || "No description yet."}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                      <StatusPill statusKey={c.status} />
                      <span style={{ fontSize: 13, color: "#8A8776", fontWeight: 500 }}>{currency(expenseTotals[c.id] || 0)} spent</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "concepts" && detailConcept && (
          <ConceptDetail
            concept={concepts.find((c) => c.id === detailConcept.id) || detailConcept}
            expenses={expenses.filter((e) => e.conceptId === detailConcept.id)}
            total={expenseTotals[detailConcept.id] || 0}
            onBack={() => setDetailConcept(null)}
            onEdit={() => setConceptModal(concepts.find((c) => c.id === detailConcept.id))}
            onDelete={() => setConfirmDelete({ type: "concept", id: detailConcept.id, label: detailConcept.name })}
            onStatusChange={async (status) => {
              const updated = concepts.map((c) => c.id === detailConcept.id ? { ...c, status } : c);
              setConcepts(updated);
              const concept = updated.find((c) => c.id === detailConcept.id);
              if (concept) {
                await fetch("/api/concepts", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(concept),
                });
              }
            }}
            onAddExpense={() => setExpenseModal({ mode: "new", conceptId: detailConcept.id })}
            onEditExpense={(e) => setExpenseModal(e)}
            onDeleteExpense={(e) => setConfirmDelete({ type: "expense", id: e.id, label: e.description })}
            onUploadArtifact={(file) => addArtifact(detailConcept.id, file)}
            onDeleteArtifact={(artifactId) => deleteArtifact(detailConcept.id, artifactId)}
          />
        )}

        {tab === "summary" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22 }}>
              <div>
                <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 30, margin: 0 }}>Status Summary</h1>
                <p style={{ margin: "6px 0 0", color: "#6B6858", fontSize: 14.5 }}>One row per concept, at a glance.</p>
              </div>
              <button style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6 }} onClick={() => setConceptModal("new")}>
                <Plus size={16} /> Add concept
              </button>
            </div>

            {concepts.length === 0 ? (
              <EmptyState text="No concepts yet. Add your team's first idea to start tracking it." />
            ) : (
              <div style={{ background: "#fff", border: "1px solid #E5E2D9", borderRadius: 10, overflow: "auto" }}>
                <table>
                  <thead>
                    <tr style={{ background: "#F7F5EE", textAlign: "left" }}>
                      {["Project Name", "Domain", "Provisional Patent Filed Status", "Planned Organisation for POC", "Status", "ETA", "Sensor", ""].map((h) => (
                        <th key={h} style={{ padding: "11px 16px", fontSize: 12, color: "#8A8776", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {concepts.map((c) => (
                      <tr
                        key={c.id}
                        style={{ borderTop: "1px solid #EFEDE3", cursor: "pointer" }}
                        onClick={() => { setTab("concepts"); setDetailConcept(c); }}
                      >
                        <td style={{ padding: "12px 16px", fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap" }}>{c.name}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13.5, color: "#4C4A3E", whiteSpace: "nowrap" }}>{c.domain || "—"}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            fontSize: 12, fontWeight: 600, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap",
                            background: c.patentStatus === "Filed" || c.patentStatus === "Granted" ? "#0F766E14" : "#8A877614",
                            color: c.patentStatus === "Filed" || c.patentStatus === "Granted" ? "#0F766E" : "#6B6858",
                          }}>{c.patentStatus || "Not started"}</span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13.5, color: "#4C4A3E", whiteSpace: "nowrap" }}>{c.plannedOrgForPOC || "—"}</td>
                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}><StatusPill statusKey={c.status} /></td>
                        <td style={{ padding: "12px 16px", fontSize: 13.5, color: "#4C4A3E", whiteSpace: "nowrap" }}>{c.eta || "—"}</td>
                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                          <span style={{
                            fontSize: 12, fontWeight: 600, padding: "3px 9px", borderRadius: 20,
                            background: c.requiresSensor === "Yes" ? "#B4530914" : "#8A877614",
                            color: c.requiresSensor === "Yes" ? "#B45309" : "#6B6858",
                          }}>{c.requiresSensor || "No"}</span>
                        </td>
                        <td style={{ padding: "12px 16px" }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <IconBtn onClick={() => setConceptModal(c)}><Pencil size={13} /></IconBtn>
                            <IconBtn onClick={() => setConfirmDelete({ type: "concept", id: c.id, label: c.name })}><Trash2 size={13} /></IconBtn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === "expenses" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22 }}>
              <div>
                <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 30, margin: 0 }}>Expenses</h1>
                <p style={{ margin: "6px 0 0", color: "#6B6858", fontSize: 14.5 }}>Every spend, linked back to the concept it belongs to.</p>
              </div>
              <button style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6 }} onClick={() => setExpenseModal({ mode: "new" })}>
                <Plus size={16} /> Add expense
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <FilterChip active={expenseFilter === "all"} onClick={() => setExpenseFilter("all")}>All concepts</FilterChip>
              {concepts.map((c) => (
                <FilterChip key={c.id} active={expenseFilter === c.id} onClick={() => setExpenseFilter(c.id)}>{c.name}</FilterChip>
              ))}
            </div>

            {visibleExpenses.length === 0 ? (
              <EmptyState text="No expenses recorded here yet." />
            ) : (
              <div style={{ background: "#fff", border: "1px solid #E5E2D9", borderRadius: 10, overflow: "hidden" }}>
                <table>
                  <thead>
                    <tr style={{ background: "#F7F5EE", textAlign: "left" }}>
                      {["Concept", "Description", "Date", "Source", "Paid by", "Amount", ""].map((h) => (
                        <th key={h} style={{ padding: "11px 16px", fontSize: 12, color: "#8A8776", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleExpenses.map((e) => (
                      <tr key={e.id} style={{ borderTop: "1px solid #EFEDE3" }}>
                        <td style={{ padding: "12px 16px", fontSize: 13.5, fontWeight: 500 }}>{conceptName(e.conceptId)}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13.5, color: "#4C4A3E" }}>{e.description}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "#8A8776" }}>{e.date}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            fontSize: 12, fontWeight: 600, padding: "3px 9px", borderRadius: 20,
                            background: e.source === "Company" ? "#0F766E14" : "#B4530914",
                            color: e.source === "Company" ? "#0F766E" : "#B45309",
                            display: "inline-flex", alignItems: "center", gap: 5
                          }}>
                            {e.source === "Company" ? <Building2 size={11} /> : <User size={11} />}
                            {e.source}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13.5, color: "#4C4A3E" }}>{e.paidBy || "—"}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13.5, fontWeight: 600 }}>{currency(e.amount)}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <IconBtn onClick={() => setExpenseModal(e)}><Pencil size={14} /></IconBtn>
                            <IconBtn onClick={() => setConfirmDelete({ type: "expense", id: e.id, label: e.description })}><Trash2 size={14} /></IconBtn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: "1.5px solid #E5E2D9", background: "#FAFAF5" }}>
                      <td colSpan={5} style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#6B6858", textAlign: "right" }}>Total</td>
                      <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 700 }}>
                        {currency(visibleExpenses.reduce((s, e) => s + e.amount, 0))}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {(conceptModal !== null) && (
        <Modal title={conceptModal === "new" ? "Add a concept" : "Edit concept"} onClose={() => setConceptModal(null)}>
          <ConceptForm
            initial={conceptModal === "new" ? null : conceptModal}
            onSave={saveConcept}
            onCancel={() => setConceptModal(null)}
          />
        </Modal>
      )}

      {(expenseModal !== null) && (
        <Modal title={expenseModal.mode === "new" || !expenseModal.id ? "Add an expense" : "Edit expense"} onClose={() => setExpenseModal(null)} wide>
          <ExpenseForm
            initial={expenseModal.id ? expenseModal : null}
            concepts={concepts}
            defaultConceptId={expenseModal.conceptId}
            onSave={saveExpense}
            onCancel={() => setExpenseModal(null)}
          />
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Delete this?" onClose={() => setConfirmDelete(null)}>
          <p style={{ fontSize: 14, color: "#4C4A3E", marginTop: 0 }}>
            {confirmDelete.type === "concept"
              ? <>Delete <strong>{confirmDelete.label}</strong> and all its linked expenses? This can't be undone.</>
              : <>Delete the expense "<strong>{confirmDelete.label}</strong>"? This can't be undone.</>}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
            <button style={btnGhost} onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button style={{ ...btnPrimary, background: "#B42318" }} onClick={async () => await doDelete()}>Delete</button>
          </div>
        </Modal>
      )}

      {previewArtifact && (
        <Modal title={previewArtifact.name} onClose={() => setPreviewArtifact(null)} wide>
          <ArtifactPreview artifact={previewArtifact} />
        </Modal>
      )}
    </div>
  );
}

function KpiCard({ label, value, accent, small }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E2D9", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 11.5, color: "#8A8776", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: small ? "'IBM Plex Sans', sans-serif" : "'Fraunces', serif", fontWeight: small ? 600 : 600, fontSize: small ? 15 : 22, color: accent || "#1B1F2A" }}>{value}</div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E2D9", borderRadius: 10, padding: "18px 20px" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#6B6858", marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.3 }}>{title}</div>
      {children}
    </div>
  );
}

function PatentRow({ icon: Icon, color, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: color + "0D", borderRadius: 8 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, fontWeight: 500, color: "#1B1F2A" }}>
        <Icon size={16} color={color} /> {label}
      </span>
      <span style={{ fontSize: 16, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 13px", borderRadius: 20, cursor: "pointer",
      border: active ? "1.5px solid #1D4E5F" : "1px solid #DAD6C8",
      background: active ? "#1D4E5F" : "#fff",
      color: active ? "#fff" : "#5B5847",
      fontSize: 13, fontWeight: 500, fontFamily: "'IBM Plex Sans', sans-serif"
    }}>{children}</button>
  );
}

function IconBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      border: "1px solid #E5E2D9", background: "#fff", borderRadius: 6, padding: 6,
      cursor: "pointer", color: "#6B6858", display: "flex"
    }}>{children}</button>
  );
}

function MiniStat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: "#8A8776", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: "#1B1F2A" }}>{value}</div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{
      border: "1px dashed #D6D2C4", borderRadius: 10, padding: "48px 20px",
      textAlign: "center", color: "#8A8776", fontSize: 14, background: "#FAFAF5"
    }}>{text}</div>
  );
}

function ConceptDetail({ concept, expenses, total, onBack, onEdit, onDelete, onStatusChange, onAddExpense, onEditExpense, onDeleteExpense, onUploadArtifact, onDeleteArtifact }) {
  const fileInputRef = React.useRef(null);
  const artifacts = concept.artifacts || [];

  function formatSize(bytes) {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  return (
    <div>
      <button onClick={onBack} style={{
        border: "none", background: "transparent", cursor: "pointer", color: "#6B6858",
        fontSize: 13.5, fontWeight: 500, marginBottom: 18, padding: 0, fontFamily: "'IBM Plex Sans', sans-serif"
      }}>← All concepts</button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 28, margin: 0 }}>{concept.name}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={btnGhost} onClick={onEdit}>Edit</button>
          <button style={{ ...btnGhost, color: "#B42318", borderColor: "#F0C7C0" }} onClick={onDelete}>Delete</button>
        </div>
      </div>
      <p style={{ color: "#6B6858", fontSize: 14.5, maxWidth: 560, marginTop: 4 }}>{concept.description}</p>

      <div style={{ display: "flex", gap: 28, flexWrap: "wrap", margin: "16px 0 22px" }}>
        <MiniStat label="Domain" value={concept.domain || "—"} />
        <MiniStat label="Provisional patent filed status" value={concept.patentStatus || "Not started"} />
        <MiniStat label="Planned organisation for POC" value={concept.plannedOrgForPOC || "—"} />
        <MiniStat label="ETA" value={concept.eta || "—"} />
        <MiniStat label="Requires sensor" value={concept.requiresSensor || "No"} />
      </div>

      <div style={{ margin: "18px 0 26px", maxWidth: 280 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#6B6858", marginBottom: 8 }}>Status</div>
        <StatusSelect value={concept.status} onChange={onStatusChange} />
      </div>

      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "#fff", border: "1px solid #E5E2D9", borderRadius: 10, padding: "16px 20px", marginBottom: 20
      }}>
        <div>
          <div style={{ fontSize: 12.5, color: "#8A8776", marginBottom: 4 }}>Total spent on this concept</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 24 }}>{total.toLocaleString ? currency(total) : total}</div>
        </div>
        <button style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6 }} onClick={onAddExpense}>
          <Plus size={16} /> Add expense
        </button>
      </div>

      <div style={{ fontSize: 12.5, fontWeight: 600, color: "#6B6858", marginBottom: 8 }}>Linked expenses</div>
      {expenses.length === 0 ? (
        <EmptyState text="No expenses linked to this concept yet." />
      ) : (
        <div style={{ background: "#fff", border: "1px solid #E5E2D9", borderRadius: 10, overflow: "hidden" }}>
          {expenses.map((e, i) => (
            <div key={e.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "13px 18px", borderTop: i === 0 ? "none" : "1px solid #EFEDE3"
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{e.description}</div>
                <div style={{ fontSize: 12.5, color: "#8A8776", marginTop: 2, display: "flex", gap: 6, alignItems: "center" }}>
                  {e.source === "Company" ? <Building2 size={11} /> : <User size={11} />}
                  {e.source} · {e.paidBy || "—"} · {e.date}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>{currency(e.amount)}</div>
                <IconBtn onClick={() => onEditExpense(e)}><Pencil size={13} /></IconBtn>
                <IconBtn onClick={() => onDeleteExpense(e)}><Trash2 size={13} /></IconBtn>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "26px 0 8px" }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#6B6858" }}>Artifacts</div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadArtifact(file);
              e.target.value = "";
            }}
          />
          <button style={{ ...btnGhost, display: "flex", alignItems: "center", gap: 6, padding: "7px 12px" }} onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} /> Upload artifact
          </button>
        </div>
      </div>
      {artifacts.length === 0 ? (
        <EmptyState text="No artifacts uploaded yet — add design files, spec sheets, or reference docs here." />
      ) : (
        <div style={{ background: "#fff", border: "1px solid #E5E2D9", borderRadius: 10, overflow: "hidden" }}>
          {artifacts.map((a, i) => (
            <div key={a.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 18px", borderTop: i === 0 ? "none" : "1px solid #EFEDE3"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <FileText size={16} color="#8A8776" style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: "#8A8776", marginTop: 2 }}>{formatSize(a.size)} · uploaded {a.uploadedAt}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <IconBtn onClick={() => setPreviewArtifact(a)} title="View">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </IconBtn>
                <IconBtn onClick={() => { const link = document.createElement("a"); link.href = a.url || a.dataUrl; link.download = a.name; document.body.appendChild(link); link.click(); document.body.removeChild(link); }} title="Download">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </IconBtn>
                <IconBtn onClick={() => onDeleteArtifact(a.id)}><Trash2 size={13} /></IconBtn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ArtifactPreview({ artifact }) {
  const url = artifact.url || artifact.dataUrl;
  const type = artifact.type || "";

  if (type.startsWith("image/")) {
    return (
      <div style={{ display: "flex", justifyContent: "center", background: "#1B1F2A", borderRadius: 8, overflow: "hidden" }}>
        <img src={url} alt={artifact.name} style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }} />
      </div>
    );
  }

  if (type.startsWith("video/")) {
    return (
      <div style={{ display: "flex", justifyContent: "center", background: "#1B1F2A", borderRadius: 8, overflow: "hidden" }}>
        <video src={url} controls style={{ maxWidth: "100%", maxHeight: "70vh" }} />
      </div>
    );
  }

  if (type.startsWith("text/") || type === "application/json" || type === "application/javascript") {
    return (
      <iframe
        src={url}
        style={{ width: "100%", height: "70vh", border: "1px solid #E5E2D9", borderRadius: 8, background: "#fff" }}
        title={artifact.name}
      />
    );
  }

  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <p style={{ margin: "0 0 12px", color: "#6B6858", fontSize: 14 }}>This file type may not be previewable directly.</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <a href={url} target="_blank" rel="noreferrer" style={{ ...btnPrimary, textDecoration: "none" }}>Open in browser</a>
        <button
          onClick={() => {
            const link = document.createElement("a");
            link.href = url;
            link.download = artifact.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          style={btnPrimary}
        >Download</button>
      </div>
    </div>
  );
}
