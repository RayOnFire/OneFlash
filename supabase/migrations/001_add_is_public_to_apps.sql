-- =============================================
-- 迁移脚本：添加 is_public 字段到 apps 表（支持分享功能）
-- =============================================

-- 1. 添加 is_public 字段（如果不存在）
ALTER TABLE apps ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

-- 2. 更新现有应用为公开状态
UPDATE apps SET is_public = TRUE WHERE is_public IS NULL;

-- 3. 更新 RLS 策略支持公开应用访问（如果需要）
-- 先检查并删除旧策略
DROP POLICY IF EXISTS "Users can view own apps" ON apps;
DROP POLICY IF EXISTS "Users can view own apps or public apps" ON apps;

-- 创建新策略：用户可以查看自己的应用，或者公开的应用
CREATE POLICY "Users can view own apps or public apps" ON apps
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

