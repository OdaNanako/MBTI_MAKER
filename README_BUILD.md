# 如何打包生成 EXE 和 APK

我已经为你配置好了打包所需的所有环境文件。由于当前的云端环境限制（缺少 Windows 编译环境和 Java SDK），你需要在本地电脑上运行以下步骤来生成最终文件。

## 1. 准备工作
首先，通过点击右上角的 **Settings -> Export to ZIP** 将项目下载到你的电脑并解压。

## 2. 生成 Windows (.exe) 文件
1. **安装 Node.js**：确保你的电脑安装了 Node.js。
2. **打开终端**：在项目根目录下打开命令行（CMD 或 PowerShell）。
3. **安装依赖**：运行 `npm install`。
4. **执行打包**：运行 `npm run electron:build`。
5. **获取文件**：打包完成后，生成的 `.exe` 文件将出现在 `dist_electron` 文件夹中。

## 3. 生成安卓 (.apk) 文件
1. **安装 Android Studio**：确保你的电脑安装了 Android Studio 和 Java SDK。
2. **安装依赖**：运行 `npm install`。
3. **同步项目**：运行 `npx cap sync android`。
4. **使用 Android Studio 构建**：
   - 运行 `npx cap open android` 打开 Android Studio。
   - 在 Android Studio 中，点击菜单栏的 **Build > Build Bundle(s) / APK(s) > Build APK(s)**。
5. **获取文件**：构建完成后，点击右下角的 "locate" 即可找到生成的 `.apk` 文件。

---

### 为什么不能直接在网页生成？
- **EXE 打包**：需要 Windows 系统的底层库进行编译。
- **APK 打包**：需要完整的 Android SDK 和 Java 运行环境，这些环境体积巨大，通常不在云端预览环境中预装。

我已经为你写好了所有的配置文件（`electron/main.js`, `capacitor.config.ts`, `package.json`），你只需要在本地运行上述命令即可！
