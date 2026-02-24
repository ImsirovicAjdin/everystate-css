/**
 * Style Engine: Path-to-CSS compiler
 *
 * Subscribes to a namespace in an EveryState store (default: 'css.*')
 * and compiles dot-path state changes into real CSSStyleSheet rules.
 *
 * Path convention:
 *   css.{selector}.{property}              -> .selector { property: value }
 *   css.{selector}.{pseudo}.{property}     -> .selector:pseudo { property: value }
 *   css.{sel1}.{sel2}.{property}           -> .sel1 .sel2 { property: value }
 *   css.{sel}.{pseudo}.{sel2}.{property}   -> .sel:pseudo .sel2 { property: value }
 *
 * Pseudo-classes: hover, focus, active, disabled, visited, firstChild, lastChild,
 *                 focusWithin, focusVisible, checked, empty, invalid, valid
 * Pseudo-elements: before, after, placeholder, selection
 *
 * @example
 *   import { createStyleEngine } from '@everystate/css/styleEngine';
 *   const engine = createStyleEngine(store);
 *   store.set('css.card.background', '#fff');
 *   store.set('css.card.hover.boxShadow', '0 4px 6px rgba(0,0,0,0.1)');
 */

const CSS_PROPERTIES = new Set([
  'accentColor','alignContent','alignItems','alignSelf',
  'background','backgroundColor','backgroundImage','backgroundPosition','backgroundRepeat','backgroundSize',
  'border','borderBottom','borderBottomColor','borderBottomLeftRadius','borderBottomRightRadius',
  'borderBottomStyle','borderBottomWidth','borderCollapse','borderColor','borderLeft',
  'borderLeftColor','borderLeftStyle','borderLeftWidth','borderRadius','borderRight',
  'borderRightColor','borderRightStyle','borderRightWidth','borderSpacing','borderStyle',
  'borderTop','borderTopColor','borderTopLeftRadius','borderTopRightRadius','borderTopStyle',
  'borderTopWidth','borderWidth',
  'bottom','boxShadow','boxSizing',
  'caretColor','clear','clipPath','color','columnCount','columnGap','columnRule','columns',
  'content','cursor',
  'direction','display',
  'fill','filter','flex','flexBasis','flexDirection','flexFlow','flexGrow','flexShrink','flexWrap',
  'float','font','fontFamily','fontFeatureSettings','fontSize','fontStyle','fontVariant',
  'fontVariantNumeric','fontWeight',
  'gap','gridAutoColumns','gridAutoFlow','gridAutoRows','gridColumn','gridColumnEnd',
  'gridColumnGap','gridColumnStart','gridGap','gridRow','gridRowEnd','gridRowGap',
  'gridRowStart','gridTemplateAreas','gridTemplateColumns','gridTemplateRows',
  'height',
  'isolation',
  'justifyContent','justifyItems','justifySelf',
  'left','letterSpacing','lineHeight','listStyle','listStylePosition','listStyleType',
  'margin','marginBottom','marginLeft','marginRight','marginTop',
  'maxHeight','maxWidth','minHeight','minWidth','mixBlendMode',
  'objectFit','objectPosition','opacity','order','outline','outlineColor',
  'outlineOffset','outlineStyle','outlineWidth','overflow','overflowWrap',
  'overflowX','overflowY',
  'padding','paddingBottom','paddingLeft','paddingRight','paddingTop',
  'perspective','placeContent','placeItems','placeSelf',
  'pointerEvents','position',
  'resize','right','rotate','rowGap',
  'scale','scrollBehavior','scrollMargin','scrollPadding',
  'stroke','strokeDasharray','strokeDashoffset','strokeLinecap','strokeLinejoin',
  'strokeOpacity','strokeWidth',
  'tableLayout','textAlign','textDecoration','textDecorationColor','textDecorationLine',
  'textDecorationStyle','textIndent','textOverflow','textShadow','textTransform',
  'top','transform','transformOrigin','transition','transitionDelay',
  'transitionDuration','transitionProperty','transitionTimingFunction',
  'userSelect',
  'verticalAlign','visibility',
  'whiteSpace','width','willChange','wordBreak','wordSpacing','writingMode',
  'zIndex',
]);

const PSEUDO_CLASSES = new Map([
  ['hover', ':hover'],
  ['focus', ':focus'],
  ['active', ':active'],
  ['disabled', ':disabled'],
  ['visited', ':visited'],
  ['checked', ':checked'],
  ['empty', ':empty'],
  ['invalid', ':invalid'],
  ['valid', ':valid'],
  ['required', ':required'],
  ['firstChild', ':first-child'],
  ['lastChild', ':last-child'],
  ['firstOfType', ':first-of-type'],
  ['lastOfType', ':last-of-type'],
  ['focusWithin', ':focus-within'],
  ['focusVisible', ':focus-visible'],
]);

const PSEUDO_ELEMENTS = new Map([
  ['before', '::before'],
  ['after', '::after'],
  ['placeholder', '::placeholder'],
  ['selection', '::selection'],
]);

function camelToKebab(s) {
  return s.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * Create a style engine that compiles state paths to CSS rules.
 *
 * @param {Object} store - An EveryState store instance
 * @param {Object} [options]
 * @param {string} [options.namespace='css'] - State namespace to watch
 * @param {string} [options.id='everystate-css'] - ID for the injected <style> element
 * @returns {{ destroy: Function, getSheet: Function, getRules: Function }}
 */
export function createStyleEngine(store, { namespace = 'css', id = 'everystate-css' } = {}) {
  const styleEl = document.createElement('style');
  styleEl.id = id;
  document.head.appendChild(styleEl);
  const sheet = styleEl.sheet;
  const ruleMap = new Map();

  function getOrCreateRule(selector) {
    if (!ruleMap.has(selector)) {
      const idx = sheet.insertRule(`${selector} {}`, sheet.cssRules.length);
      ruleMap.set(selector, sheet.cssRules[idx]);
    }
    return ruleMap.get(selector);
  }

  function applyProperty(selector, prop, value) {
    const rule = getOrCreateRule(selector);
    rule.style.setProperty(camelToKebab(prop), value);
  }

  function parsePath(fullPath) {
    const path = fullPath.startsWith(namespace + '.')
      ? fullPath.slice(namespace.length + 1)
      : fullPath;

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

  function processPath(fullPath, value) {
    if (typeof value === 'object' && value !== null) {
      walkLeaves(fullPath, value);
      return;
    }
    const parsed = parsePath(fullPath);
    if (parsed) {
      applyProperty(parsed.selector, parsed.prop, String(value));
    }
  }

  function walkLeaves(prefix, obj) {
    for (const [k, v] of Object.entries(obj)) {
      const p = `${prefix}.${k}`;
      if (typeof v === 'object' && v !== null) {
        walkLeaves(p, v);
      } else {
        processPath(p, v);
      }
    }
  }

  const unsub = store.subscribe(`${namespace}.*`, ({ path, value }) => {
    processPath(path, value);
  });

  return {
    destroy() {
      unsub();
      styleEl.remove();
      ruleMap.clear();
    },
    getSheet() { return sheet; },
    getRules() { return ruleMap; },
    applyProperty,
    parsePath,
  };
}
