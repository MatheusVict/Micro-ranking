import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MatchInterface } from './interfaces/match.interface';
import { Ranking } from './interfaces/ranking.schema';
import { RpcException } from '@nestjs/microservices';
import { ClientProxySmartRanking } from 'src/proxymq/client-proxy.proxymq';
import { firstValueFrom } from 'rxjs';
import { CategoriesInterface } from './interfaces/categories.interface';
import { EventName } from './enum/events.enum';

@Injectable()
export class RankingsService {
  constructor(
    @InjectModel('rankings')
    private readonly rankingsModel: Model<Ranking>,
    private readonly clientProxySmartRanking: ClientProxySmartRanking,
  ) {}

  private clientAdminBackEnd =
    this.clientProxySmartRanking.getClientProxyAdminBackendInstance();

  private readonly logger = new Logger(RankingsService.name);

  async processMatch(idMatch: string, match: MatchInterface): Promise<void> {
    try {
      const category: CategoriesInterface = await firstValueFrom(
        this.clientAdminBackEnd.send('pegar-categoria', match.category),
      );

      await Promise.all(
        match.players.map(async (player) => {
          const ranking = new this.rankingsModel();

          ranking.category = match.category;
          ranking.challenge = match.challenge;
          ranking.match = idMatch;
          ranking.player = player;

          if (player == match.def) {
            const eventFilter = category.events.filter(
              (event) => event.name == EventName.VITORIA,
            );

            ranking.event = EventName.VITORIA;
            ranking.operetion = eventFilter[0].operetion;
            ranking.points = eventFilter[0].value;

            /*ranking.event = 'VITÓRIA';
            ranking.points = 30;
            ranking.operetion = '+';*/
          } else {
            const eventFilter = category.events.filter(
              (event) => event.name == EventName.DERROTA,
            );

            ranking.event = EventName.DERROTA;
            ranking.operetion = eventFilter[0].operetion;
            ranking.points = eventFilter[0].value;
            /*ranking.event = 'DERROTA';
            ranking.points = 0;
            ranking.operetion = '+';*/
          }

          this.logger.log(`Ranking: ${JSON.stringify(ranking)}`);

          await ranking.save();
        }),
      );
    } catch (error) {
      this.logger.error(`Erro no map: ${JSON.stringify(error)}`);
      throw new RpcException(error.message);
    }
  }
}
