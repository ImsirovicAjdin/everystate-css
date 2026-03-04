# @everystate/css v1.0.6

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

## Self-test (CLI, opt-in)

Run the bundled **zero-dependency** self-test locally to verify CSS behavior.
It is **opt-in** and never runs automatically on install:

```bash
# via npx (no install needed)
npx everystate-css-self-test

# if installed locally
everystate-css-self-test

# or directly
node node_modules/@everystate/css/self-test.js
```

You can also run the npm script from the package folder:

```bash
npm --prefix node_modules/@everystate/css run self-test
```

### Integration tests (@everystate/test)

The `tests/` folder contains a separate integration suite that uses
`@everystate/test` (not zero-dep). This is an intentional tradeoff:
the **self-test** stays lightweight, while integration tests remain available
for deeper validation.

Run the integration suite (opt-in):

```bash
npm install @everystate/test
node node_modules/@everystate/css/tests/css.test.js
```

Short form (from the package folder):

```bash
cd node_modules/@everystate/css
npm run test:integration
# or short alias
npm run test:i
```

Or, from your project root:

```bash
npm --prefix node_modules/@everystate/css run test:integration
```

## License

MIT © Ajdin Imsirovic
