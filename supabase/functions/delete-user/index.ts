// Supabase Edge Function: delete-user
// 删除用户及其所有相关数据（仅管理员可用）

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ADMIN_OPENID = 'ofW_r4lPk806IqPSk4-gR9r_478g'
const STORAGE_URL_PREFIX = SUPABASE_URL + '/storage/v1/object/public/'

function isStorageUrl(url: string, bucket: string): boolean {
  return url && url.startsWith(STORAGE_URL_PREFIX + bucket + '/')
}

function extractFileName(url: string, bucket: string): string | null {
  const prefix = STORAGE_URL_PREFIX + bucket + '/'
  if (url.startsWith(prefix)) {
    return url.substring(prefix.length)
  }
  return null
}

serve(async (req) => {
  try {
    // 验证调用者是否为管理员
    const { admin_openid, target_openid } = await req.json().catch(() => ({}))
    if (admin_openid !== ADMIN_OPENID) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { headers: { 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    if (!target_openid) {
      return new Response(
        JSON.stringify({ error: '缺少目标用户 openid' }),
        { headers: { 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const errors: string[] = []

    // 1. 获取用户信息
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('_openid', target_openid)
      .single()

    if (userError) {
      return new Response(
        JSON.stringify({ error: '用户不存在' }),
        { headers: { 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // 2. 获取用户的所有资产（用于提取缩略图 URL）
    const { data: assets } = await supabase
      .from('assets')
      .select('icon')
      .eq('_openid', target_openid)

    // 3. 获取用户的所有分类（用于提取缩略图 URL）
    const { data: categories } = await supabase
      .from('categories')
      .select('icon')
      .eq('_openid', target_openid)

    // 4. 删除 Storage 中的文件
    const filesToDelete: { bucket: string; fileName: string }[] = []

    // 4a. 头像
    if (user.avatarUrl && isStorageUrl(user.avatarUrl, 'avatars')) {
      const fileName = extractFileName(user.avatarUrl, 'avatars')
      if (fileName) filesToDelete.push({ bucket: 'avatars', fileName })
    }

    // 4b. 资产缩略图
    if (assets) {
      for (const asset of assets) {
        if (asset.icon && isStorageUrl(asset.icon, 'icons')) {
          const fileName = extractFileName(asset.icon, 'icons')
          if (fileName) filesToDelete.push({ bucket: 'icons', fileName })
        }
      }
    }

    // 4c. 分类缩略图
    if (categories) {
      for (const cat of categories) {
        if (cat.icon && isStorageUrl(cat.icon, 'category-icons')) {
          const fileName = extractFileName(cat.icon, 'category-icons')
          if (fileName) filesToDelete.push({ bucket: 'category-icons', fileName })
        }
      }
    }

    // 执行批量删除文件
    for (const { bucket, fileName } of filesToDelete) {
      const { error: delErr } = await supabase.storage
        .from(bucket)
        .remove([fileName])
      if (delErr) {
        errors.push(`删除存储文件失败 [${bucket}/${fileName}]: ${delErr.message}`)
      }
    }

    // 5. 删除所有资产记录
    const { error: delAssetsErr } = await supabase
      .from('assets')
      .delete()
      .eq('_openid', target_openid)
    if (delAssetsErr) {
      errors.push(`删除资产失败: ${delAssetsErr.message}`)
    }

    // 6. 删除所有分类记录
    const { error: delCategoriesErr } = await supabase
      .from('categories')
      .delete()
      .eq('_openid', target_openid)
    if (delCategoriesErr) {
      errors.push(`删除分类失败: ${delCategoriesErr.message}`)
    }

    // 7. 删除用户记录
    const { error: delUserErr } = await supabase
      .from('users')
      .delete()
      .eq('_openid', target_openid)
    if (delUserErr) {
      errors.push(`删除用户失败: ${delUserErr.message}`)
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ success: false, errors, message: '部分删除操作失败' }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: '用户及所有相关数据已删除' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || '服务器错误' }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
