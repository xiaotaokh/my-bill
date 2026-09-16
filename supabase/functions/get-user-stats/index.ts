// Supabase Edge Function: get-user-stats
// 获取用户统计信息（仅管理员可用），支持分页

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

function getChinaDateStr(value) {
  if (!value) return null
  return String(value).slice(0, 10)
}

function getTodayChinaDateStr() {
  const now = new Date()
  const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  return chinaTime.toISOString().slice(0, 10)
}

serve(async (req) => {
  try {
    // 验证调用者是否为管理员
    const body = await req.json().catch(() => ({}))
    const { openid } = body
    if (openid !== ADMIN_OPENID) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { headers: { 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 分页参数
    const page = Math.max(1, parseInt(body.page) || 1)
    const pageSize = Math.max(5, parseInt(body.pageSize) || 20)
    const offset = (page - 1) * pageSize
    const isFirstPage = page === 1

    // 中国时间（UTC+8）
    const chinaNow = new Date(Date.now() + 8 * 60 * 60 * 1000)

    // 30天前（用于统计近30天访问次数）
    const thirtyDaysAgoChina = new Date(chinaNow)
    thirtyDaysAgoChina.setDate(thirtyDaysAgoChina.getDate() - 30)
    thirtyDaysAgoChina.setHours(0, 0, 0, 0)
    const thirtyDaysAgoUTC = new Date(thirtyDaysAgoChina.getTime() - 8 * 60 * 60 * 1000)

    // 7天前（用于活跃客户判定）
    const sevenDaysAgoChina = new Date(chinaNow)
    sevenDaysAgoChina.setDate(sevenDaysAgoChina.getDate() - 7)
    sevenDaysAgoChina.setHours(0, 0, 0, 0)
    const sevenDaysAgoUTC = new Date(sevenDaysAgoChina.getTime() - 8 * 60 * 60 * 1000)

    // 获取用户总数（排除管理员）
    const { count: totalCount, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .neq('_openid', ADMIN_OPENID)

    if (countError) {
      return new Response(
        JSON.stringify({ error: countError.message }),
        { headers: { 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // 资产总数（排除管理员）
    const { count: totalAssetCount, error: assetCountError } = await supabase
      .from('assets')
      .select('*', { count: 'exact', head: true })
      .neq('_openid', ADMIN_OPENID)

    // 活跃客户数（新规则：近7天访问 + 近30天≥3次，全量统计）
    let activeUserCount = 0
    const { data: recentUsers, error: recentUsersError } = await supabase
      .from('users')
      .select('_openid')
      .neq('_openid', ADMIN_OPENID)
      .gte('lastAccessTime', sevenDaysAgoUTC.toISOString())

    if (!recentUsersError && recentUsers && recentUsers.length > 0) {
      const recentOpenids = recentUsers.map(u => u._openid)
      const { data: activeLogs, error: activeLogsError } = await supabase
        .from('access_logs')
        .select('_openid')
        .in('_openid', recentOpenids)
        .limit(5000)
        .gte('accessTime', thirtyDaysAgoUTC.toISOString())

      if (!activeLogsError && activeLogs) {
        const countMap: Record<string, number> = {}
        activeLogs.forEach(log => {
          countMap[log._openid] = (countMap[log._openid] || 0) + 1
        })
        activeUserCount = recentOpenids.filter(oid => (countMap[oid] || 0) >= 3).length
      }
    }

    // 分页查询用户（排除管理员，按最近访问时间倒序）
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .neq('_openid', ADMIN_OPENID)
      .order('lastAccessTime', { ascending: false, nullsFirst: false })
      .range(offset, offset + pageSize - 1)

    if (usersError) {
      return new Response(
        JSON.stringify({ error: usersError.message }),
        { headers: { 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // 查询当前页用户的 access_logs（分批避免 in() 超限），计算 visitCount
    const userOpenids = users.map(u => u._openid)
    let thirtyDayVisitCountMap: Record<string, number> = {}
    let totalVisitCountMap: Record<string, number> = {}
    let todayVisitCountMap: Record<string, number> = {}
    if (userOpenids.length > 0) {
      const todayStr = getTodayChinaDateStr()
      const BATCH = 100
      for (let i = 0; i < userOpenids.length; i += BATCH) {
        const batch = userOpenids.slice(i, i + BATCH)
        const { data: batchLogs } = await supabase
          .from('access_logs')
          .select('_openid, accessTime')
          .in('_openid', batch)
        if (batchLogs) {
          batchLogs.forEach((log: any) => {
            totalVisitCountMap[log._openid] = (totalVisitCountMap[log._openid] || 0) + 1
            if (log.accessTime >= thirtyDaysAgoUTC.toISOString()) {
              thirtyDayVisitCountMap[log._openid] = (thirtyDayVisitCountMap[log._openid] || 0) + 1
            }
            if (getChinaDateStr(log.accessTime) === todayStr) {
              todayVisitCountMap[log._openid] = (todayVisitCountMap[log._openid] || 0) + 1
            }
          })
        }
      }
    }

    // 只查询当前页用户的资产
    let userAssets: Record<string, any[]> = {}
    if (userOpenids.length > 0) {
      const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .in('_openid', userOpenids)

      if (!assetsError && assets) {
        assets.forEach(asset => {
          const oid = asset._openid
          if (!userAssets[oid]) {
            userAssets[oid] = []
          }

          let usedDays = 0
          let dailyCost = 0

          if (asset.assetType === 'subscription') {
            if (asset.subscriptionStartDate) {
              const endDate = asset.subscriptionStatus === 'ended' ? asset.subscriptionEndDate : null
              usedDays = calcUsedDays(asset.subscriptionStartDate, endDate)
            }
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
      }
    }

    // 组合用户数据
    const userStats = users.map(user => {
      const userAssetList = userAssets[user._openid] || []
      return {
        ...user,
        assetCount: userAssetList.length,
        totalAssetPrice: Math.round(userAssetList.reduce((sum, a) => sum + (a.price || 0), 0) * 100) / 100,
        assets: userAssetList,
        thirtyDayVisitCount: thirtyDayVisitCountMap[user._openid] || 0,
        totalVisitCount: totalVisitCountMap[user._openid] || 0,
        todayVisitCount: todayVisitCountMap[user._openid] || 0
      }
    })

    // 访问统计仅首页计算
    let accessStats = null
    if (isFirstPage) {
      const { data: accessLogs, error: accessLogsError } = await supabase
        .from('access_logs')
        .select('_openid, accessTime')
        .neq('_openid', ADMIN_OPENID)
        .order('accessTime', { ascending: true }).limit(10000)

      if (!accessLogsError && accessLogs) {
        const todayDateStr = getTodayChinaDateStr()
        const dateData: Record<string, any> = {}
        let todayCount = 0
        const todayUserSet = new Set<string>()
        const totalUserSet = new Set<string>()

        accessLogs.forEach(log => {
          const dateStr = getChinaDateStr(log.accessTime)
          if (!dateStr) return

          totalUserSet.add(log._openid)

          if (dateStr === todayDateStr) {
            todayCount++
            todayUserSet.add(log._openid)
          }

          if (!dateData[dateStr]) {
            dateData[dateStr] = { count: 0, users: {} }
          }

          const stat = dateData[dateStr]
          stat.count++

          const key = log._openid || 'unknown'
          if (!stat.users[key]) {
            stat.users[key] = {
              name: '未知用户',
              assetCount: 0,
              assetPrice: 0,
              visitCount: 0
            }
          }
          stat.users[key].visitCount++
        })

        userStats.forEach(u => {
          Object.values(dateData).forEach((dayStat: any) => {
            if (dayStat.users[u._openid]) {
              dayStat.users[u._openid].name = u.nickName || '未知用户'
              dayStat.users[u._openid].assetCount = u.assetCount || 0
              dayStat.users[u._openid].assetPrice = u.totalAssetPrice || 0
            }
          })
        })

        const chartData = Object.keys(dateData).sort().map(date => ({
          date: date.slice(5),
          fullDate: date,
          count: dateData[date].count,
          users: Object.keys(dateData[date].users).map(key => dateData[date].users[key])
        }))

        accessStats = {
          todayCount,
          todayUserCount: todayUserSet.size,
          totalCount: accessLogs.length,
          totalUserCount: totalUserSet.size,
          chartData
        }
      }
    }

    return new Response(
      JSON.stringify({
        users: userStats,
        totalCount: totalCount || 0,
        totalAssetCount: totalAssetCount || 0,
        activeUserCount,
        page,
        pageSize,
        hasMore: offset + pageSize < (totalCount || 0),
        accessStats
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || '服务器错误' }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
