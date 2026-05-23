import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';

// GET: List all users, their roles, and profile information (Admin Only)
export async function GET() {
  try {
    // Authenticate and check for ADMIN role
    await requireAuth(['ADMIN']);

    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        isActive: true,
        expiresAt: true,
        createdAt: true,
        userRoles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
              },
            },
            status: true,
            expiresAt: true,
          },
        },
        clientProfile: {
          select: {
            fullName: true,
          },
        },
        providerProfile: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format output
    const formattedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      expiresAt: user.expiresAt,
      createdAt: user.createdAt,
      fullName: user.clientProfile?.fullName || user.providerProfile?.fullName || 'N/A',
      roles: user.userRoles.map((ur) => ({
        roleId: ur.role.id,
        name: ur.role.name,
        status: ur.status,
        expiresAt: ur.expiresAt,
      })),
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (err.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Admin users fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH: Update user status, expiration, or roles (Admin Only)
export async function PATCH(req: NextRequest) {
  try {
    // Authenticate and check for ADMIN role
    await requireAuth(['ADMIN']);

    const body = await req.json();
    const { userId, isActive, expiresAt, roles } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Process roles update if provided
    if (roles && Array.isArray(roles)) {
      const allDbRoles = await db.role.findMany();
      const roleMap = new Map(allDbRoles.map((r) => [r.name, r.id]));

      for (const r of roles) {
        const roleId = roleMap.get(r.name);
        if (!roleId) continue;

        if (r.status === 'remove') {
          // Delete role assignment
          await db.userRole.deleteMany({
            where: {
              userId,
              roleId,
            },
          });
        } else {
          // Upsert role assignment
          await db.userRole.upsert({
            where: {
              userId_roleId: {
                userId,
                roleId,
              },
            },
            update: {
              status: r.status,
            },
            create: {
              userId,
              roleId,
              status: r.status,
            },
          });

          // If role is approved and profile doesn't exist, create default profiles
          if (r.status === 'approved') {
            if (r.name === 'CLIENT') {
              const existingProfile = await db.clientProfile.findUnique({ where: { userId } });
              if (!existingProfile) {
                const userObj = await db.user.findUnique({ where: { id: userId } });
                await db.clientProfile.create({
                  data: {
                    userId,
                    fullName: userObj?.email.split('@')[0] || 'Client User',
                  },
                });
              }
            } else if (r.name === 'PROVIDER') {
              const existingProfile = await db.providerProfile.findUnique({ where: { userId } });
              if (!existingProfile) {
                const userObj = await db.user.findUnique({ where: { id: userId } });
                await db.providerProfile.create({
                  data: {
                    userId,
                    fullName: userObj?.email.split('@')[0] || 'Expert Provider',
                    isAvailable: true,
                  },
                });
              }
            }
          }
        }
      }
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        isActive: isActive !== undefined ? isActive : undefined,
        expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : undefined,
      },
      select: {
        id: true,
        email: true,
        isActive: true,
        expiresAt: true,
      },
    });

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (err.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Admin user update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
