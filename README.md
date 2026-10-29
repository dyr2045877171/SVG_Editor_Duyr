# SVG Editor CLI

一个使用 TypeScript 实现的命令行 SVG 编辑器，支持创建、读取、编辑和保存 SVG 文档，并提供撤销、重做与图形树查询功能。

设计与架构说明见 [`doc/README.md`](doc/README.md)。

## 环境要求

- Node.js 20 或更高版本
- npm

可以使用下面的命令检查本机环境：

```powershell
node --version
npm --version
```

## 安装依赖

进入项目根目录后执行：

```powershell
npm install
```

首次下载项目或 `package.json`、`package-lock.json` 发生变化后，应重新执行该命令。

## 启动程序

开发和演示时可以直接运行：

```powershell
npm run cli
```

看到下面的提示符即表示启动成功：

```text
svg-editor 0.1 — type 'help' for commands
svg>
```

在 `svg>` 后输入命令并按回车执行。输入 `help` 可以查看命令概要；程序目前没有单独的 `exit` 命令，可以按 `Ctrl+C` 退出。

## 快速示例

下面的命令会创建两个不同颜色的矩形，用一条线连接它们，然后查看图形树并保存文件：

```text
init 600 300
create rect left 50 100 120 70 red
create rect right 400 100 120 70 blue
create line connector 170 135 400 135 black
create text title 210 50 "Two Connected Rectangles"
tree
save demo.svg
```

生成的 `demo.svg` 位于启动程序时所在的项目根目录。也可以使用带引号的路径：

```text
save "output/my diagram.svg"
read "output/my diagram.svg"
```

注意：保存到子目录前，该目录必须已经存在。

## 常用命令

```text
init [width] [height]
read <file.svg>
save [file.svg]
canvas [width] [height]

create rect <id> <x> <y> <width> <height> [fill]
create circle <id> <cx> <cy> <r> [fill]
create ellipse <id> <cx> <cy> <rx> <ry> [fill]
create line <id> <x1> <y1> <x2> <y2> [stroke]
create text <id> <x> <y> <text>
create g <id>
```

在创建图形的命令末尾添加 `in <containerId>`，可以把图形直接放入指定分组，例如：

```text
create g scene
create rect box 10 20 100 60 orange in scene
```

其他编辑与查询命令：

```text
delete <id>
move <id> <dx> <dy>
scale <id> <factor>
set <id> <attribute> <value>
group <newGroupId> <id...>
ungroup <groupId>
addto <groupId> <id>
front <id>
back <id>
tree [id]
show <id>
undo
redo
help
```

图形 `id` 在同一文档中必须唯一，并且区分大小写。含空格的文本或路径应使用双引号包裹；以 `#` 开头的内容会被视为注释。

## 构建与测试

执行 TypeScript 类型检查并把源码编译到 `dist/`：

```powershell
npm run build
```

运行自动化测试：

```powershell
npm test
```


## 项目目录

```text
src/domain/              图形与 SVG 文档领域模型
src/application/         编辑服务、命令和撤销重做
src/infrastructure/svg/  SVG 文件解析与序列化
src/cli/                 命令解析与分发
test/                    自动化测试
doc/README.md            相应的设计架构与过程文档
```
