/**
 * Infrastructure Layer - Prisma User Repository
 * Implements IUserRepository using Prisma
 */

import { PrismaClient } from '@prisma/client';
import { IUserRepository, ClientWithStats, ClientWithScreenings, ScreeningSummary } from '../../../domain/interfaces/repositories/IUserRepository';
import { User, UserRole } from '../../../domain/entities/User';
import { Permission } from '../../../domain/entities/Permission';

export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.users.findUnique({
      where: { id },
    });

    if (!user) return null;

    return User.reconstitute({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      passwordHash: user.password_hash,
      fullName: user.full_name,
      phoneNumber: user.phone_number,
      permissions: (user.permissions || []) as Permission[],
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.users.findUnique({
      where: { email },
    });

    if (!user) return null;

    return User.reconstitute({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      passwordHash: user.password_hash,
      fullName: user.full_name,
      phoneNumber: user.phone_number,
      permissions: (user.permissions || []) as Permission[],
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
  }

  async save(user: User): Promise<User> {
    const saved = await this.prisma.users.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        password_hash: user.passwordHash,
        full_name: user.fullName,
        phone_number: user.phoneNumber,
        role: user.role,
        permissions: user.permissions as string[],
        is_active: user.isActive,
        updated_at: new Date(),
      },
      create: {
        id: user.id,
        email: user.email,
        password_hash: user.passwordHash,
        full_name: user.fullName,
        phone_number: user.phoneNumber,
        role: user.role,
        permissions: user.permissions as string[],
        is_active: user.isActive,
      },
    });

    return User.reconstitute({
      id: saved.id,
      email: saved.email,
      role: saved.role as UserRole,
      passwordHash: saved.password_hash,
      fullName: saved.full_name,
      phoneNumber: saved.phone_number,
      permissions: (saved.permissions || []) as Permission[],
      isActive: saved.is_active,
      createdAt: saved.created_at,
      updatedAt: saved.updated_at
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.users.delete({
      where: { id },
    });
  }

  async findAll(limit?: number, offset?: number): Promise<User[]> {
    const users = await this.prisma.users.findMany({
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
    });

    return users.map(user => User.reconstitute({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      passwordHash: user.password_hash,
      fullName: user.full_name,
      phoneNumber: user.phone_number,
      permissions: (user.permissions || []) as Permission[],
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }));
  }

  async findAllStaff(limit?: number, offset?: number): Promise<User[]> {
    const staff = await this.prisma.users.findMany({
      where: { role: 'staff' },
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
    });

    return staff.map(user => User.reconstitute({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      passwordHash: user.password_hash,
      fullName: user.full_name,
      phoneNumber: user.phone_number,
      permissions: (user.permissions || []) as Permission[],
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }));
  }

  async searchStaff(query: string): Promise<User[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const staff = await this.prisma.users.findMany({
      where: {
        role: 'staff',
        OR: [
          { full_name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
      orderBy: { full_name: 'asc' },
    });

    return staff.map(user => User.reconstitute({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      passwordHash: user.password_hash,
      fullName: user.full_name,
      phoneNumber: user.phone_number,
      permissions: (user.permissions || []) as Permission[],
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }));
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.users.count({
      where: { email },
    });
    return count > 0;
  }

  async findAllClientsWithStats(): Promise<ClientWithStats[]> {
    const clients = await this.prisma.users.findMany({
      where: { role: 'client' },
      include: {
        screenings_screenings_user_idTousers: {
          select: {
            status: true,
            payment_amount: true,
            created_at: true,
            completed_at: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return clients.map(client => {
      const screenings = client.screenings_screenings_user_idTousers;

      return {
        user: User.reconstitute({
          id: client.id,
          email: client.email,
          role: client.role as UserRole,
          passwordHash: client.password_hash,
          fullName: client.full_name,
          phoneNumber: client.phone_number,
          permissions: (client.permissions || []) as Permission[],
          isActive: client.is_active,
          createdAt: client.created_at,
          updatedAt: client.updated_at
        }),
        totalScreenings: screenings.length,
        pendingScreenings: screenings.filter(s =>
          s.status === 'pending_payment' || s.status === 'paid' || s.status === 'processing_bureau'
        ).length,
        completedScreenings: screenings.filter(s => s.status === 'completed').length,
        totalSpent: screenings
          .filter(s => s.payment_amount)
          .reduce((sum, s) => sum + Number(s.payment_amount), 0),
        lastScreeningDate: screenings.length > 0
          ? screenings.reduce((latest, s) => {
              const date = s.completed_at || s.created_at;
              return !latest || date > latest ? date : latest;
            }, null as Date | null)
          : null,
      };
    });
  }

  async findClientWithStatsById(userId: string): Promise<ClientWithStats | null> {
    const client = await this.prisma.users.findUnique({
      where: { id: userId, role: 'client' },
      include: {
        screenings_screenings_user_idTousers: {
          select: {
            status: true,
            payment_amount: true,
            created_at: true,
            completed_at: true,
          },
        },
      },
    });

    if (!client) return null;

    const screenings = client.screenings_screenings_user_idTousers;

    return {
      user: User.reconstitute({
        id: client.id,
        email: client.email,
        role: client.role as UserRole,
        passwordHash: client.password_hash,
        fullName: client.full_name,
        phoneNumber: client.phone_number,
        permissions: (client.permissions || []) as Permission[],
        isActive: client.is_active,
        createdAt: client.created_at,
        updatedAt: client.updated_at
      }),
      totalScreenings: screenings.length,
      pendingScreenings: screenings.filter(s =>
        s.status === 'pending_payment' || s.status === 'paid' || s.status === 'processing_bureau'
      ).length,
      completedScreenings: screenings.filter(s => s.status === 'completed').length,
      totalSpent: screenings
        .filter(s => s.payment_amount)
        .reduce((sum, s) => sum + Number(s.payment_amount), 0),
      lastScreeningDate: screenings.length > 0
        ? screenings.reduce((latest, s) => {
            const date = s.completed_at || s.created_at;
            return !latest || date > latest ? date : latest;
          }, null as Date | null)
        : null,
    };
  }

  async searchClients(query: string): Promise<User[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const clients = await this.prisma.users.findMany({
      where: {
        role: 'client',
        OR: [
          { full_name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone_number: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
      orderBy: { full_name: 'asc' },
    });

    return clients.map(user => User.reconstitute({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      passwordHash: user.password_hash,
      fullName: user.full_name,
      phoneNumber: user.phone_number,
      permissions: (user.permissions || []) as Permission[],
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }));
  }

  async findClientWithScreeningsById(userId: string): Promise<ClientWithScreenings | null> {
    const client = await this.prisma.users.findUnique({
      where: { id: userId, role: 'client' },
      include: {
        screenings_screenings_user_idTousers: {
          select: {
            id: true,
            service_id: true,
            status: true,
            applicant_name: true,
            applicant_email: true,
            payment_amount: true,
            created_at: true,
            completed_at: true,
            report_url: true,
            service_catalog: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!client) return null;

    const screenings = client.screenings_screenings_user_idTousers;

    const screeningSummaries: ScreeningSummary[] = screenings.map((s) => ({
      id: s.id,
      serviceId: s.service_id,
      serviceName: s.service_catalog.name,
      status: s.status,
      applicantName: s.applicant_name,
      applicantEmail: s.applicant_email,
      paymentAmount: s.payment_amount ? Number(s.payment_amount) : null,
      createdAt: s.created_at,
      completedAt: s.completed_at,
      reportUrl: s.report_url,
    }));

    return {
      user: User.reconstitute({
        id: client.id,
        email: client.email,
        role: client.role as UserRole,
        passwordHash: client.password_hash,
        fullName: client.full_name,
        phoneNumber: client.phone_number,
        permissions: (client.permissions || []) as Permission[],
        isActive: client.is_active,
        createdAt: client.created_at,
        updatedAt: client.updated_at
      }),
      totalScreenings: screenings.length,
      pendingScreenings: screenings.filter((s) =>
        s.status === 'pending_payment' || s.status === 'paid' || s.status === 'processing_bureau'
      ).length,
      completedScreenings: screenings.filter((s) => s.status === 'completed').length,
      totalSpent: screenings
        .filter((s) => s.payment_amount)
        .reduce((sum, s) => sum + Number(s.payment_amount), 0),
      lastScreeningDate: screenings.length > 0
        ? screenings.reduce((latest, s) => {
            const date = s.completed_at || s.created_at;
            return !latest || date > latest ? date : latest;
          }, null as Date | null)
        : null,
      screenings: screeningSummaries,
    };
  }
}
