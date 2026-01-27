
---
## 变更记录
- **时间**: 2026-01-27 21:17
- **摘要**: 未提供变更摘要
---

# Hardware Test Agent - 需求文档 (PRD) v2

## 1. 项目概述

### 1.1 项目名称
**Hardware Test Agent** - 硬件钱包自动化测试桌面端

### 1.2 项目目标
为 QA 团队构建一个**完全自动化**的硬件钱包测试工具，支持一键运行全部测试用例，自动生成详细测试报告。

### 1.3 技术选型
- **框架**: Electron 30+ + React 18 + TypeScript
- **构建工具**: Vite + electron-builder
- **核心 SDK**: @onekeyfe/hd-core
- **状态管理**: Jotai
- **测试数据**: 复用 expo-example 现有数据文件

## 2. 功能需求

### 2.1 测试模块 (P0)

| 模块 | 功能 | 自动化策略 |
|------|------|-----------|
| **Passphrase 测试** | 多钱包切换验证 | 自动输入 passphrase，`showOnOneKey: false` |
| **地址测试** | 12/18/24词地址验证 | 批量验证，无需设备确认 |
| **SLIP39 测试** | SLIP39 地址/公钥验证 | 批量验证，无需设备确认 |
| **安全检查** | 盲签名检测 | 自动配置 safetyChecks |
| **功能测试** | 设备锁定/初始化 | 事件监听自动响应 |
| **Attach To Pin** | 钱包 PIN 绑定 | 自动 PIN 输入 |
| **链方法批量** | 40+ 方法批量测试 | `showOnOneKey: false` |

### 2.2 自动化引擎 (P0)

#### 2.2.1 自动 PIN 输入
```typescript
// 监听 PIN 请求事件
SDK.on(UI_EVENT, (event) => {
  if (event.type === 'ui-request_pin') {
    SDK.uiResponse({ type: 'ui-receive_pin', payload: presetPIN });
  }
});
```

#### 2.2.2 自动 Passphrase 输入
```typescript
// 监听 Passphrase 请求事件
SDK.on(UI_EVENT, (event) => {
  if (event.type === 'ui-request_passphrase') {
    SDK.uiResponse({
      type: 'ui-receive_passphrase',
      payload: { value: currentTestPassphrase }
    });
  }
});
```

#### 2.2.3 跳过设备确认
```typescript
// 所有调用添加 showOnOneKey: false
const params = {
  path: "m/44'/0'/0'/0/0",
  showOnOneKey: false,  // 跳过设备端确认
};
```

### 2.3 测试管理界面 (P0)

#### 2.3.1 测试套件选择
- [ ] 复选框选择要运行的测试模块
- [ ] 快速选择：全选 / 全不选 / 核心测试
- [ ] 保存常用测试配置

#### 2.3.2 测试执行
- [ ] 一键运行所有选中测试
- [ ] 实时进度显示（进度条 + 当前用例）
- [ ] 支持暂停 / 继续 / 终止
- [ ] 错误时可选继续或停止

#### 2.3.3 结果展示
- [ ] 测试结果看板（通过 / 失败 / 跳过统计）
- [ ] 失败用例高亮显示
- [ ] 展开查看详细错误信息
- [ ] 支持按模块 / 状态筛选

### 2.4 报告生成 (P1)

#### 2.4.1 报告格式
- Markdown 格式（便于阅读）
- JSON 格式（便于解析）
- HTML 格式（便于分享）

#### 2.4.2 报告内容
```markdown
# 测试报告 - 2024-01-27 14:30:00

## 概览
- 设备: OneKey Pro
- 固件版本: 4.5.0
- 测试总数: 1234
- 通过: 1200 (97.2%)
- 失败: 30 (2.4%)
- 跳过: 4 (0.3%)
- 总耗时: 45分钟

## 失败用例详情
### [地址测试] cardanoGetAddress - passphrase_1
- 预期: addr1qyr8t5k9...
- 实际: addr1qxx7f3k2...
- 错误: 地址不匹配
```

### 2.5 设备管理 (P1)

- [ ] 自动检测已连接设备
- [ ] 显示设备信息（型号、固件版本、SN）
- [ ] 设备连接状态指示
- [ ] 断开重连提示

## 3. 系统架构

### 3.1 目录结构
```
hardware-test-agent/
├── packages/
│   ├── test-core/              # 核心测试逻辑 (可独立运行)
│   │   ├── src/
│   │   │   ├── engine/         # 测试引擎
│   │   │   │   ├── TestRunner.ts
│   │   │   │   ├── AutomationEngine.ts
│   │   │   │   └── EventHandler.ts
│   │   │   ├── suites/         # 测试套件
│   │   │   │   ├── passphrase/
│   │   │   │   ├── address/
│   │   │   │   ├── slip39/
│   │   │   │   ├── security/
│   │   │   │   ├── functional/
│   │   │   │   ├── attachToPin/
│   │   │   │   └── chainMethod/
│   │   │   ├── data/           # 测试数据 (从 expo-example 同步)
│   │   │   ├── reporter/       # 报告生成器
│   │   │   └── types/          # 类型定义
│   │   └── package.json
│   │
│   └── desktop/                # Electron 桌面端
│       ├── src/
│       │   ├── main/           # Electron 主进程
│       │   │   ├── index.ts
│       │   │   └── ipc.ts
│       │   ├── renderer/       # React 渲染进程
│       │   │   ├── App.tsx
│       │   │   ├── pages/
│       │   │   │   ├── Dashboard.tsx
│       │   │   │   ├── TestRunner.tsx
│       │   │   │   ├── Results.tsx
│       │   │   │   └── Settings.tsx
│       │   │   ├── components/
│       │   │   │   ├── TestSuiteSelector/
│       │   │   │   ├── ProgressView/
│       │   │   │   ├── ResultsTable/
│       │   │   │   └── DeviceStatus/
│       │   │   └── stores/
│       │   └── preload/
│       ├── electron-builder.json
│       └── package.json
│
├── pnpm-workspace.yaml
└── package.json
```

### 3.2 核心类设计

#### TestRunner - 测试执行器
```typescript
class TestRunner {
  private sdk: CoreApi;
  private automationEngine: AutomationEngine;
  private reporter: Reporter;
  
  async runSuite(suite: TestSuite): Promise<SuiteResult>;
  async runAll(suites: TestSuite[]): Promise<TestReport>;
  pause(): void;
  resume(): void;
  stop(): void;
}
```

#### AutomationEngine - 自动化引擎
```typescript
class AutomationEngine {
  private pinCallback: () => string;
  private passphraseCallback: () => string;
  
  setupEventHandlers(sdk: CoreApi): void;
  setCurrentPassphrase(passphrase: string): void;
  setCurrentPin(pin: string): void;
}
```

### 3.3 数据流
```
[UI 选择测试] 
    ↓
[TestRunner 调度] 
    ↓
[AutomationEngine 处理设备事件]
    ↓
[SDK 调用硬件]
    ↓
[结果验证]
    ↓
[Reporter 生成报告]
    ↓
[UI 展示结果]
```

## 4. 实现计划

### Phase 1: 基础框架 (Week 1)
- [ ] 初始化 monorepo 项目结构
- [ ] 配置 Electron + Vite + React
- [ ] 集成 @onekeyfe/hd-core
- [ ] 实现基础 AutomationEngine

### Phase 2: 测试套件迁移 (Week 2)
- [ ] 迁移 Passphrase 测试逻辑
- [ ] 迁移地址测试逻辑
- [ ] 迁移 SLIP39 测试逻辑
- [ ] 迁移其他测试模块

### Phase 3: 桌面界面 (Week 3)
- [ ] Dashboard 首页
- [ ] 测试套件选择界面
- [ ] 测试执行进度界面
- [ ] 结果展示界面

### Phase 4: 报告与优化 (Week 4)
- [ ] 报告生成器（MD/JSON/HTML）
- [ ] 测试配置持久化
- [ ] 错误处理优化
- [ ] 打包与分发

## 5. 验收标准

### 5.1 功能验收
- [ ] 能够一键运行全部 7 个测试模块
- [ ] 自动处理 PIN 和 Passphrase 输入
- [ ] 生成完整的测试报告
- [ ] 支持 macOS / Windows / Linux

### 5.2 性能验收
- [ ] 全量测试（~1200 用例）完成时间 < 1 小时
- [ ] 应用启动时间 < 3 秒
- [ ] 内存占用 < 500MB

### 5.3 可用性验收
- [ ] QA 团队可独立使用
- [ ] 界面清晰直观
- [ ] 错误信息明确

---

## 给 Stitch 的输入摘要

### 需要设计的页面

1. **Dashboard 首页**
   - 设备连接状态卡片
   - 最近测试结果摘要
   - 快速开始测试按钮

2. **测试套件选择页**
   - 7 个测试模块的复选框列表
   - 每个模块显示：名称、描述、用例数量
   - 全选/取消全选按钮
   - 开始测试按钮

3. **测试执行页**
   - 总体进度条
   - 当前执行模块和用例
   - 实时日志滚动显示
   - 暂停/继续/终止按钮

4. **结果展示页**
   - 统计卡片（通过/失败/跳过）
   - 结果表格（可展开详情）
   - 筛选器（按模块/状态）
   - 导出报告按钮

5. **设置页**
   - PIN 配置
   - 测试超时配置
   - 报告输出路径
