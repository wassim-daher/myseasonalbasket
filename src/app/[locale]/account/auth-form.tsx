'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { MAX_PASSWORD, MIN_PASSWORD, type AccountError } from '@/lib/account';
import type { Dictionary, Locale } from '@/lib/i18n';
import { loadMyOrders } from '@/lib/my-orders';
import { loginAction, registerAction } from './actions';

type Props = { mode: 'login' | 'register'; locale: Locale; t: Dictionary; next: string; forgotHref: string | null };

export function AuthForm({ mode, locale, t, next, forgotHref }: Props) {
  const a = t.account;
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<AccountError | null>(null);
  const [pending, start] = useTransition();
  const register = mode === 'register';
  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : '';

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const orders = loadMyOrders();
      const result = register
        ? await registerAction({ name, phone, password, remember, locale }, next, orders)
        : await loginAction({ phone, password, remember }, locale, next, orders);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace(result.next ?? `/${locale}/account`);
      router.refresh();
    });
  }

  return (
    <div className="auth">
      <h1 className="page-title">{register ? a.registerTitle : a.loginTitle}</h1>
      <p className="soft">{register ? a.registerLead : a.loginLead}</p>
      <form onSubmit={submit} className="auth-form" noValidate>
        {register && (
          <label className="field">{a.name}
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} autoComplete="name" />
          </label>
        )}
        <label className="field">{a.phone}
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={30} type="tel" inputMode="tel" autoComplete="tel" dir="ltr" placeholder="+961 70 123 456" />
        </label>
        <div className="field">
          <label htmlFor="account-password">{register ? a.newPassword : a.password}</label>
          <span className="password-field">
            <input
              id="account-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={register ? MIN_PASSWORD : 1}
              maxLength={MAX_PASSWORD}
              type={showPassword ? 'text' : 'password'}
              autoComplete={register ? 'new-password' : 'current-password'}
              dir="ltr"
              aria-describedby={register ? 'password-hint' : undefined}
            />
            <button type="button" className="link-button" onClick={() => setShowPassword((v) => !v)} aria-pressed={showPassword} aria-controls="account-password">
              {showPassword ? a.hide : a.show}
            </button>
          </span>
          {register && <span id="password-hint" className="small muted">{a.passwordHint}</span>}
        </div>
        <label className="check">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span>{a.remember}</span>
        </label>
        {error && (
          <p className="alert" role="alert">
            {a.errors[error]}
            {error === 'taken' && <> <Link href={`/${locale}/account/login${nextQuery}`}>{a.submitLogin}</Link></>}
          </p>
        )}
        <button type="submit" className="btn btn-primary btn-large btn-block" disabled={pending}>
          {register ? a.submitRegister : a.submitLogin}
        </button>
      </form>
      {!register && (
        <p className="small soft auth-help">
          {forgotHref ? <a href={forgotHref} target="_blank" rel="noopener noreferrer">{a.forgot}</a> : a.forgotNoWhatsapp}
        </p>
      )}
      <p className="auth-switch">
        {register ? a.haveAccount : a.noAccount}{' '}
        <Link href={`/${locale}/account/${register ? 'login' : 'register'}${nextQuery}`}>{register ? a.submitLogin : a.submitRegister}</Link>
      </p>
    </div>
  );
}
