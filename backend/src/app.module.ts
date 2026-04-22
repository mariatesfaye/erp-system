import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CustomersModule } from './customers/customers.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ProductsModule } from './products/products.module';
import { StockMovementsModule } from './stock-movements/stock-movements.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProductsModule,
    StockMovementsModule,
    CustomersModule,
    InvoicesModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
