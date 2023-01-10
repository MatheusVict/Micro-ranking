import { Module } from '@nestjs/common';
import { RankingsModule } from './rankings/rankings.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.BD_CONNECTION_URI, {
      autoCreate: true,
      autoIndex: true,
    }),
    RankingsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
