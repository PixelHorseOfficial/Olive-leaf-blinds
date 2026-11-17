import { useState } from 'react';
import './Contact.css';

// Swap this for your own photo (e.g. /images/contact-blinds.jpg) any time.
const CONTACT_IMAGE =
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80';

const SOCIALS = [
  {
    name: 'Instagram',
    href: 'https://instagram.com',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: 'Pinterest',
    href: 'https://pinterest.com',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M10.200 20 12 12.500" />
        <path d="M9.500 14c-1.300-2.600.300-5.500 3-5.500 2 0 3 1.300 3 2.800 0 2-1.200 3.500-2.800 3.500-.8 0-1.300-.500-1.500-1" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M8 10.500V16M8 7.800v.1M11.500 16v-5.500M11.500 12.500c0-1.300 1-2.200 2.200-2.200s2 .9 2 2.200V16" />
      </svg>
    ),
  },
];

export default function Contact() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | error | sent

  const handleSubmit = (e) => {
    e.preventDefault();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!valid) {
      setStatus('error');
      return;
    }
    // TODO: send `email` to your backend / form service here.
    setStatus('sent');
    setEmail('');
  };

  return (
    <section className="olb-contact" id="contact">
      <div className="olb-contact__wrap">
        <figure className="olb-contact__media">
          <img
            src={CONTACT_IMAGE}
            alt="Sunlit living room with soft window treatments"
            loading="lazy"
          />
        </figure>

        <div className="olb-contact__panel">
          <div className="olb-contact__brand">
            <img src="/images/logo2.png" width="76" height="76" alt="Olive Leaf Blinds logo" />
            <span className="olb-contact__name">
              Olive Leaf <em>Blinds</em>
            </span>
          </div>

          <p className="olb-contact__tagline">Book a free home consultation</p>

          <form className="olb-contact__form" onSubmit={handleSubmit} noValidate>
            <label className="olb-sr" htmlFor="olb-contact-email">
              Email address
            </label>
            <input
              id="olb-contact-email"
              type="email"
              value={email}
              placeholder="jane@email.com"
              onChange={(e) => {
                setEmail(e.target.value);
                if (status !== 'idle') setStatus('idle');
              }}
              aria-invalid={status === 'error'}
              aria-describedby="olb-contact-msg"
            />
            <button type="submit">Submit</button>
          </form>

          <p
            id="olb-contact-msg"
            className={`olb-contact__msg ${status}`}
            role="status"
            aria-live="polite"
          >
            {status === 'error' && 'Please enter a valid email address.'}
            {status === 'sent' && 'Thank you! We will be in touch to arrange your visit.'}
          </p>

          <div className="olb-contact__follow">
            <span>Follow us</span>
            <ul>
              {SOCIALS.map((s) => (
                <li key={s.name}>
                  <a href={s.href} target="_blank" rel="noreferrer" aria-label={s.name}>
                    {s.icon}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}