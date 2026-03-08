# OpenClaw Community 部署指南

## 项目信息
- 项目名称：OpenClaw Community
- 本地路径：`D:\AI application experience\vibe coding\openclaw 社区网页开发`
- 技术栈：Node.js + Express + EJS + SQLite(JSON文件)

## 服务器要求
- 操作系统：Ubuntu 20.04/22.04 LTS
- Node.js版本：v18+ 
- 内存：2GB+
- 端口：3000（可配置）

## 部署步骤

### 1. 连接服务器
```bash
ssh root@服务器IP
```

### 2. 安装Node.js
```bash
# 安装Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node -v
npm -v
```

### 3. 创建项目目录
```bash
mkdir -p /opt/openclaw-community
cd /opt/openclaw-community
```

### 4. 上传项目文件
使用SCP或SFTP上传以下文件：
- app.js
- package.json
- views/ (整个目录)
- public/ (整个目录)
- uploads/ (创建空目录)
- data/ (创建空目录)

### 5. 安装依赖
```bash
npm install
```

### 6. 启动应用
```bash
# 开发模式
npm start

# 或使用PM2守护进程
npm install -g pm2
pm2 start app.js --name openclaw-community
pm2 save
pm2 startup
```

### 7. 配置防火墙
```bash
# 开放3000端口
sudo ufw allow 3000/tcp
sudo ufw reload
```

### 8. 配置Nginx反向代理（可选）
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 访问地址
- 部署后访问：`http://服务器IP:3000`
- 管理员账号：admin@openclaw.community / admin123

## 数据备份
数据库文件位于：`data/db.json`
建议定期备份此文件。

## 故障排查

### 应用无法启动
1. 检查Node.js版本：`node -v`
2. 检查端口占用：`netstat -tlnp | grep 3000`
3. 查看错误日志：`cat app.js` 运行时的控制台输出

### 无法访问
1. 检查防火墙设置：`sudo ufw status`
2. 检查安全组规则（阿里云控制台）
3. 确认应用正在运行：`pm2 status`
