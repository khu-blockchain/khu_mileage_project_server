import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';

import { AppConfigModule } from '@/config/config.module';
import { AdminModule } from '@/modules/admin/admin.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { MileageModule } from '@/modules/mileage/mileage.module';
import { MileagePointHistoryModule } from '@/modules/mileage-point-history/mileage-point-history.module';
import { MileageRubricModule } from '@/modules/mileage-rubric/mileage-rubric.module';
import { PollingModule } from '@/modules/polling/polling.module';
import { StudentModule } from '@/modules/student/student.module';
import { WalletLostModule } from '@/modules/wallet-lost/wallet-lost.module';
import { SharedModule } from '@/shared/shared.module';

const imports: any[] = [];

const coreImports = [
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
      const ds = new DataSource(options)
      if (!ds.isInitialized) {
        await ds.initialize()
      }
      try{
        return addTransactionalDataSource(ds);
      }
      catch (e:any){
        if(String(e?.message || e).includes("has already added")){
          return ds;
        }
        throw e;
      }
      //return addTransactionalDataSource(new DataSource(options));
    },
  }),
  SharedModule,
];

const mainImports = [
  ...coreImports,
  AuthModule,
  StudentModule,
  AdminModule,
  MileageRubricModule,
  MileageModule,
  WalletLostModule,
  MileagePointHistoryModule,
];

const pollerImports = [
  ...coreImports,
  StudentModule,
  AdminModule,
  MileageRubricModule,
  MileageModule,
  WalletLostModule,
  MileagePointHistoryModule,
  PollingModule,
];

if (process.env.APP_TYPE === 'poller') {
  imports.push(...pollerImports);
} else {
  // APP_TYPE이 'main'이거나 설정되지 않은 경우 main app 모듈들을 로드
  imports.push(...mainImports);
}

@Module({
  imports,
  controllers: [],
})
export class AppModule {}
