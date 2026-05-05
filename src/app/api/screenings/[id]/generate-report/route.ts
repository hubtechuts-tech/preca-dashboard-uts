/**
 * Presentation Layer - Generate Report Route
 *
 * POST /api/screenings/[id]/generate-report - Generate PDF from saved report data
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, UnauthorizedError, ForbiddenError } from '@/lib/api-auth';
import { Permission } from '@/domain/entities/Permission';
import { GenerateReportUseCase } from '@/application/use-cases/report/GenerateReportUseCase';
import { GenerateReportDTO } from '@/application/dto/report/ReportDTO';
import { PrismaScreeningRepository } from '@/infrastructure/database/repositories/PrismaScreeningRepository';
import { PrismaServiceCatalogRepository } from '@/infrastructure/database/repositories/PrismaServiceCatalogRepository';
import { PuppeteerPdfGeneratorService } from '@/infrastructure/services/PuppeteerPdfGeneratorService';
import { SupabaseStorageService } from '@/infrastructure/services/SupabaseStorageService';
import { prisma } from '@/infrastructure/database/PrismaClient';
import {
  ReportDataNotFoundError,
  TemplateNotFoundError,
  PdfGenerationError
} from '@/domain/errors/ReportErrors';
import { ZodError } from 'zod';

/**
 * POST /api/screenings/[id]/generate-report
 * Generate PDF report from saved report data
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let pdfGeneratorService: PuppeteerPdfGeneratorService | null = null;

  try {
    const session = await requirePermission(request, Permission.SCREENINGS_WRITE);
    const body = await request.json().catch(() => ({}));

    // Create DTO with validation
    const dto = new GenerateReportDTO({
      screeningId: id,
      templateId: body.templateId
    });

    // Create use case with dependencies
    const screeningRepository = new PrismaScreeningRepository(prisma);
    const serviceRepository = new PrismaServiceCatalogRepository(prisma);
    pdfGeneratorService = new PuppeteerPdfGeneratorService();
    const fileStorageService = SupabaseStorageService.getInstance();

    const useCase = new GenerateReportUseCase(
      screeningRepository,
      serviceRepository,
      pdfGeneratorService,
      fileStorageService
    );

    // Execute
    const result = await useCase.execute(dto, session.userId);

    return NextResponse.json(result, { status: 201 });
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
    if (error instanceof ReportDataNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    if (error instanceof TemplateNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    if (error instanceof PdfGenerationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    console.error('Error in POST /api/screenings/[id]/generate-report:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    // Clean up Puppeteer browser instance
    if (pdfGeneratorService) {
      await pdfGeneratorService.close().catch(console.error);
    }
  }
}

/**
 * GET /api/screenings/[id]/generate-report
 * Get available templates for report generation
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

    const screening = await screeningRepository.findById(id);
    if (!screening) {
      return NextResponse.json(
        { error: 'Screening no encontrado' },
        { status: 404 }
      );
    }

    const service = await serviceRepository.findById(screening.serviceId);

    const pdfGeneratorService = new PuppeteerPdfGeneratorService();
    const availableTemplates = pdfGeneratorService.getAvailableTemplates();

    // Determine default template
    const personType = screening.applicantPersonType === 'moral' ? 'pm' : 'pfae';
    const defaultTemplate = service?.reportSchema?.templateId
      || `preca-basic-${personType}`;

    return NextResponse.json({
      screeningId: id,
      hasReportData: screening.hasReportData(),
      canGenerate: screening.hasReportData() && screening.isPaid() && screening.hasSignedAuthorization(),
      defaultTemplate,
      availableTemplates,
      serviceReportSchema: service?.reportSchema?.toJSON() || null
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error in GET /api/screenings/[id]/generate-report:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
