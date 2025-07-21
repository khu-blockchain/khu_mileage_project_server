import { Module } from '@nestjs/common';
import { SharedModule } from '@/shared/shared.module';
import { AdminModule } from '@/modules/admin/admin.module';
import { AppConfigModule } from '@/config/config.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import { AuthModule } from '@/modules/auth/auth.module';
import { StudentModule } from '@/modules/student/student.module';
import { MileageRubricModule } from '@/modules/mileage-rubric/mileage-rubric.module';
import { MileageModule } from '@/modules/mileage/mileage.module';
import { WalletLostModule } from './modules/wallet-lost/wallet-lost.module';
import { PollingModule } from './modules/polling/polling.module';

const imports: any[] = [];

const baseImports = [
  AppConfigModule,
  TypeOrmModule.forRootAsync({
    imports: [AppConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      type: 'postgres',
      host: configService.get<string>('database.host'),
      port: configService.get<number | undefined>('database.port'),
      database: configService.get<string>('database.name'),
      username: configService.get<string>('database.user'),
      password: configService.get<string>('database.pass'),
      entities: [__dirname + '/modules/**/entities/*.entity{.ts,.js}'],
      timezone: 'Asia/Seoul',
      synchronize: false,
      debug: configService.get<string>('app.env') === 'development',
    }),
    async dataSourceFactory(options) {
      if (!options) {
        throw new Error('Invalid options passed');
      }
      return addTransactionalDataSource(new DataSource(options));
    },
  }),
  SharedModule,
  AuthModule,
  StudentModule,
  AdminModule,
  MileageRubricModule,
  MileageModule,
  WalletLostModule,
];

const pollerImports = [...baseImports, PollingModule];

if (process.env.APP_TYPE === 'poller') imports.push(...pollerImports);
if (process.env.APP_TYPE === 'main') imports.push(...baseImports);

@Module({
  imports,
  controllers: [],
})
export class AppModule {}
