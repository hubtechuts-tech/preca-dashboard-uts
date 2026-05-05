/**
 * Presentation Layer - Report Data Route
 *
 * POST /api/screenings/[id]/report-data - Save report data for dynamic PDF generation
 * GET /api/screenings/[id]/report-data - Get current report data
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, UnauthorizedError, ForbiddenError } from '@/lib/api-auth';
import { Permission } from '@/domain/entities/Permission';
import { SaveReportDataUseCase } from '@/application/use-cases/report/SaveReportDataUseCase';
import { GetScreeningByIdUseCase } from '@/application/use-cases/screening/GetScreeningByIdUseCase';
import { SaveReportDataDTO } from '@/application/dto/report/ReportDTO';
import { PrismaScreeningRepository } from '@/infrastructure/database/repositories/PrismaScreeningRepository';
import { PrismaServiceCatalogRepository } from '@/infrastructure/database/repositories/PrismaServiceCatalogRepository';
import { prisma } from '@/infrastructure/database/PrismaClient';
import { ReportSchemaValidationError } from '@/domain/errors/ReportErrors';
import { ZodError } from 'zod';

/**
 * POST /api/screenings/[id]/report-data
 * Save report data for a screening
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const session = await requirePermission(request, Permission.SCREENINGS_WRITE);
    const body = await request.json();

    // Create DTO with validation
    const dto = new SaveReportDataDTO({
      screeningId: id,
      reportData: body.reportData
    });

    // Create use case with dependencies
    const screeningRepository = new PrismaScreeningRepository(prisma);
    const serviceRepository = new PrismaServiceCatalogRepository(prisma);
    const useCase = new SaveReportDataUseCase(screeningRepository, serviceRepository);

    // Execute
    const result = await useCase.execute(dto, session.userId);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    if (error instanceof ReportSchemaValidationError) {
      return NextResponse.json(
        { error: error.message, validationErrors: error.validationErrors },
        { status: 400 }
      );
    }
    console.error('Error in POST /api/screenings/[id]/report-data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/screenings/[id]/report-data
 * Get current report data for a screening
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await requirePermission(request, Permission.SCREENINGS_READ);

    const screeningRepository = new PrismaScreeningRepository(prisma);
    const serviceRepository = new PrismaServiceCatalogRepository(prisma);
    const useCase = new GetScreeningByIdUseCase(screeningRepository);

    const screening = await useCase.execute(id);
    if (!screening) {
      return NextResponse.json(
        { error: 'Screening no encontrado' },
        { status: 404 }
      );
    }

    // Get service to include report schema
    const service = await serviceRepository.findById(screening.serviceId);

    return NextResponse.json({
      screeningId: screening.id,
      reportData: screening.reportData,
      hasReportData: screening.hasReportData(),
      reportSchema: service?.reportSchema?.toJSON() || null,
      hasReportSchema: service?.hasReportSchema() || false
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error in GET /api/screenings/[id]/report-data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
