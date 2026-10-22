import { redirect } from 'next/navigation';

// Orders now live in the shopper's account.
export default async function OldMyOrders({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale === 'ar' ? 'ar' : 'en'}/account`);
}
