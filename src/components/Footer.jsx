import "./Footer.css";

/*
  Background photo: window blinds, hotlinked from Unsplash (free to use).
  To use your own picture, replace this with your file path,
  e.g.  "/images/footer-blinds.jpg"
*/
const FOOTER_IMAGE =
  "https://unsplash.com/photos/Ztf7inpO-0s/download?force=true&w=2000";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { label: "Home", href: "#home" },
      { label: "Collection", href: "#collection" },
      { label: "Process", href: "#process" },
    ],
  },
  {
    title: "Pages",
    links: [
      { label: "Our Works", href: "#our-works" },
      { label: "Reviews", href: "#reviews" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "Instagram", href: "#" },
      { label: "Pinterest", href: "#" },
      { label: "Facebook", href: "#" },
    ],
  },
];

/* Social links: replace each "#" with your real profile URL */
const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
};

const SOCIALS = [
  {
    label: "Instagram",
    brand: "instagram",
    href: "#",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    brand: "linkedin",
    href: "#",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M8 11v6M8 7.5v.01M12 17v-6M12 13a2.5 2.5 0 0 1 5 0v4" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    brand: "facebook",
    href: "#",
    icon: (
      <svg {...iconProps}>
        <path d="M14 8h2.5V4.5H14A3.5 3.5 0 0 0 10.5 8v2.5H8V14h2.5v6.5H14V14h2.5l.5-3.5H14V8z" />
      </svg>
    ),
  },
];

const BADGE_TEXT =
  "LET'S MAKE SOMETHING WORTH KEEPING · YOUR WINDOWS DESERVE IT · ";

/*
  All class names start with "bf-" (blinds footer) so they can never clash
  with older footer styles elsewhere in the site.
*/
export default function Footer() {
  return (
    <footer className="bf" id="contact">
      {/* ---------- Big headline with rotating badge ---------- */}
      <div className="bf-hero" aria-label="Let's talk">
        <span className="bf-word" aria-hidden="true">
          LET'S
        </span>

        <a className="bf-badge" href="#contact-form" aria-label="Start a conversation">
          <svg className="bf-badge-ring" viewBox="0 0 200 200" aria-hidden="true">
            <defs>
              <path
                id="bf-circle"
                d="M100,100 m-82,0 a82,82 0 1,1 164,0 a82,82 0 1,1 -164,0"
              />
            </defs>
            <text>
              <textPath
                href="#bf-circle"
                startOffset="0"
                textLength="512"
                lengthAdjust="spacing"
              >
                {BADGE_TEXT}
              </textPath>
            </text>
          </svg>
          <svg
            className="bf-badge-arrow"
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 18L18 6" />
            <path d="M9 6h9v9" />
          </svg>
        </a>

        <span className="bf-word" aria-hidden="true">
          TALK
        </span>
      </div>

      {/* ---------- Olive link band ---------- */}
      <div className="bf-band">
        <div className="bf-inner">
          <div className="bf-grid">
            {COLUMNS.map((column) => (
              <nav className="bf-col" aria-label={column.title} key={column.title}>
                <p className="bf-title">{column.title}</p>
                <ul className="bf-list">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href}>{link.label}</a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            <div className="bf-col">
              <p className="bf-title">Visit</p>
              <ul className="bf-list">
                <li>Serving homes across the United States</li>
                <li>[Phone number]</li>
                <li>[Email address]</li>
              </ul>
            </div>
          </div>

          <div className="bf-bottom">
            <div className="bf-brandrow">
              <a className="bf-logo" href="#home" aria-label="Olive Leaf Blinds home">
                <img src="/images/logo2.png" alt="Olive Leaf Blinds logo" />
              </a>
              <ul className="bf-social" aria-label="Social media">
                {SOCIALS.map((s) => (
                  <li key={s.label}>
                    <a className={`bf-social-${s.brand}`} href={s.href} aria-label={s.label} target="_blank" rel="noopener noreferrer">
                      {s.icon}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <span className="bf-credit">
              <span className="bf-credit-by">
                © 2026 Designed and developed by{" "}
                <strong className="bf-credit-name">Pixel Horse.</strong>
              </span>{" "}
              <span className="bf-rights">All rights reserved.</span>
            </span>
          </div>
        </div>
      </div>

      {/* ---------- Blinds photo strip ---------- */}
      <div
        // className="bf-photo"
        // style={{ "--bf-image": `url("${FOOTER_IMAGE}")` }}
        // role="img"
        // aria-label="Sunlight filtering through window blinds"
      />
    </footer>
  );
}