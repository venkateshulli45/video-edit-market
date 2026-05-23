import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: Fetch all parent categories with their subcategories
export async function GET() {
  try {
    const categories = await db.category.findMany({
      where: { parentId: null },
      include: {
        subcategories: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json({ categories });
  } catch (error: unknown) {
    console.error('Categories fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
