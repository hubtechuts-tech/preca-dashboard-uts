/**
 * DELETE /api/admin/screenings/[id]/delete
 * Admin endpoint to delete a screening
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { Permission } from '@/domain/entities/Permission';
import { DeleteScreeningUseCase } from '@/application/use-cases/screening/DeleteScreeningUseCase';
import { PrismaScreeningRepository } from '@/infrastructure/database/repositories/PrismaScreeningRepository';
import { prisma } from '@/infrastructure/database/PrismaClient';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    await requirePermission(request, Permission.SCREENINGS_WRITE);

    const { id: screeningId } = await params;

    // Initialize dependencies
    const screeningRepository = new PrismaScreeningRepository(prisma);
    const deleteScreeningUseCase = new DeleteScreeningUseCase(screeningRepository);

    // Execute use case
    await deleteScreeningUseCase.execute(screeningId);

    return NextResponse.json(
      { message: 'Screening deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting screening:', error);

    if (error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error.name === 'ForbiddenError') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    if (error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to delete screening' },
      { status: 500 }
    );
  }
}
