/**
 * Supabase Storage 孤儿文件清理脚本
 *
 * 使用方法：
 * 1. 获取 Service Role Key：Dashboard → Settings → API → service_role
 * 2. 运行：node scripts/clean-storage.js <SERVICE_ROLE_KEY>
 *
 * 注意：Service Role Key 有管理员权限，请勿泄露
 */

const SUPABASE_URL = 'https://scogsobcckvybkwcmvqh.supabase.co';

// 孤儿文件列表（从 SQL 查询结果获取）
const orphanFiles = {
  avatars: [
    '1780388526752.svg',
    '1780387762336.svg',
    '1780042523032.svg',
    '1780036996006.svg',
    '1779950980314.svg',
    '1779950225688.svg',
    '1776332102426.jpg',
    '1776152498009.jpg',
    '1776160775108.jpg',
    '1776150906209.jpg',
    '1776070875585.jpg',
    '1776159118137.jpg',
    '1776937601475.jpg',
    '1776938488904.svg',
    '1776996819776.jpg',
    '1777271925912.jpg',
    '1776996877050.svg',
    '1777271914822.jpg',
    '1777272107293.jpg',
    '1777271844064.jpg',
    '1778039606895.svg',
    '1778056872177.jpg',
    '1778826705336.svg',
    '1779258909547.svg'
  ],
  icons: [
    '1773909610442_ujkl4aq7k.png',
    '1774403753427_lljog8pjj.png',
    '1773910977834_kvr9unwwa.png',
    '1773912179046_8twdlqx8s.png',
    '1773910699020_vo15eyxb0.png',
    '1774346342914_2kjm7y071.png',
    '1774408253057_ixlde3n0g.png',
    '1777447928488_sjort0tsk.png',
    '1777440636613_ez6b4a4zs.png',
    '1778727815236_mgi80jhf3.png'
  ],
  'category-icons': [
    '1777605640211-2594.png',
    '1777445822886-5962.png',
    '1777273892289-1977.png'
  ]
};

async function deleteFiles(bucket, files, serviceRoleKey) {
  // Supabase Storage API 要求 body 为对象，包含 prefixes 数组
  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prefixes: files })
  });

  if (response.ok) {
    return { success: true, count: files.length };
  } else {
    const error = await response.text();
    return { success: false, error };
  }
}

async function main() {
  const serviceRoleKey = process.argv[2];

  if (!serviceRoleKey) {
    console.log('请提供 Service Role Key:');
    console.log('node scripts/clean-storage.js <SERVICE_ROLE_KEY>');
    console.log('\n获取方式：Dashboard → Settings → API → service_role');
    process.exit(1);
  }

  console.log('开始清理 Storage 孤儿文件...\n');

  const buckets = Object.keys(orphanFiles);
  let totalDeleted = 0;
  let failedBuckets = [];

  for (const bucket of buckets) {
    const files = orphanFiles[bucket];
    console.log(`清理 ${bucket} (${files.length} 个文件)...`);

    const result = await deleteFiles(bucket, files, serviceRoleKey);

    if (result.success) {
      console.log(`  ✓ 已删除 ${result.count} 个文件`);
      totalDeleted += result.count;
    } else {
      console.log(`  ✗ 删除失败: ${result.error}`);
      failedBuckets.push(bucket);
    }
  }

  console.log('\n清理完成!');
  console.log(`总计删除: ${totalDeleted} 个文件`);

  if (failedBuckets.length > 0) {
    console.log(`失败: ${failedBuckets.join(', ')}`);
  }
}

main();