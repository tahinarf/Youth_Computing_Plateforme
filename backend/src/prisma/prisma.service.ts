/*import { Injectable } from '@nestjs/common';

@Injectable()
export class PrismaService {}
*/
/*
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}*/import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from '../../prisma/contract.d.ts';
import contractJson from '../../prisma/contract.json' with { type: 'json' };

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly db = postgres<Contract>({
    contractJson,
    url: process.env.DATABASE_URL,
  });

  async onModuleInit() {
    await this.db.connect();
  }

  async onModuleDestroy() {
    // Prisma 8 Postgres runtime ne fournit pas disconnect().
  }

  get client() {
    return this.db;
  }
}