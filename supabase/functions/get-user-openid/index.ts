import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  try {
    // 只接受 POST 请求
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取请求体中的 code
    const { code } = await req.json();

    if (!code) {
      return new Response(JSON.stringify({ error: 'Missing code' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 微信小程序配置
    const appId = 'wxb1fb63721cb2da59';
    const secret = '75c12ae2c42058a2c0834b1b6ab38f0c';

    // 调用微信 API 换取 openid
    const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;

    const wxRes = await fetch(wxUrl);
    const wxData = await wxRes.json();

    if (wxData.errcode && wxData.errcode !== 0) {
      return new Response(JSON.stringify({ error: wxData.errmsg || 'WeChat API error' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 返回 openid
    return new Response(JSON.stringify({
      success: true,
      openid: wxData.openid
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});