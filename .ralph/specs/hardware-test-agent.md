# Hardware Test Agent - Specification

## Overview
Desktop application for automated hardware wallet testing. Extracts and automates tests from the expo-example project for OneKey hardware devices.

## Target Users
- QA team for hardware wallet testing
- Developers needing automated regression testing

## Technology Stack
- **Framework**: Electron + React
- **Build**: Vite + electron-builder
- **Package Manager**: pnpm (monorepo)
- **SDK**: @onekeyfe/hd-common-connect-sdk
- **Transport**: WebUSB

## Core Requirements

### R1: Device Connection
- Connect to OneKey hardware devices via WebUSB
- Display device info (type, label, firmware version)
- Handle device connect/disconnect events
- Support device selection dialog

### R2: Test Automation
- Auto-respond to PIN requests
- Auto-respond to Passphrase requests
- Support `showOnOneKey: false` for faster testing
- Manage passphraseState for multi-wallet tests

### R3: Test Suites
Required test categories:
1. **Address Tests** - Validate address generation for multiple chains
2. **Passphrase Tests** - Test multi-wallet switching with different passphrases
3. **Chain Method Tests** - Test various blockchain operations
4. **Functional Tests** - Lock/unlock device operations
5. **Batch Address Tests** - Batch address generation
6. **SLIP39 Tests** - Shamir backup address validation (future)
7. **Security Tests** - Blind signature checks (future)

### R4: Report Generation
- Generate test reports with pass/fail status
- Include device info in reports
- Export to Markdown, JSON, HTML formats
- Persist reports in localStorage
- Display report history with details

### R5: User Interface
Pages required:
1. **Dashboard** - Device connection and status
2. **Test Runner** - Suite selection and execution
3. **Results** - Report history and export
4. **Settings** - Automation configuration

## Architecture

### Process Separation
- **Main Process**: Electron app lifecycle, file dialogs, IPC handlers
- **Renderer Process**: React UI, SDK (WebUSB requires user interaction)
- **Preload**: Bridge for secure IPC communication

### SDK Integration
```typescript
// SDK runs in renderer due to WebUSB requirements
const settings = {
  debug: true,
  fetchConfig: true,
  env: 'webusb',
};
await sdk.init(settings);
```

### Auto-Response Mechanism
```typescript
// Listen for UI events and auto-respond
sdk.on(UI_EVENT, (event) => {
  if (event.type === UI_REQUEST.REQUEST_PIN) {
    sdk.uiResponse({
      type: UI_REQUEST.RECEIVE_PIN,
      payload: defaultPin,
    });
  }
});
```

## Success Criteria
1. App connects to device via WebUSB
2. Tests run without manual PIN/Passphrase entry
3. Reports are generated and exportable
4. Build produces installers for Mac/Win/Linux

## Non-Goals (Out of Scope)
- Bluetooth/Bridge transport support
- Real-time collaboration features
- Cloud report storage
- Mobile app version
