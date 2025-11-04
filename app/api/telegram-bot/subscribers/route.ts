import { NextResponse } from 'next/server';
import { getSubscriberCount, getSubscribers } from '@/lib/telegramSubscribers';

export async function GET(request: Request) {
  const adminToken = process.env.ADMIN_BROADCAST_TOKEN;
  if (!adminToken) return NextResponse.json({ error: 'Admin token not set' }, { status: 500 });
  const provided = new URL(request.url).searchParams.get('token');
  if (provided !== adminToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const includeIds = new URL(request.url).searchParams.get('ids') === 'true';
  const count = await getSubscriberCount();
  if (!includeIds) {
    return NextResponse.json({ count });
  }
  const ids = await getSubscribers();
  return NextResponse.json({ count, ids });
}
