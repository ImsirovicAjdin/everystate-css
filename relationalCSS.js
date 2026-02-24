/**
 * Relational CSS: Constraint-based reactive style relationships
 *
 * Define relationships between style values: proportional scaling,
 * derived values, modular type scales, and WCAG contrast enforcement.
 * When a source value changes, all dependent values recompute automatically.
 *
 * @example
 *   import { createRelationalCSS } from '@everystate/css/relationalCSS';
 *
 *   const rel = createRelationalCSS(store);
 *
 *   // Proportional: header padding is always 2x card padding
 *   rel.derive('css.header.padding', { ref: 'css.card.padding', multiply: 2 });
 *
 *   // Modular type scale from a base font size
 *   rel.scale('tokens.font.base', {
 *     'css.h1.fontSize': 2.0,
 *     'css.h2.fontSize': 1.5,
 *     'css.h3.fontSize': 1.25,
 *     'css.body.fontSize': 1,
 *     'css.small.fontSize': 0.875,
 *   });
 *
 *   // WCAG contrast: auto-adjust text color for readability
 *   rel.contrast('css.card.color', {
 *     against: 'css.card.background',
 *     light: '#ffffff',
 *     dark: '#1e293b',
 *     minRatio: 4.5,
 *   });
 */

// ---- Color utilities for contrast computation ----

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  let r, g, b;
  if (h.length === 3) {
    r = parseInt(h[0] + h[0], 16);
    g = parseInt(h[1] + h[1], 16);
    b = parseInt(h[2] + h[2], 16);
  } else if (h.length === 6 || h.length === 8) {
    r = parseInt(h.substring(0, 2), 16);
    g = parseInt(h.substring(2, 4), 16);
    b = parseInt(h.substring(4, 6), 16);
  } else {
    return null;
  }
  return [r, g, b];
}

function parseColor(value) {
  if (!value || typeof value !== 'string') return null;
  const v = value.trim();

  // Hex
  if (v.startsWith('#')) return hexToRgb(v);

  // rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = v.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
  }

  // Named colors (common ones for practical use)
  const named = {
    white: [255, 255, 255], black: [0, 0, 0],
    red: [255, 0, 0], green: [0, 128, 0], blue: [0, 0, 255],
    yellow: [255, 255, 0], orange: [255, 165, 0], purple: [128, 0, 128],
    gray: [128, 128, 128], grey: [128, 128, 128],
  };
  return named[v.toLowerCase()] || null;
}

function relativeLuminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(color1, color2) {
  const l1 = relativeLuminance(color1);
  const l2 = relativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ---- Length utilities ----

const LENGTH_RE = /^(-?\d+(\.\d+)?)(px|rem|em|%|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc)$/;

function parseLength(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(LENGTH_RE);
  if (!match) return null;
  return { value: parseFloat(match[1]), unit: match[3] };
}

function formatLength(num, unit) {
  // Round to 4 decimal places to avoid floating point noise
  const rounded = Math.round(num * 10000) / 10000;
  return `${rounded}${unit}`;
}

// ---- Main API ----

/**
 * Create a relational CSS engine.
 *
 * @param {Object} store - An EveryState store instance
 * @returns {Object} Relational CSS API
 */
export function createRelationalCSS(store) {
  const unsubs = [];
  const relations = []; // for inspection

  return {
    /**
     * Derive a style value from another by applying a multiplier and/or offset.
     *
     * @param {string} targetPath - Path to write the computed value
     * @param {Object} options
     * @param {string} options.ref - Source path to watch
     * @param {number} [options.multiply=1] - Multiply the source value by this factor
     * @param {number} [options.add=0] - Add this amount (in same units) after multiply
     * @param {string} [options.unit] - Override unit (e.g. 'rem')
     */
    derive(targetPath, { ref, multiply = 1, add = 0, unit: overrideUnit } = {}) {
      function compute() {
        const source = store.get(ref);
        if (source == null) return;

        const parsed = parseLength(String(source));
        if (parsed) {
          const result = parsed.value * multiply + add;
          const u = overrideUnit || parsed.unit;
          store.set(targetPath, formatLength(result, u));
        } else if (!isNaN(parseFloat(source))) {
          // Plain number
          const result = parseFloat(source) * multiply + add;
          store.set(targetPath, String(result));
        }
      }

      // Compute initial value
      compute();

      // Re-compute when source changes
      const unsub = store.subscribe(ref, compute);
      unsubs.push(unsub);

      relations.push({
        type: 'derive',
        target: targetPath,
        source: ref,
        multiply,
        add,
      });

      return unsub;
    },

    /**
     * Create a modular scale from a base value.
     * Each target gets base * scaleFactor.
     *
     * @param {string} basePath - Path to the base value (e.g. 'tokens.font.base')
     * @param {Object} targets - { targetPath: scaleFactor, ... }
     */
    scale(basePath, targets) {
      const targetEntries = Object.entries(targets);

      function compute() {
        const base = store.get(basePath);
        if (base == null) return;

        const parsed = parseLength(String(base));
        if (!parsed) return;

        for (const [targetPath, factor] of targetEntries) {
          const result = parsed.value * factor;
          store.set(targetPath, formatLength(result, parsed.unit));
        }
      }

      compute();
      const unsub = store.subscribe(basePath, compute);
      unsubs.push(unsub);

      relations.push({
        type: 'scale',
        base: basePath,
        targets: { ...targets },
      });

      return unsub;
    },

    /**
     * Auto-select a text color (light or dark) based on background contrast.
     * Ensures WCAG compliance at the specified ratio.
     *
     * @param {string} targetPath - Path to write the text color
     * @param {Object} options
     * @param {string} options.against - Path to the background color to check against
     * @param {string} [options.light='#ffffff'] - Light color option
     * @param {string} [options.dark='#1e293b'] - Dark color option
     * @param {number} [options.minRatio=4.5] - Minimum contrast ratio (4.5 = AA, 7 = AAA)
     */
    contrast(targetPath, { against, light = '#ffffff', dark = '#1e293b', minRatio = 4.5 } = {}) {
      function compute() {
        const bgValue = store.get(against);
        if (!bgValue) return;

        const bgRgb = parseColor(String(bgValue));
        if (!bgRgb) return;

        const lightRgb = parseColor(light);
        const darkRgb = parseColor(dark);
        if (!lightRgb || !darkRgb) return;

        const lightRatio = contrastRatio(lightRgb, bgRgb);
        const darkRatio = contrastRatio(darkRgb, bgRgb);

        // Pick whichever has better contrast, prefer the one that meets minRatio
        if (lightRatio >= minRatio && darkRatio >= minRatio) {
          // Both pass, pick the one with higher contrast
          store.set(targetPath, lightRatio >= darkRatio ? light : dark);
        } else if (lightRatio >= minRatio) {
          store.set(targetPath, light);
        } else if (darkRatio >= minRatio) {
          store.set(targetPath, dark);
        } else {
          // Neither passes, pick the better one and warn
          const best = lightRatio >= darkRatio ? light : dark;
          const bestRatio = Math.max(lightRatio, darkRatio);
          console.warn(
            `[relational-css] contrast(${targetPath}): best ratio ${bestRatio.toFixed(2)}:1 ` +
            `does not meet ${minRatio}:1. Using '${best}'.`
          );
          store.set(targetPath, best);
        }
      }

      compute();
      const unsub = store.subscribe(against, compute);
      unsubs.push(unsub);

      relations.push({
        type: 'contrast',
        target: targetPath,
        against,
        light,
        dark,
        minRatio,
      });

      return unsub;
    },

    /**
     * Clamp a value between min and max, reacting to source changes.
     *
     * @param {string} targetPath - Path to write clamped value
     * @param {Object} options
     * @param {string} options.ref - Source path
     * @param {string} options.min - Minimum value (e.g. '0.75rem')
     * @param {string} options.max - Maximum value (e.g. '3rem')
     */
    clamp(targetPath, { ref, min, max } = {}) {
      const minParsed = parseLength(min);
      const maxParsed = parseLength(max);

      function compute() {
        const source = store.get(ref);
        if (source == null) return;

        const parsed = parseLength(String(source));
        if (!parsed) { store.set(targetPath, source); return; }

        let val = parsed.value;
        if (minParsed && parsed.unit === minParsed.unit) {
          val = Math.max(val, minParsed.value);
        }
        if (maxParsed && parsed.unit === maxParsed.unit) {
          val = Math.min(val, maxParsed.value);
        }

        store.set(targetPath, formatLength(val, parsed.unit));
      }

      compute();
      const unsub = store.subscribe(ref, compute);
      unsubs.push(unsub);

      relations.push({ type: 'clamp', target: targetPath, ref, min, max });
      return unsub;
    },

    /**
     * Get all defined relations for debugging.
     *
     * @returns {Array}
     */
    getRelations() {
      return [...relations];
    },

    /**
     * Tear down all subscriptions.
     */
    destroy() {
      for (const unsub of unsubs) unsub();
      unsubs.length = 0;
      relations.length = 0;
    },
  };
}
