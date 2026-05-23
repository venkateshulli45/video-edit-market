import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';

// GET: List all pending role requests (Admin Only)
export async function GET() {
  try {
    // Authenticate and restrict to ADMIN role
    await requireAuth(['ADMIN']);

    const pendingRequests = await db.userRole.findMany({
      where: {
        status: 'pending',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            clientProfile: { select: { fullName: true } },
            providerProfile: { select: { fullName: true } },
          },
        },
        role: true,
      },
      orderBy: {
        assignedAt: 'asc',
      },
    });

    const formattedRequests = pendingRequests.map((req) => ({
      userId: req.userId,
      roleId: req.roleId,
      email: req.user.email,
      fullName: req.user.clientProfile?.fullName || req.user.providerProfile?.fullName || 'N/A',
      roleName: req.role.name,
      requestedAt: req.assignedAt,
    }));

    return NextResponse.json({ requests: formattedRequests });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Fetch pending role requests error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Approve or reject a role request (Admin Only)
export async function POST(req: NextRequest) {
  try {
    // Authenticate and restrict to ADMIN role
    await requireAuth(['ADMIN']);

    const body = await req.json();
    const { userId, roleId, action, expiresAt } = body; // action: 'approve' | 'reject', expiresAt: optional role end date

    if (!userId || !roleId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const updatedUserRole = await db.userRole.update({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
      data: {
        status: newStatus,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        role: true,
      },
    });

    return NextResponse.json({
      message: `Role request ${action}d successfully.`,
      userRole: {
        userId: updatedUserRole.userId,
        roleName: updatedUserRole.role.name,
        status: updatedUserRole.status,
        expiresAt: updatedUserRole.expiresAt,
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Update role request error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
