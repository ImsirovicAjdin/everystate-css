/**
 * Typed CSS: Runtime schema validation for state-driven styles
 *
 * Define what CSS properties a component accepts, with value constraints.
 * The engine validates every store.set('css.*') call against the schema
 * and warns (or rejects) invalid values.
 *
 * @example
 *   import { createTypedCSS } from '@everystate/css/typedCSS';
 *
 *   const typed = createTypedCSS(store, {
 *     btn: {
 *       background: { type: 'color' },
 *       padding: { type: 'length', min: '0.25rem', max: '3rem' },
 *       borderRadius: { type: 'length' },
 *       fontSize: { type: 'length', min: '0.75rem', max: '2rem' },
 *       display: { type: 'enum', values: ['flex', 'inline-flex', 'block', 'none'] },
 *     },
 *   });
 *
 *   store.set('css.btn.padding', '1rem');    // ✅ valid
 *   store.set('css.btn.padding', '10rem');   // ⚠️ exceeds max
 *   store.set('css.btn.display', 'table');   // ⚠️ not in enum
 *   store.set('css.card.zIndex', '999');     // ⚠️ property not in schema
 */

const COLOR_RE = /^(#([0-9a-f]{3,8})|rgb(a)?\(|hsl(a)?\(|transparent|currentColor|inherit|initial|unset|var\()/i;
const COLOR_NAMES = new Set([
  'black','white','red','green','blue','yellow','orange','purple','pink','gray','grey',
  'cyan','magenta','brown','olive','navy','teal','maroon','aqua','lime','silver','fuchsia',
]);

const LENGTH_RE = /^(-?\d+(\.\d+)?)(px|rem|em|%|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc)$/;
const LENGTH_UNIT_TO_PX = {
  px: 1, rem: 16, em: 16, pt: 1.333, cm: 37.795, mm: 3.7795, in: 96,
};

/**
 * Parse a length string to a numeric value in px (approximate, for comparison).
 * Returns null if not parseable.
 */
function lengthToPx(value) {
  const match = String(value).match(LENGTH_RE);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const unit = match[3];
  const factor = LENGTH_UNIT_TO_PX[unit];
  return factor != null ? num * factor : null;
}

function isValidColor(value) {
  if (typeof value !== 'string') return false;
  const v = value.trim().toLowerCase();
  return COLOR_RE.test(v) || COLOR_NAMES.has(v);
}

function isValidLength(value) {
  if (typeof value !== 'string') return false;
  // Allow compound values like '0.5rem 1rem'
  const parts = value.trim().split(/\s+/);
  return parts.every(p => LENGTH_RE.test(p) || p === '0' || p === 'auto' || p === 'inherit' || p === 'initial' || p === 'unset' || /^var\(/.test(p));
}

function isValidNumber(value) {
  return !isNaN(parseFloat(value));
}

const VALIDATORS = {
  color(value) {
    if (!isValidColor(value)) {
      return `'${value}' is not a valid color. Use hex (#fff), rgb(), hsl(), or a named color.`;
    }
    return null;
  },

  length(value, constraint) {
    if (!isValidLength(value)) {
      return `'${value}' is not a valid CSS length.`;
    }
    // Check min/max on simple single-value lengths
    if (constraint.min || constraint.max) {
      const px = lengthToPx(value);
      if (px !== null) {
        if (constraint.min) {
          const minPx = lengthToPx(constraint.min);
          if (minPx !== null && px < minPx) {
            return `'${value}' is below minimum '${constraint.min}'.`;
          }
        }
        if (constraint.max) {
          const maxPx = lengthToPx(constraint.max);
          if (maxPx !== null && px > maxPx) {
            return `'${value}' exceeds maximum '${constraint.max}'.`;
          }
        }
      }
    }
    return null;
  },

  enum(value, constraint) {
    if (!constraint.values || !constraint.values.includes(value)) {
      return `'${value}' is not allowed. Expected one of: ${constraint.values?.join(', ')}.`;
    }
    return null;
  },

  number(value, constraint) {
    if (!isValidNumber(value)) {
      return `'${value}' is not a valid number.`;
    }
    const num = parseFloat(value);
    if (constraint.min != null && num < constraint.min) {
      return `${value} is below minimum ${constraint.min}.`;
    }
    if (constraint.max != null && num > constraint.max) {
      return `${value} exceeds maximum ${constraint.max}.`;
    }
    return null;
  },

  string() {
    return null; // anything goes
  },

  shadow(value, constraint) {
    if (typeof value !== 'string') return `'${value}' is not a valid shadow value.`;
    if (constraint.maxLayers) {
      const layers = value.split(',').length;
      if (layers > constraint.maxLayers) {
        return `Shadow has ${layers} layers, maximum is ${constraint.maxLayers}.`;
      }
    }
    return null;
  },
};

/**
 * Create a typed CSS validation layer.
 *
 * @param {Object} store - An EveryState store instance
 * @param {Object} schema - Component schemas: { componentName: { prop: { type, ...constraints } } }
 * @param {Object} [options]
 * @param {string} [options.namespace='css'] - Namespace to validate
 * @param {'warn'|'error'|'reject'} [options.mode='warn'] - What to do on invalid values
 *   - 'warn': console.warn but allow the set
 *   - 'error': console.error but allow the set
 *   - 'reject': prevent the set (requires store proxy)
 * @param {Function} [options.onViolation] - Custom handler for violations
 * @returns {Object} Typed CSS API
 */
export function createTypedCSS(store, schema = {}, {
  namespace = 'css',
  mode = 'warn',
  onViolation = null,
} = {}) {
  // Store schema in state for introspection
  store.set('schema', JSON.parse(JSON.stringify(schema)));

  const violations = [];

  function report(component, prop, message) {
    const entry = {
      component,
      property: prop,
      message,
      timestamp: Date.now(),
    };
    violations.push(entry);
    if (violations.length > 200) violations.shift();

    const formatted = `[typed-css] ${component}.${prop}: ${message}`;

    if (onViolation) {
      onViolation(entry);
    } else if (mode === 'warn') {
      console.warn(formatted);
    } else if (mode === 'error') {
      console.error(formatted);
    }
  }

  function validate(path, value) {
    // Parse component and property from path
    const rel = path.startsWith(namespace + '.')
      ? path.slice(namespace.length + 1)
      : path;

    const segments = rel.split('.');
    if (segments.length < 2) return true;

    // Find the component name (first segment)
    const component = segments[0];
    const componentSchema = schema[component];

    // If no schema for this component, it's unvalidated (pass through)
    if (!componentSchema) return true;

    // The property is the last segment; middle segments may be pseudo-classes
    const prop = segments[segments.length - 1];
    const constraint = componentSchema[prop];

    if (!constraint) {
      // Property not in schema
      const allowed = Object.keys(componentSchema).join(', ');
      report(component, prop, `Property not in schema. Allowed: ${allowed}.`);
      return mode !== 'reject';
    }

    const validator = VALIDATORS[constraint.type];
    if (!validator) return true; // unknown type, pass through

    const error = validator(String(value), constraint);
    if (error) {
      report(component, prop, error);
      return mode !== 'reject';
    }

    return true;
  }

  // Subscribe to validate all sets under the namespace
  const unsub = store.subscribe(`${namespace}.*`, ({ path, value }) => {
    if (typeof value === 'object' && value !== null) return; // skip subtree sets
    validate(path, value);
  });

  return {
    /**
     * Manually validate a value against a component's schema.
     *
     * @param {string} component - Component name
     * @param {string} prop - Property name
     * @param {*} value - Value to validate
     * @returns {{ valid: boolean, error: string|null }}
     */
    validate(component, prop, value) {
      const componentSchema = schema[component];
      if (!componentSchema) return { valid: true, error: null };
      const constraint = componentSchema[prop];
      if (!constraint) {
        return { valid: false, error: `Property '${prop}' not in ${component} schema.` };
      }
      const validator = VALIDATORS[constraint.type];
      if (!validator) return { valid: true, error: null };
      const error = validator(String(value), constraint);
      return { valid: !error, error };
    },

    /**
     * Add or update a component schema at runtime.
     *
     * @param {string} component - Component name
     * @param {Object} componentSchema - Property constraints
     */
    defineComponent(component, componentSchema) {
      schema[component] = componentSchema;
      store.set(`schema.${component}`, JSON.parse(JSON.stringify(componentSchema)));
    },

    /**
     * Remove a component schema.
     *
     * @param {string} component - Component name
     */
    removeComponent(component) {
      delete schema[component];
    },

    /**
     * Get the schema for a component (from state).
     *
     * @param {string} component - Component name
     * @returns {Object|undefined}
     */
    getSchema(component) {
      return component ? store.get(`schema.${component}`) : store.get('schema');
    },

    /**
     * Get recent validation violations.
     *
     * @param {number} [limit=50]
     * @returns {Array}
     */
    getViolations(limit = 50) {
      return violations.slice(-limit);
    },

    /**
     * Clear violation history.
     */
    clearViolations() {
      violations.length = 0;
    },

    /**
     * Tear down subscriptions.
     */
    destroy() {
      unsub();
      violations.length = 0;
    },
  };
}
