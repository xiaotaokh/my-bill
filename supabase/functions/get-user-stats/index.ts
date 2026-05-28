// Supabase Edge Function: get-user-stats
// 获取用户统计信息（仅管理员可用）

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ADMIN_OPENID = 'ofW_r4lPk806IqPSk4-gR9r_478g'

function calcUsedDays(purchaseDate, endDate) {
  if (!purchaseDate) return 0
  const start = new Date(purchaseDate)
  const end = endDate ? new Date(endDate) : new Date()
  const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

function getPeriodDays(periodType, customDays) {
  const periodMap = {
    'monthly': 30,
    'yearly': 365,
    'weekly': 7
  }
  if (periodType === 'custom') return parseInt(customDays) || 30
  return periodMap[periodType] || 30
}

serve(async (req) => {
  try {
    // 验证调用者是否为管理员
    const { openid } = await req.json().catch(() => ({}))
    if (openid !== ADMIN_OPENID) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { headers: { 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 获取所有用户信息
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')

    if (usersError) {
      return new Response(
        JSON.stringify({ error: usersError.message }),
        { headers: { 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // 获取所有资产
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('*')

    if (assetsError) {
      return new Response(
        JSON.stringify({ error: assetsError.message }),
        { headers: { 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // 按用户分组资产，同时计算各字段
    const userAssets = {}
    assets.forEach(asset => {
      const oid = asset._openid
      if (!userAssets[oid]) {
        userAssets[oid] = []
      }

      // 计算 usedDays 和 dailyCost
      let usedDays = 0
      let dailyCost = 0

      if (asset.assetType === 'subscription') {
        if (asset.subscriptionStartDate) {
          const endDate = asset.subscriptionStatus === 'ended' ? asset.subscriptionEndDate : null
          usedDays = calcUsedDays(asset.subscriptionStartDate, endDate)
        }

        // 订阅资产：日均成本 = 总投入 / 已订阅天数
        if (asset.subscriptionStatus !== 'pending' && usedDays > 0 && asset.periodAmount && asset.periodType) {
          const periodDays = getPeriodDays(asset.periodType, asset.periodDays)
          const completedPeriods = Math.floor(usedDays / periodDays) + 1
          const totalInvestment = asset.periodAmount * completedPeriods
          dailyCost = totalInvestment / usedDays
        }
      } else if (asset.purchaseDate) {
        let endDate = null
        if (asset.status === 'retired') endDate = asset.retiredDate
        else if (asset.status === 'sold') endDate = asset.soldDate
        usedDays = calcUsedDays(asset.purchaseDate, endDate)
        if (asset.price && usedDays >= 1) {
          dailyCost = asset.price / usedDays
        }
      }

      userAssets[oid].push({
        ...asset,
        usedDays,
        dailyCost: Number(dailyCost.toFixed(2)),
        usedDaysText: usedDays + '天'
      })
    })

    // 组合用户数据
    const userStats = users.map(user => {
      const userAssetList = userAssets[user._openid] || []
      return {
        ...user,
        assetCount: userAssetList.length,
        totalAssetPrice: userAssetList.reduce((sum, a) => sum + (a.price || 0), 0),
        assets: userAssetList
      }
    })

    return new Response(
      JSON.stringify(userStats),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || '服务器错误' }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
