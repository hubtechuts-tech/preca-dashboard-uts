/**
 * PrismaServiceCatalogRepository
 *
 * Infrastructure layer implementation of IServiceCatalogRepository
 * Maps between Prisma models and domain entities
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { IServiceCatalogRepository } from '../../../domain/interfaces/repositories/IServiceCatalogRepository';
import { ServiceCatalog, PersonType } from '../../../domain/entities/ServiceCatalog';
import { FormSchema } from '../../../domain/value-objects/FormSchema';
import { ReportSchema } from '../../../domain/value-objects/ReportSchema';

export class PrismaServiceCatalogRepository implements IServiceCatalogRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: number): Promise<ServiceCatalog | null> {
    const record = await this.prisma.service_catalog.findUnique({
      where: { id }
    });

    if (!record) return null;

    return this.toDomain(record);
  }

  async findByCode(code: string): Promise<ServiceCatalog | null> {
    const record = await this.prisma.service_catalog.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!record) return null;

    return this.toDomain(record);
  }

  async findAllActive(): Promise<ServiceCatalog[]> {
    const records = await this.prisma.service_catalog.findMany({
      where: { is_active: true },
      orderBy: { created_at: 'asc' }
    });

    return records.map(record => this.toDomain(record));
  }

  async findActiveByPersonType(personType: PersonType): Promise<ServiceCatalog[]> {
    const records = await this.prisma.service_catalog.findMany({
      where: {
        is_active: true,
        target_person_type: personType
      },
      orderBy: { created_at: 'asc' }
    });

    return records.map(record => this.toDomain(record));
  }

  async findAll(): Promise<ServiceCatalog[]> {
    const records = await this.prisma.service_catalog.findMany({
      orderBy: { created_at: 'asc' }
    });

    return records.map(record => this.toDomain(record));
  }

  async save(service: ServiceCatalog): Promise<void> {
    const data = this.toPrisma(service);
    const { id, ...createData } = data;

    // Use code as unique identifier for upsert (handles id: 0 case)
    await this.prisma.service_catalog.upsert({
      where: { code: service.code },
      update: data,
      create: createData
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.service_catalog.delete({
      where: { id }
    });
  }

  async existsByCode(code: string): Promise<boolean> {
    const count = await this.prisma.service_catalog.count({
      where: { code: code.toUpperCase() }
    });

    return count > 0;
  }

  /**
   * Maps Prisma model to Domain entity
   */
  private toDomain(record: any): ServiceCatalog {
    // Parse form_schema from JSON to FormSchema
    let formSchema: FormSchema | null = null;
    if (record.form_schema) {
      try {
        formSchema = FormSchema.fromJSON(record.form_schema);
      } catch (error) {
        console.error('Error parsing form_schema for service', record.id, ':', error);
        // Keep as null if invalid
      }
    }

    // Parse report_schema from JSON to ReportSchema
    let reportSchema: ReportSchema | null = null;
    if (record.report_schema) {
      try {
        reportSchema = ReportSchema.fromJSON(record.report_schema);
      } catch (error) {
        console.error('Error parsing report_schema for service', record.id, ':', error);
        // Keep as null if invalid
      }
    }

    return ServiceCatalog.reconstitute({
      id: record.id,
      code: record.code,
      name: record.name,
      description: record.description,
      priceMxn: parseFloat(record.price_mxn.toString()),
      targetPersonType: record.target_person_type as PersonType,
      stripeProductId: record.stripe_product_id,
      stripePriceId: record.stripe_price_id,
      isActive: record.is_active,
      formSchema,
      reportSchema,
      requiresApplicantDetails: record.requires_applicant_details || false,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    });
  }

  /**
   * Maps Domain entity to Prisma model
   */
  private toPrisma(domain: ServiceCatalog) {
    // Convert FormSchema to plain JSON object for Prisma
    const formSchemaData = domain.formSchema
      ? JSON.parse(JSON.stringify(domain.formSchema.toJSON()))
      : Prisma.DbNull;

    // Convert ReportSchema to plain JSON object for Prisma
    const reportSchemaData = domain.reportSchema
      ? JSON.parse(JSON.stringify(domain.reportSchema.toJSON()))
      : Prisma.DbNull;

    return {
      id: domain.id,
      code: domain.code,
      name: domain.name,
      description: domain.description,
      price_mxn: domain.priceMxn,
      target_person_type: domain.targetPersonType,
      stripe_product_id: domain.stripeProductId,
      stripe_price_id: domain.stripePriceId,
      is_active: domain.isActive,
      form_schema: formSchemaData,
      report_schema: reportSchemaData,
      requires_applicant_details: domain.requiresApplicantDetails,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt
    };
  }
}
