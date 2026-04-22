import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StockMovementType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const totals = await this.prisma.stockMovement.groupBy({
      by: ['type'],
      where: { productId },
      _sum: { quantity: true },
    });

    const inTotal =
      totals.find((t) => t.type === StockMovementType.IN)?._sum.quantity ?? 0;
    const outTotal =
      totals.find((t) => t.type === StockMovementType.OUT)?._sum.quantity ?? 0;

    return {
      ...product,
      balance: inTotal - outTotal,
    };
  }

  async create(dto: CreateProductDto) {
    try {
      return await this.prisma.product.create({
        data: {
          sku: dto.sku,
          name: dto.name,
          unitPrice: new Prisma.Decimal(dto.unitPrice),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('SKU already exists');
      }
      throw error;
    }
  }

  async update(productId: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    try {
      return await this.prisma.product.update({
        where: { id: productId },
        data: {
          sku: dto.sku,
          name: dto.name,
          unitPrice:
            dto.unitPrice !== undefined
              ? new Prisma.Decimal(dto.unitPrice)
              : undefined,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('SKU already exists');
      }
      throw error;
    }
  }
}
