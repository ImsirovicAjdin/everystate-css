/**
 * Design System as State - Runtime reactive design tokens
 *
 * Stores design tokens (colors, spacing, radii, fonts, shadows) in an
 * EveryState store and provides reactive bindings so that token changes
 * automatically propagate to every style that references them.
 *
 * @example
 *   import { createDesignSystem } from '@everystate/css/designSystem';
 *
 *   const ds = createDesignSystem(store, {
 *     tokens: {
 *       color: { primary: '#3b82f6', danger: '#ef4444', surface: '#fff', text: '#1e293b' },
 *       spacing: { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem' },
 *       radius: { sm: '0.25rem', md: '0.5rem', lg: '1rem', full: '9999px' },
 *       font: { sm: '0.875rem', base: '1rem', lg: '1.25rem', xl: '1.5rem' },
 *       shadow: {
 *         sm: '0 1px 2px rgba(0,0,0,0.05)',
 *         md: '0 4px 6px rgba(0,0,0,0.1)',
 *         lg: '0 10px 15px rgba(0,0,0,0.15)',
 *       },
 *     },
 *   });
 *
 *   // Bind a token to a style path - when token changes, style updates
 *   ds.bind('css.btn.background', 'color.primary');
 *   ds.bind('css.btn.padding', 'spacing.md');
 *
 *   // Change token → all bound styles update
 *   ds.setToken('color.primary', '#8b5cf6');
 *
 *   // Bulk theme swap
 *   ds.setTokens({ color: { primary: '#22c55e', danger: '#dc2626' } });
 */

/**
 * @param {Object} store - An EveryState store instance
 * @param {Object} options
 * @param {Object} options.tokens - Initial token tree
 * @param {string} [options.namespace='tokens'] - State namespace for tokens
 * @returns {Object} Design system API
 */
export function createDesignSystem(store, { tokens = {}, namespace = 'tokens' } = {}) {
  // bindings: Map<tokenPath, Set<stylePath>>
  // Tracks which style paths depend on which token paths
  const bindings = new Map();
  // unsubs: Map<tokenPath, Function>
  const unsubs = new Map();

  // Initialize tokens in store
  setDeep(store, namespace, tokens);

  /**
   * Recursively set an object tree into the store
   */
  function setDeep(st, prefix, obj) {
    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
      for (const [k, v] of Object.entries(obj)) {
        setDeep(st, `${prefix}.${k}`, v);
      }
    } else {
      st.set(prefix, obj);
    }
  }

  /**
   * Resolve a short token path (e.g. 'color.primary') to a full store path
   */
  function fullTokenPath(tokenPath) {
    return tokenPath.startsWith(namespace + '.') ? tokenPath : `${namespace}.${tokenPath}`;
  }

  /**
   * Ensure a subscription exists for a token path that pushes value to all bound style paths
   */
  function ensureSubscription(tokenPath) {
    const full = fullTokenPath(tokenPath);
    if (unsubs.has(tokenPath)) return;

    const unsub = store.subscribe(full, (value) => {
      const targets = bindings.get(tokenPath);
      if (targets) {
        for (const stylePath of targets) {
          store.set(stylePath, value);
        }
      }
    });
    unsubs.set(tokenPath, unsub);
  }

  return {
    /**
     * Bind a style path to a token. When the token changes, the style updates.
     * Also immediately sets the style to the current token value.
     *
     * @param {string} stylePath - Target style path (e.g. 'css.btn.background')
     * @param {string} tokenPath - Source token path (e.g. 'color.primary')
     * @returns {Function} Unbind function
     */
    bind(stylePath, tokenPath) {
      if (!bindings.has(tokenPath)) {
        bindings.set(tokenPath, new Set());
      }
      bindings.get(tokenPath).add(stylePath);
      ensureSubscription(tokenPath);

      // Set initial value
      const currentValue = store.get(fullTokenPath(tokenPath));
      if (currentValue !== undefined) {
        store.set(stylePath, currentValue);
      }

      return () => {
        const targets = bindings.get(tokenPath);
        if (targets) {
          targets.delete(stylePath);
          if (targets.size === 0) {
            bindings.delete(tokenPath);
            const unsub = unsubs.get(tokenPath);
            if (unsub) { unsub(); unsubs.delete(tokenPath); }
          }
        }
      };
    },

    /**
     * Bind multiple style paths to tokens at once.
     *
     * @param {Object} map - { stylePath: tokenPath, ... }
     * @returns {Function} Unbind all
     */
    bindAll(map) {
      const unbinds = [];
      for (const [stylePath, tokenPath] of Object.entries(map)) {
        unbinds.push(this.bind(stylePath, tokenPath));
      }
      return () => unbinds.forEach(fn => fn());
    },

    /**
     * Set a single token value. All bound styles update automatically.
     *
     * @param {string} tokenPath - Token path (e.g. 'color.primary')
     * @param {*} value - New token value
     */
    setToken(tokenPath, value) {
      store.set(fullTokenPath(tokenPath), value);
    },

    /**
     * Set multiple tokens at once (partial merge).
     *
     * @param {Object} tokenTree - Partial token tree to merge
     */
    setTokens(tokenTree) {
      setDeep(store, namespace, tokenTree);
    },

    /**
     * Get current value of a token.
     *
     * @param {string} tokenPath - Token path
     * @returns {*} Current value
     */
    getToken(tokenPath) {
      return store.get(fullTokenPath(tokenPath));
    },

    /**
     * Get all current tokens.
     *
     * @returns {Object} Full token tree
     */
    getAllTokens() {
      return store.get(namespace);
    },

    /**
     * Get all bindings for debugging/inspection.
     *
     * @returns {Object} Map of tokenPath → [stylePaths]
     */
    getBindings() {
      const result = {};
      for (const [token, targets] of bindings) {
        result[token] = [...targets];
      }
      return result;
    },

    /**
     * Remove all bindings and subscriptions.
     */
    destroy() {
      for (const unsub of unsubs.values()) {
        unsub();
      }
      unsubs.clear();
      bindings.clear();
    },
  };
}
