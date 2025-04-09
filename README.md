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
