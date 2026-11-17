import React, { useState } from "react";
import "./Reviews.css";

/*
  Sample reviews. Replace with your real customer feedback before launch.
  Avatars use initials so no stock photos of real people are used as fake customers.
*/
const ROW_ONE = [
  {
    rating: 5,
    text: "The roller blinds look fantastic in our living room. The fabric filters the glare beautifully without making the room feel dark.",
    name: "Priya Sharma",
    role: "Homeowner, New York",
  },
  {
    rating: 5,
    text: "The installer arrived on time, fitted every blind in a single visit, and cleaned up afterwards. Truly a stress-free experience.",
    name: "Rahul Mehta",
    role: "Apartment Owner, Los Angeles",
  },
  {
    rating: 5,
    text: "Our blackout blinds changed the way we sleep. The bedroom is completely dark, even in the middle of the afternoon.",
    name: "Ananya Iyer",
    role: "Interior Stylist,Chicago",
  },
  {
    rating: 5,
    text: "The free measuring visit saved us so much worry. Every blind fitted perfectly into our recesses with no gaps at all.",
    name: "Karan Malhotra",
    role: "Villa Owner, Houston",
  },
  {
    rating: 4,
    text: "Motorised blinds linked to our smart home setup in minutes. Having them open with the sunrise is a daily luxury.",
    name: "Neha Kapoor",
    role: "Product Manager,  Phoenix",
  },
  {
    rating: 5,
    text: "Elegant Roman blinds in a soft linen finish. Guests keep asking where we found them. The stitching is flawless.",
    name: "Meera Nair",
    role: "Homeowner, San Antonio",
  },
];

const ROW_TWO = [
  {
    rating: 5,
    text: "Delivery arrived within the promised two weeks, and the packaging was careful. Every blind was exactly as ordered.",
    name: "Vikram Singh",
    role: "Cafe Owner, Philadelphia",
  },
  {
    rating: 5,
    text: "Zebra blinds give us light control without losing privacy. They look modern and were simple to operate from day one.",
    name: "Sneha Reddy",
    role: "Architect, San Diego",
  },
  {
    rating: 5,
    text: "The team helped us choose wooden venetians for the study. Real wood warmth, and they hold up well in the afternoon sun.",
    name: "Arjun Patel",
    role: "Consultant, Dallas",
  },
  {
    rating: 5,
    text: "Our office blinds cut the glare on monitors and the room stays cooler. Staff noticed the difference within days.",
    name: "Divya Menon",
    role: "Operations Head, Fort Worth",
  },
  {
    rating: 4,
    text: "Responsive service from enquiry to installation. They even adjusted one blind for free after a small change of mind.",
    name: "Rohan Desai",
    role: "Homeowner, Austin",
  },
  {
    rating: 5,
    text: "Easy to clean, sturdy chains, and a smooth lift every time. These blinds feel built to last for many years.",
    name: "Aisha Khan",
    role: "Teacher, Columbus",
  },
];

const initials = (name) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const Stars = ({ rating }) => (
  <div className="rv-stars" role="img" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <svg
        key={n}
        className={n <= rating ? "rv-star is-on" : "rv-star"}
        width="18"
        height="18"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8L12 2.5z" />
      </svg>
    ))}
  </div>
);

const Card = ({ review }) => (
  <article className="rv-card">
    <Stars rating={review.rating} />
    <p className="rv-text">{review.text}</p>
    <div className="rv-author">
      <span className="rv-avatar" aria-hidden="true">
        {initials(review.name)}
      </span>
      <div className="rv-author-info">
        <span className="rv-name">{review.name}</span>
        <span className="rv-role">{review.role}</span>
      </div>
    </div>
  </article>
);

/* The set is rendered twice so the loop is seamless. The copy is hidden from screen readers. */
const MarqueeRow = ({ reviews, reverse }) => (
  <div className="rv-marquee">
    <div className={`rv-track ${reverse ? "is-reverse" : ""}`}>
      <div className="rv-set">
        {reviews.map((review) => (
          <Card key={review.name} review={review} />
        ))}
      </div>
      <div className="rv-set" aria-hidden="true">
        {reviews.map((review) => (
          <Card key={`${review.name}-copy`} review={review} />
        ))}
      </div>
    </div>
  </div>
);

const Reviews = () => {
  // Hovering pauses the scroll (CSS). Clicking locks it until clicked again.
  const [locked, setLocked] = useState(false);

  return (
    <section className="rv-section" aria-labelledby="rv-heading">
      <div className="rv-header">
        <span className="rv-pill">
          What our customers say
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </span>
        <h2 id="rv-heading" className="rv-heading">
          Loved By The Homes <span>Fitted With Them</span>
        </h2>
        <p className="rv-sub">
          From perfect measuring to careful installation, our blinds are made
          to bring light, privacy and style to every room.
        </p>
      </div>

      <div
        className={`rv-rows ${locked ? "is-locked" : ""}`}
        onClick={() => setLocked((value) => !value)}
        role="group"
        aria-label="Customer reviews. Hover or click to pause scrolling."
        title={locked ? "Click to resume" : "Click to pause"}
      >
        <MarqueeRow reviews={ROW_ONE} />
        <MarqueeRow reviews={ROW_TWO} reverse />
      </div>
    </section>
  );
};

export default Reviews;