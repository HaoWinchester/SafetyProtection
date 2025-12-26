# Docker镜像拉取问题解决方案

## 问题原因

错误信息: `Error response from daemon: Get "https://registry-1.docker.io/v2/": net/http: request canceled while waiting for connection`

这是因为Docker无法连接到Docker Hub,通常由于:
1. 网络问题
2. Docker Hub在国内访问受限
3. 防火墙或代理设置

---

## 解决方案

### 方案1: 配置Docker镜像加速器 (推荐)

#### Windows - Docker Desktop

1. **打开Docker Desktop**
   - 右键点击任务栏的Docker图标
   - 选择"Settings" (设置)

2. **配置Docker Engine**
   - 在左侧菜单选择 "Docker Engine"
   - 在配置文件中添加以下内容:

```json
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://docker.1panel.live",
    "https://hub.rat.dev"
  ],
  "dns": ["8.8.8.8", "114.114.114.114"]
}
```

3. **应用并重启**
   - 点击 "Apply & restart"
   - 等待Docker重启

4. **验证配置**
   ```bash
   docker info
   ```
   查看输出中是否包含 "Registry Mirrors"

#### Linux - 配置daemon.json

1. **编辑配置文件**
   ```bash
   sudo nano /etc/docker/daemon.json
   ```

2. **添加以下内容**
   ```json
   {
     "registry-mirrors": [
       "https://docker.m.daocloud.io",
       "https://docker.1panel.live",
       "https://hub.rat.dev"
     ]
   }
   ```

3. **重启Docker**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart docker
   ```

---

### 方案2: 手动拉取镜像

如果配置镜像加速器后仍有问题,可以尝试手动拉取:

```bash
# 尝试从不同镜像源拉取
docker pull postgres:15-alpine
docker pull redis:7-alpine
```

---

### 方案3: 使用代理 (如果有的话)

如果使用代理,可以在Docker Desktop中配置:

1. Docker Desktop -> Settings -> Resources -> Proxies
2. 启用手动代理配置
3. 输入代理地址和端口

---

### 方案4: 暂时跳过Docker,使用本地安装

如果Docker问题持续存在,可以先手动安装数据库服务,然后启动应用:

#### 安装PostgreSQL

1. **下载PostgreSQL**
   - 访问: https://www.postgresql.org/download/windows/
   - 下载并安装PostgreSQL 15

2. **创建数据库**
   ```sql
   -- 使用pgAdmin或psql
   CREATE DATABASE safety_detection_db;
   CREATE USER safety_user WITH PASSWORD 'safety_pass_2024';
   GRANT ALL PRIVILEGES ON DATABASE safety_detection_db TO safety_user;
   ```

#### 安装Redis

1. **下载Redis for Windows**
   - 下载: https://github.com/microsoftarchive/redis/releases
   - 或使用WSL2安装Linux版Redis

2. **启动Redis**
   ```bash
   redis-server
   ```

#### 启动后端

```bash
cd "D:\幻谱AI研究院\产品\大模型安全检测工具\安全检测项目\backend"

# 激活虚拟环境
venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
# 编辑 .env 文件,设置:
# DATABASE_URL=postgresql://safety_user:safety_pass_2024@localhost:5432/safety_detection_db
# REDIS_URL=redis://:redis_pass_2024@localhost:6379/0

# 初始化数据库
python -m app.db.init_db

# 启动后端
uvicorn app.main:app --reload --port 8000
```

#### 启动前端

```bash
cd "D:\幻谱AI研究院\产品\大模型安全检测工具\安全检测项目\frontend"

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

---

## 验证步骤

### 配置镜像加速器后验证

1. **测试拉取镜像**
   ```bash
   docker pull postgres:15-alpine
   docker pull redis:7-alpine
   ```

2. **如果成功,启动服务**
   ```bash
   cd "D:\幻谱AI研究院\产品\大模型安全检测工具\安全检测项目"
   docker-compose -f docker-compose-simple.yml up -d
   ```

3. **查看服务状态**
   ```bash
   docker-compose ps
   ```

---

## 常用国内Docker镜像加速器

以下是国内常用的镜像加速器(建议配置多个):

1. DaoCloud: `https://docker.m.daocloud.io`
2. 1Panel: `https://docker.1panel.live`
3. Rat: `https://hub.rat.dev`
4. Chenby: `https://docker.chenby.cn`
5. AWSL: `https://docker.awsl9527.cn`

---

## 如果所有方案都失败

可以暂时使用本地安装的方式(方案4),先运行项目:

1. 安装PostgreSQL和Redis
2. 配置环境变量
3. 手动启动后端和前端

虽然步骤多一些,但可以绕过Docker的网络问题。

---

## 推荐操作顺序

1. **首先尝试**: 配置Docker镜像加速器 (方案1)
2. **如果失败**: 手动拉取镜像测试 (方案2)
3. **如果仍失败**: 使用本地安装 (方案4)

---

## 需要帮助?

如果以上方案都无法解决问题,请检查:
- 网络连接是否正常
- 防火墙是否阻止了Docker
- 是否使用了公司网络(可能有特殊限制)
- Docker Desktop是否正常运行

祝您顺利启动项目! 🚀
