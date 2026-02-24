/**
 * @everystate/css: zero-dependency self-test
 *
 * Tests the pure-function core of the CSS package:
 * - styleEngine: parsePath, camelToKebab
 * - typedCSS: validators (color, length, enum, number)
 * - relationalCSS: color utilities (hexToRgb, relativeLuminance, contrastRatio)
 * - relationalCSS: length utilities (parseLength, formatLength)
 *
 * DOM-dependent features (createStyleEngine, createCssState) are tested
 * in the integration test suite via EveryState.
 */

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n${title}`);
}

// -- Pure functions extracted for testing -----------------------------

// From styleEngine.js
function camelToKebab(s) {
  return s.replace(/([A-Z])/g, '-$1').toLowerCase();
}

const CSS_PROPERTIES = new Set([
  'background','backgroundColor','border','borderRadius','boxShadow',
  'color','display','fontSize','fontWeight','height','margin','marginTop',
  'opacity','padding','paddingTop','width','zIndex',
]);

const PSEUDO_CLASSES = new Map([
  ['hover', ':hover'], ['focus', ':focus'], ['active', ':active'],
  ['disabled', ':disabled'], ['firstChild', ':first-child'],
  ['lastChild', ':last-child'], ['focusWithin', ':focus-within'],
]);

const PSEUDO_ELEMENTS = new Map([
  ['before', '::before'], ['after', '::after'],
  ['placeholder', '::placeholder'],
]);

function parsePath(fullPath, namespace = 'css') {
  const path = fullPath.startsWith(namespace + '.')
    ? fullPath.slice(namespace.length + 1) : fullPath;
  const segments = path.split('.');
  const prop = segments[segments.length - 1];
  if (!CSS_PROPERTIES.has(prop)) return null;
  const selectorParts = [];
  let pseudoSuffix = '';
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    if (PSEUDO_CLASSES.has(seg)) {
      pseudoSuffix += PSEUDO_CLASSES.get(seg);
    } else if (PSEUDO_ELEMENTS.has(seg)) {
      pseudoSuffix += PSEUDO_ELEMENTS.get(seg);
    } else {
      if (pseudoSuffix) {
        selectorParts[selectorParts.length - 1] += pseudoSuffix;
        pseudoSuffix = '';
      }
      selectorParts.push('.' + seg);
    }
  }
  const selector = (selectorParts.length ? selectorParts.join(' ') : ':root') + pseudoSuffix;
  return { selector, prop };
}

// From typedCSS.js
const COLOR_RE = /^(#([0-9a-f]{3,8})|rgb(a)?\(|hsl(a)?\(|transparent|currentColor|inherit|initial|unset|var\()/i;
const COLOR_NAMES = new Set(['black','white','red','green','blue','yellow','orange','purple']);

function isValidColor(value) {
  if (typeof value !== 'string') return false;
  const v = value.trim().toLowerCase();
  return COLOR_RE.test(v) || COLOR_NAMES.has(v);
}

const LENGTH_RE = /^(-?\d+(\.\d+)?)(px|rem|em|%|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc)$/;

function isValidLength(value) {
  if (typeof value !== 'string') return false;
  const parts = value.trim().split(/\s+/);
  return parts.every(p => LENGTH_RE.test(p) || p === '0' || p === 'auto' || p === 'inherit');
}

// From relationalCSS.js
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

function parseLength(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(LENGTH_RE);
  if (!match) return null;
  return { value: parseFloat(match[1]), unit: match[3] };
}

function formatLength(num, unit) {
  const rounded = Math.round(num * 10000) / 10000;
  return `${rounded}${unit}`;
}

// -- 1. camelToKebab -------------------------------------------------

section('1. camelToKebab');

assert('backgroundColor -> background-color', camelToKebab('backgroundColor') === 'background-color');
assert('fontSize -> font-size', camelToKebab('fontSize') === 'font-size');
assert('borderTopLeftRadius -> border-top-left-radius', camelToKebab('borderTopLeftRadius') === 'border-top-left-radius');
assert('color -> color (no change)', camelToKebab('color') === 'color');
assert('zIndex -> z-index', camelToKebab('zIndex') === 'z-index');

// -- 2. parsePath ----------------------------------------------------

section('2. parsePath');

const p1 = parsePath('css.card.background');
assert('simple: selector = .card', p1.selector === '.card');
assert('simple: prop = background', p1.prop === 'background');

const p2 = parsePath('css.card.hover.boxShadow');
assert('pseudo-class: selector = .card:hover', p2.selector === '.card:hover');
assert('pseudo-class: prop = boxShadow', p2.prop === 'boxShadow');

const p3 = parsePath('css.card.before.color');
assert('pseudo-element: selector = .card::before', p3.selector === '.card::before');

const p4 = parsePath('css.header.nav.fontSize');
assert('nested: selector = .header .nav', p4.selector === '.header .nav');
assert('nested: prop = fontSize', p4.prop === 'fontSize');

const p5 = parsePath('css.card.unknownProp');
assert('unknown prop: returns null', p5 === null);

const p6 = parsePath('css.background');
assert('root: selector = :root', p6.selector === ':root');
assert('root: prop = background', p6.prop === 'background');

// -- 3. color validation ---------------------------------------------

section('3. color validation');

assert('hex #fff valid', isValidColor('#fff'));
assert('hex #3b82f6 valid', isValidColor('#3b82f6'));
assert('rgb() valid', isValidColor('rgb(255, 0, 0)'));
assert('rgba() valid', isValidColor('rgba(255, 0, 0, 0.5)'));
assert('hsl() valid', isValidColor('hsl(120, 100%, 50%)'));
assert('named color valid', isValidColor('red'));
assert('transparent valid', isValidColor('transparent'));
assert('currentColor valid', isValidColor('currentColor'));
assert('var() valid', isValidColor('var(--my-color)'));
assert('invalid string', !isValidColor('not-a-color'));
assert('number invalid', !isValidColor(42));

// -- 4. length validation --------------------------------------------

section('4. length validation');

assert('1rem valid', isValidLength('1rem'));
assert('16px valid', isValidLength('16px'));
assert('0.5em valid', isValidLength('0.5em'));
assert('100% valid', isValidLength('100%'));
assert('50vh valid', isValidLength('50vh'));
assert('0 valid', isValidLength('0'));
assert('auto valid', isValidLength('auto'));
assert('compound 0.5rem 1rem valid', isValidLength('0.5rem 1rem'));
assert('invalid string', !isValidLength('big'));
assert('number invalid', !isValidLength(42));

// -- 5. hexToRgb -----------------------------------------------------

section('5. hexToRgb');

const rgb1 = hexToRgb('#fff');
assert('#fff -> [255,255,255]', rgb1[0] === 255 && rgb1[1] === 255 && rgb1[2] === 255);

const rgb2 = hexToRgb('#000000');
assert('#000000 -> [0,0,0]', rgb2[0] === 0 && rgb2[1] === 0 && rgb2[2] === 0);

const rgb3 = hexToRgb('#3b82f6');
assert('#3b82f6 -> [59,130,246]', rgb3[0] === 59 && rgb3[1] === 130 && rgb3[2] === 246);

const rgb4 = hexToRgb('#f00');
assert('#f00 -> [255,0,0]', rgb4[0] === 255 && rgb4[1] === 0 && rgb4[2] === 0);

assert('invalid hex -> null', hexToRgb('#gg') === null);

// -- 6. contrastRatio ------------------------------------------------

section('6. contrastRatio');

const whiteBlack = contrastRatio([255, 255, 255], [0, 0, 0]);
assert('white/black ratio ≈ 21:1', Math.abs(whiteBlack - 21) < 0.1);

const sameColor = contrastRatio([128, 128, 128], [128, 128, 128]);
assert('same color ratio = 1:1', Math.abs(sameColor - 1) < 0.01);

const wcagAA = contrastRatio([255, 255, 255], [100, 100, 100]);
assert('white/gray passes AA (≥4.5)', wcagAA >= 4.5);

// -- 7. parseLength + formatLength -----------------------------------

section('7. parseLength + formatLength');

const len1 = parseLength('1.5rem');
assert('parseLength 1.5rem: value = 1.5', len1.value === 1.5);
assert('parseLength 1.5rem: unit = rem', len1.unit === 'rem');

const len2 = parseLength('16px');
assert('parseLength 16px: value = 16', len2.value === 16);
assert('parseLength 16px: unit = px', len2.unit === 'px');

assert('parseLength invalid -> null', parseLength('big') === null);
assert('parseLength number -> null', parseLength(42) === null);

assert('formatLength 1.5 rem', formatLength(1.5, 'rem') === '1.5rem');
assert('formatLength 24 px', formatLength(24, 'px') === '24px');
assert('formatLength rounds', formatLength(1.33333333, 'rem') === '1.3333rem');

// -- Summary ---------------------------------------------------------

console.log(`\n@everystate/css v1.0.0 self-test`);
if (failed > 0) {
  console.error(`✗ ${failed} assertion(s) failed, ${passed} passed`);
  process.exit(1);
} else {
  console.log(`✓ ${passed} assertions passed`);
}
