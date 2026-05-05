/**
 * Infrastructure Layer - Prisma Advisor Repository
 * Implements IAdvisorRepository using Prisma
 */

import { PrismaClient } from '@prisma/client';
import {
  IAdvisorRepository,
  AdvisorWithScreenings,
  AdvisorStats,
  AdvisorScreeningSummary
} from '../../../domain/interfaces/repositories/IAdvisorRepository';
import { Advisor } from '../../../domain/entities/Advisor';

export class PrismaAdvisorRepository implements IAdvisorRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: number): Promise<Advisor | null> {
    const advisor = await this.prisma.advisors.findUnique({
      where: { id },
    });

    if (!advisor) return null;

    return Advisor.reconstitute({
      id: advisor.id,
      name: advisor.name,
      email: advisor.email,
      phoneNumber: advisor.phone_number,
      isActive: advisor.is_active,
      createdAt: advisor.created_at,
      updatedAt: advisor.updated_at,
    });
  }

  async findByEmail(email: string): Promise<Advisor | null> {
    const advisor = await this.prisma.advisors.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!advisor) return null;

    return Advisor.reconstitute({
      id: advisor.id,
      name: advisor.name,
      email: advisor.email,
      phoneNumber: advisor.phone_number,
      isActive: advisor.is_active,
      createdAt: advisor.created_at,
      updatedAt: advisor.updated_at,
    });
  }

  async findByPhoneNumber(phoneNumber: string): Promise<Advisor | null> {
    const advisor = await this.prisma.advisors.findFirst({
      where: { phone_number: phoneNumber.trim() },
    });

    if (!advisor) return null;

    return Advisor.reconstitute({
      id: advisor.id,
      name: advisor.name,
      email: advisor.email,
      phoneNumber: advisor.phone_number,
      isActive: advisor.is_active,
      createdAt: advisor.created_at,
      updatedAt: advisor.updated_at,
    });
  }

  async findByPhoneAndName(phoneNumber: string, name: string): Promise<Advisor | null> {
    const normalizedPhoneNumber = this._normalizePhoneNumber(phoneNumber);
    const normalizedName = name.toLowerCase().trim();

    const advisor = await this.prisma.advisors.findFirst({
      where: {
        phone_number: normalizedPhoneNumber,
        name: {
          equals: normalizedName,
          mode: 'insensitive',
        },
      },
    });

    if (!advisor) return null;

    return Advisor.reconstitute({
      id: advisor.id,
      name: advisor.name,
      email: advisor.email,
      phoneNumber: advisor.phone_number,
      isActive: advisor.is_active,
      createdAt: advisor.created_at,
      updatedAt: advisor.updated_at,
    });
  }

  async findOrCreateByPhoneAndName(
    phoneNumber: string,
    name: string,
    email?: string
  ): Promise<Advisor> {
    // First try to find by phone number
    const existing = await this.findByPhoneNumber(phoneNumber);
    if (existing) {
      return existing;
    }

    // If not found, create new advisor
    // Generate email if not provided
    const advisorEmail = email || `advisor_${phoneNumber}@preca.temp`;

    const newAdvisor = Advisor.create(name, advisorEmail, phoneNumber);
    return this.save(newAdvisor);
  }

  async findAllActive(limit?: number, offset?: number): Promise<Advisor[]> {
    const advisors = await this.prisma.advisors.findMany({
      where: { is_active: true },
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
    });

    return advisors.map(advisor =>
      Advisor.reconstitute({
        id: advisor.id,
        name: advisor.name,
        email: advisor.email,
        phoneNumber: advisor.phone_number,
        isActive: advisor.is_active,
        createdAt: advisor.created_at,
        updatedAt: advisor.updated_at,
      })
    );
  }

  async findAll(limit?: number, offset?: number): Promise<Advisor[]> {
    const advisors = await this.prisma.advisors.findMany({
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
    });

    return advisors.map(advisor =>
      Advisor.reconstitute({
        id: advisor.id,
        name: advisor.name,
        email: advisor.email,
        phoneNumber: advisor.phone_number,
        isActive: advisor.is_active,
        createdAt: advisor.created_at,
        updatedAt: advisor.updated_at,
      })
    );
  }

  async save(advisor: Advisor): Promise<Advisor> {
    const data = {
      name: advisor.name,
      email: advisor.email,
      phone_number: advisor.phoneNumber,
      is_active: advisor.isActive,
      updated_at: new Date(),
    };

    let saved;
    if (advisor.id === 0) {
      // Create new advisor
      saved = await this.prisma.advisors.create({
        data,
      });
    } else {
      // Update existing advisor
      saved = await this.prisma.advisors.update({
        where: { id: advisor.id },
        data,
      });
    }

    return Advisor.reconstitute({
      id: saved.id,
      name: saved.name,
      email: saved.email,
      phoneNumber: saved.phone_number,
      isActive: saved.is_active,
      createdAt: saved.created_at,
      updatedAt: saved.updated_at,
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.advisors.delete({
      where: { id },
    });
  }

  async findAdvisorWithScreeningsById(id: number): Promise<AdvisorWithScreenings | null> {
    const advisor = await this.prisma.advisors.findUnique({
      where: { id },
      include: {
        screenings: {
          include: {
            service_catalog: true,
            users_screenings_user_idTousers: true,
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!advisor) return null;

    const reconstitutedAdvisor = Advisor.reconstitute({
      id: advisor.id,
      name: advisor.name,
      email: advisor.email,
      phoneNumber: advisor.phone_number,
      isActive: advisor.is_active,
      createdAt: advisor.created_at,
      updatedAt: advisor.updated_at,
    });

    // Calculate statistics
    const totalScreenings = advisor.screenings.length;
    const completedScreenings = advisor.screenings.filter(
      (s) => s.status === 'completed'
    ).length;
    const pendingScreenings = advisor.screenings.filter(
      (s) => s.status !== 'completed' && s.status !== 'rejected'
    ).length;
    const totalRevenue = advisor.screenings
      .filter((s) => s.payment_amount !== null)
      .reduce((sum, s) => sum + Number(s.payment_amount || 0), 0);
    const lastActivityDate = advisor.screenings.length > 0
      ? advisor.screenings[0].created_at
      : null;

    // Map screenings to summary
    const screenings: AdvisorScreeningSummary[] = advisor.screenings.map((s) => ({
      id: s.id,
      serviceId: s.service_id,
      serviceName: s.service_catalog?.name || 'Unknown Service',
      status: s.status,
      applicantName: s.applicant_name,
      applicantEmail: s.applicant_email,
      clientName: s.users_screenings_user_idTousers?.full_name || null,
      clientEmail: s.users_screenings_user_idTousers?.email || null,
      paymentAmount: s.payment_amount ? Number(s.payment_amount) : null,
      createdAt: s.created_at,
      completedAt: s.completed_at,
      reportUrl: s.report_url,
    }));

    return {
      advisor: reconstitutedAdvisor,
      totalScreenings,
      completedScreenings,
      pendingScreenings,
      totalRevenue,
      lastActivityDate,
      screenings,
    };
  }

  async getTopAdvisorsByScreenings(limit: number): Promise<AdvisorStats[]> {
    const advisors = await this.prisma.advisors.findMany({
      where: { is_active: true },
      include: {
        screenings: {
          select: {
            id: true,
            status: true,
            payment_amount: true,
            created_at: true,
          },
        },
      },
    });

    // Calculate stats for each advisor
    const advisorStats: AdvisorStats[] = advisors.map((advisor) => {
      const reconstitutedAdvisor = Advisor.reconstitute({
        id: advisor.id,
        name: advisor.name,
        email: advisor.email,
        phoneNumber: advisor.phone_number,
        isActive: advisor.is_active,
        createdAt: advisor.created_at,
        updatedAt: advisor.updated_at,
      });

      const totalScreenings = advisor.screenings.length;
      const completedScreenings = advisor.screenings.filter(
        (s) => s.status === 'completed'
      ).length;
      const pendingScreenings = advisor.screenings.filter(
        (s) => s.status !== 'completed' && s.status !== 'rejected'
      ).length;
      const totalRevenue = advisor.screenings
        .filter((s) => s.payment_amount !== null)
        .reduce((sum, s) => sum + Number(s.payment_amount || 0), 0);
      const lastActivityDate = advisor.screenings.length > 0
        ? advisor.screenings.reduce((latest, s) =>
            s.created_at > latest ? s.created_at : latest,
            advisor.screenings[0].created_at
          )
        : null;

      return {
        advisor: reconstitutedAdvisor,
        totalScreenings,
        completedScreenings,
        pendingScreenings,
        totalRevenue,
        lastActivityDate,
      };
    });

    // Sort by total screenings descending and return top N
    return advisorStats
      .sort((a, b) => b.totalScreenings - a.totalScreenings)
      .slice(0, limit);
  }

  private _normalizePhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/\D/g, '');
  }
}
