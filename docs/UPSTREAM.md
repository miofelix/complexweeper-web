# 上游同步记录

上游：[Yueqing-Chen/complexweeper-A-minesweeper-game](https://github.com/Yueqing-Chen/complexweeper-A-minesweeper-game)

最初分叉点：`577750eae65f0832bcf6ffd51e68ef7ebe81f767`（v1.0.12）。

本次同步：`f6b80bb35690ad4498e2e0179353bc8b369a2d70`（v1.3.0，2026-10-21 获取），覆盖上次同步点之后的 4 个提交。

历史同步：

- `80502e5e8b222362cbe86d57588f2c0fbbb11a3f`（v1.2.0，2026-10-08 获取），覆盖其上次同步点之后的 10 个提交。
- `8932be562f9267a288055a0fed996197e709bbe0`（v1.1.3，2026-10-06 获取），覆盖最初分叉点之后的 26 个提交。

本仓库将 Zig + Win32 桌面版重写为 TypeScript Web 版，因此通过移植规则、界面行为与素材同步；Git 的共同祖先仍是最初分叉点。

## 已移植

- v1.0.13：原始六段 WAV 音效，四类踩雷、通关及每整秒计时；Web 添加音效开关，用户操作后解锁浏览器音频。
- v1.1.x：双曲复数模式（j² = 1），有符号提示值 a² − b²，以及推荐展开判据。规则引擎同时保留上游的备选宽松判据 `judge_loose`；界面使用推荐判据。
- v1.1.3 透明图集：双曲数字、±j 雷与旗、j 计雷器以及终局正错标记；图集 PNG/JSON 原样采用上游文件。
- 失败时按真实雷型显示标对/标错的雷，胜利时显示标对/标错的旗，给空格插旗单独显示错误空格。
- 每个模式独立的难度、自定义和纪录菜单；标题固定，雷名随模式变化。
- 玩法和素材文案。
- v1.2.0：模式名称更新为「圆复数模式」和「双曲复数模式（闵可夫斯基模式）」。双曲模式中实雷又称类空雷，双曲虚雷又称类时雷，j 为类时单位；玩法说明补充形式模长（时空间隔）与闵可夫斯基时空度规的灵感来源。
- v1.2.0：声音偏好持久保存，默认开启；关闭时立即停止当前音效。Web 版沿用现有工具条音效开关，并以浏览器 `localStorage` 保存选择，对应上游的注册表偏好。
- v1.3.0：颜色开关，默认彩色；关闭后格子、数字、旗与雷、计雷器、计时器和人脸改用黑白贴图，立即重绘且不影响当前对局。偏好持久保存，对应上游注册表的 `Color` 值；Web 版用工具条「颜色」按钮切换，选择保存在 `localStorage` 的 `complexweeper-web.color.v1`。
- v1.3.0：黑白图集 `素材/图集黑白.png` 原样采用为 `public/assets/atlas-bw.png`，与彩色图集共用槽位表；彩色图集同步上游对 `hnum_49_i` 的像素微调。

圆复数模式继续使用原 `complexweeper-web.scores.v1` 存储键，双曲模式继续使用 `complexweeper-web.scores.hyper.v1`，保留已有纪录。内部模式标识仍为 `complex` / `hyper`。自定义取消不会改变模式；从目标模式菜单应用自定义时会正确切换到该模式。双曲展开规则以 `game.zig` 实际实现为准：旗数相等，且旗帜净和与真雷净和的 |a|、|b| 分别匹配，其中实部为类空部，j 部为类时部。

v1.2.0 没有改变规则实现、图集或音效；当时移植名称、玩法文案及声音偏好，桌面自定义窗口的排版变更按 Web 现有对话框适配。

v1.3.0 没有改变规则实现与音效（`game.zig` 只改了注释），六段 WAV 仍来自 v1.1.3（`8932be5`）。上游构建把黑白图集压成灰度容器 `atlas_bw.bin`；这张图本身就是 8 位灰度 PNG，所有会绘制的槽位都不透明，灰度值与 `atlas_bw.bin` 逐像素一致，因此 Web 版直接绘制原图，无需移植生成步骤。与上游一样，黑白图集缺失或尺寸不符时，关闭颜色仍显示彩色贴图；程序图标保持彩色。

Web 版保留现有触屏/触控笔操作、拖动浏览、模态焦点管理、自定义随机配比、跨标签纪录合并、开局即时胜利判定与 PWA 完整预缓存。桌面构建、自检和 Win32 包装的变更不适用于 Web 运行环境。

## 后续同步

```bash
git fetch upstream --prune
git log --oneline f6b80bb..upstream/main
git diff f6b80bb..upstream/main -- README.md '正式版/src/game.zig' '正式版/src/main.zig' '素材/' '素材说明.md'
```

按这里记录的同步点比较后续变更，移植到对应 TypeScript 模块并更新本记录。当前两张图集原样取自本次同步点：

```bash
git show 'f6b80bb:素材/图集.png' > public/assets/atlas.png
git show 'f6b80bb:素材/图集黑白.png' > public/assets/atlas-bw.png
```

当前音效可从其来源提交重新提取：

```bash
node scripts/extract-sounds.mjs 8932be5
```

验证使用 `npm run typecheck`、`npm test` 和 `npm run build`。构建会把所有图集、WAV 和应用文件列入 PWA 预缓存。
