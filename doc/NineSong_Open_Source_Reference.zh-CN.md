# NineSong 开源参考说明

来源快照：

- 本文档参考的本地来源：`E:\0_XiangCheng_WorkSpace\0_项目备份\NineSong\README.md`
- 这里是对该开源 README 快照的整理版，目的是让主 README 保持简洁，同时不丢失历史说明。

## 公开仓库状态

按照该开源 README 快照中的说明：

- NineSong 开源仓库已经被声明为冻结在当前公开提交。
- 后端不再作为持续公开更新的开源后端继续推进。
- DockerHub 分发被描述为永久免费。
- 基于 React 的前端应用被描述为计划在 2026 年 4 月左右开始陆续推出。
- NineSong-Desktop 一键可视化安装导向包和 NineSong-Panel 可视化 Docker 面板被描述为后续规划方向。
- NSMusicS-Flutter 被描述为面向 Google Play、App Store、Microsoft Store 的全平台付费应用。

由于这份 README 本身也是历史性的公开快照，上述内容更适合作为“历史公开说明”理解，而不应直接等同于当前必然兑现的实时发布承诺。

## 该 README 中列出的音乐场景已实现能力

该开源 README 明确列出了以下音乐场景增强能力：

- 丰富的单级排序，以及多级混合排序和筛选
- 更深入的复合标签处理
- 搜索跳转优化
- 基于标题、专辑、艺术家、歌词的模糊搜索
- 支持中文拼音与简繁体混合匹配
- 相似结果推荐
- 多种播放风格，例如 cover square、rotate、beaut、base、album-list
- 面向不同音乐文件场景的专属播放模式
- 面向 CUE 的播放与文件管理能力
- CUE 虚拟轨道可视化播放
- 更完整的 TAG 导入能力，包括 `m4a` 和 `cue` 相关音乐镜像工作流
- 基于标签云和兴趣偏好的第一阶段推荐
- 基于用户使用数据的第二阶段轻量推荐

## 该 README 中列出的音乐场景规划

该 README 还列出了以下后续规划方向：

- 双页浏览模式，包含虚拟列表和分页列表
- 服务端与客户端之间的上传、下载与同步
- 标签可视化管理、远程上传、自动关联与手动合并
- 更丰富的标签字段，例如艺人头像、艺人照片、专辑封面、音质版本、歌词版本
- 面向 ISO 的播放与文件管理
- 更高级的音效支持，包括多声道效果与多种 EQ 模式
- 公益在线 TAG API 接入，用于用户自主同步标签
- 基于音乐知识图谱的第三阶段推荐
- 结合 LLM 的第四阶段推荐

## 该 README 中的 Docker 部署说明

该开源 README 中描述的公开 Docker 部署方式如下：

1. 从 NineSong releases 页面下载压缩包：
   https://github.com/Super-Badmen-Viper/NineSong/releases/
2. 将 `.env` 与 `docker-compose.yaml` 放在同一目录。
3. 按需要自定义卷映射，尤其是音乐库目录映射。
4. 运行：

```sh
docker compose up -d
```

该 README 中列出的默认登录信息：

- 登录邮箱：`admin@gmail.com`
- 登录密码：`admin123`

其中还特别说明：

- 更新镜像版本后，媒体库中的临时生成资源，例如专辑封面，可能会被清除。
- 需要重新扫描媒体库来再生成这些临时资源。
- 彻底重装 NineSong 时，需要连同 Docker 卷数据一起清理。

## 该 README 中的本地调试说明

该 README 还给出了以下本地调试提示：

- 修改 `.env` 中的配置，例如：
  - `DB_HOST=localhost`
  - `DB_PORT=27017`
- 如果本地 MongoDB 卷数据尚未准备好，先修改 `docker-compose-local-windows.ps1` 中的卷路径。
- 然后运行本地 Windows docker-compose 脚本，等待卷目录初始化。
- 安装 `air`：

```sh
go install github.com/air-verse/air@latest
```

- 然后运行：

```sh
air
```

此外还提到可以导入 `NineSong API.postman_collection.json` 进行 Postman 调试。

## 社区与附加信息

该开源 README 中列出了：

- QQ 群 1：已满
- QQ 群 2：`610551734`

如果你需要查看当时的原始完整表述，请直接打开上面的本地来源 README。
