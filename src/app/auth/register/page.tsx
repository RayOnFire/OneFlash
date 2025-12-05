'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Sparkles, CheckCircle2, Shield } from 'lucide-react';
import AuroraBackground from '@/components/AuroraBackground';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // 密码强度检查
  const getPasswordStrength = () => {
    if (!password) return { level: 0, text: '', color: '' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 1, text: '弱', color: 'bg-red-500' };
    if (score <= 3) return { level: 2, text: '中', color: 'bg-yellow-500' };
    return { level: 3, text: '强', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少 6 位');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setError('该邮箱已被注册');
        } else {
          setError(error.message);
        }
        return;
      }

      setSuccess(true);
    } catch {
      setError('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <AuroraBackground />

        <div className="w-full max-w-sm relative z-10">
          <div className="auth-card rounded-3xl p-8 text-center">
            <div className="relative inline-block mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 opacity-30 blur-xl" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-3">注册成功！</h1>
            <p className="text-text-secondary mb-8 leading-relaxed">
              我们已向 <span className="text-white font-medium">{email}</span> 发送了确认邮件，请查收并点击链接激活账号。
            </p>

            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-2xl transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
            >
              <span className="text-white font-semibold">前往登录</span>
              <ArrowRight className="w-5 h-5 text-white" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      <AuroraBackground />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo 区域 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3 group">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-shadow">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-30 blur-lg group-hover:opacity-50 transition-opacity" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">灵光</h1>
              <p className="text-sm text-text-secondary mt-1">让复杂，变简单</p>
            </div>
          </Link>
        </div>

        {/* 表单卡片 */}
        <div className="auth-card rounded-3xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-white">创建账号</h2>
            <p className="text-sm text-text-secondary mt-2">加入灵光，开启智能创作</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl backdrop-blur-sm animate-shake">
                <p className="text-sm text-red-400 text-center">{error}</p>
              </div>
            )}

            {/* 邮箱输入 */}
            <div className="space-y-2">
              <label className="text-sm text-text-secondary font-medium pl-1">邮箱地址</label>
              <div className={`relative transition-all duration-300 ${focusedField === 'email' ? 'transform scale-[1.02]' : ''}`}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Mail className={`w-5 h-5 transition-colors ${focusedField === 'email' ? 'text-primary' : 'text-white/30'}`} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="your@email.com"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:bg-white/10 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {/* 密码输入 */}
            <div className="space-y-2">
              <label className="text-sm text-text-secondary font-medium pl-1">密码</label>
              <div className={`relative transition-all duration-300 ${focusedField === 'password' ? 'transform scale-[1.02]' : ''}`}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Lock className={`w-5 h-5 transition-colors ${focusedField === 'password' ? 'text-primary' : 'text-white/30'}`} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="至少 6 位密码"
                  required
                  className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:bg-white/10 focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {/* 密码强度指示器 */}
              {password && (
                <div className="flex items-center gap-2 px-1 pt-1">
                  <div className="flex-1 flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          passwordStrength.level >= level ? passwordStrength.color : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs ${
                    passwordStrength.level === 1 ? 'text-red-400' :
                    passwordStrength.level === 2 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {passwordStrength.text}
                  </span>
                </div>
              )}
            </div>

            {/* 确认密码 */}
            <div className="space-y-2">
              <label className="text-sm text-text-secondary font-medium pl-1">确认密码</label>
              <div className={`relative transition-all duration-300 ${focusedField === 'confirm' ? 'transform scale-[1.02]' : ''}`}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Shield className={`w-5 h-5 transition-colors ${focusedField === 'confirm' ? 'text-primary' : 'text-white/30'}`} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField('confirm')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="再次输入密码"
                  required
                  className={`w-full pl-12 pr-4 py-4 bg-white/5 border rounded-2xl text-white placeholder-white/30 focus:outline-none focus:bg-white/10 focus:ring-2 focus:ring-primary/20 transition-all ${
                    confirmPassword && confirmPassword !== password
                      ? 'border-red-500/50 focus:border-red-500/50'
                      : confirmPassword && confirmPassword === password
                      ? 'border-green-500/50 focus:border-green-500/50'
                      : 'border-white/10 focus:border-primary/50'
                  }`}
                />
                {confirmPassword && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {confirmPassword === password ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-red-400" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 注册按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 mt-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <>
                  <span className="text-white font-semibold">创建账号</span>
                  <ArrowRight className="w-5 h-5 text-white" />
                </>
              )}
            </button>
          </form>

          {/* 分割线 */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          {/* 登录链接 */}
          <p className="text-center text-text-secondary">
            已有账号？{' '}
            <Link
              href={`/auth/login${redirectTo !== '/' ? `?redirect=${redirectTo}` : ''}`}
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              立即登录
            </Link>
          </p>
        </div>

        {/* 底部提示 */}
        <p className="text-center text-xs text-white/20 mt-6">
          继续即表示您同意我们的服务条款和隐私政策
        </p>
      </div>
    </main>
  );
}
