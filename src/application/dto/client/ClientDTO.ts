/**
 * Application Layer - Client DTOs
 * Data Transfer Objects for client operations
 */

export class ClientResponseDTO {
  id: string;
  email: string;
  fullName: string | null;
  isActive: boolean;
  createdAt: Date;
  totalScreenings: number;
  pendingScreenings: number;
  completedScreenings: number;
  totalSpent: number;
  lastScreeningDate: Date | null;

  constructor(data: {
    id: string;
    email: string;
    fullName: string | null;
    isActive: boolean;
    createdAt: Date;
    totalScreenings: number;
    pendingScreenings: number;
    completedScreenings: number;
    totalSpent: number;
    lastScreeningDate: Date | null;
  }) {
    this.id = data.id;
    this.email = data.email;
    this.fullName = data.fullName;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
    this.totalScreenings = data.totalScreenings;
    this.pendingScreenings = data.pendingScreenings;
    this.completedScreenings = data.completedScreenings;
    this.totalSpent = data.totalSpent;
    this.lastScreeningDate = data.lastScreeningDate;
  }

  static fromDomain(clientWithStats: any): ClientResponseDTO {
    return new ClientResponseDTO({
      id: clientWithStats.user.id,
      email: clientWithStats.user.email,
      fullName: clientWithStats.user.fullName,
      isActive: clientWithStats.user.isActive,
      createdAt: clientWithStats.user.createdAt,
      totalScreenings: clientWithStats.totalScreenings,
      pendingScreenings: clientWithStats.pendingScreenings,
      completedScreenings: clientWithStats.completedScreenings,
      totalSpent: clientWithStats.totalSpent,
      lastScreeningDate: clientWithStats.lastScreeningDate,
    });
  }

  get initials(): string {
    if (this.fullName) {
      return this.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return this.email.substring(0, 2).toUpperCase();
  }

  get displayName(): string {
    return this.fullName || this.email;
  }

  get status(): 'active' | 'inactive' | 'new' {
    if (!this.isActive) return 'inactive';
    if (this.totalScreenings === 0) return 'new';
    return 'active';
  }

  get activityLevel(): 'high' | 'medium' | 'low' {
    if (this.totalScreenings >= 10) return 'high';
    if (this.totalScreenings >= 3) return 'medium';
    return 'low';
  }
}
