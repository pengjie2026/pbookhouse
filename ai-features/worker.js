/**
 * 蒲草书屋 AI 功能 Cloudflare Worker
 * 功能：语音合成 + 图片生成
 * 
 * 部署步骤：
 * 1. 安装 Wrangler: npm install -g wrangler
 * 2. 登录: wrangler login
 * 3. 部署: wrangler deploy
 */

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
      // 语音合成 API
      if (path === '/tts') {
        return handleTTS(request, env, corsHeaders);
      }

      // 图片生成 API
      if (path === '/image') {
        return handleImageGen(request, env, corsHeaders);
      }

      // 健康检查
      if (path === '/health') {
        return new Response(JSON.stringify({ status: 'ok', service: 'pugrass-ai' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
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

  if (!response.ok) {
    const error = await response.text();
    return new Response(JSON.stringify({ error }), {
      status: response.status,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const data = await response.json();
  
  // MiniMax 返回的是 hex 编码的音频数据
  if (data.data?.audio) {
    const audioBuffer = Buffer.from(data.data.audio, 'hex');
    return new Response(audioBuffer, {
      headers: {
        ...headers,
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline',
      },
    });
  }
  
  // 如果没有 audio 字段，返回完整响应供调试
  return new Response(JSON.stringify(data), {
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

  if (!response.ok) {
    const error = await response.text();
    return new Response(JSON.stringify({ error }), {
      status: response.status,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const data = await response.json();
  
  // MiniMax 返回格式: { data: { image_base64: ["base64字符串", ...] } }
  const imageBase64 = data.data?.image_base64;
  
  if (imageBase64 && imageBase64.length > 0) {
    return new Response(JSON.stringify({
      created: Date.now(),
      data: imageBase64,
    }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
  
  // 如果没有图片数据，返回完整响应供调试
  return new Response(JSON.stringify(data), {
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}
