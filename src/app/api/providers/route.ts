import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';

// GET: Fetch list of all active/available service providers (accessible by any authenticated user)
export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const providers = await db.providerProfile.findMany({
      where: {
        isAvailable: true,
      },
      select: {
        id: true,
        fullName: true,
        bio: true,
        skills: true,
        hourlyRate: true,
        averageRating: true,
      },
    });

    return NextResponse.json({ providers });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Fetch providers error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
