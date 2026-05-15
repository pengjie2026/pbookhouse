/**
 * 蒲草书屋 AI 功能 Cloudflare Worker
 * 功能：语音合成 + 图片生成 + 文本生成
 * 版本: 1.0.2
 * 
 * 部署步骤：
 * 1. 安装 Wrangler: npm install -g wrangler
 * 2. 登录: wrangler login
 * 3. 部署: wrangler deploy
 */

const VERSION = '1.0.3';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS 头
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 处理 OPTIONS 请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 获取版本号
      if (path === '/version') {
        return new Response(JSON.stringify({ version: VERSION }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 语音合成 API
      if (path === '/tts') {
        return await handleTTS(request, env, corsHeaders);
      }

      // 图片生成 API
      if (path === '/image') {
        return await handleImageGen(request, env, corsHeaders);
      }

      // 文本生成 API (AI 写作优化)
      if (path === '/text') {
        return await handleTextGen(request, env, corsHeaders);
      }

      // 健康检查
      if (path === '/health') {
        return new Response(JSON.stringify({ 
          status: 'ok', 
          service: 'pugrass-ai',
          version: VERSION 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 调试接口 - 查看原始 API 响应
      if (path === '/debug/tts') {
        return await debugTTS(request, env, corsHeaders);
      }

      if (path === '/debug/image') {
        return await debugImage(request, env, corsHeaders);
      }

      return new Response(`Pugrass AI v${VERSION}\nTry /health, /tts, /image, or /text`, { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};

/**
 * 语音合成 - Text-to-Speech
 */
async function handleTTS(request, env, headers) {
  const { text, voice_id = 'Chinese (Mandarin)_Lyrical_Voice', speed = 1.0 } = await request.json();

  if (!text) {
    return new Response(JSON.stringify({ error: 'text is required' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const response = await fetch('https://api.minimaxi.com/v1/t2a_v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.MINIMAX_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'speech-2.6-hd',
      text: text,
      stream: false,
      voice_setting: {
        voice_id: voice_id,
        speed: speed,
        vol: 1.0,
        pitch: 0,
      },
      audio_setting: {
        sample_rate: 32000,
        bitrate: 128000,
        format: 'mp3',
      },
    }),
  });

  // 获取原始响应类型
  const contentType = response.headers.get('content-type') || '';
  
  // 如果返回的是音频二进制数据（不是 JSON）
  if (!contentType.includes('application/json')) {
    const audioBuffer = await response.arrayBuffer();
    if (audioBuffer.byteLength > 100) {
      return new Response(audioBuffer, {
        headers: {
          ...headers,
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': 'inline',
        },
      });
    }
    // 如果太小，返回调试信息
    return new Response(JSON.stringify({
      error: 'Audio too small',
      size: audioBuffer.byteLength,
      contentType: contentType
    }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  // 尝试解析 JSON
  const data = await response.json();
  console.log('TTS Response:', JSON.stringify(data));

  // 情况1: 直接返回二进制音频（某些端点）
  if (data instanceof ArrayBuffer || data.byteLength) {
    return new Response(data, {
      headers: {
        ...headers,
        'Content-Type': 'audio/mpeg',
      },
    });
  }

  // 情况2: MiniMax 返回格式 - 检查不同的可能字段
  // 可能格式: { data: { audio: "hex..." } } 或 { data: { audio_url: "..." } }
  const audioHex = data.data?.audio || data.audio || data.data?.audio_hex;
  const audioUrl = data.data?.audio_url || data.audio_url;
  const audioBase64 = data.data?.audio_base64 || data.audio_base64;

  if (audioHex) {
    try {
      const audioBuffer = Buffer.from(audioHex, 'hex');
      if (audioBuffer.length > 100) {
        return new Response(audioBuffer, {
          headers: {
            ...headers,
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': 'inline',
          },
        });
      }
    } catch (e) {
      return new Response(JSON.stringify({ 
        error: 'Failed to decode hex audio',
        details: e.message,
        rawData: String(data).substring(0, 500)
      }), {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }
  }

  if (audioUrl) {
    // 如果返回的是 URL，下载并返回音频
    const audioResponse = await fetch(audioUrl);
    const audioBuffer = await audioResponse.arrayBuffer();
    return new Response(audioBuffer, {
      headers: {
        ...headers,
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline',
      },
    });
  }

  if (audioBase64) {
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    if (audioBuffer.length > 100) {
      return new Response(audioBuffer, {
        headers: {
          ...headers,
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': 'inline',
        },
      });
    }
  }

  // 如果没有音频数据，返回完整响应供调试
  return new Response(JSON.stringify({
    debug: true,
    responseKeys: Object.keys(data),
    dataKeys: data.data ? Object.keys(data.data) : [],
    fullResponse: data
  }), {
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

/**
 * 图片生成 - Text-to-Image
 */
async function handleImageGen(request, env, headers) {
  const { prompt, model = 'image-01' } = await request.json();

  if (!prompt) {
    return new Response(JSON.stringify({ error: 'prompt is required' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const response = await fetch('https://api.minimaxi.com/v1/image_generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.MINIMAX_API_KEY}`,
    },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      aspect_ratio: '1:1',
      response_format: 'base64',
    }),
  });

  // 检查是否直接返回二进制图片
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const imageBuffer = await response.arrayBuffer();
    if (imageBuffer.byteLength > 1000) {
      // 返回 base64 编码的图片
      const base64 = Buffer.from(imageBuffer).toString('base64');
      return new Response(JSON.stringify({
        data: [base64]
      }), {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }
  }

  const data = await response.json();
  console.log('Image Response:', JSON.stringify(data));

  // 检查 MiniMax 可能的返回格式
  const imageBase64 = data.data?.image_base64 || data.image_base64;
  const imageUrl = data.data?.image_url || data.image_url;
  const imageUrlList = data.data?.image_url_list || data.image_url_list;

  if (imageBase64 && Array.isArray(imageBase64)) {
    return new Response(JSON.stringify({
      created: Date.now(),
      data: imageBase64,
    }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  // 如果有 URL，尝试下载图片
  const urlToFetch = imageUrl || (imageUrlList && imageUrlList[0]);
  if (urlToFetch) {
    try {
      const imgResponse = await fetch(urlToFetch);
      const imgBuffer = await imgResponse.arrayBuffer();
      const base64 = Buffer.from(imgBuffer).toString('base64');
      return new Response(JSON.stringify({
        created: Date.now(),
        data: [base64],
        original_url: urlToFetch
      }), {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    } catch (e) {
      return new Response(JSON.stringify({
        error: 'Failed to fetch image from URL',
        url: urlToFetch,
        details: e.message
      }), {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }
  }

  // 返回调试信息
  return new Response(JSON.stringify({
    debug: true,
    responseKeys: Object.keys(data),
    dataKeys: data.data ? Object.keys(data.data) : [],
    fullResponse: data
  }), {
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

/**
 * 文本生成 - AI 写作优化
 */
async function handleTextGen(request, env, headers) {
  // Token Plan 支持的模型: MiniMax-M2.7, MiniMax-M2.5
  const { prompt, model = 'MiniMax-M2.7' } = await request.json();

  if (!prompt) {
    return new Response(JSON.stringify({ error: 'prompt is required' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const response = await fetch('https://api.minimaxi.com/v1/text/chatcompletion_v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.MINIMAX_API_KEY}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      tokens_to_generate: 500,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  console.log('Text Response:', JSON.stringify(data));

  // 提取回复内容 - M2.7 使用 OpenAI兼容格式
  // 优先级: choices > text (M2.7 的 text 字段可能为空)
  let text = '';
  
  // 方式1: choices[].messages[].content (标准 OpenAI 格式)
  const choices = data.choices;
  if (choices && choices.length > 0) {
    const choice = choices[0];
    text = choice?.messages?.[0]?.content || 
           choice?.message?.content ||
           choice?.text || '';
  }
  
  // 方式2: 如果 choices 为空，尝试直接字段
  if (!text) {
    text = data.text || data.response || data.output || '';
  }
  
  return new Response(JSON.stringify({
    text: text,
    model: data.model || model,
    usage: data.usage,
    debug: !text ? { responseKeys: Object.keys(data), choices: data.choices } : undefined
  }), {
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

/**
 * 调试接口 - TTS 原始响应
 */
async function debugTTS(request, env, headers) {
  const { text = '你好，这是测试音频', voice_id = 'Chinese (Mandarin)_Lyrical_Voice' } = await request.json();

  const response = await fetch('https://api.minimaxi.com/v1/t2a_v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.MINIMAX_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'speech-2.6-hd',
      text: text,
      stream: false,
      voice_setting: {
        voice_id: voice_id,
        speed: 1.0,
        vol: 1.0,
        pitch: 0,
      },
      audio_setting: {
        sample_rate: 32000,
        bitrate: 128000,
        format: 'mp3',
      },
    }),
  });

  const contentType = response.headers.get('content-type');
  const bodyText = await response.text();
  
  return new Response(JSON.stringify({
    status: response.status,
    contentType: contentType,
    bodyLength: bodyText.length,
    bodyPreview: bodyText.substring(0, 500),
    bodyPreviewHex: bodyText.substring(0, 200),
  }), {
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

/**
 * 调试接口 - 图片生成原始响应
 */
async function debugImage(request, env, headers) {
  const { prompt = '一只可爱的熊猫', model = 'image-01' } = await request.json();

  const response = await fetch('https://api.minimaxi.com/v1/image_generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.MINIMAX_API_KEY}`,
    },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      aspect_ratio: '1:1',
      response_format: 'base64',
    }),
  });

  const contentType = response.headers.get('content-type');
  const bodyText = await response.text();
  
  return new Response(JSON.stringify({
    status: response.status,
    contentType: contentType,
    bodyLength: bodyText.length,
    bodyPreview: bodyText.substring(0, 1000),
  }), {
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}
