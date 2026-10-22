'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import type { AccountError } from '@/lib/account';
import { localized, type Dictionary, type Locale } from '@/lib/i18n';
import type { AccountAddress, DeliveryZone } from '@/lib/shop-types';
import { changePasswordAction, logoutAction, saveAddressAction, saveNameAction, type AccountResult } from './actions';

function useAccountForm() {
  const [error, setError] = useState<AccountError | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  const run = (work: () => Promise<AccountResult>, after?: () => void) => {
    setError(null);
    setDone(false);
    start(async () => {
      const result = await work();
      if (result.ok) {
        setDone(true);
        after?.();
      } else setError(result.error);
    });
  };
  return { error, done, pending, run };
}

function Feedback({ t, error, done, doneText }: { t: Dictionary; error: AccountError | null; done: boolean; doneText: string }) {
  if (error) return <p className="alert" role="alert">{t.account.errors[error]}</p>;
  return done ? <p className="success" role="status">{doneText}</p> : null;
}

export function NameForm({ t, name: initial }: { t: Dictionary; name: string }) {
  const router = useRouter();
  const [name, setName] = useState(initial);
  const f = useAccountForm();
  const submit = (e: FormEvent) => { e.preventDefault(); f.run(() => saveNameAction(name), () => router.refresh()); };
  return (
    <form onSubmit={submit} className="account-form">
      <label className="field">{t.account.name}
        <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} autoComplete="name" />
      </label>
      <Feedback t={t} error={f.error} done={f.done} doneText={t.account.saved} />
      <button type="submit" className="btn btn-secondary" disabled={f.pending || name.trim() === initial}>{t.account.save}</button>
    </form>
  );
}

export function AddressForm({ t, locale, zones, address }: { t: Dictionary; locale: Locale; zones: DeliveryZone[]; address: AccountAddress | null }) {
  const [zoneId, setZoneId] = useState(address?.zoneId ?? '');
  const [line, setLine] = useState(address?.line ?? '');
  const [notes, setNotes] = useState(address?.notes ?? '');
  const f = useAccountForm();
  const submit = (e: FormEvent) => { e.preventDefault(); f.run(() => saveAddressAction({ zoneId, line, notes })); };
  return (
    <form onSubmit={submit} className="account-form">
      <label className="field">{t.account.zone}
        <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} required>
          <option value="">{t.account.chooseZone}</option>
          {zones.map((z) => <option key={z.id} value={z.id}>{localized(locale, z.nameEn, z.nameAr)}</option>)}
        </select>
      </label>
      <label className="field">{t.account.addressLine}
        <input value={line} onChange={(e) => setLine(e.target.value)} required minLength={3} maxLength={500} autoComplete="street-address" />
      </label>
      <label className="field">{t.account.addressNotes}
        <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
      </label>
      <Feedback t={t} error={f.error} done={f.done} doneText={t.account.saved} />
      <button type="submit" className="btn btn-secondary" disabled={f.pending}>{t.account.save}</button>
    </form>
  );
}

export function PasswordForm({ t }: { t: Dictionary }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const f = useAccountForm();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    f.run(() => changePasswordAction({ current, next }), () => { setCurrent(''); setNext(''); });
  };
  return (
    <form onSubmit={submit} className="account-form">
      <label className="field">{t.account.current}
        <input value={current} onChange={(e) => setCurrent(e.target.value)} type="password" required autoComplete="current-password" dir="ltr" />
      </label>
      <label className="field">{t.account.next}
        <input value={next} onChange={(e) => setNext(e.target.value)} type="password" required minLength={8} maxLength={72} autoComplete="new-password" dir="ltr" />
        <span className="small muted">{t.account.passwordHint}</span>
      </label>
      <Feedback t={t} error={f.error} done={f.done} doneText={t.account.passwordChanged} />
      <button type="submit" className="btn btn-secondary" disabled={f.pending}>{t.account.passwordTitle}</button>
    </form>
  );
}

export function LogoutButton({ t, locale }: { t: Dictionary; locale: Locale }) {
  return (
    <form action={logoutAction.bind(null, locale)}>
      <button type="submit" className="btn btn-secondary btn-block">{t.account.logout}</button>
    </form>
  );
}
