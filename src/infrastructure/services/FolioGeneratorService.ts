/**
 * Infrastructure Layer - Folio Generator Service
 *
 * Generates unique sequential folio numbers for reports.
 * Format: YYYYMMDD-XXXX (e.g., 20260202-0001)
 */

import { PrismaClient } from '@prisma/client';

export class FolioGeneratorService {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Generate a new unique folio number
   * Format: YYYYMMDD-XXXX
   */
  async generateFolio(): Promise<string> {
    const today = new Date();
    const datePrefix = this.formatDatePrefix(today);

    // Get the count of reports generated today to determine the sequence number
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Count screenings that have report_url (completed reports) created today
    // Or use a simple approach: get the highest folio number for today
    const existingFolios = await this.prisma.screenings.findMany({
      where: {
        report_url: { not: null },
        updated_at: {
          gte: todayStart,
          lt: todayEnd
        }
      },
      select: {
        client_reference_id: true
      }
    });

    // Find the highest sequence number for today
    let maxSequence = 0;
    const todayPattern = new RegExp(`^${datePrefix}-(\\d+)$`);

    for (const screening of existingFolios) {
      if (screening.client_reference_id) {
        const match = screening.client_reference_id.match(todayPattern);
        if (match) {
          const seq = parseInt(match[1], 10);
          if (seq > maxSequence) {
            maxSequence = seq;
          }
        }
      }
    }

    // Also check all screenings (not just today's) to get the absolute max for robustness
    const allFolios = await this.prisma.screenings.findMany({
      where: {
        client_reference_id: {
          startsWith: datePrefix
        }
      },
      select: {
        client_reference_id: true
      }
    });

    for (const screening of allFolios) {
      if (screening.client_reference_id) {
        const match = screening.client_reference_id.match(todayPattern);
        if (match) {
          const seq = parseInt(match[1], 10);
          if (seq > maxSequence) {
            maxSequence = seq;
          }
        }
      }
    }

    const newSequence = maxSequence + 1;
    const sequenceStr = newSequence.toString().padStart(4, '0');

    return `${datePrefix}-${sequenceStr}`;
  }

  /**
   * Generate folio for a specific screening
   * If the screening already has a folio-style client_reference_id, return it
   * Otherwise, generate a new one
   */
  async getOrGenerateFolio(screeningId: string): Promise<string> {
    const screening = await this.prisma.screenings.findUnique({
      where: { id: screeningId },
      select: { client_reference_id: true }
    });

    // Check if existing client_reference_id looks like a folio (YYYYMMDD-XXXX format)
    if (screening?.client_reference_id) {
      const folioPattern = /^\d{8}-\d{4}$/;
      if (folioPattern.test(screening.client_reference_id)) {
        return screening.client_reference_id;
      }
    }

    // Generate new folio
    const newFolio = await this.generateFolio();

    // Update the screening with the new folio
    await this.prisma.screenings.update({
      where: { id: screeningId },
      data: { client_reference_id: newFolio }
    });

    return newFolio;
  }

  /**
   * Format date as YYYYMMDD
   */
  private formatDatePrefix(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Validate folio format
   */
  static isValidFolio(folio: string): boolean {
    return /^\d{8}-\d{4}$/.test(folio);
  }

  /**
   * Parse folio to extract date and sequence
   */
  static parseFolio(folio: string): { date: Date; sequence: number } | null {
    const match = folio.match(/^(\d{4})(\d{2})(\d{2})-(\d{4})$/);
    if (!match) return null;

    const [, year, month, day, seq] = match;
    return {
      date: new Date(parseInt(year), parseInt(month) - 1, parseInt(day)),
      sequence: parseInt(seq, 10)
    };
  }
}

// Singleton instance for convenience
let instance: FolioGeneratorService | null = null;

export function getFolioGeneratorService(prisma?: PrismaClient): FolioGeneratorService {
  if (!instance) {
    instance = new FolioGeneratorService(prisma);
  }
  return instance;
}
