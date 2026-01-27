# Hardware Test Agent - Build Instructions

## Project Setup
```bash
# Install dependencies
pnpm install

# If pnpm not installed
npm install -g pnpm
```

## Development

### Run Development Server
```bash
# Run Electron app in development mode
pnpm dev:electron

# Or run just the Vite dev server (renderer only)
pnpm dev
```

### Build for Production
```bash
# Build Vite bundles (renderer + main + preload)
pnpm build:vite

# Full build with installers
cd packages/desktop && pnpm build
```

### Build Outputs
```
packages/desktop/dist/
├── main/          # Electron main process
├── preload/       # Preload scripts
└── renderer/      # React app (HTML/CSS/JS)
```

## Project Structure
```
hardware-test-agent/
├── packages/
│   ├── desktop/           # Electron + React app
│   │   ├── src/
│   │   │   ├── main/      # Electron main process
│   │   │   ├── preload/   # IPC bridge
│   │   │   └── renderer/  # React app
│   │   │       ├── components/
│   │   │       ├── contexts/
│   │   │       ├── pages/
│   │   │       └── services/
│   │   └── dist/          # Build output
│   └── test-core/         # Shared types (minimal)
├── .ralph/                # Ralph configuration
└── pnpm-workspace.yaml
```

## Key Files
- `packages/desktop/src/renderer/services/sdk.ts` - SDK WebUSB integration
- `packages/desktop/src/renderer/services/testRunner.ts` - Test execution engine
- `packages/desktop/src/renderer/services/testSuites.ts` - Test suite definitions
- `packages/desktop/src/renderer/services/reportStorage.ts` - Report persistence
- `packages/desktop/src/renderer/contexts/SDKContext.tsx` - React SDK state

## Running Tests
```bash
# Currently no automated tests for the app itself
# Hardware device required for integration testing

# Manual testing:
# 1. Run `pnpm dev:electron`
# 2. Connect OneKey device via USB
# 3. Click "选择设备" to select via WebUSB
# 4. Navigate to Test Runner and run tests
```

## Key Learnings

### WebUSB Constraint
The SDK must run in the renderer process because WebUSB `requestDevice()` requires a user gesture (click). Cannot be called from main process.

### CSP Requirements
Content Security Policy must allow:
- `connect-src` for *.onekey.so and *.onekeycn.com
- `unsafe-eval` for SDK dynamic imports

### Vite + Electron Path Resolution
When using `root: 'src/renderer'`, electron plugin entries need absolute paths:
```typescript
entry: path.resolve(__dirname, 'src/main/index.ts')
```

### Auto PIN/Passphrase
Use `sdk.on(UI_EVENT, handler)` to intercept and auto-respond to device prompts. Response format:
```typescript
sdk.uiResponse({
  type: UI_REQUEST.RECEIVE_PIN,
  payload: '123456'
});
```

## Feature Development Checklist

Before marking features complete:
- [ ] Code builds without errors (`pnpm build:vite`)
- [ ] App starts without console errors
- [ ] Device connection works via WebUSB
- [ ] Changes committed with conventional commit messages
- [ ] @fix_plan.md updated with progress

## Troubleshooting

### "SDK not initialized"
Wait for SDK init in useEffect, check `initialized` state before actions.

### WebUSB device not showing
- Ensure device is connected via USB (not Bluetooth)
- Try unplugging and replugging the device
- Check browser WebUSB support (Chromium-based required)

### Build fails with entry not found
Use absolute paths in vite.config.ts for electron plugin entries.
