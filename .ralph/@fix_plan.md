# Ralph Fix Plan - Hardware Test Agent

## High Priority
- [x] Set up basic project structure and build system
  - Electron + React monorepo with pnpm workspace
  - Vite build system with electron plugin
  - electron-builder for packaging
- [x] Define core data structures and types
  - TestReport, TestSuite, TestCase, DeviceInfo types
  - SDKContext for React state management
  - TestRunnerService with EventEmitter3
- [x] Implement basic input/output handling
  - SDK service with WebUSB support
  - Report storage service (localStorage)
  - IPC for file system operations
- [ ] Create test framework and initial tests
  - Need unit tests for SDK service
  - Need unit tests for test runner service
  - Need unit tests for report storage

## Medium Priority
- [x] Add error handling and validation
  - Error states in SDKContext
  - Device connection error handling
  - Test result validation
- [x] Implement core business logic
  - Test suites: Address, Passphrase, ChainMethod, Functional, BatchAddress
  - Auto PIN/Passphrase response via UI_EVENT
  - Report generation and export (MD/JSON/HTML)
- [x] Add configuration management
  - Settings page with automation config
  - localStorage persistence for config
- [ ] Create user documentation
  - README with usage instructions
  - API documentation for test suites

## Low Priority
- [ ] Performance optimization
  - Code splitting for large SDK bundle
  - Lazy loading for test suites
- [ ] Extended feature set
  - Full test data migration from expo-example (~80 address tests, ~64 SLIP39 tests)
  - SLIP39 test suite
  - Security checks test suite
  - AttachToPin test suite
- [ ] Integration with external services
  - CI/CD integration
  - Test result reporting to external systems
- [ ] Advanced error recovery
  - Retry mechanisms for failed tests
  - Device reconnection handling

## Completed
- [x] Project initialization
- [x] Electron + React project setup
- [x] SDK integration with @onekeyfe/hd-common-connect-sdk
- [x] WebUSB device connection
- [x] Auto PIN/Passphrase response
- [x] Test runner service
- [x] 5 test suites (30+ test cases)
- [x] Report storage (localStorage)
- [x] Report export (Markdown, JSON, HTML)
- [x] UI pages (Dashboard, TestRunner, Results, Settings)
- [x] Build configuration for Mac/Win/Linux

## Notes
- SDK runs in renderer process (WebUSB requires user interaction)
- IPC only used for file system operations (save reports)
- Test data can be expanded by adding more cases to testSuites.ts
- App builds successfully with `pnpm build:vite`

## Next Steps
1. Add unit tests for core services
2. Create user documentation
3. Migrate full test data from expo-example
4. Add app icons for packaging
