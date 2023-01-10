import { Module } from '@nestjs/common';
import { RankingsService } from './rankings.service';
import { RankingsController } from './rankings.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { RankingSchema } from './interfaces/ranking.schema';
import { ProxymqModule } from 'src/proxymq/proxymq.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'rankings', schema: RankingSchema }]),
    ProxymqModule,
  ],
  providers: [RankingsService],
  controllers: [RankingsController],
})
export class RankingsModule {}
