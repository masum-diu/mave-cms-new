// components/common/InlineSvg.jsx
// Renders an uploaded SVG inline (instead of <img src=...>) so its color can
// be controlled with CSS. Falls back to a plain <img> while loading or if the
// fetch fails, so it never breaks non-SVG usage.

import React, { useEffect, useState } from "react";

const forceCurrentColor = (markup) =>
  markup
    .replace(/fill="([^"]*)"/gi, (match, val) =>
      val.trim().toLowerCase() === "none" ? match : 'fill="currentColor"'
    )
    .replace(/fill='([^']*)'/gi, (match, val) =>
      val.trim().toLowerCase() === "none" ? match : "fill='currentColor'"
    );

const InlineSvg = ({ src, color, className, style, alt = "" }) => {
  const [markup, setMarkup] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setMarkup(null);
    setFailed(false);

    if (!src) return undefined;

    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch SVG");
        return res.text();
      })
      .then((text) => {
        if (!cancelled) setMarkup(text);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  if (failed || !markup) {
    return <img src={src} alt={alt} className={className} style={style} />;
  }

  const html = color ? forceCurrentColor(markup) : markup;

  return (
    <div
      role="img"
      aria-label={alt}
      className={className}
      style={{ display: "inline-block", ...(color ? { color } : {}), ...style }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default InlineSvg;
