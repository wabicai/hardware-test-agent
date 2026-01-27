# Hardware Test Agent

Desktop application for automated OneKey hardware wallet testing. Runs test suites without manual PIN/Passphrase entry.

## Features

- **WebUSB Connection**: Connect to OneKey devices directly via USB
- **Automated Testing**: Auto-respond to PIN and Passphrase prompts
- **Multiple Test Suites**: Address, Passphrase, Chain Methods, Functional, Batch tests
- **Report Generation**: Export results to Markdown, JSON, or HTML
- **Cross-Platform**: Builds for macOS, Windows, and Linux

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- OneKey hardware device connected via USB

### Installation

```bash
# Clone the repository
git clone https://github.com/user/hardware-test-agent.git
cd hardware-test-agent

# Install dependencies
pnpm install
```

### Development

```bash
# Run in development mode
pnpm dev:electron
```

### Production Build

```bash
# Build for current platform
cd packages/desktop && pnpm build
```

## Usage

1. **Connect Device**: Plug in your OneKey hardware device via USB
2. **Launch App**: Run `pnpm dev:electron`
3. **Select Device**: Click "选择设备 (WebUSB)" on the Dashboard
4. **Run Tests**: Navigate to Test Runner, select suites, click "开始测试"
5. **View Results**: Check the Results page for detailed reports

## Test Suites

| Suite | Description |
|-------|-------------|
| Address | Validates address generation across 7 chains (BTC, ETH, SOL, etc.) |
| Passphrase | Tests multi-wallet switching with different passphrases |
| Chain Methods | Tests 17 blockchain operations (getAddress, signTransaction, etc.) |
| Functional | Device lock/unlock operations |
| Batch Address | Bulk address generation tests |

## Configuration

Navigate to Settings to configure:

- **Default PIN**: PIN code for auto-response (default: 123456)
- **Default Passphrase**: Passphrase for auto-response
- **Auto Respond**: Toggle automatic PIN/Passphrase responses

## Project Structure

```
hardware-test-agent/
├── packages/
│   └── desktop/          # Electron + React app
│       ├── src/
│       │   ├── main/     # Electron main process
│       │   ├── preload/  # IPC bridge
│       │   └── renderer/ # React UI
│       │       ├── services/
│       │       │   ├── sdk.ts          # SDK WebUSB integration
│       │       │   ├── testRunner.ts   # Test execution engine
│       │       │   ├── testSuites.ts   # Test suite definitions
│       │       │   └── reportStorage.ts # Report persistence
│       │       └── pages/
│       └── dist/         # Build output
└── .ralph/               # Development documentation
```

## Requirements

- Chromium-based browser engine (Electron uses Chromium)
- USB connection (WebUSB doesn't work over Bluetooth)
- Device firmware compatible with hd-common-connect-sdk

## Troubleshooting

### Device not showing in selection dialog
- Ensure device is connected via USB cable
- Try unplugging and reconnecting the device
- Check that no other application is using the device

### Tests failing with timeout
- Ensure device is unlocked
- Check that PIN is correctly configured in Settings
- Verify device firmware is up to date

### Build errors
```bash
# Clean and rebuild
rm -rf node_modules packages/*/node_modules
pnpm install
pnpm build:vite
```

## License

MIT
