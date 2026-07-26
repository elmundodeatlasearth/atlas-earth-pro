// src/utils/sanitize.ts
// Sanitización de HTML para dangerouslySetInnerHTML
import DOMPurify from "dompurify";

export function sanitizeHTML(html: string): string {
  if (typeof window === "undefined") return html; // SSR fallback
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "h1","h2","h3","h4","h5","h6",
      "p","br","hr",
      "ul","ol","li",
      "strong","em","b","i","u","s",
      "code","pre","blockquote",
      "table","thead","tbody","tr","th","td",
      "div","span",
      "a","img",
    ],
    ALLOWED_ATTR: ["href","target","rel","src","alt","class","style"],
    ALLOW_DATA_ATTR: false,
  });
}
