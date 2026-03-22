# NSMusicS Electron 开发说明

本文档恢复了旧版工作区 README 中原来直接放在首页里的更详细本地开发说明。

## 基础环境

旧版工作区 README 中建议的基线环境：

- Node.js：`20.15.0`
- npm：`10.4.0`

安装依赖：

```sh
cd NSMusicS\NSMusicS-Electron
npm install
```

或者：

```sh
cd NSMusicS\NSMusicS-Electron
cnpm install
```

## MPV 安装

桌面播放场景需要单独安装 MPV：

- MPV 安装地址：https://mpv.io/installation/

旧版工作区中记录的解压目标路径：

- Windows：`NSMusicS\NSMusicS-Electron\resources\mpv-x86_64-20241124`
- macOS：`NSMusicS\NSMusicS-Electron\resources\mpv-x86_64-20241124`

## better-sqlite3 处理方案

旧版工作区 README 原来记录了两种处理方式。

### 方法 A：手动替换二进制

在原先文档里，这种方式被作为推荐路径，前提是本地 Node 版本与项目预期一致。

1. 删除：

```text
NSMusicS\NSMusicS-Electron\node_modules\better-sqlite3\build\Release\better_sqlite3.node
```

2. 从下列目录中复制匹配平台的二进制文件：

```text
NSMusicS\NSMusicS-Electron\resources\node\win
NSMusicS\NSMusicS-Electron\resources\node\linux
NSMusicS\NSMusicS-Electron\resources\node\macos
```

3. 粘贴到：

```text
NSMusicS\NSMusicS-Electron\node_modules\better-sqlite3\build\Release
```

### 方法 B：使用 electron-rebuild

```sh
cd NSMusicS/NSMusicS-Electron/node_modules/better-sqlite3
npm install electron-rebuild -D
```

然后在 `better-sqlite3/package.json` 中加入：

```json
"rebuild": "electron-rebuild -f -w better-sqlite3"
```

再运行：

```sh
npm run rebuild
```

## 运行与构建

运行开发模式：

```sh
cd NSMusicS\NSMusicS-Electron
npm run dev
```

构建桌面安装包：

```sh
cd NSMusicS\NSMusicS-Electron
npm run build
```
