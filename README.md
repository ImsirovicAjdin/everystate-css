# @everystate/css

**State-driven CSS: Reactive styling, design tokens, and relational constraints**

Make your styles reactive. Design tokens, theme variables, and CSS constraints live in EveryState and update automatically.

## Installation

```bash
npm install @everystate/css @everystate/core
```

## Quick Start

```js
import { createEveryState } from '@everystate/core';
import { createStyleEngine } from '@everystate/css';

const store = createEveryState({
  theme: {
    primary: '#3b82f6',
    secondary: '#8b5cf6'
  }
});

const engine = createStyleEngine(store, 'theme');

// Styles update automatically when state changes
store.set('theme.primary', '#ef4444');
```

## Features

- **Design tokens**: Store colors, spacing, typography in state
- **Reactive updates**: CSS custom properties update on state change
- **Type validation**: Ensure valid CSS values
- **Relational constraints**: Define relationships between tokens
- **WCAG contrast**: Automatic contrast checking
- **Zero build**: Runtime CSS generation

## Ecosystem


| Package | Description | License |
|---|---|---|
| [@everystate/aliases](https://www.npmjs.com/package/@everystate/aliases) | Ergonomic single-character and short-name DOM aliases for vanilla JS | MIT |
| [@everystate/core](https://www.npmjs.com/package/@everystate/core) | Path-based state management with wildcard subscriptions and async support. Core state engine (you are here). | MIT |
| [@everystate/css](https://www.npmjs.com/package/@everystate/css) | Reactive CSSOM engine: design tokens, typed validation, WCAG enforcement, all via path-based state | MIT |
| [@everystate/examples](https://www.npmjs.com/package/@everystate/examples) | Example applications and patterns | MIT |
| [@everystate/perf](https://www.npmjs.com/package/@everystate/perf) | Performance monitoring overlay | MIT |
| [@everystate/react](https://www.npmjs.com/package/@everystate/react) | React hooks adapter: `usePath`, `useIntent`, `useAsync` hooks and `EventStateProvider` | MIT |
| [@everystate/renderer](https://www.npmjs.com/package/@everystate/renderer) | Direct-binding reactive renderer: `bind-*`, `set`, `each` attributes. Zero build step | Proprietary |
| [@everystate/router](https://www.npmjs.com/package/@everystate/router) | SPA routing as state | MIT |
| [@everystate/test](https://www.npmjs.com/package/@everystate/test) | Event-sequence testing for UIstate stores. Zero dependency. | Proprietary |
| [@everystate/view](https://www.npmjs.com/package/@everystate/view) | State-driven view: DOMless resolve + surgical DOM projector. View tree as first-class state | MIT |

## License

MIT © Ajdin Imsirovic
