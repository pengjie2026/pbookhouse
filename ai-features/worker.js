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
  const { text, voice_id = 'male-qn-qingse', speed = 1.0 } = await request.json();

  if (!text) {
    return new Response(JSON.stringify({ error: 'text is required' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const response = await fetch('https://api.minimax.chat/v1/t2a_v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.MINIMAX_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'speech-2.8-HD',
      text: text,
      stream: false,
      voice_setting: {
        voice_id: voice_id,
        speed: speed,
        vol: 1.0,
        pitch: 0,
        emotion: 'calm',
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

  // 返回音频数据
  const audioBuffer = await response.arrayBuffer();
  return new Response(audioBuffer, {
    headers: {
      ...headers,
      'Content-Type': 'audio/mp3',
      'Content-Disposition': 'inline',
    },
  });
}

/**
 * 图片生成 - Text-to-Image
 */
async function handleImageGen(request, env, headers) {
  const { prompt, model = 'image-01', style = 'natural' } = await request.json();

  if (!prompt) {
    return new Response(JSON.stringify({ error: 'prompt is required' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const response = await fetch('https://api.minimax.chat/v1/image_generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.MINIMAX_API_KEY}`,
    },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      image_size: '1:1',
      style: style, // natural | anime | flat_illustration
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
  
  // 返回生成的图片 URL
  return new Response(JSON.stringify({
    created: Date.now(),
    data: data.data || [],
  }), {
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}
