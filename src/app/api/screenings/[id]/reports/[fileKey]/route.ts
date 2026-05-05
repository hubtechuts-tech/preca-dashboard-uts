/**
 * Presentation Layer - Delete Report Route
 *
 * DELETE /api/screenings/[id]/reports/[fileKey] - Delete a specific report
 */

import { NextRequest, NextResponse } from 'next/server';
import { DeleteReportUseCase } from '@/application/use-cases/report/DeleteReportUseCase';
import { PrismaScreeningRepository } from '@/infrastructure/database/repositories/PrismaScreeningRepository';
import { SupabaseStorageService } from '@/infrastructure/services/SupabaseStorageService';
import { prisma } from '@/infrastructure/database/PrismaClient';
import { requirePermission, UnauthorizedError, ForbiddenError } from '@/lib/api-auth';
import { Permission } from '@/domain/entities/Permission';

/**
 * DELETE /api/screenings/[id]/reports/[fileKey]
 * Delete a specific report from a screening
 * Requires admin authentication with SCREENINGS_WRITE permission
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileKey: string }> }
) {
  const { id, fileKey } = await params;

  try {
    // Require admin authentication with write permission
    const session = await requirePermission(request, Permission.SCREENINGS_WRITE);

    // Create dependencies
    const screeningRepository = new PrismaScreeningRepository(prisma);
    const fileStorageService = SupabaseStorageService.getInstance();

    // Create use case and execute
    const useCase = new DeleteReportUseCase(screeningRepository, fileStorageService);
    const result = await useCase.execute(
      {
        screeningId: id,
        fileKey: decodeURIComponent(fileKey)
      },
      session.userId
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error) {
      // Handle known errors
      if (error.message.includes('no encontrado')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      console.error('Error deleting report:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Unexpected error in DELETE /api/screenings/[id]/reports/[fileKey]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
