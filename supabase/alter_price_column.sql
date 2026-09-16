-- 修复 assets 表 price / periodAmount 字段 numeric 精度溢出问题
-- numeric(10,2) 整数部分最多 8 位 (99,999,999.98)，改为 numeric(12,2) 整数部分最多 10 位 (~百亿)
-- 三步执行，安全可控

-- 第一步：确认当前精度（已完成，numeric(10,2)）

-- 第二步：调整精度
ALTER TABLE public.assets
  ALTER COLUMN price TYPE numeric(12,2);

ALTER TABLE public.assets
  ALTER COLUMN "periodAmount" TYPE numeric(12,2);

-- 第三步：确认改后精度
SELECT column_name, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'assets'
  AND column_name IN ('price', 'periodAmount');
