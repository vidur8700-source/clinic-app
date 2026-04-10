import BookingForm from "@/components/BookingForm";

export default function HomePage() {
  return (
    <>
      <nav>
        <div className="nav-logo">Dr. Fozail</div>
        <ul className="nav-links">
          <li><a href="#services">Services</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#booking">Booking</a></li>
        </ul>
        <a className="nav-cta" href="/admin">Admin Panel</a>
      </nav>

      <section className="hero" id="home">
        <div>
          <span className="hero-badge">Accepting New Patients</span>
          <h1>Restore Movement,<br />Reclaim Your <em>Life.</em></h1>
          <p className="hero-sub">Expert physiotherapy care tailored to your body. From pain relief to full recovery — Dr. Fozail is here every step of the way.</p>
          <div className="hero-actions">
            <a href="#booking" className="btn-primary">Book an Appointment</a>
            <a href="tel:+917550419931" className="call-btn">📞 Call Us</a>
            <a href="#services" className="btn-ghost">View Services</a>
          </div>
          <div className="hero-stats">
            <div><div className="stat-num">12+</div><div className="stat-lbl">Years Experience</div></div>
            <div><div className="stat-num">2000+</div><div className="stat-lbl">Patients Treated</div></div>
            <div><div className="stat-num">98%</div><div className="stat-lbl">Satisfaction Rate</div></div>
          </div>
        </div>

        <div className="hero-photo">
          <div className="hero-photo-fallback">
            <div className="hero-photo-letter">D</div>
            <div className="hero-photo-text">Dr. Fozail</div>
            <div className="hero-photo-sub">Physiotherapy &amp; Rehabilitation</div>
          </div>
          <div className="hero-photo-badge">
            <div className="hpb-dot">
              <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div><div className="hpb-lbl">Next Available</div><div className="hpb-val">Tomorrow, 10:00 AM</div></div>
          </div>
        </div>
      </section>

      <section id="services">
        <div className="sec-label">What We Treat</div>
        <h2 className="sec-title">Specialized Care for Every Condition</h2>
        <p className="sec-sub">Comprehensive physiotherapy treatments designed to get you back to doing what you love.</p>
        <div className="services-grid">
          <div className="svc-card">
            <div className="svc-icon"><svg viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg></div>
            <h3>Orthopedic Rehab</h3>
            <p>Recovery from fractures, joint replacements, sprains, and post-surgical rehabilitation.</p>
          </div>
          <div className="svc-card">
            <div className="svc-icon"><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
            <h3>Sports Injury</h3>
            <p>Sport-specific recovery protocols for ligament tears, muscle strains, and more.</p>
          </div>
          <div className="svc-card">
            <div className="svc-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg></div>
            <h3>Back &amp; Neck Pain</h3>
            <p>Manual therapy and posture correction for cervical, lumbar, and spinal disorders.</p>
          </div>
          <div className="svc-card">
            <div className="svc-icon"><svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>
            <h3>Neurological Physio</h3>
            <p>Rehabilitation for stroke, Parkinson's, and other neurological conditions.</p>
          </div>
          <div className="svc-card">
            <div className="svc-icon"><svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
            <h3>Post-Surgery Care</h3>
            <p>Safe and structured recovery plans following orthopedic or soft-tissue surgeries.</p>
          </div>
          <div className="svc-card">
            <div className="svc-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
            <h3>Geriatric Physio</h3>
            <p>Balance training, fall prevention, and mobility improvement for elderly patients.</p>
          </div>
        </div>
      </section>

      <section id="about" style={{ paddingTop: 0 }}>
        <div className="about-wrap">
          <div className="about-photo">
            <div className="about-photo-fallback">
              <div className="about-photo-letter">D</div>
              <div className="about-photo-text">Dr. Fozail</div>
            </div>
          </div>
          <div className="about-content">
            <div className="sec-label">About the Doctor</div>
            <h2 className="sec-title" style={{ maxWidth: "100%" }}>A Trusted Hand in Your Recovery</h2>
            <p className="sec-sub">Dr. Fozail is a certified physiotherapist with over 12 years of clinical experience, specializing in musculoskeletal and sports rehabilitation.</p>
            <div className="creds">
              <div className="cred"><div className="cred-dot"></div><div><strong>BPT &amp; MPT (Musculoskeletal)</strong><span>Rajiv Gandhi University of Health Sciences</span></div></div>
              <div className="cred"><div className="cred-dot"></div><div><strong>Certified Manual Therapist</strong><span>IAMT — International Academy of Manual Therapy</span></div></div>
              <div className="cred"><div className="cred-dot"></div><div><strong>Clinic Hours: Mon – Sat</strong><span>9:00 AM – 7:00 PM &nbsp;|&nbsp; Sunday Closed</span></div></div>
            </div>
          </div>
        </div>
      </section>

      <BookingForm />

      <footer>
        <div>
          <div className="ft-logo">Dr. Fozail</div>
          <div className="ft-info" style={{ fontSize: ".72rem", opacity: .4, marginTop: 3 }}>Physiotherapy &amp; Rehabilitation</div>
        </div>
        <div className="ft-info" style={{ textAlign: "center" }}>
          Mon – Sat: 9:00 AM – 7:00 PM<br /><span style={{ opacity: .4, fontSize: ".72rem" }}>Sunday Closed</span>
        </div>
        <div className="ft-info" style={{ textAlign: "right" }}>
          +91 75504 19931<br /><span style={{ opacity: .4, fontSize: ".72rem" }}>drfozail@physioclinic.in</span>
        </div>
      </footer>
    </>
  );
}