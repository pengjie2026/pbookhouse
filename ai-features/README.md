# 蒲草书屋 AI 功能部署指南

## 功能说明

本目录包含两个 AI 功能：
1. **语音朗读 (TTS)** - 将文字转为语音
2. **AI 配图生成** - 根据描述生成图片

## 部署步骤

### 第一步：安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 第二步：登录 Cloudflare

```bash
wrangler login
```
浏览器会打开，按提示授权即可。

### 第三步：设置 API Key

```bash
cd ai-features
wrangler secret put MINIMAX_API_KEY
```

当提示输入时，粘贴你的 MiniMax API Key：
```
sk-api-rEQ_lCiNix7JQns2s90vaciOmI0f4aL7N2vVhFcryEGFYImy7oFMUIKk724G__UJRw8f0GG_-3v5c80mE96BtSVGKHyN-NcvJnF5rK83d1Pyx1I4SoMx7uw
```

### 第四步：部署 Worker

```bash
wrangler deploy
```

部署成功后会显示 Worker URL，例如：
```
https://pugrass-ai.你的账号.workers.dev
```

### 第五步：访问 AI 工具箱

打开浏览器访问：
```
https://你的用户名.github.io/pbookhouse/ai-features/index.html
```

或在本地预览：
```bash
wrangler dev
# 然后访问 http://localhost:8787
```

## 使用方法

1. 打开 AI 工具箱页面
2. 在顶部输入框填入你的 Worker 地址
3. 点击对应功能的按钮即可使用

## API 接口

### 健康检查
```
GET /health
```

### 语音合成
```
POST /tts
Content-Type: application/json

{
  "text": "要朗读的文字",
  "voice_id": "female-qn-qingxin",  // 可选音色
  "speed": 1.0                       // 可选语速
}
```

### 图片生成
```
POST /image
Content-Type: application/json

{
  "prompt": "图片描述",
  "model": "image-01",
  "style": "natural"  // natural | anime | flat_illustration
}
```

## 费用说明

- **Cloudflare Workers**: 每天 100,000 请求免费
- **MiniMax API**: 按实际调用量计费
  - TTS: ~¥0.1/千字
  - 图片生成: ~¥0.1/张

## 注意事项

1. 请妥善保管 API Key，不要泄露给他人
2. 建议设置 API 限额避免意外超支
3. Worker 地址变更后需重新保存到本地配置
