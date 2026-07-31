# Codex Skin 待完成工作说明

本文用于记录 `codex-skin` 当前仍未完成的工作、原因、实现顺序和验收标准。

项目目标不是给 Codex 简单换色，而是把 Codex Desktop 在不修改官方安装包、不破坏原生交互的前提下，改造成高度接近微信 PC 与 QQ NT 的聊天式 Agent 客户端。

---

## 1. 当前完成状态

目前已经具备：

- Windows Store 包内 Codex / ChatGPT 可执行文件发现
- 仅绑定 `127.0.0.1` 的 CDP 启动与连通性检测
- CDP target 发现与运行时 JavaScript / CSS 注入
- Renderer reload 后自动重新注入
- MutationObserver 驱动的 DOM 重新识别
- 基础语义层：`sidebar`、`conversation-list`、`active-chat`、`chat-header`、`user-message`、`agent-message`、`tool-card`、`diff-card`、`approval-card`、`composer` 等
- 微信风格主题与 QQ 风格主题
- 静态预览页
- 隐私安全的 DOM Inspector
- 退出时恢复官方界面

当前最大问题不是主题 CSS，而是：**还没有针对目标 Windows 版本 Codex Renderer 的精确 DOM Adapter。**

在精确 Adapter 完成前，现有主题只能依赖通用选择器和结构特征，视觉能力已经存在，但在真实 Codex 不同版本中，消息、会话列表、工具调用等节点的命中率仍可能变化。

---

# 2. P0：真实 Codex DOM 精确适配

这是当前最高优先级，也是后续所有高还原 UI 的基础。

## 2.1 获取目标版本 DOM 结构报告

需要在目标 Windows Codex 版本运行：

```powershell
npm run inspect > codex-dom-report.json
```

Inspector 只记录 DOM 结构元数据，不输出聊天正文。

需要确认：

- 当前 Codex / ChatGPT Renderer 的版本和页面 target
- 项目 / Thread 列表容器
- 单条 Thread 行
- 当前选中的 Thread 行
- User Message 外层节点
- Assistant Message 外层节点
- Tool Call 外层节点
- Diff / Patch 外层节点
- Approval / Permission 外层节点
- Composer 外层节点
- 输入区域
- 发送按钮
- Header / Title 区域
- Split Pane / Browser / Terminal 等附加区域

### 验收标准

对同一版本 Codex：

- User Message 识别率 100%
- Assistant Message 识别率 100%
- Thread Row 识别率 100%
- 当前 Thread 选中态识别正确
- Tool / Diff / Approval 不误标普通消息
- Composer、输入框、发送按钮识别稳定

---

## 2.2 建立版本化 Adapter

不要继续扩大通用 CSS selector。

目标结构：

```text
src/adapters/
├── generic.ts
├── codex-26.7xx.ts
├── codex-26.8xx.ts
└── index.ts
```

运行时优先使用已知版本 Adapter；版本未知时退回 generic adapter。

Adapter 最终统一输出语义角色：

```text
app-shell
sidebar
conversation-list
conversation-row
conversation-row-active
active-chat
chat-header
chat-title
chat-actions
user-message
agent-message
message-content
message-meta
tool-card
diff-card
approval-card
code-block
composer
composer-toolbar
composer-input
send-button
```

### 验收标准

主题 CSS 不直接依赖 Codex 的随机 class 名。

Codex 小版本升级后，如果 DOM 发生变化，只修改 Adapter，不修改微信 / QQ Theme 的主体布局代码。

---

# 3. P0：微信主题高还原

目标不是“绿色 Codex”，而是让用户打开 Codex 后第一视觉感受接近微信 PC。

## 3.1 左侧会话区

待完成：

- 项目 / Thread 映射成微信会话行
- 方形头像
- 会话名称
- 最后一条消息摘要
- 时间
- 未读 Badge
- 当前会话绿色选中态
- Hover 状态
- 搜索框
- 顶部个人区域 / 固定操作区

需要适配 Codex 原始 Project / Thread 数据展示方式，不能伪造第二套不可点击列表。

### 验收标准

- 原 Codex Thread 点击行为保持不变
- 列表滚动保持正常
- 当前会话与实际 Thread 状态一致
- 视觉上不再像 IDE Sidebar

---

## 3.2 聊天顶部栏

待完成：

- 当前 Project / Thread 名称作为聊天对象标题
- 在线 / Agent 状态区域
- 更多操作入口的微信式视觉
- 保留 Codex 原生 Header 操作能力

### 验收标准

Header 高度、边框、留白、文字层级与微信桌面端接近，同时不遮挡 Codex 原生操作。

---

## 3.3 消息气泡

待完成：

- User 右侧绿色气泡
- Codex 左侧白色气泡
- 微信式小圆角和气泡尖角
- 头像与气泡垂直对齐
- 连续消息间距
- Markdown 段落间距
- 引用、列表、表格、代码块在气泡中的适配
- 超长消息最大宽度与响应式规则

需要重点避免：

- 代码块突破气泡
- Markdown 表格撑宽布局
- Tool 卡片被错误包进文字气泡
- User / Agent 外层元素被重复 padding

### 验收标准

普通文本、长文本、代码、表格、列表、图片等常见消息都不破版。

---

## 3.4 Tool / Diff / Approval 卡片

待完成：

### Tool Call

做成微信“小程序 / 服务消息”式卡片：

```text
┌────────────────────────┐
│ >_ 执行命令             │
│ npm run build          │
│                        │
│ 已完成 · 3.2s          │
└────────────────────────┘
```

### Diff

做成文件消息：

```text
┌────────────────────────┐
│ 📄 Login.tsx           │
│ +34  -12               │
│                  查看 › │
└────────────────────────┘
```

### Approval

做成确认卡片，但必须继续使用 Codex 原有按钮和事件。

### 验收标准

- 原 Tool 展开 / 折叠行为不受影响
- Diff 查看能力不受影响
- Approval 原按钮继续有效
- 失败、运行中、成功状态有不同视觉表达

---

## 3.5 微信输入区

待完成：

- 工具栏
- 附件按钮
- 输入区
- 发送按钮
- 多行输入自动增长
- Focus 状态
- Disabled 状态
- Working / Streaming 状态

### 验收标准

快捷键、粘贴、拖入文件、附件选择、发送等 Codex 原生行为全部保留。

---

# 4. P0：QQ NT 主题高还原

QQ 主题不能成为“微信主题换蓝色”。

整体需要保持独立布局语言。

## 4.1 左侧会话区

待完成：

- QQ NT 式圆形头像
- 蓝色系 Active / Hover
- 更大的行高和圆角
- 搜索框
- Project / Thread 信息层级
- 时间 / Badge

---

## 4.2 顶部聊天栏

待完成：

- QQ NT 式聊天对象标题
- 更明显的右侧操作区
- 为“搜索 / 更多 / Agent 操作”等保留位置
- 与 Windows 窗口区域协调

---

## 4.3 消息区域

待完成：

- User 蓝色圆角气泡
- Codex 白色圆角气泡
- QQ 风格圆形头像
- 更松的消息间距
- Hover / Select 状态
- Markdown / Code / Table 自适应

---

## 4.4 QQ 服务卡片

Tool、Diff、Approval 设计成更接近 QQ 文件 / 服务卡片的视觉：

- 较大圆角
- 轻边框
- 蓝色状态元素
- 文件类型图标
- 执行状态
- CTA 区域

必须继续复用真实 Codex DOM 和事件。

---

## 4.5 QQ 输入区

待完成：

- 更宽、更圆的 Composer
- QQ 式底部操作区
- 蓝色发送操作
- 多行输入适配
- 文件 / 图片 / Agent 工具入口布局

---

# 5. P1：Agent Messenger 语义增强

微信 / QQ 还原完成后，再加入真正属于 Codex 的 Agent 能力。

## 5.1 Agent 状态

将 Codex 的运行状态转换成聊天状态：

```text
正在输入…
正在查看项目结构…
正在读取 LoginService.java…
正在修改 3 个文件…
正在运行测试…
```

要求状态来自真实 Codex 行为，不做虚假动画。

---

## 5.2 项目 = 联系人 / 会话

探索把 Project / Thread 的认知改造成：

```text
Agent Interview
GPT Converter
Knowledge Base
```

每个项目像一个长期存在的 AI 同事。

这只是表现层映射，不改变 Codex 的真实 Project / Thread 数据模型。

---

## 5.3 项目头像

支持：

- 自动生成默认头像
- 项目首字母头像
- 自定义本地头像
- 微信方形 / QQ 圆形主题分别裁剪

不把头像资源写入 Codex 官方安装目录。

---

## 5.4 时间与消息分组

待实现：

- 连续 User 消息分组
- 连续 Agent 消息分组
- 时间分隔线
- 头像按消息组显示
- Tool 卡片与对应 Agent 回合关联

---

# 6. P1：主题切换与设置面板

目前主题通过命令行选择，后续需要桌面控制层。

目标：

```text
Codex Skin

主题
○ WeChat
● QQ

外观
头像大小
字体缩放
背景透明度
动效

[应用] [恢复官方]
```

待完成：

- 系统托盘
- 微信 / QQ 一键切换
- Restore 官方主题
- 开机 / Codex 启动联动
- 主题参数持久化
- 当前 Codex 版本 / Adapter 状态显示
- CDP 连接状态

---

# 7. P1：视觉回归测试

静态 `preview/index.html` 已经存在，但还需要正式视觉测试机制。

待完成：

- 固定 1280×800 / 1440×900 / 1920×1080 fixture
- 微信标准截图
- QQ 标准截图
- CSS 改动后的截图对比
- Message / Tool / Diff / Approval 单独 fixture
- 长文本 / Code / Table / Error 状态 fixture

目标不是追求和微信、QQ 图标资源 1:1 复制，而是保持布局、比例、交互层级和视觉语言高度一致。

---

# 8. P1：稳定性

## 8.1 DOM 变化恢复

需要处理：

- Thread 切换
- 新消息 Streaming
- Tool 状态更新
- Dialog 打开 / 关闭
- Split Pane 创建 / 删除
- Renderer Reload
- Codex 自动更新后的 Adapter 降级

---

## 8.2 性能

当前 MutationObserver 需要继续优化。

目标：

- 不对整个 DOM 高频重复扫描
- 只处理新增 / 改变区域
- 对已经标记的节点跳过
- 避免滚动消息时明显掉帧
- 长会话保持可用

---

## 8.3 Restore

Restore 必须完整撤销：

- `data-codex-skin-*`
- 注入 style
- helper DOM
- observer
- runtime listener
- scene / avatar 等增强元素

恢复后界面应该等价于正常启动的官方 Codex。

---

# 9. P1：Windows 运行时兼容

当前已经兼容 `Codex.exe` 和较新的 `ChatGPT.exe` / OWL runtime 路径，但仍需继续验证：

- Windows 10
- Windows 11
- Store 更新前后
- Codex 不同包版本
- 多个 ChatGPT / Codex 进程
- 非默认安装状态
- CDP target 多页面情况

需要建立：

```text
runtime version
        ↓
launcher strategy
        ↓
CDP target strategy
        ↓
adapter version
```

---

# 10. P2：主题系统扩展

微信和 QQ 稳定后，再抽象正式 Theme API。

建议结构：

```text
themes/<theme>/
├── manifest.json
├── tokens.css
├── layout.css
├── messages.css
├── cards.css
├── composer.css
└── assets/
```

主题只消费统一语义，不直接访问 Codex DOM。

未来可以增加：

- Telegram
- Discord
- MSN
- ICQ
- Slack
- 自定义企业 IM

但在微信 / QQ 达到稳定可用前，不扩大主题数量。

---

# 11. 测试与 CI

当前仓库已经加入 TypeScript CI 配置，但仍需要完成：

- 确认 GitHub Actions 正常触发
- `npm ci`
- `npm run typecheck`
- Adapter 单元测试
- Theme manifest 校验
- CSS 基本语法检查
- Windows 启动脚本静态检查
- Preview smoke test

后续可以增加 Windows Runner 验证 PowerShell 脚本，但不应该在 CI 中尝试真正启动用户的 Codex Desktop。

---

# 12. 安全边界

以下原则保持不变：

- 不修改 `WindowsApps` 内官方文件
- 不 patch `app.asar`
- 不替换官方二进制
- CDP 只监听 `127.0.0.1`
- 不暴露调试端口到局域网 / Internet
- Inspector 不导出聊天正文
- 自定义主题不得默认执行任意第三方 JavaScript
- Approval 等关键操作必须继续使用 Codex 原生事件链

---

# 13. 推荐开发顺序

按以下顺序继续：

```text
1. 获取真实 Codex DOM Report
              ↓
2. 完成当前版本 Adapter
              ↓
3. 微信真实界面校准
              ↓
4. QQ 真实界面校准
              ↓
5. Tool / Diff / Approval 卡片
              ↓
6. Composer 精确适配
              ↓
7. 长会话 / Streaming / 切换稳定性
              ↓
8. 设置面板与一键主题切换
              ↓
9. 视觉回归测试
              ↓
10. Theme API
```

当前不要优先开发更多主题。

**当前最重要的下一步：拿到目标 Windows Codex 版本的 `codex-dom-report.json`，完成第一个精确版本 Adapter。**
