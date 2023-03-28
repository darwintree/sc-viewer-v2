# 概览

**注意⚠： 本项目为爱好者交流学习提供帮助，请勿直接或间接将本项目与[官方游戏](https://shinycolors.enza.fun)进行对比。**

[BUG反馈](https://github.com/darwintree/sc-viewer-v2/issues) | [协助开发](https://github.com/darwintree/sc-viewer-v2)

## 基本功能

sc-viewer([https://sc-viewer.top](https://sc-viewer.top)) 被设计为[偶像大师闪耀色彩汉化插件](https://github.com/biuuu/ShinyColors)的翻译前端。同时也可以作为简易的剧情浏览器。目前主要包括以下功能：

- CSV文件翻译前端：提供图形化的翻译编辑界面，进行了移动端适配。可用于进行翻译、校对等工作。
  - 可自由切换文件来源（包括磁盘文件、浏览器历史文件、Github现有翻译等）。
- 历史翻译管理：管理历史翻译。
- Github工作流管理：将翻译文件推送至主翻译仓库。
  - 支持非 working group 成员进行协作。

![ui](img/ui.png)

## 额外功能

此外，为了优化使用体验，集成了部分服务支持了部分额外功能：

- *索引功能*：提供用户友好的翻译入口。
  - 包括当前剧情索引与剧情列表索引（可按照实装时间排序）。
- *语音播放*：预览语音。
- *翻译效果预览*：集成 [ShinyColorsDB-EventViewer
](https://github.com/ShinyColorsDB/ShinyColorsDB-EventViewer) 实现的模拟预览。

> 如果遭到滥用，额外功能会在未来增加访问限制或去除。有相关需求请咨询仓库开发者，请勿进行恶意利用。

![list](img/list.png)
