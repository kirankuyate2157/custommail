import Handlebars from "handlebars";

export function renderTemplate(template = "", data = {}) {
  try {
    const compiled = Handlebars.compile(template);
    return compiled(data);
  } catch (e) {
    console.warn("Template render error:", e);
    return template;
  }
}
