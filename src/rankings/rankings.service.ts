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
import {
  Historic,
  RankingResponse,
} from './interfaces/ranking-response.interface';
import * as momentTimezone from 'moment-timezone';
import * as _ from 'lodash';
import { ChallengeInterface } from './interfaces/challenge.interface';

@Injectable()
export class RankingsService {
  constructor(
    @InjectModel('rankings')
    private readonly rankingsModel: Model<Ranking>,
    private readonly clientProxySmartRanking: ClientProxySmartRanking,
  ) {}

  private clientAdminBackEnd =
    this.clientProxySmartRanking.getClientProxyAdminBackendInstance();

  private clientChallenges =
    this.clientProxySmartRanking.getClientProxyChallengesInstance();

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

  async getRankingForId(
    idCategory: string,
    dataRef: string,
  ): Promise<RankingResponse[] | RankingResponse> {
    try {
      this.logger.log(`o ID da cetegoria ${idCategory} com a data ${dataRef}`);

      if (!dataRef) {
        dataRef = momentTimezone().tz('America/Sao_Paulo').format('YYYY-MM-DD');
        this.logger.log(dataRef);
      }

      /*Recuperou registros de partidas processadas com base na categoria,
        filtrando a categoria recebida na requisição
      */
      const rankingRegister = await this.rankingsModel
        .find()
        .where('category')
        .equals(idCategory);

      /*
        Agora vamos recuperar todos os desafios com data menor ou igual
        a data q recebemos na requisição {dataRef}.
        Somente iremos recuperar desafios q estiverem com o status igual
        a 'REALIZADO' e filtrando a categoria
      */

      const challenges: ChallengeInterface[] = await firstValueFrom(
        this.clientChallenges.send('consultar-desafio-realizado', {
          idCategory,
          dataRef,
        }),
      );

      this.logger.log(`Challhenges: ${JSON.stringify(challenges)}`);

      /*
        Realizaremos um loop dos resgistros que recuperamos do ranking {partidas processada}
        e descartaremos os registros(com base no id do desafio) q não retornaram no objeto desafio
      */

      _.remove(rankingRegister, function (item) {
        return (
          challenges.filter((challenge) => (challenge._id = item.challenge))
            .length == 0
        );
      });

      this.logger.log(
        `RegistroRanking novo ${JSON.stringify(rankingRegister)}`,
      );

      /*
      Agrupar por jogador
      */
      // A primeria chave do array é o parametro da busca(q aqui no caso foi o jogador)
      const result = _(rankingRegister)
        .groupBy('player')
        .map((items, key) => ({
          jogador: key,
          historico: _.countBy(items, 'event'),
          pontos: _.sumBy(items, 'points'),
        }))
        .value();

      // Ordem dos paramêtros: oq vai ordenar, em q campo, em q ordem
      const resultOrder = _.orderBy(result, 'points', 'desc');

      this.logger.log(`Resultado: ${JSON.stringify(resultOrder)}`);

      const rankingResponseList: RankingResponse[] = [];
      resultOrder.map(function (item, index) {
        const rankingResponse: RankingResponse = {};
        rankingResponse.player = item.jogador;
        rankingResponse.position = index + 1;
        rankingResponse.score = item.pontos;

        const historic: Historic = {};
        historic.victories = item.historico.VITORIA
          ? item.historico.VITORIA
          : 0;
        historic.defeats = item.historico.DERROTA ? item.historico.DERROTA : 0;
        rankingResponse.historicMatch = historic;

        rankingResponseList.push(rankingResponse);
      });

      return rankingResponseList;
    } catch (error) {
      this.logger.error(`Erro ${JSON.stringify(error.message)}`);
      throw new RpcException(error.message);
    }
  }
}
