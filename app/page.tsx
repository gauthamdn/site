"use client";

import {
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  Boxes,
  ChevronRight,
  CircuitBoard,
  Copyright,
  ExternalLink,
  Linkedin,
  Mail,
  Menu,
  Network,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import CareerChat from "./components/CareerChat";

const journey = [
  {
    period: "2023 — NOW",
    role: "Senior Engineering Manager",
    company: "ATLASSIAN",
    description:
      "Leading product engineering at global scale—building strong teams, shaping strategy, and turning complex systems into experiences customers trust.",
    current: true,
  },
  {
    period: "2021 — 2023",
    role: "Engineering Manager",
    company: "ATLASSIAN",
    description:
      "Joined Atlassian to grow engineering organizations and create the conditions for teams to do their most consequential work.",
  },
  {
    period: "2017 — 2021",
    role: "Senior Engineering Manager",
    company: "DELL TECHNOLOGIES",
    description:
      "Built a 30-person, multi-disciplinary product group spanning product, design, engineering, data, and DevOps. Modernized order visibility for 26,000 users.",
  },
  {
    period: "2009 — 2017",
    role: "Engineer → IT Manager",
    company: "DELL TECHNOLOGIES",
    description:
      "Grew from software engineer to technology leader, architecting enterprise integrations and modernizing customer communication platforms.",
  },
  {
    period: "2009",
    role: "Engineering Intern",
    company: "IBM INDIA SOFTWARE LABS",
    description:
      "Started the journey with the DB2 Net Search Extender team—learning that deep technical curiosity is the foundation of lasting impact.",
  },
];

const principles = [
  {
    number: "01",
    icon: Users,
    title: "People multiply impact",
    text: "Build environments where talented people have context, agency, and the safety to take bold swings.",
  },
  {
    number: "02",
    icon: Network,
    title: "Systems over symptoms",
    text: "Solve the architecture and operating-model problems underneath the visible ones. Make progress repeatable.",
  },
  {
    number: "03",
    icon: CircuitBoard,
    title: "Technology serves people",
    text: "The best platform is the one that makes a customer's day simpler and a team’s work more meaningful.",
  },
];

const proof = [
  { value: "15+", label: "Years in engineering" },
  { value: "30", label: "Person product org built" },
  { value: "$5.7M", label: "Transformation portfolio" },
  { value: "80K", label: "Partners enabled" },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scroll, setScroll] = useState(0);

  useEffect(() => {
    const updateScroll = () => {
      const height =
        document.documentElement.scrollHeight - window.innerHeight;
      setScroll(height > 0 ? (window.scrollY / height) * 100 : 0);
    };
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main>
      <div className="scroll-progress" style={{ width: `${scroll}%` }} />
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Gautham D N — home">
          <span>G</span>
          <i />
          <span>DN</span>
        </a>
        <nav className={menuOpen ? "nav open" : "nav"} aria-label="Main menu">
          <a href="#about" onClick={closeMenu}>
            About
          </a>
          <a href="#journey" onClick={closeMenu}>
            Journey
          </a>
          <a href="#thinking" onClick={closeMenu}>
            Thinking
          </a>
          <a href="#portfolio" onClick={closeMenu}>
            Portfolio
          </a>
          <a className="nav-contact" href="#contact" onClick={closeMenu}>
            Let&apos;s talk <ArrowUpRight size={15} />
          </a>
        </nav>
        <button
          className="menu-button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <section className="hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <div className="orb orb-one" aria-hidden="true" />
        <div className="orb orb-two" aria-hidden="true" />
        <div className="hero-content">
          <div className="eyebrow reveal">
            <span className="live-dot" />
            Bengaluru, India · Engineering leadership
          </div>
          <h1 className="reveal reveal-delay-1">
            I build teams that
            <br />
            build <em>what&apos;s next.</em>
          </h1>
          <p className="hero-intro reveal reveal-delay-2">
            Engineering leader, systems thinker, and customer advocate turning
            ambitious ideas into durable products—and talented groups into
            exceptional teams.
          </p>
          <div className="hero-actions reveal reveal-delay-3">
            <a className="button button-primary" href="#journey">
              Explore my journey <ArrowDown size={17} />
            </a>
            <a className="text-link" href="#about">
              More about me <ChevronRight size={17} />
            </a>
          </div>
        </div>
        <div className="hero-mark reveal reveal-delay-2" aria-hidden="true">
          <div className="mark-ring ring-one" />
          <div className="mark-ring ring-two" />
          <div className="mark-ring ring-three" />
          <div className="mark-core">
            <span>GDN</span>
            <small>EST. 2009</small>
          </div>
          <span className="mark-label label-one">PEOPLE</span>
          <span className="mark-label label-two">PRODUCT</span>
          <span className="mark-label label-three">PLATFORM</span>
        </div>
        <div className="hero-footer">
          <span>SCROLL TO EXPLORE</span>
          <div />
          <span>01 / 06</span>
        </div>
      </section>

      <section className="proof-strip" aria-label="Career highlights">
        {proof.map((item) => (
          <div className="proof-item" key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </section>

      <section className="about section" id="about">
        <div className="section-kicker">
          <span>01</span>
          <p>ABOUT</p>
        </div>
        <div className="about-copy">
          <h2>
            Business ambition.
            <br />
            <span>Engineering rigor.</span>
          </h2>
          <div className="about-body">
            <p className="lead">
              I operate where product strategy, technology, and organizational
              design meet.
            </p>
            <p>
              Over 15+ years, I&apos;ve moved from writing enterprise
              integrations to leading large, cross-functional product teams. My
              work has consistently centered on one challenge: making complex
              systems—both technical and human—work beautifully at scale.
            </p>
            <p>
              Today, I lead engineering at Atlassian. Previously at Dell, I
              built teams and platforms that transformed order visibility,
              customer self-service, and communications for users worldwide.
            </p>
            <a
              className="inline-link"
              href="https://www.linkedin.com/in/gautham-d-n-313b489"
              target="_blank"
              rel="noreferrer"
            >
              Full profile on LinkedIn <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      </section>

      <section className="principles section" id="thinking">
        <div className="section-kicker light">
          <span>02</span>
          <p>HOW I LEAD</p>
        </div>
        <div className="principles-heading">
          <h2>
            Build with <em>intent.</em>
            <br />
            Lead with <em>clarity.</em>
          </h2>
          <p>
            The principles I return to when the problems are hard and the
            answers are not obvious.
          </p>
        </div>
        <div className="principle-grid">
          {principles.map(({ number, icon: Icon, title, text }) => (
            <article className="principle-card" key={number}>
              <div className="card-top">
                <span>{number}</span>
                <Icon />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
              <div className="card-line" />
            </article>
          ))}
        </div>
      </section>

      <section className="journey section" id="journey">
        <div className="section-kicker">
          <span>03</span>
          <p>CAREER JOURNEY</p>
        </div>
        <div className="journey-heading">
          <h2>Built from the code up.</h2>
          <p>
            A career spent expanding the scope of impact—from systems, to
            products, to organizations.
          </p>
        </div>
        <div className="timeline">
          {journey.map((item) => (
            <article className="timeline-row" key={`${item.period}-${item.role}`}>
              <div className="timeline-period">
                {item.current && <span className="current-dot" />}
                {item.period}
              </div>
              <div className="timeline-role">
                <p>{item.company}</p>
                <h3>{item.role}</h3>
              </div>
              <p className="timeline-description">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="impact section">
        <div className="impact-visual" aria-hidden="true">
          <div className="impact-grid" />
          <Boxes size={92} strokeWidth={0.8} />
          <span>IMPACT / SCALE</span>
        </div>
        <div className="impact-copy">
          <div className="section-kicker light">
            <span>04</span>
            <p>SELECTED IMPACT</p>
          </div>
          <h2>Change that shows up in the numbers.</h2>
          <div className="impact-list">
            <div>
              <strong>15%</strong>
              <p>reduction in customer-care calls through digital self-service</p>
            </div>
            <div>
              <strong>$2.5M</strong>
              <p>annual savings from modernizing 500+ communications</p>
            </div>
            <div>
              <strong>26K</strong>
              <p>users served by a new order-visibility platform</p>
            </div>
          </div>
        </div>
      </section>

      <section className="portfolio section" id="portfolio">
        <div className="portfolio-noise" aria-hidden="true" />
        <div className="section-kicker">
          <span>05</span>
          <p>PORTFOLIO</p>
        </div>
        <div className="portfolio-content">
          <div>
            <span className="coming-soon">
              <Sparkles size={14} /> IN THE WORKS
            </span>
            <h2>
              The work behind
              <br />
              the <em>outcomes.</em>
            </h2>
          </div>
          <div className="portfolio-note">
            <p>
              A curated collection of transformation stories, architecture
              decisions, and leadership lessons is coming soon.
            </p>
            <a href="mailto:gauthamdn@gmail.com?subject=Portfolio updates">
              Get notified <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
        <div className="portfolio-preview" aria-hidden="true">
          <div className="preview-card card-a">
            <span>CASE STUDY / 01</span>
            <strong>Order visibility at scale</strong>
          </div>
          <div className="preview-card card-b">
            <span>FIELD NOTES / 02</span>
            <strong>Building teams with agency</strong>
          </div>
          <div className="preview-card card-c">
            <span>SYSTEMS / 03</span>
            <strong>From monolith to momentum</strong>
          </div>
        </div>
      </section>

      <section className="contact section" id="contact">
        <div className="contact-glow" aria-hidden="true" />
        <p className="contact-kicker">HAVE AN AMBITIOUS PROBLEM?</p>
        <h2>
          Let&apos;s build something
          <br />
          <em>that matters.</em>
        </h2>
        <a className="contact-email" href="mailto:gauthamdn@gmail.com">
          gauthamdn@gmail.com <ArrowUpRight />
        </a>
        <div className="contact-links">
          <a
            href="https://www.linkedin.com/in/gautham-d-n-313b489"
            target="_blank"
            rel="noreferrer"
          >
            <Linkedin size={18} /> LinkedIn <ExternalLink size={13} />
          </a>
          <a
            href="https://lifesboringletstastedeath.blogspot.com/"
            target="_blank"
            rel="noreferrer"
          >
            <BookOpen size={18} /> Writing <ExternalLink size={13} />
          </a>
          <a href="mailto:gauthamdn@gmail.com">
            <Mail size={18} /> Email
          </a>
        </div>
      </section>

      <CareerChat />

      <footer>
        <div className="brand footer-brand">
          <span>G</span>
          <i />
          <span>DN</span>
        </div>
        <p>
          <Copyright size={13} /> {new Date().getFullYear()} Gautham D N
        </p>
        <a href="#top">
          BACK TO TOP <ArrowUpRight size={14} />
        </a>
      </footer>
    </main>
  );
}
