# Hardware Test Agent - 技术规格

## 1. 技术栈

- **框架**: Electron 30+ + React 18 + TypeScript
- **构建**: Vite + electron-builder
- **包管理**: pnpm + monorepo
- **状态管理**: Jotai
- **SDK**: @onekeyfe/hd-core

## 2. 项目结构

```
hardware-test-agent/
├── packages/
│   ├── test-core/              # 核心测试逻辑
│   │   ├── src/
│   │   │   ├── engine/         # 测试引擎
│   │   │   ├── suites/         # 测试套件
│   │   │   ├── data/           # 测试数据
│   │   │   ├── reporter/       # 报告生成
│   │   │   └── types/          # 类型定义
│   │   └── package.json
│   │
│   └── desktop/                # Electron 桌面端
│       ├── src/
│       │   ├── main/           # 主进程
│       │   ├── renderer/       # React UI
│       │   └── preload/        # 安全桥接
│       └── package.json
│
├── scripts/                    # 构建脚本
├── pnpm-workspace.yaml
└── package.json
```

## 3. 核心模块

### 3.1 AutomationEngine
- 自动响应 PIN 请求
- 自动输入 Passphrase
- 管理 passphraseState

### 3.2 TestRunner
- 执行测试套件
- 管理测试生命周期
- 发出进度事件

### 3.3 测试套件
- PassphraseSuite
- AddressSuite
- SLIP39Suite
- SecuritySuite
- FunctionalSuite
- AttachToPinSuite
- ChainMethodSuite

## 4. IPC 接口

- device:search / device:connect / device:getInfo
- test:getSuites / test:start / test:pause / test:stop
- report:export / report:getHistory

## 5. 数据同步

通过软链接引用 expo-example 的测试数据
