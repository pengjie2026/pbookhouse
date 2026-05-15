# 蒲草书屋 - 部署指南

## 🚀 快速开始

你的博客已经**全部准备就绪**：
- ✅ 修复了所有 JavaScript 语法错误
- ✅ 测试通过（前台 + 后台）
- ✅ 初始化了 Git 仓库
- ✅ 清理了不必要的备份文件

现在只需 **5 分钟** 即可发布到互联网。

---

## 📦 第一步：在 GitHub 创建仓库

### 手动创建（推荐新手）
1. 访问 [GitHub.com](https://github.com)
2. 点击右上角 **"+" → "New repository"**
3. 填写信息：
   - **Repository name**: `pugrassbookhouse`（或其他名称）
   - **Description**: 蒲草书屋 - 一个专注于科技、建筑、文学、摄影、艺术的静态博客
   - **选择 Public**（公开）
   - **不要**勾选 "Add a README"（我们已经有了文件）
4. 点击 **"Create repository"**

### 使用命令行（如果你安装了 `gh` CLI）
```bash
# 安装 GitHub CLI（如果没有）
# brew install gh  # macOS
# winget install --id GitHub.cli  # Windows

# 登录 GitHub
gh auth login

# 创建仓库
gh repo create pugrassbookhouse --public --source=. --remote=origin --push
```

---

## 🔗 第二步：连接本地仓库到 GitHub

### A. 如果你**刚刚创建了空仓库**（没有初始化文件）
复制 GitHub 提供的命令，类似：

```bash
git remote add origin https://github.com/你的用户名/pugrassbookhouse.git
git branch -M main
git push -u origin main
```

### B. 如果已经**有了本地仓库**（推荐，我们属于这种情况）

```bash
# 进入项目目录
cd /Users/pengjie/WorkBuddy/20260409111329/pugrassbookhouse

# 添加远程仓库（将【你的用户名】替换为实际的 GitHub 用户名）
git remote add origin https://github.com/【你的用户名】/pugrassbookhouse.git

# 重命名主分支为 main（如果还不是的话）
git branch -M main

# 推送代码
git push -u origin main
```

🔐 **提示**：如果你启用了 **GitHub 双重认证**，需要使用 Personal Access Token：
1. 在 GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 生成新 token，勾选 `repo` 权限
3. 在 URL 中使用：`https://你的用户名:你的token@github.com/你的用户名/pugrassbookhouse.git`

---

## 🌐 第三步：启用 GitHub Pages

仓库创建后，**立即开启 Pages**：

### 图形界面：
1. 进入仓库页面：`github.com/你的用户名/pugrassbookhouse`
2. 点击 **Settings**（设置）
3. 左侧菜单选择 **Pages**
4. **Branch** 选择 `main`，文件夹选择 `/`（根目录）
5. 点击 **Save**

### 命令行（如果你有 `gh` CLI）：
```bash
gh repo edit --enable-pages
gh pages enable --source=main --root=/
```

---

## ⏱ 等待部署完成

- **初次部署** 需要 1-2 分钟
- 刷新 GitHub Pages 页面，直到看到 ✅ **"Your site is published at..."**
- 默认地址：`https://你的用户名.github.io/pugrassbookhouse/`

---

## ✅ 验证部署

### 访问网站：
1. **博客前台**：`https://你的用户名.github.io/pugrassbookhouse/`
2. **管理后台**：`https://你的用户名.github.io/pugrassbookhouse/admin.html`
3. **文章详情**：点击任意文章卡片查看

### 测试功能：
- [x] 导航栏切换
- [x] 分类筛选
- [x] 标签筛选
- [x] 搜索功能（右下角 🔍）
- [x] 管理后台（编辑、新增、删除文章）

---

## ⚡ 高级部署选项

### 方案二：Vercel（更快的全球 CDN）
1. 访问 [Vercel.com](https://vercel.com)，用 GitHub 账号登录
2. 点击 **"Add New Project"**
3. 选择你的仓库 `pugrassbookhouse`
4. **无需配置**，直接点击 **Deploy**
5. 获得免费域名：`pugrassbookhouse.vercel.app`

**优点**：
- 更快的全球访问速度
- 自动 HTTPS
- 每次推送自动重新部署
- 预览部署（每个 Pull Request 生成预览链接）

### 方案三：Cloudflare Pages
1. 访问 [Cloudflare Pages](https://pages.cloudflare.com/)
2. 连接 GitHub 账户
3. 选择仓库，构建命令留空（因为是静态网站）
4. 部署后获得：`pugrassbookhouse.pages.dev`

---

## 🔧 后续维护

### 更新文章
**方法一：使用管理后台（推荐）**
1. 在线访问：`你的域名/admin.html`
2. 编辑、新增、删除文章
3. 点击「保存」，数据将保存在 **浏览器 localStorage**
4. 将更新的 `js/data.js` 文件通过 Git 推送

**方法二：直接编辑数据文件**
1. 本地编辑 `js/data.js`
2. 提交并推送：
   ```bash
   git add js/data.js
   git commit -m "更新文章：XXX"
   git push
   ```
3. GitHub Pages 将自动重新部署

### 自定义域名（可选）
1. 购买域名（阿里云万网、腾讯云 DNSPod）
2. 在 GitHub Pages 设置中添加域名
3. 在域名注册商处配置 CNAME 记录：
   ```
   类型：CNAME
   主机记录：www（或 @）
   记录值：你的用户名.github.io
   ```
4. 等待 DNS 生效（最长 48 小时）

---

## 🚨 常见问题

### Q1：访问显示 "404"？
**原因**：GitHub Pages 尚未部署完成。
**解决**：等待 2 分钟，刷新页面。

### Q2：管理后台打不开？
**原因**：路径错误。
**解决**：确保访问的是 `/admin.html` 完整路径。

### Q3：修改后看不到更新？
**原因**：浏览器缓存。
**解决**：
1. 按 `Ctrl+Shift+R`（Windows）或 `Cmd+Shift+R`（Mac）强制刷新
2. 或在 GitHub Pages 设置中点击 **"Clear cache"**

### Q4：国内访问慢？
**原因**：GitHub 服务器在国外。
**解决**：使用 Vercel 或 Cloudflare Pages，它们有更好的国内 CDN。

### Q5：管理后台没有密码？
**注意**：当前版本管理后台无认证。
**建议**：
1. 仅自己知道后台地址
2. 或添加简单的 HTTP 基础认证
3. 或在本地使用 admin.html

---

## 📚 文件结构说明

```
pugrassbookhouse/
├── index.html          # 博客主页（单页面应用）
├── admin.html          # 管理后台（文章编辑）
├── DEPLOYMENT.md       # 本文件
├── .gitignore          # Git 忽略规则
├── css/
│   ├── style.css       # 博客样式
│   └── admin.css       # 后台样式
├── js/
│   ├── data.js         # 文章数据（已修复所有语法）
│   ├── app.js          # 博客前台逻辑
│   └── admin.js        # 后台管理逻辑
├── assets/             # 图片、图标等资源
└── pages/              # Markdown 页面（关于我们等）
```

---

## 🎉 恭喜！

你的 **蒲草书屋** 现在已经是一个完整的在线博客了。

### 下一步可以做的：
1. **分享链接**：发给朋友或社交媒体
2. **提交收录**：提交到百度站长平台、Google Search Console
3. **添加评论**：集成 Giscus（GitHub Discussions）
4. **添加统计**：Google Analytics 或 百度统计
5. **优化 SEO**：添加更多 meta 标签

如有问题，请参考 [GitHub Pages 官方文档](https://docs.github.com/zh/pages) 或随时咨询。

---
*最后更新：2026-04-10*