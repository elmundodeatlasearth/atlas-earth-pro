// src/__tests__/sanitize.test.ts
// Tests para la sanitización de HTML del Asistente IA (XSS prevention)
import { sanitizeHTML } from "@/utils/sanitize";

describe("sanitizeHTML", () => {
  it("permite etiquetas permitidas (h1, strong, div)", () => {
    const result = sanitizeHTML("<h1>Título</h1><p><strong>negrita</strong></p><div>bloque</div>");
    expect(result).toContain("<h1>Título</h1>");
    expect(result).toContain("<strong>negrita</strong>");
    expect(result).toContain("<div>bloque</div>");
  });

  it("elimina scripts maliciosos", () => {
    const result = sanitizeHTML("<script>alert('xss')</script><p>sano</p>");
    expect(result).not.toContain("<script");
    expect(result).not.toContain("alert");
    expect(result).toContain("sano");
  });

  it("elimina handlers de eventos inline (onerror, onclick)", () => {
    const result = sanitizeHTML('<img src="x" onerror="alert(1)"><p onclick="hack()">texto</p>');
    expect(result).not.toContain("onerror");
    expect(result).not.toContain("onclick");
    expect(result).not.toContain("hack");
  });

  it("elimina javascript: en hrefs", () => {
    const result = sanitizeHTML('<a href="javascript:alert(1)">link</a>');
    expect(result).not.toContain("javascript:");
  });

  it("maneja strings vacíos sin error", () => {
    expect(sanitizeHTML("")).toBe("");
  });

  it("conserva texto plano sin tags", () => {
    expect(sanitizeHTML("texto simple")).toBe("texto simple");
  });
});
