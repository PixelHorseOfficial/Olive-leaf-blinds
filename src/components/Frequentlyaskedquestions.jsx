import React, { useState } from "react";
import "./FrequentlyAskedQuestions.css";

const FAQ_ITEMS = [
  {
    question: "What types of window blinds do you offer?",
    answer:
      "Our collection includes Roller, Roman, Venetian, Vertical, Zebra (day & night), and Honeycomb cellular blinds. Each style is available in a wide range of fabrics, finishes, and colours, so you can balance light control, privacy, and design to suit every room in your home or office.",
  },
  {
    question: "How do I measure my windows for blinds?",
    answer:
      "Measure the width and height of your window recess at three points (top, middle, and bottom for width; left, centre, and right for height) and use the smallest measurement. For an outside-mount fit, add at least 5 cm on each side for full coverage. Our team is happy to provide a free measuring service if you would like it done for you.",
  },
  {
    question: "Do you offer custom-made blinds?",
    answer:
      "Yes. Every blind is made to measure, tailored to your exact window dimensions, fabric choice, control type, and mounting preference. We also accommodate special shapes such as arched, angled, and bay windows on request.",
  },
  {
    question: "Which blinds are best for blocking light and heat?",
    answer:
      "Blackout roller blinds and honeycomb (cellular) blinds are our top choices. Blackout fabrics block up to 100% of light, while the air pockets in honeycomb blinds provide insulation that helps keep rooms cooler in summer and warmer in winter, which can also reduce energy costs.",
  },
  {
    question: "Are motorised and smart blinds available?",
    answer:
      "Absolutely. Most of our blinds can be motorised with a remote, wall switch, or smartphone app, and are compatible with popular smart home systems and voice assistants. You can also schedule your blinds to open and close automatically with the sun.",
  },
  {
    question: "How do I clean and maintain my blinds?",
    answer:
      "Regular light dusting with a microfibre cloth or a vacuum brush attachment is usually enough. Fabric blinds can be spot-cleaned with a damp cloth and mild soap, while wood and faux-wood slats should be wiped gently and kept away from excess moisture. Detailed care instructions are included with every order.",
  },
  {
    question: "How long does delivery and installation take?",
    answer:
      "Made-to-measure blinds are typically produced and delivered within 7 to 14 working days after order confirmation. Professional installation can be scheduled at a time convenient for you, and most homes are completed within a single visit.",
  },
  {
    question: "Do your blinds come with a warranty?",
    answer:
      "Yes. All our blinds include a warranty covering manufacturing defects in fabric, mechanisms, and motors. Warranty duration varies by product range, and our support team will gladly assist with any claim or repair.",
  },
];

const FrequentlyAskedQuestions = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (index) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <section className="faq-section" aria-labelledby="faq-heading">
      <div className="faq-container">
        <div className="faq-heading-wrap">
          <h2 id="faq-heading" className="faq-heading">
            Frequently
            <br />
            Asked
            <br />
            Questions
          </h2>
          <p className="faq-subtext">
            Can't find what you're looking for? Our team is here to help you
            choose the perfect blinds for your space.
          </p>
        </div>

        <div className="faq-list">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                className={`faq-item ${isOpen ? "faq-item--open" : ""}`}
                key={item.question}
              >
                <h3 className="faq-question-wrap">
                  <button
                    type="button"
                    className="faq-question"
                    onClick={() => toggle(index)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                    id={`faq-question-${index}`}
                  >
                    <span>{item.question}</span>
                    <svg
                      className="faq-icon"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </h3>
                <div
                  id={`faq-answer-${index}`}
                  className="faq-answer"
                  role="region"
                  aria-labelledby={`faq-question-${index}`}
                >
                  <div className="faq-answer-inner">
                    <p>{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FrequentlyAskedQuestions;