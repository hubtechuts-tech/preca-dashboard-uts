/**
 * Infrastructure Layer - Prisma API Key Repository
 * Implements IApiKeyRepository using Prisma ORM
 */

import { PrismaClient } from '@prisma/client';
import { IApiKeyRepository } from '../../../domain/interfaces/repositories/IApiKeyRepository';
import { ApiKey, ApiKeyProps } from '../../../domain/entities/ApiKey';

export class PrismaApiKeyRepository implements IApiKeyRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<ApiKey | null> {
    const record = await this.prisma.api_keys.findUnique({
      where: { id },
    });

    if (!record) return null;

    return this.toDomain(record);
  }

  async findByHash(keyHash: string): Promise<ApiKey | null> {
    const record = await this.prisma.api_keys.findFirst({
      where: { key_hash: keyHash },
    });

    if (!record) return null;

    return this.toDomain(record);
  }

  async findByUserId(userId: string): Promise<ApiKey[]> {
    const records = await this.prisma.api_keys.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });

    return records.map(record => this.toDomain(record));
  }

  async findActiveByUserId(userId: string): Promise<ApiKey[]> {
    const records = await this.prisma.api_keys.findMany({
      where: {
        user_id: userId,
        is_active: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return records.map(record => this.toDomain(record));
  }

  async save(apiKey: ApiKey): Promise<void> {
    const data = this.toPrisma(apiKey);

    await this.prisma.api_keys.upsert({
      where: { id: apiKey.id },
      update: data,
      create: data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.api_keys.delete({
      where: { id },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.api_keys.updateMany({
      where: { user_id: userId },
      data: { is_active: false },
    });
  }

  /**
   * Maps Prisma model to Domain entity
   */
  private toDomain(record: any): ApiKey {
    const props: ApiKeyProps = {
      id: record.id,
      userId: record.user_id,
      keyPrefix: record.key_prefix,
      keyHash: record.key_hash,
      scopes: record.scopes || [],
      isActive: record.is_active,
      lastUsedAt: record.last_used_at,
      createdAt: record.created_at,
      expiresAt: record.expires_at,
    };

    return ApiKey.reconstitute(props);
  }

  /**
   * Maps Domain entity to Prisma model
   */
  private toPrisma(apiKey: ApiKey) {
    const obj = apiKey.toObject();

    return {
      id: obj.id,
      user_id: obj.userId,
      key_prefix: obj.keyPrefix,
      key_hash: obj.keyHash,
      scopes: obj.scopes,
      is_active: obj.isActive,
      last_used_at: obj.lastUsedAt,
      created_at: obj.createdAt,
      expires_at: obj.expiresAt,
    };
  }
}
