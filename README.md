# PDF文件转HTML

PDF文件转HTML，并且可以直接在浏览器中查看

## 技术栈

### Backend
- FastAPI
- Redis
- Pdf2HtmlEx

### Frontend
- React
- TypeScript
- Tailwind CSS

## 开始

### 后端设置

1. 进入目录
```bash
cd backend
```

2. 创建虚拟环境
```bash
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```

3. 安装依赖
```bash
pip install -r requirements.txt
```

4. docker 启动 redis
目的是任务状态管理，也可以不用 redis ，写一个存内存中也行。
```
docker run -d --name redis -p 6379:6379 redis
```

5. 安装 pdf2htmlEX
```
docker pull pdf2htmlex/pdf2htmlex:0.18.8.rc2-master-20200820-ubuntu-20.04-x86_64
```

6. 启动服务
```bash
python main.py
```

访问地址：
http://localhost:8000

### 前端

1. 进入目录
```bash
cd frontend
```

2. 安装依赖
```bash
pnpm install
```

3. 启动服务
```bash
pnpm dev
```
访问地址：
http://localhost:5173


## API 文档

后端起来之后，访问 API 文档地址：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc


### 构建

构建镜像的时候，将 pdf2htmlEX 作为基础镜像，安装 python 和 pip ，安装依赖，启动服务。
不过 pdf2htmlEX 基础镜像

```bash
# 构建并运行
docker compose -f 'docker-compose.yml' up -d --build 

# 压缩发给别人
docker save -o pdf2html-web.tar.gz pdf2html-web
docker save -o redis-alpine.tar.gz redis-alpine

# 别人运行
docker load -i < pdf2html-web.tar.gz
docker load -i < redis-alpine.tar.gz
docker compose -f docker-compose-run.yml up -d
```

## 爬坑

> https://github.com/pdf2htmlEX/pdf2htmlEX/issues/80

1. 拉取 pdf2htmlEX docker 镜像，找不到资源

解决：
```bash
docker pull pdf2htmlex/pdf2htmlex:0.18.8.rc2-master-20200820-ubuntu-20.04-x86_64
```

2. 拉取后，无法运行

解决：
```bash
# 使用 --platform linux/amd64 指定平台，并进入容器
docker run -it --rm --platform linux/amd64 \
  -v $(pwd):/mnt \
  --entrypoint sh \
  pdf2htmlex/pdf2htmlex:0.18.8.rc2-master-20200820-ubuntu-20.04-x86_64

# 进入容器后，确认目录挂载正确
cd /mnt
# 查看目录
ls
# 运行命令
pdf2htmlEX --zoom 1.3 paper.pdf
```

3. 读取处理后，无法写入。
不指定输出路径，使用 --mount 。

解决：
```bash
docker run -ti --rm --mount src="$(pwd)",target=/pdf,type=bind pdf2htmlex/pdf2htmlex:0.18.8.rc2-master-20200820-ubuntu-20.04-x86_64 --zoom 1.3 paper.pdf
```

参数：

```
docker run -ti --rm --mount src="$(pwd)",target=/pdf,type=bind pdf2htmlex/pdf2htmlex:0.18.8.rc2-master-20200820-ubuntu-20.04-x86_64 --zoom 1.3 test.pdf
```

| 参数                     | 短参数 | 作用                                                                 | 默认值        |
| ------------------------ | ------ | -------------------------------------------------------------------- | ------------- |
| `--first-page`           | `-f`   | 指定要转换的首个页面                                                   | 1             |
| `--last-page`            | `-l`   | 指定要转换的最后一个页面                                               | 2147483647    |
| `--zoom`                 |        | 缩放比例                                                             |               |
| `--fit-width`            |        | 将宽度调整为指定的像素值                                               |               |
| `--fit-height`           |        | 将高度调整为指定的像素值                                               |               |
| `--use-cropbox`          |        | 使用 CropBox 代替 MediaBox 作为页面尺寸                               | 1             |
| `--dpi`                  |        | 图形的分辨率，单位为 DPI                                               | 144           |
| `--embed`                |        | 指定要嵌入到输出 HTML 中的元素 (css, font, image, javascript, outline) |               |
| `--embed-css`            |        | 是否将 CSS 文件嵌入到输出 HTML 中                                     | 1             |
| `--embed-font`           |        | 是否将字体文件嵌入到输出 HTML 中                                     | 1             |
| `--embed-image`          |        | 是否将图像文件嵌入到输出 HTML 中                                     | 1             |
| `--embed-javascript`     |        | 是否将 JavaScript 文件嵌入到输出 HTML 中                               | 1             |
| `--embed-outline`        |        | 是否将文档大纲（书签）嵌入到输出 HTML 中                               | 1             |
| `--split-pages`          |        | 是否将每一页分割成单独的 HTML 文件                                     | 0             |
| `--dest-dir`             |        | 指定输出文件的目标目录                                                 | "."           |
| `--css-filename`         |        | 生成的 CSS 文件的名称                                                  | ""            |
| `--page-filename`        |        | 分割页面的文件名模板                                                   | ""            |
| `--outline-filename`     |        | 生成的大纲文件的名称                                                   | ""            |
| `--process-nontext`      |        | 是否渲染文本之外的图形元素                                             | 1             |
| `--process-outline`      |        | 是否在 HTML 中显示文档大纲                                             | 1             |
| `--process-annotation`   |        | 是否在 HTML 中显示注释                                                 | 0             |
| `--process-form`         |        | 是否包含文本字段和单选按钮等表单元素                                   | 0             |
| `--printing`             |        | 是否启用打印支持                                                       | 1             |
| `--fallback`             |        | 是否以回退模式输出 HTML                                               | 0             |
| `--tmp-file-size-limit`  |        | 临时文件的最大大小（KB），-1 表示无限制                                | -1            |
| `--embed-external-font`  |        | 是否嵌入外部字体的本地匹配项                                           | 1             |
| `--font-format`          |        | 嵌入字体文件的后缀名 (ttf,otf,woff,svg)                                | "woff"        |
| `--decompose-ligature`   |        | 是否分解连字，例如 ﬁ 转换为 fi                                         | 0             |
| `--turn-off-ligatures`   |        | 是否显式告知浏览器不要使用连字                                         | 0             |
| `--auto-hint`            |        | 是否对没有 hinting 信息的字体使用 FontForge 自动 hinting              | 0             |
| `--external-hint-tool`   |        | 用于 hinting 字体的外部工具（覆盖 `--auto-hint`）                      | ""            |
| `--stretch-narrow-glyph` |        | 是否拉伸窄字形而不是填充它们                                           | 0             |
| `--squeeze-wide-glyph`   |        | 是否缩小宽字形而不是截断它们                                           | 1             |
| `--override-fstype`      |        | 是否清除 TTF/OTF 字体中的 fstype bits                                | 0             |
| `--process-type3`        |        | 是否转换 Type 3 字体以用于 Web（实验性功能）                           | 0             |
| `--heps`                 |        | 合并文本的水平阈值，以像素为单位                                       | 1             |
| `--veps`                 |        | 合并文本的垂直阈值，以像素为单位                                       | 1             |
| `--space-threshold`      |        | 字间距的阈值（阈值 * em）                                             | 0.125         |
| `--font-size-multiplier` |        | 大于 1 的值会提高渲染精度                                             | 4             |
| `--space-as-offset`      |        | 是否将空格字符视为偏移量                                               | 0             |
| `--tounicode`            |        | 如何处理 ToUnicode CMaps (0=自动, 1=强制, -1=忽略)                       | 0             |
| `--optimize-text`        |        | 是否尝试减少用于文本的 HTML 元素数量                                   | 0             |
| `--correct-text-visibility`|        | 0: 不进行文本可见性检查。1: 处理完全遮挡的文本。2: 处理部分遮挡的文本         | 1             |
| `--covered-text-dpi`     |        | 当 correct-text-visibility == 2 且页面上有部分遮挡文本时使用的渲染 DPI | 300           |
| `--bg-format`            |        | 指定背景图像格式                                                       | "png"         |
| `--svg-node-count-limit` |        | 如果 SVG 背景图像中的节点数超过此限制，则此页面回退到使用位图背景；负值表示无限制 | -1            |
| `--svg-embed-bitmap`     |        | 1: 将位图嵌入到 SVG 背景中；0: 如果可能，将位图转储到外部文件           | 1             |
| `-o,--owner-password`    | `-o`   | 所有者密码（用于加密文件）                                             |               |
| `-u,--user-password`     | `-u`   | 用户密码（用于加密文件）                                               |               |
| `--no-drm`               |        | 是否覆盖文档的 DRM 设置                                                | 0             |
| `--clean-tmp`            |        | 转换后是否删除临时文件                                                 | 1             |
| `--tmp-dir`              |        | 指定临时目录的位置                                                     | "/tmp"        |
| `--data-dir`             |        | 指定数据目录                                                           | "/usr/local/share/pdf2htmlEX" |
| `--poppler-data-dir`     |        | 指定 Poppler 数据目录                                                  | "/usr/local/share/pdf2htmlEX/poppler" |
| `--debug`                |        | 是否打印调试信息                                                       | 0             |
| `--proof`                |        | 为了校对，文本会同时绘制在文本层和背景上                               | 0             |
| `--quiet`                |        | 是否静默执行操作                                                       | 0             |
| `-v,--version`           | `-v`   | 打印版权和版本信息                                                     |               |
| `-h,--help`              | `-h`   | 打印帮助信息                                                         |               |