import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, fullName, requestedRoles } = body; // requestedRoles: e.g. ['CLIENT', 'PROVIDER']

    if (!email || !password || !fullName || !requestedRoles || requestedRoles.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user and roles inside a transaction
    const newUser = await db.$transaction(async (tx) => {
      // 1. Create the user
      const user = await tx.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          isActive: true,
        },
      });

      // 2. Fetch the corresponding role records
      const rolesToAssign = await tx.role.findMany({
        where: {
          name: {
            in: requestedRoles.map((r: string) => r.toUpperCase()),
          },
        },
      });

      // 3. Create user_roles and profiles
      for (const role of rolesToAssign) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: role.id,
            status: 'pending', // All user self-registered roles require admin approval
          },
        });

        if (role.name === 'CLIENT') {
          await tx.clientProfile.create({
            data: {
              userId: user.id,
              fullName,
            },
          });
        } else if (role.name === 'PROVIDER') {
          await tx.providerProfile.create({
            data: {
              userId: user.id,
              fullName,
            },
          });
        }
      }

      return user;
    });

    return NextResponse.json({
      message: 'Registration successful. Awaiting admin approval for requested roles.',
      userId: newUser.id,
    });
  } catch (error) {
    console.error('Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
