import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceStatus, Prisma, StockMovementType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.invoice.findMany({
      include: { lines: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { lines: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async create(dto: CreateInvoiceDto) {
    this.ensureUniqueProducts(dto.lines.map((line) => line.productId));
    await this.ensureCustomerExists(this.prisma, dto.customerId);

    const products = await this.getProductsByIds(
      this.prisma,
      dto.lines.map((line) => line.productId),
    );

    const invoice = await this.prisma.invoice.create({
      data: {
        customerId: dto.customerId,
        status: InvoiceStatus.DRAFT,
        invoiceNumber: this.generateInvoiceNumber(),
        lines: {
          create: dto.lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: products.get(line.productId)!.unitPrice,
          })),
        },
      },
      include: { lines: true },
    });

    return invoice;
  }

  async update(invoiceId: string, dto: UpdateInvoiceDto) {
    this.ensureUniqueProducts(dto.lines.map((line) => line.productId));

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, status: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    this.ensureDraft(invoice.status);

    await this.ensureCustomerExists(this.prisma, dto.customerId);
    const products = await this.getProductsByIds(
      this.prisma,
      dto.lines.map((line) => line.productId),
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.invoiceLine.deleteMany({ where: { invoiceId } });

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          customerId: dto.customerId,
          lines: {
            create: dto.lines.map((line) => ({
              productId: line.productId,
              quantity: line.quantity,
              unitPrice: products.get(line.productId)!.unitPrice,
            })),
          },
        },
      });

      return tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { lines: true },
      });
    });

    if (!updated) {
      throw new NotFoundException('Invoice not found');
    }

    return updated;
  }

  async issue(invoiceId: string) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { lines: true },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      this.ensureDraft(invoice.status);

      if (invoice.lines.length === 0) {
        throw new BadRequestException('Invoice has no lines');
      }

      for (const line of invoice.lines) {
        const totals = await tx.stockMovement.groupBy({
          by: ['type'],
          where: { productId: line.productId },
          _sum: { quantity: true },
        });

        const inTotal =
          totals.find((t) => t.type === StockMovementType.IN)?._sum.quantity ??
          0;
        const outTotal =
          totals.find((t) => t.type === StockMovementType.OUT)?._sum.quantity ??
          0;

        const available = inTotal - outTotal;

        if (available < line.quantity) {
          throw new ConflictException('Insufficient stock for invoice issue');
        }
      }

      await tx.stockMovement.createMany({
        data: invoice.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          type: StockMovementType.OUT,
          invoiceId: invoice.id,
        })),
      });

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: InvoiceStatus.ISSUED,
          issuedAt: new Date(),
        },
      });

      return tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { lines: true },
      });
    });
  }

  private ensureUniqueProducts(productIds: string[]) {
    const unique = new Set(productIds);
    if (unique.size !== productIds.length) {
      throw new BadRequestException('Duplicate productId in invoice lines');
    }
  }

  private ensureDraft(status: InvoiceStatus) {
    if (status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        'Invoice is already issued and cannot be modified',
      );
    }
  }

  private async ensureCustomerExists(
    client: Prisma.TransactionClient | PrismaService,
    customerId: string,
  ) {
    const customer = await client.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
  }

  private async getProductsByIds(
    client: Prisma.TransactionClient | PrismaService,
    productIds: string[],
  ) {
    const products = await client.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, unitPrice: true },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException('One or more products were not found');
    }

    return new Map(products.map((p) => [p.id, p]));
  }

  private generateInvoiceNumber(): string {
    return `INV-${randomUUID().slice(0, 8).toUpperCase()}`;
  }
}
