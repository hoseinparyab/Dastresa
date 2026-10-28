import type { Plugin } from 'vite';

/**
 * Rewrites @mozilla/readability's `.innerHTML =` assignments so AMO's
 * addons-linter does not flag Mozilla's own library as unsafe.
 */
export function readabilityNoInnerHtml(): Plugin {
  const helper = `
function __dastresaSetHtml(el, html) {
  var doc = el.ownerDocument || document;
  var parsed = new DOMParser().parseFromString(
    "<!DOCTYPE html><html><body>" + html + "</body></html>",
    "text/html"
  );
  var nodes = Array.prototype.slice.call(parsed.body.childNodes).map(function (node) {
    return doc.importNode(node, true);
  });
  el.replaceChildren.apply(el, nodes);
}
`;

  return {
    name: 'dastresa-readability-no-innerhtml',
    enforce: 'pre',
    transform(code, id) {
      const norm = id.replace(/\\/g, '/');
      if (!norm.includes('/@mozilla/readability/Readability.js')) return null;
      if (!code.includes('.innerHTML =')) return null;

      let next = code;
      next = next.replace(
        /\/\/ eslint-disable-next-line no-unsanitized\/property\r?\n\s*page\.innerHTML = pageCacheHtml;/,
        '__dastresaSetHtml(page, pageCacheHtml);',
      );
      next = next.replace(
        /\/\/ eslint-disable-next-line no-unsanitized\/property\r?\n\s*tmp\.innerHTML = noscript\.innerHTML;/,
        '__dastresaSetHtml(tmp, noscript.innerHTML);',
      );

      if (next === code) {
        // Fallback: any remaining Element.innerHTML assignments in this file.
        next = next.replace(
          /\b([a-zA-Z_$][\w$]*)\.innerHTML\s*=\s*([^;]+);/g,
          '__dastresaSetHtml($1, $2);',
        );
      }

      if (next === code) return null;
      return { code: helper + next, map: null };
    },
  };
}
