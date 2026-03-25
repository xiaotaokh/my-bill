// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 和风天气 API Key
const WEATHER_API_KEY = '01d7c36f2c944e0592fb1032e7a382a1';

// 云函数入口函数
exports.main = async (event, context) => {
  const { latitude, longitude } = event;

  console.log('收到请求:', { latitude, longitude });

  if (!latitude || !longitude) {
    return { success: false, error: '缺少位置参数' };
  }

  const location = `${longitude},${latitude}`;

  try {
    const https = require('https');
    const zlib = require('zlib');

    // 封装 HTTPS 请求（支持 gzip）
    const fetch = (url) => new Promise((resolve, reject) => {
      https.get(url, {
        headers: {
          'Accept': 'application/json'
        }
      }, (res) => {
        let data = '';
        const chunks = [];

        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          try {
            const buffer = Buffer.concat(chunks);
            let text;

            // 根据 encoding 解压
            const encoding = res.headers['content-encoding'];
            if (encoding === 'gzip') {
              text = zlib.gunzipSync(buffer).toString('utf8');
            } else if (encoding === 'deflate') {
              text = zlib.inflateSync(buffer).toString('utf8');
            } else {
              text = buffer.toString('utf8');
            }

            // 移除 BOM 并解析
            const cleanData = text.replace(/^\uFEFF/, '').trim();
            const json = JSON.parse(cleanData);
            resolve(json);
          } catch (e) {
            console.error('解析失败:', e.message);
            reject(e);
          }
        });
      }).on('error', reject);
    });

    // 并行请求
    const baseUrl = 'https://nf2vhfmeu7.re.qweatherapi.com';
    const [nowData, forecastData] = await Promise.all([
      fetch(`${baseUrl}/v7/weather/now?location=${location}&key=${WEATHER_API_KEY}`),
      fetch(`${baseUrl}/v7/weather/3d?location=${location}&key=${WEATHER_API_KEY}`)
    ]);

    console.log('实时天气数据:', JSON.stringify(nowData));
    console.log('预报数据:', JSON.stringify(forecastData));

    const result = {
      success: true,
      now: nowData?.code === '200' ? nowData.now : null,
      forecast: forecastData?.code === '200' ? forecastData.daily : null
    };

    console.log('返回结果:', JSON.stringify(result));
    return result;

  } catch (error) {
    console.error('获取天气失败:', error);
    return { success: false, error: error.message };
  }
};