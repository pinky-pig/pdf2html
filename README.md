# PDF文件转HTML

PDF文件转HTML，并且可以直接在浏览器中查看

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

## Tech Stack

### Backend
- FastAPI
- SQLAlchemy
- JWT Authentication
- SQLite (can be configured for PostgreSQL, MySQL)

### Frontend
- React
- TypeScript
- Tailwind CSS

```bash
cd backend
```

```bash
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```


```bash
pip install -r requirements.txt
```

```bash
python main.py
```

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```
