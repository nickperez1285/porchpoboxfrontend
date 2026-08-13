import { useEffect } from "react";

const SITE_URL = "https://porchpobox.com";

const setMeta = (attr, value, name) => {
  let el = document.head.querySelector(`meta[${attr}="${value}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, value);
    document.head.appendChild(el);
  }
  el.setAttribute("content", name);
};

const Seo = ({
  title,
  description,
  keywords,
  path = "/",
  ogImage = "/porchlogo.png",
}) => {
  useEffect(() => {
    const fullTitle = title
      ? `${title} | Porch P.O. Box`
      : "Porch P.O. Box | Secure Package Delivery & Receiving Service – Stop Porch Piracy";
    const canonical = `${SITE_URL}${path === "/" ? "/" : path}`;

    document.title = fullTitle;
    setMeta("name", "description", description);
    setMeta("name", "keywords", keywords);
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", canonical);
    setMeta("property", "og:image", `${SITE_URL}${ogImage}`);
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);

    let canonicalLink = document.head.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", canonical);
  }, [title, description, keywords, path, ogImage]);

  return null;
};

export default Seo;
