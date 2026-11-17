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
            <span>© 2026 Designed and developed by Pixel Horse. All rights reserved.</span>
            {/* <span> All rights reserved.</span> */}
          </div>
        </div>
      </div>

      {/* ---------- Blinds photo strip ---------- */}
      <div
        className="bf-photo"
        style={{ "--bf-image": `url("${FOOTER_IMAGE}")` }}
        role="img"
        aria-label="Sunlight filtering through window blinds"
      />
    </footer>
  );
}