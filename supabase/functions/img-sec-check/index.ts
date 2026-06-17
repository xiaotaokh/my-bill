import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const APP_ID = 'wxb1fb63721cb2da59';
const APP_SECRET = '75c12ae2c42058a2c0834b1b6ab38f0c';

const JSON_HEADERS = {
  'Content-Type': 'application/json'
};

async function getAccessToken() {
  const tokenUrl = `https://api.weixin.qq.com/cgi-bin/stable_token`;
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({
      grant_type: 'client_credential',
      appid: APP_ID,
      secret: APP_SECRET,
      force_refresh: false
    })
  });

  const data = await response.json();
  if (!response.ok || data.errcode) {
    throw new Error(`获取 access_token 失败: ${data.errmsg || '未知错误'}`);
  }

  return data.access_token;
}

async function callImgSecCheck(file: File) {
  const accessToken = await getAccessToken();
  const url = `https://api.weixin.qq.com/wxa/img_sec_check?access_token=${accessToken}`;

  const formData = new FormData();
  formData.append('media', file, file.name || 'image.jpg');

  const response = await fetch(url, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`图片安全校验请求失败: ${data.errmsg || '未知错误'}`);
  }

  return data;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: JSON_HEADERS
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return new Response(JSON.stringify({
        ok: false,
        errCode: -1,
        errMsg: '缺少图片文件'
      }), {
        status: 400,
        headers: JSON_HEADERS
      });
    }

    const result = await callImgSecCheck(file);
    const errCode = typeof result.errcode !== 'undefined' ? result.errcode : 0;
    const errMsg = result.errmsg || '';

    return new Response(JSON.stringify({
      ok: errCode === 0,
      errCode,
      errMsg,
      result
    }), {
      status: 200,
      headers: JSON_HEADERS
    });
  } catch (error) {
    return new Response(JSON.stringify({
      ok: false,
      errCode: -1,
      errMsg: error instanceof Error ? error.message : '服务器错误'
    }), {
      status: 500,
      headers: JSON_HEADERS
    });
  }
});
