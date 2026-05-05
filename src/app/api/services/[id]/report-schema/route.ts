/**
 * Presentation Layer - Service Report Schema Route
 *
 * GET /api/services/[id]/report-schema - Get report schema for a service
 * PATCH /api/services/[id]/report-schema - Update report schema for a service
 * DELETE /api/services/[id]/report-schema - Remove report schema from a service
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, UnauthorizedError, ForbiddenError } from '@/lib/api-auth';
import { Permission } from '@/domain/entities/Permission';
import { UpdateServiceReportSchemaUseCase } from '@/application/use-cases/service/UpdateServiceReportSchemaUseCase';
import { UpdateServiceReportSchemaDTO } from '@/application/dto/report/ReportDTO';
import { PrismaServiceCatalogRepository } from '@/infrastructure/database/repositories/PrismaServiceCatalogRepository';
import { prisma } from '@/infrastructure/database/PrismaClient';
import { ZodError } from 'zod';

/**
 * GET /api/services/[id]/report-schema
 * Get report schema for a service
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await requirePermission(request, Permission.SERVICES_READ);

    const serviceRepository = new PrismaServiceCatalogRepository(prisma);
    const service = await serviceRepository.findById(parseInt(id));

    if (!service) {
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      serviceId: service.id,
      serviceName: service.name,
      serviceCode: service.code,
      hasReportSchema: service.hasReportSchema(),
      reportSchema: service.reportSchema?.toJSON() || null
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error in GET /api/services/[id]/report-schema:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/services/[id]/report-schema
 * Update report schema for a service
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await requirePermission(request, Permission.SERVICES_WRITE);
    const body = await request.json();

    // Create DTO with validation
    const dto = new UpdateServiceReportSchemaDTO({
      serviceId: parseInt(id),
      reportSchema: body.reportSchema
    });

    // Create use case
    const serviceRepository = new PrismaServiceCatalogRepository(prisma);
    const useCase = new UpdateServiceReportSchemaUseCase(serviceRepository);

    // Execute
    const result = await useCase.execute(dto);

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
        { error: 'Esquema inválido', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error in PATCH /api/services/[id]/report-schema:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/services/[id]/report-schema
 * Remove report schema from a service
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await requirePermission(request, Permission.SERVICES_WRITE);

    // Create DTO with null schema to remove it
    const dto = new UpdateServiceReportSchemaDTO({
      serviceId: parseInt(id),
      reportSchema: null
    });

    // Create use case
    const serviceRepository = new PrismaServiceCatalogRepository(prisma);
    const useCase = new UpdateServiceReportSchemaUseCase(serviceRepository);

    // Execute
    const result = await useCase.execute(dto);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error in DELETE /api/services/[id]/report-schema:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
