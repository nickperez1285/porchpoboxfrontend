import React from "react";
import Seo from "./Seo";
import "./InfoPage.css";

const keyFindings = [
  {
    icon: "🗞️",
    title: "SF Bay Area ranked #1 for package theft",
    text: "SafeWise's annual report ranked the San Francisco–Oakland–San Jose metro the #1 worst in the U.S. for package theft — coverage that put Bay Area porch piracy in the national spotlight.",
    source: "KRON4",
  },
  {
    icon: "📈",
    title: "Three in four Americans have been hit",
    text: "Package theft grew 23% in a single year, and SafeWise found three out of four Americans have had a package stolen from their doorstep.",
    source: "SafeWise",
  },
  {
    icon: "🏘️",
    title: "California leads the nation in losses",
    text: "SafeWise's latest report estimates California lost over $1.5 billion to package theft — the most of any state, with 32,000+ incidents every single day.",
    source: "SafeWise 2025",
  },
  {
    icon: "🔐",
    title: "Recovery is rare",
    text: "Package theft is overwhelmingly property crime with little chance of recovery — which is why prevention matters more than response.",
    source: "Porch P.O. Box analysis",
  },
];

const reportSections = [
  {
    title: "Why package theft happens",
    body: "Porch piracy is a crime of opportunity. A parcel left on a doorstep is visible, unattended, and typically gone within minutes of delivery. Delivery notifications tell thieves exactly when packages arrive, and the rise of online shopping means more parcels on porches than ever before.",
  },
  {
    title: "The real cost to shoppers",
    body: "Beyond the value of the item, package theft costs consumers time on refunds and reshipments, trust in online shopping, and peace of mind. Many victims report it changes how they shop — refusing doorstep delivery or paying extra for security they shouldn't need.",
  },
  {
    title: "Prevention beats recovery",
    body: "Once a package is taken, recovery is almost never possible. The effective solutions are all preventive: delivery lockers, secure receiving points, and delivery partners who hold parcels indoors until pickup. Porch P.O. Box exists for exactly this reason.",
  },
];

const comparisonRows = [
  {
    option: "Porch P.O. Box partner pickup",
    security: "High — held indoors by a trusted local partner",
    convenience: "Pick up on your schedule",
    cost: "Simple monthly plans",
  },
  {
    option: "Home doorstep delivery",
    security: "Low — visible to anyone passing by",
    convenience: "Delivery to your door, but only if someone is home",
    cost: "Free with most orders",
  },
  {
    option: "Public parcel locker",
    security: "Medium — location may be far from home",
    convenience: "Pick up within a short window",
    cost: "Often per-use fees",
  },
];

const PorchPiracyReport = () => {
  return (
    <div className="info-page">
      <Seo
        title="Porch Piracy Report: Bay Area"
        description="Annual report on package theft across the San Francisco Bay Area: why porch piracy happens, what it costs shoppers, and the prevention methods that actually work."
        keywords="porch piracy report, package theft Bay Area, package theft statistics, porch pirate report, package theft prevention"
        path="/porch-piracy-report"
        ogImage="/porchlogo.png"
      />
      <div className="info-page__inner">
        <div className="info-hero">
          <div className="info-hero__label">Porch P.O. Box Research</div>
          <h1 className="info-hero__title">Porch Piracy Report: Bay Area</h1>
          <p className="info-hero__sub">
            What the data says about package theft in the San Francisco Bay
            Area — and why secure pickup is the only reliable fix.
          </p>
        </div>

        <div className="info-card">
          <h3>About this report</h3>
          <p>
            Porch P.O. Box publishes an annual look at package theft in the
            San Francisco Bay Area. We track delivery theft reports, survey
            local shoppers, and compare the protection offered by the
            delivery methods people actually use.
          </p>
          <p>
            The Bay Area's problem is well documented. SafeWise's national
            package theft report ranked the San Francisco–Oakland–San Jose
            metro the <strong>#1 worst in the U.S.</strong> — coverage picked
            up by KRON4 and outlets across the region. Nationally, SafeWise
            estimates <strong>104 million packages were stolen in the past
            year</strong> (roughly a quarter of a million every day), costing
            consumers about <strong>$15 billion</strong> with an average
            value of <strong>$143 per stolen package</strong>.
          </p>
          <p>
            Journalists and neighborhood groups are welcome to cite this page
            and to embed our data. For the full dataset, contact us at{" "}
            <a href="mailto:contact@porchpobox.com">contact@porchpobox.com</a>.
          </p>
        </div>

        <div className="info-steps">
          {keyFindings.map((finding) => (
            <div className="info-step" key={finding.title}>
              <div className="info-step__icon" aria-hidden="true">
                {finding.icon}
              </div>
              <h3 className="info-step__title">{finding.title}</h3>
              <p className="info-step__desc">{finding.text}</p>
              {finding.source && (
                <p className="info-step__source">Source: {finding.source}</p>
              )}
            </div>
          ))}
        </div>

        <div className="info-card" style={{ marginBottom: "32px" }}>
          <h3>Report highlights</h3>
          <p>
            Package theft is one of the most common property crimes tied to
            online shopping. The Bay Area's dense housing, apartment buildings,
            and mixed-use streets create thousands of doorsteps where parcels
            sit unprotected every day.
          </p>
          <p>
            The clearest pattern in the data: theft tracks delivery volume.
            When more packages arrive on doorsteps, more packages disappear.
            Holiday surges bring the largest increases every year.
          </p>
        </div>

        <div className="info-card" style={{ marginBottom: "20px" }}>
          <h3>In the news</h3>
          <ul style={{ color: "var(--gray)", lineHeight: 1.8, paddingLeft: "20px" }}>
            <li>
              <a
                href="https://www.kron4.com/news/bay-area/sf-bay-area-ranks-worst-in-us-for-package-theft-report-finds/"
                target="_blank"
                rel="noopener noreferrer"
              >
                "SF Bay Area ranks worst in US for package theft, report finds"
              </a>{" "}
              — KRON4, covering the SafeWise report
            </li>
            <li>
              <a
                href="https://sfist.com/2022/11/25/bay-area-ranks-worst-for-package-theft-according-to-report/"
                target="_blank"
                rel="noopener noreferrer"
              >
                "Bay Area Ranks Worst for Package Theft, According to Report"
              </a>{" "}
              — SFist
            </li>
            <li>
              <a
                href="https://www.safewise.com/research/porch-pirate-package-theft/"
                target="_blank"
                rel="noopener noreferrer"
              >
                U.S. Package Theft Report — SafeWise research
              </a>{" "}
              (national source data)
            </li>
          </ul>
        </div>

        {reportSections.map((section) => (
          <div className="info-card" key={section.title} style={{ marginBottom: "20px" }}>
            <h3>{section.title}</h3>
            <p>{section.body}</p>
          </div>
        ))}

        <div className="info-card" style={{ marginBottom: "20px" }}>
          <h3>Delivery methods compared for security</h3>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
              }}
            >
              <thead>
                <tr style={{ textAlign: "left", color: "var(--navy)" }}>
                  <th style={{ padding: "10px 12px", borderBottom: "2px solid var(--border)" }}>
                    Delivery method
                  </th>
                  <th style={{ padding: "10px 12px", borderBottom: "2px solid var(--border)" }}>
                    Security
                  </th>
                  <th style={{ padding: "10px 12px", borderBottom: "2px solid var(--border)" }}>
                    Convenience
                  </th>
                  <th style={{ padding: "10px 12px", borderBottom: "2px solid var(--border)" }}>
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.option}>
                    <td style={{ padding: "12px", borderBottom: "1px solid var(--border)", fontWeight: 700, color: "var(--navy)" }}>
                      {row.option}
                    </td>
                    <td style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>{row.security}</td>
                    <td style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>{row.convenience}</td>
                    <td style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>{row.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="info-card">
          <h3>Methodology</h3>
          <p>
            This report draws on publicly reported package theft incidents,
            delivery volume data, and an annual survey of Bay Area residents.
            Figures are rounded and updated annually. When citing this report,
            please link back to{" "}
            <a href="https://porchpobox.com/porch-piracy-report">
              porchpobox.com/porch-piracy-report
            </a>
            .
          </p>
        </div>

        <div className="info-trust">
          <span>
            <span aria-hidden="true">📦</span> Updated annually
          </span>
          <span>
            <span aria-hidden="true">🔍</span> Data for journalists
          </span>
          <span>
            <span aria-hidden="true">🏘️</span> Bay Area focused
          </span>
        </div>
      </div>
    </div>
  );
};

export default PorchPiracyReport;
