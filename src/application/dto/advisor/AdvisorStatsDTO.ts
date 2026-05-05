/**
 * Application Layer - Advisor Stats DTO
 * Data Transfer Object for advisor statistics
 */

import { AdvisorStats } from '../../../domain/interfaces/repositories/IAdvisorRepository';

export interface AdvisorStatsDTO {
  advisor: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
  };
  totalScreenings: number;
  completedScreenings: number;
  pendingScreenings: number;
  totalRevenue: number;
  lastActivityDate: string | null;
}

export class AdvisorStatsDTOMapper {
  static fromDomain(stats: AdvisorStats): AdvisorStatsDTO {
    return {
      advisor: {
        id: stats.advisor.id,
        name: stats.advisor.name,
        email: stats.advisor.email,
        phoneNumber: stats.advisor.phoneNumber,
      },
      totalScreenings: stats.totalScreenings,
      completedScreenings: stats.completedScreenings,
      pendingScreenings: stats.pendingScreenings,
      totalRevenue: stats.totalRevenue,
      lastActivityDate: stats.lastActivityDate?.toISOString() || null,
    };
  }

  static fromDomainList(statsList: AdvisorStats[]): AdvisorStatsDTO[] {
    return statsList.map(stats => this.fromDomain(stats));
  }
}
