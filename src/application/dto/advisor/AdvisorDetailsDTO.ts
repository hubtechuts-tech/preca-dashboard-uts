/**
 * Application Layer - Advisor Details DTO
 * Data Transfer Object for advisor details with screenings
 */

import { AdvisorWithScreenings } from '../../../domain/interfaces/repositories/IAdvisorRepository';

export interface AdvisorScreeningSummaryDTO {
  id: string;
  serviceId: number;
  serviceName: string;
  status: string;
  applicantName: string;
  applicantEmail: string;
  clientName: string | null;
  clientEmail: string | null;
  paymentAmount: number | null;
  createdAt: string;
  completedAt: string | null;
  reportUrl: string | null;
}

export interface AdvisorDetailsDTO {
  advisor: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
    isActive: boolean;
    createdAt: string;
  };
  totalScreenings: number;
  completedScreenings: number;
  pendingScreenings: number;
  totalRevenue: number;
  lastActivityDate: string | null;
  screenings: AdvisorScreeningSummaryDTO[];
}

export class AdvisorDetailsDTOMapper {
  static fromDomain(advisorWithScreenings: AdvisorWithScreenings): AdvisorDetailsDTO {
    return {
      advisor: {
        id: advisorWithScreenings.advisor.id,
        name: advisorWithScreenings.advisor.name,
        email: advisorWithScreenings.advisor.email,
        phoneNumber: advisorWithScreenings.advisor.phoneNumber,
        isActive: advisorWithScreenings.advisor.isActive,
        createdAt: advisorWithScreenings.advisor.createdAt.toISOString(),
      },
      totalScreenings: advisorWithScreenings.totalScreenings,
      completedScreenings: advisorWithScreenings.completedScreenings,
      pendingScreenings: advisorWithScreenings.pendingScreenings,
      totalRevenue: advisorWithScreenings.totalRevenue,
      lastActivityDate: advisorWithScreenings.lastActivityDate?.toISOString() || null,
      screenings: advisorWithScreenings.screenings.map(s => ({
        id: s.id,
        serviceId: s.serviceId,
        serviceName: s.serviceName,
        status: s.status,
        applicantName: s.applicantName,
        applicantEmail: s.applicantEmail,
        clientName: s.clientName,
        clientEmail: s.clientEmail,
        paymentAmount: s.paymentAmount,
        createdAt: s.createdAt.toISOString(),
        completedAt: s.completedAt?.toISOString() || null,
        reportUrl: s.reportUrl,
      })),
    };
  }
}
