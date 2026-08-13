import React, { useEffect, useState } from "react";
import Seo from "./Seo";
import "./InfoPage.css";

const QUESTION_DATA = [
  { id: "q1", text: "Where are your packages delivered?" },
  { id: "q2", text: "Do you use package-tracking alerts?" },
  { id: "q3", text: "Do you have a doorbell camera or security camera?" },
  { id: "q4", text: "Can you require signatures on high-value deliveries?" },
  { id: "q5", text: "Do you have a porch lockbox or delivery box?" },
  { id: "q6", text: "Is there someone to take packages in quickly?" },
];

const OPTIONS = [
  { value: 0, label: "No / not usually" },
  { value: 3, label: "Sometimes / partially" },
  { value: 5, label: "Yes / always" },
];

const FIRST_OPTIONS = [
  { value: 0, label: "Left on my doorstep" },
  { value: 4, label: "Hidden spot on my property" },
  { value: 8, label: "Attended secure location (locker, partner, work)" },
];

const verdictFor = (total) => {
  if (total >= 24)
    return "Strong protection. Your packages are unlikely to be stolen. For total peace of mind, route deliveries to an attended location so they never sit on a porch at all.";
  if (total >= 15)
    return "Moderate protection. You have some defense, but packages are still at risk. Add a secure delivery spot or a trusted pickup location.";
  return "High risk. Your packages are exposed to porch pirates. A camera helps, but the surest fix is delivering to a secure, attended location.";
};

const PorchSafetyScore = () => {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const total = QUESTION_DATA.reduce(
    (sum, q) => sum + (Number(answers[q.id]) || 0),
    0,
  );

  useEffect(() => {
    if (submitted) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [submitted]);

  const embedCode = `<iframe
  src="https://porchpobox.com/porch-safety-score.html"
  width="100%"
  height="640"
  loading="lazy"
  style="border:0; border-radius:16px; max-width:440px; margin:0 auto; display:block"
  title="Porch Safety Score widget from Porch P.O. Box"
></iframe>`;

  return (
    <div className="info-page">
      <Seo
        title="Porch Safety Score"
        description="Take the free Porch Safety Score quiz to see how protected your packages are from porch pirates — and embed the widget on your own site."
        keywords="porch safety score, package theft quiz, porch pirate quiz, embeddable widget, package protection tool"
        path="/porch-safety-score"
      />
      <div className="info-page__inner">
        <div className="info-hero">
          <div className="info-hero__label">Free Tool</div>
          <h1 className="info-hero__title">Porch Safety Score</h1>
          <p className="info-hero__sub">
            Answer six quick questions and see how protected your packages are
            from porch pirates.
          </p>
        </div>

        <div className="info-card" style={{ marginBottom: "32px" }}>
          {!submitted ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
            >
              {QUESTION_DATA.map((q, i) => (
                <div key={q.id} style={{ marginBottom: "18px" }}>
                  <label
                    htmlFor={q.id}
                    style={{ fontWeight: 700, color: "var(--navy)", display: "block", marginBottom: "6px" }}
                  >
                    {i + 1}. {q.text}
                  </label>
                  <select
                    id={q.id}
                    value={answers[q.id] ?? ""}
                    required
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "14px",
                      background: "#fff",
                    }}
                  >
                    <option value="" disabled>
                      Select an answer
                    </option>
                    {(i === 0 ? FIRST_OPTIONS : OPTIONS).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "none",
                  borderRadius: "10px",
                  background: "var(--blue)",
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Calculate My Score
              </button>
            </form>
          ) : (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div style={{ fontSize: "52px", fontWeight: 900, color: "var(--navy)" }}>
                {total}
                <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--gray)" }}>
                  {" "}/ 30
                </span>
              </div>
              <p
                style={{
                  marginTop: "10px",
                  fontSize: "15px",
                  lineHeight: 1.6,
                  color: "#3a4a5e",
                }}
              >
                {verdictFor(total)}
              </p>
              <a
                href="/stop-porch-pirates"
                style={{
                  display: "inline-block",
                  marginTop: "14px",
                  padding: "10px 18px",
                  background: "var(--navy)",
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: 800,
                }}
              >
                See 10 ways to stop porch pirates →
              </a>
              <button
                type="button"
                onClick={() => {
                  setAnswers({});
                  setSubmitted(false);
                }}
                style={{
                  display: "block",
                  margin: "16px auto 0",
                  background: "none",
                  border: "none",
                  color: "var(--blue)",
                  fontWeight: 700,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Retake the quiz
              </button>
            </div>
          )}
        </div>

        <div className="info-card" style={{ marginBottom: "20px" }}>
          <h3>Embed this widget on your site</h3>
          <p>
            Neighborhood groups, HOA blogs, and local news sites: embed the
            Porch Safety Score on your own page to help your readers — it links
            back to the full guide on porchpobox.com. Copy the code below:
          </p>
          <pre
            style={{
              background: "var(--navy)",
              color: "#dbe9ff",
              padding: "16px",
              borderRadius: "12px",
              fontSize: "12px",
              overflowX: "auto",
              lineHeight: 1.5,
              margin: "12px 0",
            }}
          >
            {embedCode}
          </pre>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(embedCode)}
            style={{
              padding: "10px 18px",
              border: "1px solid var(--blue)",
              borderRadius: "10px",
              background: "#fff",
              color: "var(--blue)",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Copy embed code
          </button>
        </div>

        <div className="info-trust">
          <span><span aria-hidden="true">🛡️</span> Free to use</span>
          <span><span aria-hidden="true">🔗</span> Link-friendly embed</span>
          <span><span aria-hidden="true">🏘️</span> Made for communities</span>
        </div>
      </div>
    </div>
  );
};

export default PorchSafetyScore;
