// Supabase Edge Function: getWeather
// 获取天气数据（替代原微信云函数 getWeather）

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// 和风天气 API 配置
const QWEATHER_API_KEY = '01d7c36f2c944e0592fb1032e7a382a1'
const QWEATHER_BASE_URL = 'https://nf2vhfmeu7.re.qweatherapi.com/v7'

serve(async (req) => {
  try {
    const { latitude, longitude } = await req.json()

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: '缺少经纬度参数' }),
        { headers: { 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const location = `${longitude},${latitude}`

    // 并行获取实时天气和预报
    const [nowResponse, forecastResponse] = await Promise.all([
      fetch(`${QWEATHER_BASE_URL}/weather/now?location=${location}&key=${QWEATHER_API_KEY}`),
      fetch(`${QWEATHER_BASE_URL}/weather/3d?location=${location}&key=${QWEATHER_API_KEY}`)
    ])

    const nowData = await nowResponse.json()
    const forecastData = await forecastResponse.json()

    const result = {
      success: true,
      now: nowData?.code === '200' ? nowData.now : null,
      forecast: forecastData?.code === '200' ? forecastData.daily : null
    }

    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || '服务器错误' }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})