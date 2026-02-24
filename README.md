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

## License

MIT © Ajdin Imsirovic
