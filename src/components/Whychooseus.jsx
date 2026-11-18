import "./WhychooseUs.css";

/* ------------------------------------------------------------------
   IMAGE — put your file in:  public/images/
   Expected name: why-choose-us.png
   (change the extension below if yours is .jpg / .webp)
   Portrait photos (roughly 3:4) fit this section best.
------------------------------------------------------------------- */
const IMAGE_SRC = "/images/whychooseus-sec-image.png";
const IMAGE_ALT = "A fitter installing made-to-measure blinds in a living room";

/* ----------------------- EDITABLE CONTENT ------------------------ */
const CONTENT = {
  label: "Why choose us",
  heading: "Blinds made for your windows, from first sketch to final fitting",
  intro:
    "One team looks after everything: design, manufacturing and installation. You deal with one point of contact, and every blind is made to your exact measurements.",
  steps: [
    {
      title: "Free Consultation & Design",
      text: "We visit your home, listen to what you need and recommend fabrics, colours and styles that suit each room.",
    },
    {
      title: "Precision Manufacturing",
      text: "Every blind is cut and assembled in our own workshop to millimetre-accurate measurements.",
    },
    {
      title: "Professional Installation",
      text: "Our trained fitters install, test and adjust each blind, then clear up before they leave.",
    },
    {
      title: "Aftercare & Warranty",
      text: "Every installation is backed by a written warranty and fast support if you ever need an adjustment.",
    },
  ],
  stats: [
    { value: "15+", label: "Years of experience" },
    { value: "5,000+", label: "Homes and offices fitted" },
    { value: "5 yr", label: "Warranty on every blind" },
  ],
  cta: { text: "Book a free consultation", href: "#contact" },
};

export default function WhyChooseUs() {
  return (
    <section className="why" id="why-choose-us" aria-labelledby="why-title">
      <div className="why__media">
        <img src={IMAGE_SRC} alt={IMAGE_ALT} />
      </div>

      <div className="why__panel">
        <div className="why__inner">
          <span className="why__pill">{CONTENT.label}</span>

          <h2 className="why__title" id="why-title">
            {CONTENT.heading}
          </h2>
          <p className="why__intro">{CONTENT.intro}</p>

          <ol className="why__steps">
            {CONTENT.steps.map((s, i) => (
              <li className="why__step" key={s.title}>
                <span className="why__num" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="why__step-title">{s.title}</h3>
                <p className="why__step-text">{s.text}</p>
              </li>
            ))}
          </ol>

          <div className="why__footer">
            <dl className="why__stats">
              {CONTENT.stats.map((s) => (
                <div className="why__stat" key={s.label}>
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
            <a className="why__cta" href={CONTENT.cta.href}>
              {CONTENT.cta.text}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}