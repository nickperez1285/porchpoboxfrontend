import React from "react";
import Seo from "./Seo";
import "./InfoPage.css";

const preventionTips = [
  {
    icon: "🛡️",
    title: "Use a secure receiving address",
    text: "The single most effective fix: have packages delivered somewhere attended — a trusted partner location that holds them indoors until you pick up. Porch P.O. Box provides exactly this across the Bay Area.",
  },
  {
    icon: "📦",
    title: "Require a signature",
    text: "Many carriers let you require a signature on delivery. It slows thieves down and keeps drivers from leaving parcels on the porch.",
  },
  {
    icon: "🕒",
    title: "Schedule delivery windows",
    text: "Amazon, UPS, and FedEx all offer timed delivery. Align delivery with a time you'll actually be home.",
  },
  {
    icon: "📱",
    title: "Use package-tracking alerts",
    text: "Turn on delivery notifications and move packages off the porch within minutes of arrival.",
  },
  {
    icon: "🏠",
    title: "Hide the delivery from the street",
    text: "Ask carriers to place parcels behind the porch, in a side gate, or in a visible-from-inside spot — not on the front step in plain sight.",
  },
  {
    icon: "🤝",
    title: "Ask a neighbor",
    text: "For high-value packages, have a neighbor you trust take it in and hold it until you return.",
  },
  {
    icon: "🎥",
    title: "Add a camera or doorbell cam",
    text: "Cameras deter casual thieves and capture evidence. They don't stop every theft, but they change who gets targeted.",
  },
  {
    icon: "🛒",
    title: "Use pickup or locker options",
    text: "Amazon Locker and carrier pickup points remove the doorstep entirely — the package never sits on your porch.",
  },
  {
    icon: "🔒",
    title: "Get a porch lockbox",
    text: "A parcel lockbox bolted to your porch lets drivers drop packages securely. It's a one-time cost that eliminates most theft.",
  },
  {
    icon: "🚚",
    title: "Hold for pickup at the carrier",
    text: "UPS, FedEx, and USPS can hold packages at their local facility for you to collect on your schedule.",
  },
];

const PorchPiratesGuide = () => {
  return (
    <div className="info-page">
      <Seo
        title="How to Stop Porch Pirates"
        description="10 proven ways to stop porch pirates and protect your packages: secure receiving addresses, signature delivery, cameras, lockboxes, and more. Stop package theft today."
        keywords="how to stop porch pirates, stop porch pirates, package theft prevention, stop package theft, protect packages from theft, secure package delivery"
        path="/stop-porch-pirates"
        ogImage="/porchlogo.png"
      />
      <div className="info-page__inner">
        <div className="info-hero">
          <div className="info-hero__label">Porch P.O. Box Guide</div>
          <h1 className="info-hero__title">How to Stop Porch Pirates</h1>
          <p className="info-hero__sub">
            Package theft is a crime of opportunity. Here are 10 proven ways
            to take the opportunity away — starting with the one that works
            best.
          </p>
        </div>

        <div className="info-card" style={{ marginBottom: "32px" }}>
          <h3>Why porch piracy happens</h3>
          <p>
            Porch pirates target packages that are visible, unattended, and
            easy to grab. Delivery notifications announce exactly when parcels
            arrive, and online shopping means more boxes on doorsteps than
            ever before. A thief can spot a package, grab it, and be gone in
            under a minute — which is why most theft happens within minutes of
            delivery.
          </p>
          <p>
            The good news: porch piracy is preventable. Every method below
            works by making your packages harder to grab. Combine two or three
            and theft becomes almost impossible.
          </p>
        </div>

        <div className="info-steps">
          {preventionTips.map((tip, index) => (
            <div className="info-step" key={tip.title}>
              <div className="info-step__number">{index + 1}</div>
              <div className="info-step__icon" aria-hidden="true">
                {tip.icon}
              </div>
              <h3 className="info-step__title">{tip.title}</h3>
              <p className="info-step__desc">{tip.text}</p>
            </div>
          ))}
        </div>

        <div className="info-card" style={{ marginBottom: "20px" }}>
          <h3>The one solution that stops theft completely</h3>
          <p>
            Cameras, lockboxes, and delivery windows all reduce risk — but they
            still leave packages sitting on your doorstep. The only way to
            guarantee a package is never stolen is to make sure it never sits
            on a porch at all.
          </p>
          <p>
            That's exactly what Porch P.O. Box does. Your packages are delivered
            to a trusted local partner location and held securely indoors until
            you pick them up. No doorstep. No theft. No missed deliveries. You
            get notified the moment your package arrives and pick it up on your
            schedule.
          </p>
          <p>
            <a href="/plans">See plans and start protecting your packages →</a>
          </p>
        </div>

        <div className="info-card">
          <h3>Still want to shop doorstep-first?</h3>
          <p>
            These tactics cut your risk dramatically:
          </p>
          <ul style={{ color: "var(--gray)", lineHeight: 1.8, paddingLeft: "20px" }}>
            <li>Require signatures on anything over a few hundred dollars.</li>
            <li>Ship to your workplace when a big order is coming.</li>
            <li>Never let delivery photos of boxes pile up on your porch.</li>
            <li>Join a neighborhood watch or Nextdoor group to report theft patterns.</li>
            <li>If you are a victim, report it to police and the carrier — it builds the case for enforcement.</li>
          </ul>
        </div>

        <div className="info-trust">
          <span><span aria-hidden="true">🛡️</span> Proven methods</span>
          <span><span aria-hidden="true">📦</span> No package ever hits your porch</span>
          <span><span aria-hidden="true">📍</span> Trusted Bay Area partners</span>
        </div>
      </div>
    </div>
  );
};

export default PorchPiratesGuide;
