// app router client component
"use client";

import { FormEvent, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type ServiceName =
  | "Orthopedic Rehabilitation"
  | "Sports Injury"
  | "Back & Neck Pain"
  | "Neurological Physiotherapy"
  | "Post-Surgery Care"
  | "Geriatric Physiotherapy"
  | "General Consultation";

const SERVICES: ServiceName[] = [
  "Orthopedic Rehabilitation",
  "Sports Injury",
  "Back & Neck Pain",
  "Neurological Physiotherapy",
  "Post-Surgery Care",
  "Geriatric Physiotherapy",
  "General Consultation",
];

const WHATSAPP_NUMBER = "917550419931";

function pad(n: number) { return String(n).padStart(2, "0"); }
function toISODate(date: Date) { return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`; }
function startOfDay(date: Date) { const d = new Date(date); d.setHours(0,0,0,0); return d; }
function addMonths(date: Date, months: number) { const d = new Date(date); d.setMonth(d.getMonth() + months); return d; }
function buildCalendar(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay();
  const daysInMonth = last.getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function BookingForm() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const maxDate = useMemo(() => addMonths(today, 2), [today]);

  const [month, setMonth] = useState(() => new Date(today));
  const [selectedDate, setSelectedDate] = useState("");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState<ServiceName | "">("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [waHref, setWaHref] = useState("");

  const cells = useMemo(() => buildCalendar(month), [month]);
  const monthLabel = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const canGoPrev = month.getFullYear() > today.getFullYear() || month.getMonth() > today.getMonth();
  const canGoNext = month < new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  const days = ["S","M","T","W","T","F","S"];

  function selectDate(date: Date) {
    setSelectedDate(toISODate(date));
  }

  function resetForm() {
    setFullName("");
    setAge("");
    setGender("");
    setPhone("");
    setService("");
    setAddress("");
    setMessage("");
    setSelectedDate("");
    setStatus("idle");
    setError("");
    setSuccessMessage("");
    setWaHref("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!fullName.trim() || !phone.trim() || !service || !selectedDate) {
      setError("Fill the required fields and select a date.");
      return;
    }

    setStatus("saving");

    try {
      const { data: existing, error: lookupError } = await supabase
        .from("patients")
        .select("id")
        .eq("phone", phone.trim())
        .limit(1);

      if (lookupError) throw lookupError;

      let patientId = existing?.[0]?.id as string | undefined;
      const patientPayload = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        age: age ? Number(age) : null,
        gender: gender || null,
        address: address.trim() || null,
      };

      if (!patientId) {
        const insertPatient = await supabase.from("patients").insert(patientPayload).select("id").single();
        if (insertPatient.error) throw insertPatient.error;
        patientId = insertPatient.data.id;
      } else {
        const updatePatient = await supabase.from("patients").update(patientPayload).eq("id", patientId);
        if (updatePatient.error) throw updatePatient.error;
      }

      const insertAppointment = await supabase
        .from("appointments")
        .insert({
          patient_id: patientId,
          service,
          preferred_date: selectedDate,
          status: "pending",
          notes: message.trim() || null,
        })
        .select("id")
        .single();

      if (insertAppointment.error) throw insertAppointment.error;

      const msg = [
        "New appointment request",
        `Name: ${fullName.trim()}`,
        `Age: ${age || "-"}`,
        `Gender: ${gender || "-"}`,
        `Phone: ${phone.trim()}`,
        `Service: ${service}`,
        `Preferred Date: ${selectedDate}`,
        `Address: ${address.trim() || "-"}`,
        `Message: ${message.trim() || "-"}`,
      ].join("\n");

      setWaHref(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`);
      setSuccessMessage(`Request sent for ${selectedDate}. You can confirm instantly on WhatsApp.`);
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <section className="booking-section" id="booking">
      <div className="booking-card">
        <div className="form-head">
          <div className="sec-label" style={{ textAlign: "center" }}>Get in Touch</div>
          <h2 className="sec-title">Book Your Appointment</h2>
          <p>Fill in your details and choose a preferred date. Our assistant will confirm your time slot shortly.</p>
        </div>

        {status !== "success" ? (
          <form onSubmit={handleSubmit} noValidate>
            <div className="fgrid">
              <div className="fld">
                <label htmlFor="fullName">Full Name</label>
                <input id="fullName" type="text" placeholder="e.g. Rahul Verma" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="fld">
                <label htmlFor="phone">Mobile Number</label>
                <input id="phone" type="tel" placeholder="92285 56980" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="fld">
                <label htmlFor="age">Age</label>
                <input id="age" type="number" min="0" placeholder="34" value={age} onChange={(e) => setAge(e.target.value)} />
              </div>
              <div className="fld">
                <label htmlFor="gender">Gender</label>
                <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="fld full">
                <label htmlFor="service">Service Required</label>
                <select id="service" value={service} onChange={(e) => setService(e.target.value as ServiceName | "")}>
                  <option value="" disabled>Select a service</option>
                  {SERVICES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="fld full">
                <label>Preferred Date</label>
                <div className="calendar">
                  <div className="cal-head">
                    <button className="cal-nav" type="button" onClick={() => setMonth(addMonths(month, -1))} disabled={!canGoPrev} aria-label="Previous month">&lsaquo;</button>
                    <div className="cal-title">{monthLabel}</div>
                    <button className="cal-nav" type="button" onClick={() => setMonth(addMonths(month, 1))} disabled={!canGoNext} aria-label="Next month">&rsaquo;</button>
                  </div>
                  <div style={{ padding: "8px 12px 12px" }}>
                    <div className="cal-grid">
                      {days.map((d) => <div className="cal-dow" key={d}>{d}</div>)}
                      {cells.map((cell, idx) => {
                        if (!cell) return <div className="cal-cell" key={idx}><span className="cal-day blank">&nbsp;</span></div>;
                        const day = startOfDay(cell);
                        const iso = toISODate(day);
                        const isDisabled = day < today || day > maxDate;
                        const isToday = iso === toISODate(today);
                        const isSelected = iso === selectedDate;
                        const sunday = day.getDay() === 0;
                        return (
                          <div className="cal-cell" key={iso}>
                            <button
                              type="button"
                              className={["cal-day", sunday ? "sunday" : "", isToday ? "today" : "", isSelected ? "selected" : "", isDisabled ? "disabled" : ""].join(" ")}
                              disabled={isDisabled}
                              onClick={() => selectDate(day)}
                            >
                              {day.getDate()}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <input type="hidden" value={selectedDate} readOnly />
                <div className="sel-date">{selectedDate ? `Selected: ${selectedDate}` : "No date selected yet."}</div>
              </div>

              <div className="fld full">
                <label htmlFor="address">Address</label>
                <input id="address" type="text" placeholder="Your home or locality address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="fld full">
                <label htmlFor="message">MESSAGE</label>
                <textarea id="message" placeholder="Briefly describe your concern…" value={message} onChange={(e) => setMessage(e.target.value)} />
              </div>
            </div>

            {error ? <div className="note" style={{ marginTop: 12 }}><p style={{ color: "var(--red)" }}>{error}</p></div> : null}
            <button type="submit" className="sub-btn" disabled={status === "saving"}>{status === "saving" ? "Submitting..." : "Confirm Appointment Request →"}</button>
          </form>
        ) : (
          <div className="success" style={{ display: "block" }}>
            <div className="suc-icon"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg></div>
            <h3>Request Received!</h3>
            <p style={{ fontWeight: 700, color: "var(--t600)", marginBottom: 6 }}>{successMessage}</p>
            <p style={{ marginBottom: 10 }}>Appointment request sent. You can also confirm instantly on WhatsApp.</p>
            <div style={{ marginTop: 8 }}>
              <a className="wa-btn" href={waHref} target="_blank" rel="noopener noreferrer">💬 Contact on WhatsApp</a>
            </div>
            <button className="secondary-btn" onClick={resetForm}>Book Another Appointment</button>
            <p style={{ marginTop: 14, fontSize: ".78rem", color: "var(--g400)" }}>We respond within a few hours during clinic hours (Mon–Sat, 9 AM–7 PM).</p>
          </div>
        )}
      </div>
    </section>
  );
}
