# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.4] - 2026-03-03

### Added
- CLI for zero-dependency self-testing (`everystate-css-self-test`)
- New npm scripts: `self-test`, `test:integration`, `test:i`
- Bin entry point for npx support

### Changed
- Updated self-test version string from v1.0.0 to v1.0.4

### Usage
```bash
# Zero-dep self-test
npx everystate-css-self-test

# npm scripts
npm run self-test
npm run test:integration
npm run test:i
```

## [1.0.3] - 2026-03-01

### Added
- Ecosystem table in README.md
- Updated file patterns in package.json to include all files

## [1.0.2] - 2026-02-28

### Added
- Self-test documentation in README.md
- Integration test suite using @everystate/test

## [1.0.1] - 2026-02-27

### Fixed
- Package configuration and file inclusion

## [1.0.0] - 2026-02-26

### Added
- Initial release of @everystate/css
- State-driven CSS with runtime reactive styling
- Design tokens and typed validation
- Relational constraints and WCAG compliance
- Zero-build reactive styling engine
- DOMless testing capabilities
