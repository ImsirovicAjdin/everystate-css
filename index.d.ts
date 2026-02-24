/**
 * @everystate/css
 *
 * Reactive CSS engine, design system, typed CSS, and relational constraints.
 */

import type { EveryStateStore } from '@everystate/core';

// == Style Engine ===========================================================

export interface StyleEngineOptions {
  /** CSS path namespace in the store (default: 'css') */
  namespace?: string;
  /** ID for the injected <style> element (default: 'everystate-css') */
  id?: string;
}

export interface StyleEngine {
  /** Apply a CSS property to a selector */
  apply(selector: string, prop: string, value: string): void;
  /** Parse a store path into { selector, prop } or null */
  parse(fullPath: string): { selector: string; prop: string } | null;
}

/**
 * Create a style engine that subscribes to store paths and writes CSS rules.
 * Paths like `css.card.hover.background` become `.card:hover { background: ... }`.
 */
export function createStyleEngine(store: EveryStateStore, options?: StyleEngineOptions): StyleEngine;

// == CSS State ==============================================================

export interface CssStateOptions {
  namespace?: string;
  id?: string;
}

export interface CssState {
  store: EveryStateStore;
  engine: StyleEngine;
  set(path: string, value: any): any;
  get(path: string): any;
  subscribe(path: string, handler: Function): () => void;
  batch(fn: () => void): void;
  destroy(): void;
}

/**
 * Create a combined store + style engine for CSS state management.
 */
export function createCssState(initial?: Record<string, any>, options?: CssStateOptions): CssState;

// == Design System ==========================================================

export interface DesignSystemOptions {
  /** Initial token values */
  tokens?: Record<string, any>;
  /** Token namespace in the store (default: 'tokens') */
  namespace?: string;
}

export interface DesignSystem {
  /** Bind a CSS style path to a token path */
  bind(stylePath: string, tokenPath: string): void;
  /** Set a single token value */
  setToken(tokenPath: string, value: any): void;
  /** Set multiple tokens at once */
  setTokens(tokens: Record<string, any>): void;
  /** Get a token value */
  getToken(tokenPath: string): any;
  /** Get all current bindings */
  getBindings(): Map<string, Set<string>>;
  /** Destroy all subscriptions */
  destroy(): void;
}

/**
 * Create a design system with token-to-style bindings.
 * Changing a token automatically updates all bound CSS paths.
 */
export function createDesignSystem(store: EveryStateStore, options?: DesignSystemOptions): DesignSystem;

// == Relational CSS =========================================================

export interface RelationScaleTargets {
  [cssPath: string]: number;
}

export interface RelationDeriveOptions {
  ref: string;
  multiply?: number;
  add?: number;
}

export interface RelationContrastOptions {
  against: string;
  light: string;
  dark: string;
  minRatio?: number;
}

export interface RelationClampOptions {
  ref: string;
  min?: string;
  max?: string;
}

export interface RelationalCSS {
  /** Create a modular scale: source path × ratio → multiple target paths */
  scale(sourcePath: string, targets: RelationScaleTargets): void;
  /** Derive a value from a reference with multiply/add transforms */
  derive(targetPath: string, options: RelationDeriveOptions): void;
  /** Auto-pick light/dark text color based on WCAG contrast against a background */
  contrast(targetPath: string, options: RelationContrastOptions): void;
  /** Clamp a derived value between min and max */
  clamp(targetPath: string, options: RelationClampOptions): void;
  /** Get all registered relations */
  getRelations(): Array<{ type: string; [key: string]: any }>;
  /** Destroy all subscriptions */
  destroy(): void;
}

/**
 * Create relational CSS constraints (scales, derivations, contrast enforcement).
 */
export function createRelationalCSS(store: EveryStateStore): RelationalCSS;

// == Typed CSS ==============================================================

export interface TypedCSSPropertySchema {
  type: 'color' | 'length' | 'enum' | 'shadow' | 'number';
  min?: string;
  max?: string;
  values?: string[];
  maxLayers?: number;
}

export interface TypedCSSSchema {
  [component: string]: {
    [property: string]: TypedCSSPropertySchema;
  };
}

export interface TypedCSSOptions {
  onViolation?: (entry: { component: string; property: string; value: any; message: string }) => void;
}

export interface TypedCSS {
  /** Get all recorded violations */
  getViolations(): Array<{ component: string; property: string; value: any; message: string }>;
  /** Destroy the typed CSS validator */
  destroy(): void;
}

/**
 * Create a typed CSS validator that watches store paths and reports constraint violations.
 */
export function createTypedCSS(store: EveryStateStore, schema: TypedCSSSchema, options?: TypedCSSOptions): TypedCSS;

// == Template Manager =======================================================

export interface TemplateManager {
  register(name: string, template: Record<string, any>): void;
  apply(name: string): void;
  list(): string[];
}

export declare class TemplateManagerClass {
  constructor(store: EveryStateStore);
  register(name: string, template: Record<string, any>): void;
  apply(name: string): void;
  list(): string[];
}

export function createTemplateManager(store: EveryStateStore): TemplateManager;
export { TemplateManagerClass as TemplateManager };

// == State Serializer =======================================================

export interface Serializer {
  serialize(state: Record<string, any>): string;
  deserialize(css: string): Record<string, any>;
}

export function createSerializer(): Serializer;
export function escapeCssValue(value: string): string;
export function unescapeCssValue(value: string): string;

declare const StateSerializer: {
  serialize(state: Record<string, any>): string;
  deserialize(css: string): Record<string, any>;
};
export { StateSerializer };
