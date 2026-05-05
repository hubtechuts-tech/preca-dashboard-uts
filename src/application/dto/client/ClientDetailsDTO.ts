/**
 * Application Layer - Client Details DTO
 * Data Transfer Object for client details with screenings
 */

import { ClientWithScreenings } from '../../../domain/interfaces/repositories/IUserRepository';

export interface ScreeningSummaryDTO {
  id: string;
  serviceId: number;
  serviceName: string;
  status: string;
  applicantName: string;
  applicantEmail: string;
  paymentAmount: number | null;
  createdAt: string;
  completedAt: string | null;
  reportUrl: string | null;
}

export interface ClientDetailsDTO {
  user: {
    id: string;
    email: string;
    fullName: string | null;
    phoneNumber: string | null;
    createdAt: string;
  };
  totalScreenings: number;
  pendingScreenings: number;
  completedScreenings: number;
  totalSpent: number;
  lastScreeningDate: string | null;
  screenings: ScreeningSummaryDTO[];
}

export class ClientDetailsDTOMapper {
  static fromDomain(clientWithScreenings: ClientWithScreenings): ClientDetailsDTO {
    return {
      user: {
        id: clientWithScreenings.user.id,
        email: clientWithScreenings.user.email,
        fullName: clientWithScreenings.user.fullName,
        phoneNumber: clientWithScreenings.user.phoneNumber,
        createdAt: clientWithScreenings.user.createdAt.toISOString(),
      },
      totalScreenings: clientWithScreenings.totalScreenings,
      pendingScreenings: clientWithScreenings.pendingScreenings,
      completedScreenings: clientWithScreenings.completedScreenings,
      totalSpent: clientWithScreenings.totalSpent,
      lastScreeningDate: clientWithScreenings.lastScreeningDate?.toISOString() || null,
      screenings: clientWithScreenings.screenings.map(s => ({
        id: s.id,
        serviceId: s.serviceId,
        serviceName: s.serviceName,
        status: s.status,
        applicantName: s.applicantName,
        applicantEmail: s.applicantEmail,
        paymentAmount: s.paymentAmount,
        createdAt: s.createdAt.toISOString(),
        completedAt: s.completedAt?.toISOString() || null,
        reportUrl: s.reportUrl,
      })),
    };
  }
}
