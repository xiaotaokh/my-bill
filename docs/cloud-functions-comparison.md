# 云函数迁移对比清单

> 旧微信云函数已于 2026-05-28 删除，以下为 13 个云函数的迁移对照。

| # | 旧云函数 | 技术栈 | 迁移方式 | 对应代码位置 |
|---|---------|--------|---------|-------------|
| 1 | `addAsset` | wx-server-sdk | `supabase.from('assets').insert()` | `pages/asset-add/asset-add.js:1354-1358` |
| 2 | `addCategory` | wx-server-sdk | `supabase.from('categories').insert()` | `pages/category-manage/category-manage.js:609-619` |
| 3 | `batchDeleteAssets` | wx-server-sdk | `supabase.from('assets').delete().in('id', ...)` | `pages/index/index.js:1431-1434` |
| 4 | `batchDeleteCategories` | wx-server-sdk | `supabase.from('categories').delete().in('id', ...)` | `pages/category-manage/category-manage.js:890-894` |
| 5 | `deleteCategory` | wx-server-sdk | `supabase.from('categories').delete().eq('id', ...)` | `pages/category-manage/category-manage.js:999-1002` |
| 6 | `getCategories` | wx-server-sdk | `supabase.from('categories').select('*')` | `pages/category-manage/category-manage.js:109-113` |
| 7 | `getUserOpenid` | wx-server-sdk | Supabase Edge Function `get-user-openid` | `utils/auth.js:21` / `app.js:27` |
| 8 | `getUserStats` | wx-server-sdk | Supabase Edge Function `get-user-stats` | `pages/user-stats/user-stats.js:188` |
| 9 | `getWeather` | wx-server-sdk | Supabase Edge Function `getWeather` | `pages/index/index.js:512` |
| 10 | `saveUserInfo` | wx-server-sdk | `supabase.from('users').update()` | `pages/account/account.js:312-319` |
| 11 | `updateAsset` | wx-server-sdk | `supabase.from('assets').update()` | `pages/asset-add/asset-add.js:1348-1351` |
| 12 | `updateCategory` | wx-server-sdk | `supabase.from('categories').update()` | `pages/category-manage/category-manage.js:657-666` |
| 13 | `updateCategorySortOrder` | wx-server-sdk | `supabase.from('categories').update()`（逐条） | `pages/category-manage/category-manage.js:756-760` |

## 清理明细

- 删除目录：`cloudfunctions/`（414MB，含 node_modules）
- 项目配置：移除 `project.config.json` 中的 `cloudfunctionRoot` 及 `packOptions.ignore` 中的 cloudfunctions 条目
- 云开发 SDK：`app.json` 中 `"cloud": true` → `false`
