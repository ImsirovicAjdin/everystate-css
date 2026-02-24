/**
 * @everystate/css: integration tests via @everystate/test
 *
 * Tests the EveryState-driven CSS modules:
 * - designSystem: token binding, setToken, setTokens
 * - typedCSS: schema validation, violations
 * - relationalCSS: derive, scale, contrast, clamp
 *
 * These modules work entirely through EveryState (no DOM required).
 * cssState and styleEngine require DOM and are covered by browser tests.
 */

import { createEveryTest, runTests } from '@everystate/test';
import { createEveryState } from '@everystate/core';
import { createDesignSystem } from '@everystate/css/designSystem';
import { createTypedCSS } from '@everystate/css/typedCSS';
import { createRelationalCSS } from '@everystate/css/relationalCSS';

const results = runTests({

  // == designSystem ==================================================

  'designSystem: initializes tokens in store': () => {
    const store = createEveryState({});
    const ds = createDesignSystem(store, {
      tokens: { color: { primary: '#3b82f6', danger: '#ef4444' } },
    });
    if (store.get('tokens.color.primary') !== '#3b82f6') throw new Error('Expected primary token');
    if (store.get('tokens.color.danger') !== '#ef4444') throw new Error('Expected danger token');
    ds.destroy();
    store.destroy();
  },

  'designSystem: getToken reads token value': () => {
    const store = createEveryState({});
    const ds = createDesignSystem(store, {
      tokens: { spacing: { md: '1rem' } },
    });
    if (ds.getToken('spacing.md') !== '1rem') throw new Error('Expected 1rem');
    ds.destroy();
    store.destroy();
  },

  'designSystem: setToken updates token': () => {
    const store = createEveryState({});
    const ds = createDesignSystem(store, {
      tokens: { color: { primary: '#3b82f6' } },
    });
    ds.setToken('color.primary', '#8b5cf6');
    if (store.get('tokens.color.primary') !== '#8b5cf6') throw new Error('Expected updated token');
    ds.destroy();
    store.destroy();
  },

  'designSystem: bind propagates token to style path': () => {
    const store = createEveryState({});
    const ds = createDesignSystem(store, {
      tokens: { color: { primary: '#3b82f6' } },
    });
    ds.bind('css.btn.background', 'color.primary');
    if (store.get('css.btn.background') !== '#3b82f6') throw new Error('Expected initial bind');

    ds.setToken('color.primary', '#22c55e');
    if (store.get('css.btn.background') !== '#22c55e') throw new Error('Expected propagated value');
    ds.destroy();
    store.destroy();
  },

  'designSystem: bindAll binds multiple paths': () => {
    const store = createEveryState({});
    const ds = createDesignSystem(store, {
      tokens: { color: { primary: '#3b82f6' }, spacing: { md: '1rem' } },
    });
    ds.bindAll({
      'css.btn.background': 'color.primary',
      'css.btn.padding': 'spacing.md',
    });
    if (store.get('css.btn.background') !== '#3b82f6') throw new Error('Expected bg');
    if (store.get('css.btn.padding') !== '1rem') throw new Error('Expected padding');
    ds.destroy();
    store.destroy();
  },

  'designSystem: unbind stops propagation': () => {
    const store = createEveryState({});
    const ds = createDesignSystem(store, {
      tokens: { color: { primary: '#3b82f6' } },
    });
    const unbind = ds.bind('css.btn.background', 'color.primary');
    unbind();
    ds.setToken('color.primary', '#000');
    // After unbind, the style path should NOT update
    if (store.get('css.btn.background') === '#000') throw new Error('Should not propagate after unbind');
    ds.destroy();
    store.destroy();
  },

  'designSystem: getBindings returns current bindings': () => {
    const store = createEveryState({});
    const ds = createDesignSystem(store, {
      tokens: { color: { primary: '#3b82f6' } },
    });
    ds.bind('css.btn.background', 'color.primary');
    ds.bind('css.card.background', 'color.primary');
    const bindings = ds.getBindings();
    if (!bindings['color.primary']) throw new Error('Expected binding entry');
    if (bindings['color.primary'].length !== 2) throw new Error('Expected 2 bound paths');
    ds.destroy();
    store.destroy();
  },

  'designSystem: setTokens bulk update': () => {
    const store = createEveryState({});
    const ds = createDesignSystem(store, {
      tokens: { color: { primary: '#3b82f6', danger: '#ef4444' } },
    });
    ds.setTokens({ color: { primary: '#000', danger: '#f00' } });
    if (store.get('tokens.color.primary') !== '#000') throw new Error('Expected bulk primary');
    if (store.get('tokens.color.danger') !== '#f00') throw new Error('Expected bulk danger');
    ds.destroy();
    store.destroy();
  },

  // == typedCSS ======================================================

  'typedCSS: validate color - valid': () => {
    const store = createEveryState({});
    const typed = createTypedCSS(store, {
      btn: { background: { type: 'color' } },
    });
    const result = typed.validate('btn', 'background', '#3b82f6');
    if (!result.valid) throw new Error('Expected valid color');
    typed.destroy();
    store.destroy();
  },

  'typedCSS: validate color - invalid': () => {
    const store = createEveryState({});
    const typed = createTypedCSS(store, {
      btn: { background: { type: 'color' } },
    });
    const result = typed.validate('btn', 'background', 'not-a-color');
    if (result.valid) throw new Error('Expected invalid color');
    if (!result.error) throw new Error('Expected error message');
    typed.destroy();
    store.destroy();
  },

  'typedCSS: validate length - valid': () => {
    const store = createEveryState({});
    const typed = createTypedCSS(store, {
      btn: { padding: { type: 'length' } },
    });
    const result = typed.validate('btn', 'padding', '1rem');
    if (!result.valid) throw new Error('Expected valid length');
    typed.destroy();
    store.destroy();
  },

  'typedCSS: validate enum - valid': () => {
    const store = createEveryState({});
    const typed = createTypedCSS(store, {
      btn: { display: { type: 'enum', values: ['flex', 'block', 'none'] } },
    });
    const result = typed.validate('btn', 'display', 'flex');
    if (!result.valid) throw new Error('Expected valid enum');
    typed.destroy();
    store.destroy();
  },

  'typedCSS: validate enum - invalid': () => {
    const store = createEveryState({});
    const typed = createTypedCSS(store, {
      btn: { display: { type: 'enum', values: ['flex', 'block', 'none'] } },
    });
    const result = typed.validate('btn', 'display', 'table');
    if (result.valid) throw new Error('Expected invalid enum');
    typed.destroy();
    store.destroy();
  },

  'typedCSS: validate number with min/max': () => {
    const store = createEveryState({});
    const typed = createTypedCSS(store, {
      card: { zIndex: { type: 'number', min: 0, max: 9999 } },
    });
    if (!typed.validate('card', 'zIndex', '10').valid) throw new Error('10 should be valid');
    if (typed.validate('card', 'zIndex', '-1').valid) throw new Error('-1 should be invalid');
    if (typed.validate('card', 'zIndex', '10000').valid) throw new Error('10000 should be invalid');
    typed.destroy();
    store.destroy();
  },

  'typedCSS: property not in schema': () => {
    const store = createEveryState({});
    const typed = createTypedCSS(store, {
      btn: { background: { type: 'color' } },
    });
    const result = typed.validate('btn', 'unknownProp', 'value');
    if (result.valid) throw new Error('Unknown prop should be invalid');
    typed.destroy();
    store.destroy();
  },

  'typedCSS: defineComponent at runtime': () => {
    const store = createEveryState({});
    const typed = createTypedCSS(store, {});
    typed.defineComponent('card', { background: { type: 'color' } });
    const result = typed.validate('card', 'background', '#fff');
    if (!result.valid) throw new Error('Expected valid after defineComponent');
    typed.destroy();
    store.destroy();
  },

  'typedCSS: getViolations tracks violations': () => {
    const store = createEveryState({});
    const violations = [];
    const typed = createTypedCSS(store, {
      btn: { background: { type: 'color' } },
    }, { onViolation: (v) => violations.push(v) });

    store.set('css.btn.background', 'not-a-color');
    if (violations.length !== 1) throw new Error(`Expected 1 violation, got ${violations.length}`);
    typed.destroy();
    store.destroy();
  },

  // == relationalCSS =================================================

  'relationalCSS: derive multiplier': () => {
    const store = createEveryState({});
    store.set('css.card.padding', '1rem');
    const rel = createRelationalCSS(store);
    rel.derive('css.header.padding', { ref: 'css.card.padding', multiply: 2 });
    if (store.get('css.header.padding') !== '2rem') throw new Error(`Expected 2rem, got ${store.get('css.header.padding')}`);
    rel.destroy();
    store.destroy();
  },

  'relationalCSS: derive reacts to source change': () => {
    const store = createEveryState({});
    store.set('css.card.padding', '1rem');
    const rel = createRelationalCSS(store);
    rel.derive('css.header.padding', { ref: 'css.card.padding', multiply: 2 });
    store.set('css.card.padding', '2rem');
    if (store.get('css.header.padding') !== '4rem') throw new Error(`Expected 4rem`);
    rel.destroy();
    store.destroy();
  },

  'relationalCSS: derive with add': () => {
    const store = createEveryState({});
    store.set('css.base.margin', '1rem');
    const rel = createRelationalCSS(store);
    rel.derive('css.large.margin', { ref: 'css.base.margin', multiply: 1, add: 0.5 });
    if (store.get('css.large.margin') !== '1.5rem') throw new Error(`Expected 1.5rem`);
    rel.destroy();
    store.destroy();
  },

  'relationalCSS: scale creates modular type scale': () => {
    const store = createEveryState({});
    store.set('tokens.font.base', '1rem');
    const rel = createRelationalCSS(store);
    rel.scale('tokens.font.base', {
      'css.h1.fontSize': 2.0,
      'css.h2.fontSize': 1.5,
      'css.body.fontSize': 1,
      'css.small.fontSize': 0.875,
    });
    if (store.get('css.h1.fontSize') !== '2rem') throw new Error(`Expected 2rem`);
    if (store.get('css.h2.fontSize') !== '1.5rem') throw new Error(`Expected 1.5rem`);
    if (store.get('css.body.fontSize') !== '1rem') throw new Error(`Expected 1rem`);
    if (store.get('css.small.fontSize') !== '0.875rem') throw new Error(`Expected 0.875rem`);
    rel.destroy();
    store.destroy();
  },

  'relationalCSS: scale reacts to base change': () => {
    const store = createEveryState({});
    store.set('tokens.font.base', '1rem');
    const rel = createRelationalCSS(store);
    rel.scale('tokens.font.base', { 'css.h1.fontSize': 2.0 });
    store.set('tokens.font.base', '1.25rem');
    if (store.get('css.h1.fontSize') !== '2.5rem') throw new Error(`Expected 2.5rem`);
    rel.destroy();
    store.destroy();
  },

  'relationalCSS: contrast picks accessible color': () => {
    const store = createEveryState({});
    store.set('css.card.background', '#000000');
    const rel = createRelationalCSS(store);
    rel.contrast('css.card.color', {
      against: 'css.card.background',
      light: '#ffffff',
      dark: '#1e293b',
    });
    // Against black, white has better contrast
    if (store.get('css.card.color') !== '#ffffff') throw new Error(`Expected white text on black bg`);
    rel.destroy();
    store.destroy();
  },

  'relationalCSS: contrast reacts to bg change': () => {
    const store = createEveryState({});
    store.set('css.card.background', '#000000');
    const rel = createRelationalCSS(store);
    rel.contrast('css.card.color', {
      against: 'css.card.background',
      light: '#ffffff',
      dark: '#1e293b',
    });
    store.set('css.card.background', '#ffffff');
    // Against white, dark has better contrast
    if (store.get('css.card.color') !== '#1e293b') throw new Error(`Expected dark text on white bg`);
    rel.destroy();
    store.destroy();
  },

  'relationalCSS: clamp enforces min/max': () => {
    const store = createEveryState({});
    store.set('css.input.fontSize', '0.5rem');
    const rel = createRelationalCSS(store);
    rel.clamp('css.input.fontSizeClamped', {
      ref: 'css.input.fontSize',
      min: '0.75rem',
      max: '2rem',
    });
    if (store.get('css.input.fontSizeClamped') !== '0.75rem') throw new Error(`Expected clamped to min 0.75rem`);

    store.set('css.input.fontSize', '5rem');
    if (store.get('css.input.fontSizeClamped') !== '2rem') throw new Error(`Expected clamped to max 2rem`);

    store.set('css.input.fontSize', '1rem');
    if (store.get('css.input.fontSizeClamped') !== '1rem') throw new Error(`Expected 1rem (within range)`);
    rel.destroy();
    store.destroy();
  },

  'relationalCSS: getRelations returns all relations': () => {
    const store = createEveryState({});
    store.set('css.card.padding', '1rem');
    const rel = createRelationalCSS(store);
    rel.derive('css.header.padding', { ref: 'css.card.padding', multiply: 2 });
    rel.scale('tokens.font.base', { 'css.h1.fontSize': 2 });
    const relations = rel.getRelations();
    if (relations.length !== 2) throw new Error(`Expected 2 relations, got ${relations.length}`);
    if (relations[0].type !== 'derive') throw new Error('Expected derive');
    if (relations[1].type !== 'scale') throw new Error('Expected scale');
    rel.destroy();
    store.destroy();
  },
});

if (results.failed > 0) process.exit(1);
