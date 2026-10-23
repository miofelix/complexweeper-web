# 项目 issue 分析

核查日期：2026-10-24（Asia/Shanghai）；本地基线：`488d497`。

## 实施结果（2026-10-24）

已采纳 #1 的建议：固定 `98.css@0.1.21`，将原内联样式迁移到 `src/styles.css`，通过 `src/main.ts` 按「库样式 → 项目适配」顺序导入；工具条、弹窗和表单接入经典外观。弹窗使用 `window`、`title-bar`、`title-bar-text`、`window-body` 与默认按钮类，同时保留现有焦点管理、ARIA、菜单语义和交互状态。棋盘规则及 Canvas 绘制未改动。

CSS 与四个字体文件均由 Vite 本地打包。完整 MIT 声明保存在 `public/licenses/98.css-LICENSE.txt`，随产物发布并预缓存；中英文 README 已更新。下文为实施前分析，源码行号对应上述基线。

验证结果：

- `npm test`：10 个文件、192 个测试通过；预缓存测试覆盖 CSS、字体与许可声明。
- `npm run typecheck`、`npm run build`、`git diff --check`：通过。
- 真实 Chromium 浏览器：桌面、320px/375px 窄屏、coarse pointer 下工具条/表单/按钮至少 44px；长中文标题与标签无横向溢出，弹窗正文可滚动。
- 实测选中态、颜色/音效/插旗/缩放不重置对局；Tab/Shift+Tab 焦点循环、Escape 恢复焦点、表单错误提示及四类弹窗通过。
- 生产构建由 service worker 控制后，禁用浏览器 HTTP 缓存并模拟断网重载，游戏启动成功，CSS、两种实际使用的 WOFF2 字重及许可文件请求均返回 200；全部 22 个发行文件均在预缓存清单内。
- 双曲高级棋盘在 320px 视口下可横向滚动，页面无横向溢出。
- `npm audit --omit=dev`：生产依赖未报告漏洞。

## 范围与结论

当前目录名称沿用桌面原项目，但 `origin` 是 [miofelix/complexweeper-web](https://github.com/miofelix/complexweeper-web)，`upstream` 才是桌面原作。截至核查时，origin 查询到 1 个 issue（open），没有 open PR。本文以 Web fork 为主，上游问题见文末附录。

唯一 issue 是 [#1「[feat] 考虑使用 jdan.github.io/98.css/ 组件库」](https://github.com/miofelix/complexweeper-web/issues/1)。创建时间为 2026-10-23 16:00:40 UTC，即北京时间 2026-10-24 00:00:40；没有标签、负责人和评论。正文只有库简介及链接，没有界定改造范围或验收标准。

**建议接受为 P2 界面改进，先改工具条与弹窗，暂不扩大到棋盘绘制。** P2 是本报告的建议，并非 issue 现有标签。98.css 与当前经典灰底、立体边框的方向一致，主要价值是统一控件外观、减少重复样式维护；它不能解决玩法、推理体验或游戏规则问题。

## 现状与适配范围

| 区域 | 当前实现证据 | 建议 |
| --- | --- | --- |
| 工具条按钮、菜单 | `index.html:41–88,227–279,284–325`，自写 `.tool`、`details/summary` 与菜单布局 | 使用库的按钮基础外观；保留响应式布局、summary 和链接的统一外观适配 |
| 弹窗外观 | `index.html:108–225`；`src/app/dialogs.ts:34–90,109–114` | 对接 `window`、`title-bar`、`title-bar-text`、`window-body`；默认按钮对接库的 `default` 类 |
| 表单 | `index.html:156–200`；`src/app/dialogs.ts:170–240` | 使用库输入控件外观，保留中文标签、校验提示和移动端尺寸 |
| 游戏棋盘、计数器、笑脸 | `src/render/renderer.ts`；`src/render/atlas.ts`；`index.html:326–327` | 当前为 Canvas 和图集渲染，CSS 不会替换内部绘制；无需迁移 |
| 离线与构建 | `src/main.ts:9–14`；`scripts/build-service-worker.ts:21–43`；`public/sw.js:50–58` | 通过 npm 本地打包 CSS/字体，并检查构建后的预缓存清单 |

## 主要风险

1. **全局样式叠加。** 核查的发布版会直接作用于 `body`、`button`、`input`、`label`、`select`、`a` 等元素；本项目已有自写 border、padding、font、focus 规则。直接引入会混合库的 box-shadow 与旧边框，应清理重复的视觉规则，保留布局规则，明确覆盖顺序。
2. **工具条不全是 button。** 模式入口是 `summary`，GitHub 入口是 `a.tool`（`index.html:289–323`）。核查的发布版没有对应 summary 按钮规则，不能只导入 CSS 就获得一致外观，也不宜为追求外观而破坏原有语义。
3. **持续选中态。** `src/app/app.ts:449–473` 通过 `.active` 和 `aria-pressed` 表示模式、难度、缩放、颜色和音效。发布版的瞬时 `:active` 效果不等于持续状态，没有直接的 `button[aria-pressed=true]` 规则；需要显式补齐。
4. **中文与触屏尺寸。** 库为多类控件指定 11px 字体，普通按钮默认最小高度 23px、最小宽度 75px，number 输入框设置 22px 高度。项目当前输入框为 16px 字体，窄屏或 coarse pointer 控件至少 44px（`index.html:166–175,269–279`）。应覆盖库默认值并检查长模式名、标签换行、菜单定位和缩放按钮宽度。
5. **离线资源。** 库 CSS 引用了本地 WOFF/WOFF2 字体。直接接入远端 CDN 不会进入当前构建目录，且现有 service worker 忽略跨域请求；应将 CSS 与实际使用的字体交给 Vite 构建。现有构建脚本会遍历 dist 全部文件，通常无需重写缓存机制，但应验证生成结果。
6. **样式不提供交互。** 库不含 JavaScript。现有焦点循环、Escape、焦点恢复、背景 inert 和 ARIA 命名（`src/app/dialogs.ts:34–102`）仍需保留。已有 `primary` 类与库 `default` 类的命名差异也需要适配。

以上是对源码和样式规则的静态判断，尚未在浏览器中实施或验证接入后的实际布局。

## 建议实施顺序

1. 把现有内联样式整理为项目样式文件，分清控件视觉与页面布局，保持 CSS 引入顺序明确。
2. 通过 npm 固定 98.css 版本、提交 lockfile，本地打包样式和字体；保留第三方 MIT 许可信息。
3. 先迁移弹窗外壳、按钮与表单，再统一工具条；保留现有 ID、DOM 语义、事件和状态属性。
4. 补齐 summary、链接、持续选中态、中文字体及触屏尺寸适配；移除已被库接管的重复边框规则。
5. 完成功能回归、真实浏览器视觉检查及 PWA 离线验证后，再决定是否扩大外观改造范围。

改动面预计集中在 `package.json`、lockfile、`src/main.ts`、`index.html`、新样式文件和 `src/app/dialogs.ts`；规则引擎与 Canvas 渲染无需因本 issue 而修改。工作量为小到中等，风险集中在样式回归，而非游戏算法；尚无视觉原型，不给出承诺工期。

## 建议验收条件

- 工具条与四类弹窗（自定义、纪录、玩法、关于）视觉一致，长中文标题、数字输入与错误提示可读。
- 两模式菜单、难度选择、颜色/音效/插旗开关、缩放持续选中态均正确，切换外观不重置当前对局。
- Tab/Shift+Tab、Escape、焦点恢复、背景 inert 与 ARIA 标签通过现有行为测试。
- 320px、375px、桌面视口及 coarse pointer 下控件可操作，触控目标保留 44px 下限；大棋盘仍可滚动。
- 首次联网加载并由 service worker 控制后断网重开，CSS、必要字体与游戏资源可用；更新后资源版本匹配。
- `npm test`、`npm run typecheck`、`npm run build` 全部通过；额外进行真实浏览器视觉检查，不能仅靠 jsdom 证明布局正确。

## 当前验证结果

本次只分析和新增报告，没有引入依赖或修改游戏源码。

- `npm test`：10 个测试文件、192 个测试通过。
- `npm run typecheck`：通过。
- `npm run build`：通过。
- 当前生产构建：`index.html` 10.00 kB（gzip 2.74 kB），JS 44.07 kB（gzip 14.88 kB）。
- 核查的 98.css npm 发布版为 `0.1.21`，CSS 文件 26,848 字节，Python gzip 测得 4,433 字节；字体另计。该测量不是接入后的净增量，Vite 压缩及旧 CSS 删除会改变结果。
- GitHub latest release API 返回标签 `0.1.18`，与 npm `0.1.21` 不同；实施时应以选定的 npm 版本与 lockfile 为准，不能用 release 页面推断 npm 最新版。

## 一手来源

- [origin issue #1](https://github.com/miofelix/complexweeper-web/issues/1)（通过 GitHub CLI/API 查询）
- [98.css 官方仓库与说明](https://github.com/jdan/98.css)
- [98.css npm 元数据](https://registry.npmjs.org/98.css/latest)（核查时 `0.1.21`）
- [核查的发布 CSS](https://unpkg.com/98.css@0.1.21/dist/98.css)
- [GitHub latest release API](https://api.github.com/repos/jdan/98.css/releases/latest)
- 本地源码路径和行号基于提交 `488d497`；测试和构建结果来自本次本地执行。

---

## 上游 issue 适用性附录

核对日期：2026-10-24。仅分析上游 `Yueqing-Chen/complexweeper-A-minesweeper-game` 的 #6、#7、#8、#3、#5；已逐项执行 `gh issue view --repo … --json …,comments`，五项均为 OPEN。本地代码基线为 `488d49748f1deb204aded02dd610e0f0c5e4d900`；同步记录为上游 v1.3.0 / `f6b80bb35690ad4498e2e0179353bc8b369a2d70`（[docs/UPSTREAM.md:5–14](UPSTREAM.md#L5-L14)）。本次只做主源与静态代码核对，未复现截图、未运行测试。

### #6：展开探测影响推理严谨性

- **主源**：[issue 正文](https://github.com/Yueqing-Chen/complexweeper-A-minesweeper-game/issues/6)反对借中键试探抵消对，提出全正雷或额外提示；[作者 2026-10-11 回复](https://github.com/Yueqing-Chen/complexweeper-A-minesweeper-game/issues/6#issuecomment-6111415218)明确可用自定义去掉负雷，全正预设仅为可能的后续功能。
- **本地适用**：反馈确实覆盖 Web 版的规则体验。[README.md:34–38](../README.md#L34-L38)已明确允许用展开试探抵消对；[src/game/game.ts:329–350](../src/game/game.ts#L329-L350)先比较真实邻域雷数，再比较实/虚总数（允许互换）；[354–377](../src/game/game.ts#L354-L377)判据失败只反馈，通过后仍可能踩到未标出的真雷。
- **结论：设计取舍／体验改进，不是已证实的移植 bug。** 现有替代方式为「自定义 → 指定配比」，负实雷、负虚雷填 0，至少一种正雷非零；对话框支持精确配比与非负计数（[src/app/dialogs.ts:209–240、256–270、325–330](../src/app/dialogs.ts#L209-L330)，名称见 [src/app/strings.ts:61–75](../src/app/strings.ts#L61-L75)），配置应用到 `type_count` 后开新局（[src/app/app.ts:224–232](../src/app/app.ts#L224-L232)），引擎按配比布雷（[src/game/game.ts:187–206](../src/game/game.ts#L187-L206)）。新增全正预设或公开更多信息属于规则／产品选择，不能宣称保证棋盘唯一解或无需猜测。

### #7：多解验证

- **主源**：[issue 正文](https://github.com/Yueqing-Chen/complexweeper-A-minesweeper-game/issues/7)要求在雷数、位置符合后验证题面可行性；[作者 2026-10-12 回复](https://github.com/Yueqing-Chen/complexweeper-A-minesweeper-game/issues/7#issuecomment-6123647347)将其定位为未来的“完美无缺模式”；[2026-10-13 补充评论](https://github.com/Yueqing-Chen/complexweeper-A-minesweeper-game/issues/7#issuecomment-6139978541)另提大范围改旗的试错成本。
- **本地适用**：严格依赖真实盘的边界仍存在，但要分清三件事：局部展开用 `matchComboTruth`（[src/game/game.ts:329–350](../src/game/game.ts#L329-L350)）；胜利只要求翻开全部真实非雷格，不要求旗型全对（[387–394](../src/game/game.ts#L387-L394)）；`correctFlags` 与终局旗帜标对／标错才逐格比较真实雷型（[419–424](../src/game/game.ts#L419-L424)、[src/render/renderer.ts:103–113](../src/render/renderer.ts#L103-L113)）。因此“旗型被标错”不能直接等同“错误判负”。
- **结论：新验证模式需求，尚无足够证据定为 Web 回归。** 当前未实现接受任意满足已知题面的替代盘；严格展开和真实非雷格判胜与[上游 game.zig:386–459](https://github.com/Yueqing-Chen/complexweeper-A-minesweeper-game/blob/f6b80bb35690ad4498e2e0179353bc8b369a2d70/正式版/src/game.zig#L386-L459)一致。`judge_loose` 仅是双曲模式的局部备选判据，仍要求真实雷数并读取真值，不能当作全局多解验证开关（[src/game/game.ts:330–335](../src/game/game.ts#L330-L335)；[docs/UPSTREAM.md:19、29](UPSTREAM.md#L19-L29)）。如后续实现，需先定义题面约束、各类雷总数、已开格与终局标记的语义，分别复现“展开拒绝”“标型错误”“未判胜”，再确定改动范围。

### #8：Zig 新版本兼容

- **主源**：[issue 正文](https://github.com/Yueqing-Chen/complexweeper-A-minesweeper-game/issues/8)，无评论。报告者提出 `std.fs.cwd()` 的新版替代及 `**` 运算符可能弃用；这些版本断言在本次未独立验证，不应作为已确认的 Zig 官方变更引用。
- **代码依据**：本地构建使用 `vite build`、类型检查使用 `tsc --noEmit`（[package.json:7–20](../package.json#L7-L20)）；CI 配置 Node 22 并执行 npm 安装、类型检查、测试与构建（[.github/workflows/ci.yml:12–20](../.github/workflows/ci.yml#L12-L20)）。这些执行路径不调用 Zig。
- **结论：上游桌面构建兼容性报告，当前 Web 版不适用。** 本地命令与依赖为 Vite／TypeScript／Vitest（[package.json:7–20](../package.json#L7-L20)），CI 使用 Node 22（[.github/workflows/ci.yml:12–20](../.github/workflows/ci.yml#L12-L20)），同步边界也明确排除桌面构建和 Win32 包装（[docs/UPSTREAM.md:14、35](UPSTREAM.md#L14-L35)）；无需为这条 issue 给 Web 工程增加 Zig 兼容层。

### #3：Web 移植告知

- **主源**：[issue 正文及评论](https://github.com/Yueqing-Chen/complexweeper-A-minesweeper-game/issues/3)。正文由 `miofelix` 告知本 Web fork；两条评论只讨论制作方式，未提出可复现缺陷，也无作者要求修改的回复。
- **结论：项目沟通记录，不是 bug／待移植功能。** 本地 [README.md:14–20](../README.md#L14-L20)已说明 fork、维护者、原作者与同步方式；[docs/ASSETS.md:19–35](ASSETS.md#L19-L35)单列经典素材来源声明。可作为出处依据，不将 issue 中“完整保留／逐位兼容”的自述当成本次测试结果；本次未做完整授权审计。

### #5：移动端移植

- **主源**：[issue 正文与讨论](https://github.com/Yueqing-Chen/complexweeper-A-minesweeper-game/issues/5)是第三方移动端移植告知；评论提供其[多端仓库](https://github.com/Yueqing-Chen/complexweeper-A-minesweeper-game/issues/5#issuecomment-6106613665)、[双曲模式更新](https://github.com/Yueqing-Chen/complexweeper-A-minesweeper-game/issues/5#issuecomment-6121337789)及[2026-10-18 黑白模式更新](https://github.com/Yueqing-Chen/complexweeper-A-minesweeper-game/issues/5#issuecomment-6251258036)。这些是评论者的发布说明，本次未审查其代码或安装包。
- **结论：外部生态信息，不是本 Web 仓库的移动端缺陷。** 本地已有触屏与触控笔操作说明（[README.md:48–58](../README.md#L48-L58)），双曲／黑白功能已有同步记录（[docs/UPSTREAM.md:19–27](UPSTREAM.md#L19-L27)）。关于拼写的[作者 2026-10-11 回复](https://github.com/Yueqing-Chen/complexweeper-A-minesweeper-game/issues/5#issuecomment-6111394979)明确省略 `s` 是命名选择；本地 `Complexweeper`（[src/app/strings.ts:3](../src/app/strings.ts#L3)）无需据此改名。

综合分流：#6／#7 留作规则与体验路线讨论；#8 留给上游桌面工具链维护；#3／#5 归为移植与生态沟通。五条均不能仅因 OPEN 状态列为本 fork 已确认源码 bug。
