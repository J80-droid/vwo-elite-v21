import DOMPurify from "dompurify";

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Uses DOMPurify which is safe for both Browser and (with JSDOM) Node.
 */
export const sanitizeHTML = (html: string): string => {
    if (!html) return "";
    return DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        ALLOWED_TAGS: [
            "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "ul", "ol", "li",
            "strong", "em", "b", "i", "u", "code", "pre", "blockquote",
            "img", "a", "span", "div", "table", "thead", "tbody", "tr", "th", "td"
        ],
        ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "id", "target"]
    });
};
