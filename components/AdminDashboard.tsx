// app router client component
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Patient = { id: string; full_name: string; phone: string; age: number | null; gender: string | null; address: string | null; last_meet: string | null; created_at: string; };
type Appointment = { id: string; patient_id: string; service: string; preferred_date: string; confirmed_time: string | null; status: "pending" | "confirmed" | "completed" | "cancelled"; notes: string | null; created_at: string; patients?: Patient | null; };
const STATUS_OPTIONS = ["pending", "confirmed", "completed", "cancelled"] as const;

function fmt(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}
function safeText(value: unknown) { return value == null || value === "" ? "—" : String(value); }

export default function AdminDashboard() {
  const [sessionReady, setSessionReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<"appointments" | "patients" | "stats">("appointments");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Appointment["status"]>("all");
  const [sortFilter, setSortFilter] = useState<"newest" | "oldest">("newest");
  const [toast, setToast] = useState("");
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [editStatus, setEditStatus] = useState<Appointment["status"]>("pending");
  const [editTime, setEditTime] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);

  const patientById = useMemo(() => {
    const map = new Map<string, Patient>();
    for (const p of patients) map.set(p.id, p);
    return map;
  }, [patients]);

  function showToast(message: string) {
    setToast(message);
    window.clearTimeout((window as Window & { __toastTimer?: number }).__toastTimer);
    (window as Window & { __toastTimer?: number }).__toastTimer = window.setTimeout(() => setToast(""), 2500);
  }

  function normalizeAppointment(row: any): Appointment {
    return {
      id: row.id,
      patient_id: row.patient_id,
      service: row.service,
      preferred_date: row.preferred_date,
      confirmed_time: row.confirmed_time,
      status: row.status ?? "pending",
      notes: row.notes,
      created_at: row.created_at,
      patients: row.patients ?? null,
    };
  }

  async function loadData() {
    if (!isAuthed) return;
    const [{ data: apptData, error: apptErr }, { data: patientData, error: patientErr }] = await Promise.all([
      supabase.from("appointments").select("id, patient_id, service, preferred_date, confirmed_time, status, notes, created_at, patients:patient_id(id, full_name, phone, age, gender, address, last_meet, created_at)").order("created_at", { ascending: false }),
      supabase.from("patients").select("id, full_name, phone, age, gender, address, last_meet, created_at").order("created_at", { ascending: false }),
    ]);
    if (apptErr) throw apptErr;
    if (patientErr) throw patientErr;
    setAppointments((apptData ?? []).map(normalizeAppointment));
    setPatients((patientData ?? []) as Patient[]);
  }

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setIsAuthed(Boolean(data.session));
      setSessionReady(true);
      if (data.session?.user.email) setEmail(data.session.user.email);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(Boolean(session));
      setSessionReady(true);
      setEmail(session?.user.email ?? "");
      if (!session) {
        setAppointments([]);
        setPatients([]);
      } else {
        loadData().catch(console.error);
      }
    });
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isAuthed) return;
    loadData().catch(console.error);
    const channel = supabase
      .channel("clinic-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => loadData().catch(console.error))
      .on("postgres_changes", { event: "*", schema: "public", table: "patients" }, () => loadData().catch(console.error))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAuthed]);

  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;

  const filteredAppointments = appointments.filter((appt) => {
    const patient = patientById.get(appt.patient_id) ?? appt.patients ?? undefined;
    const hay = [patient?.full_name, patient?.phone, appt.service, appt.preferred_date, appt.confirmed_time, appt.status, appt.notes].filter(Boolean).join(" ").toLowerCase();
    const matchesQuery = !query || hay.includes(query.toLowerCase());
    const matchesStatus = statusFilter === "all" ? true : appt.status === statusFilter;
    return matchesQuery && matchesStatus;
  }).sort((a, b) => {
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    return sortFilter === "newest" ? tb - ta : ta - tb;
  });

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginError("");
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setLoginError(error.message);
      return;
    }
    if (data.user?.email) setEmail(data.user.email);
    setPassword("");
    setIsAuthed(true);
    showToast("Signed in");
    await loadData();
  }

  async function signOut() {
    await supabase.auth.signOut();
    setIsAuthed(false);
    setAppointments([]);
    setPatients([]);
    showToast("Signed out");
  }

  function openEdit(appt: Appointment) {
    setEditing(appt);
    setEditStatus(appt.status);
    setEditTime(appt.confirmed_time ?? "");
    setEditNotes(appt.notes ?? "");
    setDetailOpen(true);
  }

  function closeModal() {
    setDetailOpen(false);
    setEditing(null);
  }

  async function saveEdit() {
    if (!editing) return;
    if (editStatus !== editing.status) {
      const ok = window.confirm(`Change status from ${editing.status} to ${editStatus}?`);
      if (!ok) return;
    }
    const { error } = await supabase.from("appointments").update({
      status: editStatus,
      confirmed_time: editTime.trim() || null,
      notes: editNotes.trim() || null,
    }).eq("id", editing.id);
    if (error) { alert(error.message); return; }
    if (editStatus === "confirmed") {
      await supabase.from("patients").update({ last_meet: new Date().toISOString() }).eq("id", editing.patient_id);
    }
    showToast("Appointment updated");
    closeModal();
    await loadData();
  }

  async function quickStatus(id: string, nextStatus: Appointment["status"]) {
    const appt = appointments.find((a) => a.id === id);
    if (!appt) return;
    const ok = window.confirm(`Change status to ${nextStatus}?`);
    if (!ok) return;
    const { error } = await supabase.from("appointments").update({ status: nextStatus }).eq("id", id);
    if (error) { alert(error.message); return; }
    if (nextStatus === "confirmed") {
      await supabase.from("patients").update({ last_meet: new Date().toISOString() }).eq("id", appt.patient_id);
    }
    showToast("Status updated");
    await loadData();
  }

  if (!sessionReady) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!isAuthed) {
    return (
      <section className="login-wrap">
        <div className="login-card">
          <h2>Admin Sign In</h2>
          <p>Secure access for clinic management.</p>
          <form onSubmit={handleLogin}>
            <div className="login-note">Use your Supabase Auth email and password.</div>
            {loginError ? <div className="login-error" style={{ display: "block" }}>{loginError}</div> : null}
            <div className="field">
              <label htmlFor="admin-email">Email</label>
              <input id="admin-email" type="email" placeholder="admin@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="admin-password">Password</label>
              <input id="admin-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button className="primary-btn" type="submit" style={{ width: "100%" }}>Sign in</button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <div className="shell auth">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">D</div>
          <div>
            <h1>Dr. Fozail<br /><span style={{ fontWeight: 500, color: "var(--muted)" }}>Clinic Admin</span></h1>
          </div>
        </div>
        <div className="nav">
          <button className={tab === "appointments" ? "active" : ""} onClick={() => setTab("appointments")}><span>Appointments</span><small>{appointments.length}</small></button>
          <button className={tab === "patients" ? "active" : ""} onClick={() => setTab("patients")}><span>Patients</span><small>{patients.length}</small></button>
          <button className={tab === "stats" ? "active" : ""} onClick={() => setTab("stats")}><span>Stats</span><small>Live</small></button>
        </div>
        <div className="sidebar-footer">
          <button className="ghost-btn" onClick={() => loadData().then(() => showToast("Data refreshed")).catch((e) => alert((e as Error).message))}>🔄 Refresh</button>
          <button className="danger-btn" onClick={signOut}>🚪 Sign out</button>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="title-wrap"><h2>Bookings</h2></div>
          <div className="top-actions">
            <div className="searchbar">
              <span style={{ color: "var(--muted)" }}>⌕</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} type="text" placeholder="Search name, phone, service..." />
            </div>
          </div>
        </div>

        <div className="grid">
          <div className="card stat amber"><div className="label">Pending</div><div className="value">{pendingCount}</div></div>
          <div className="card stat blue"><div className="label">Confirmed</div><div className="value">{confirmedCount}</div></div>
        </div>

        <div className="toolbar">
          <div className="filters">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
              <option value="all">All statuses</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
            <select value={sortFilter} onChange={(e) => setSortFilter(e.target.value as typeof sortFilter)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        {tab === "appointments" ? (
          <div className="card table-card">
            <div className="table-head">
              <div>
                <h3>Appointment queue</h3>
                <span>{appointments.length} bookings · {pendingCount} pending · {confirmedCount} confirmed</span>
              </div>
            </div>
            <div style={{ padding: 16 }}>
              <div className="appointment-list">
                {filteredAppointments.length === 0 ? <div className="muted">No appointments found.</div> : filteredAppointments.map((appt) => {
                  const patient = patientById.get(appt.patient_id) ?? appt.patients ?? undefined;
                  return (
                    <button key={appt.id} className="appointment-btn" type="button" onClick={() => openEdit(appt)}>
                      <div className="appt-card">
                        <div className="appt-top">
                          <div>
                            <div className="appt-name">{safeText(patient?.full_name || "Unknown patient")}</div>
                            <div className="appt-meta">
                              <span>{safeText(patient?.phone)}</span>
                              <span>•</span>
                              <span>{safeText(appt.service)}</span>
                            </div>
                          </div>
                          <span className={`status ${appt.status}`}>{appt.status}</span>
                        </div>
                        <div className="appt-line">
                          <span><strong>Date:</strong> {safeText(appt.preferred_date)}</span>
                          <span><strong>Time:</strong> {safeText(appt.confirmed_time)}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {tab === "patients" ? (
          <div className="card table-card" style={{ marginTop: 18 }}>
            <div className="table-head">
              <div><h3>Patient list</h3><span>{patients.length} patients total</span></div>
              <span>Last meet updates when you confirm an appointment</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Name</th><th>Phone</th><th>Age</th><th>Gender</th><th>Address</th><th>Last Meet</th><th>Created</th></tr>
                </thead>
                <tbody>
                  {patients.length === 0 ? (
                    <tr><td colSpan={7} className="muted">No patients found.</td></tr>
                  ) : patients.map((p) => (
                    <tr key={p.id}><td><strong>{safeText(p.full_name)}</strong></td><td>{safeText(p.phone)}</td><td>{safeText(p.age)}</td><td>{safeText(p.gender)}</td><td>{safeText(p.address)}</td><td>{fmt(p.last_meet)}</td><td>{fmt(p.created_at)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {tab === "stats" ? (
          <div className="card" style={{ marginTop: 18 }}>
            <h3 style={{ marginTop: 0 }}>Quick overview</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 14 }}>
              <div className="card" style={{ boxShadow: "none", background: "#fafaf8" }}><div className="label">Patients</div><div className="value" style={{ fontSize: 24 }}>{patients.length}</div></div>
              <div className="card" style={{ boxShadow: "none", background: "#fafaf8" }}><div className="label">Logged in as</div><div className="value" style={{ fontSize: 18 }}>{email || "—"}</div></div>
              <div className="card" style={{ boxShadow: "none", background: "#fafaf8" }}><div className="label">Data state</div><div className="value" style={{ fontSize: 18 }}>Live</div></div>
            </div>
          </div>
        ) : null}
      </main>

      {detailOpen && editing ? (
        <div className="modal-backdrop" style={{ display: "flex" }} onClick={(e) => { if (e.target === e.currentTarget) setDetailOpen(false); }}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="editAppointmentTitle">
            <div className="modal-head">
              <h3 id="editAppointmentTitle">Appointment details</h3>
              <button className="ghost-btn" onClick={() => setDetailOpen(false)}>Close</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail"><label>Patient</label><div>{safeText((patientById.get(editing.patient_id) ?? editing.patients)?.full_name)}</div></div>
                <div className="detail"><label>Phone</label><div>{safeText((patientById.get(editing.patient_id) ?? editing.patients)?.phone)}</div></div>
                <div className="detail"><label>Age</label><div>{safeText((patientById.get(editing.patient_id) ?? editing.patients)?.age)}</div></div>
                <div className="detail"><label>Gender</label><div>{safeText((patientById.get(editing.patient_id) ?? editing.patients)?.gender)}</div></div>
                <div className="detail full"><label>Address</label><div>{safeText((patientById.get(editing.patient_id) ?? editing.patients)?.address)}</div></div>
                <div className="detail"><label>Service</label><div>{safeText(editing.service)}</div></div>
                <div className="detail"><label>Preferred Date</label><div>{safeText(editing.preferred_date)}</div></div>
                <div className="detail"><label>Confirmed Time</label><div>{safeText(editTime || editing.confirmed_time)}</div></div>
                <div className="detail"><label>Status</label><div><span className={`status ${editStatus}`}>{editStatus}</span></div></div>
                <div className="detail full"><label>Notes</label><div>{safeText(editNotes || editing.notes)}</div></div>
                <div className="detail"><label>Created</label><div>{fmt(editing.created_at)}</div></div>
                <div className="detail"><label>Last Meet</label><div>{fmt((patientById.get(editing.patient_id) ?? editing.patients)?.last_meet)}</div></div>
              </div>

              <div className="card" style={{ boxShadow: "none", background: "#fafaf8", marginBottom: 18 }}>
                <h4 style={{ margin: "0 0 12px", fontSize: 15 }}>Edit appointment</h4>
                <div className="modal-grid">
                  <div className="field">
                    <label htmlFor="editStatus">Status</label>
                    <select id="editStatus" value={editStatus} onChange={(e) => setEditStatus(e.target.value as Appointment["status"])}>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="editTime">Confirmed Time</label>
                    <input id="editTime" type="text" placeholder="10:30 AM" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
                  </div>
                  <div className="field full">
                    <label htmlFor="editNotes">Notes</label>
                    <textarea id="editNotes" placeholder="Add internal notes..." value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="ghost-btn" onClick={() => setDetailOpen(false)}>Cancel</button>
              <button className="primary-btn" onClick={async () => {
                if (!editing) return;
                if (editStatus !== editing.status) {
                  const ok = window.confirm(`Change status from ${editing.status} to ${editStatus}?`);
                  if (!ok) return;
                }
                const { error } = await supabase.from("appointments").update({
                  status: editStatus,
                  confirmed_time: editTime.trim() || null,
                  notes: editNotes.trim() || null,
                }).eq("id", editing.id);
                if (error) { alert(error.message); return; }
                if (editStatus === "confirmed") {
                  await supabase.from("patients").update({ last_meet: new Date().toISOString() }).eq("id", editing.patient_id);
                }
                showToast("Appointment updated");
                setDetailOpen(false);
                await loadData();
              }}>Save changes</button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
