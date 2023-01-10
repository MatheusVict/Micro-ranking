import { Controller, Logger } from '@nestjs/common';
import { RankingsService } from './rankings.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { MatchInterface } from './interfaces/match.interface';

const ackErros: string[] = ['E11000'];

@Controller('rankings')
export class RankingsController {
  constructor(private readonly rankingsService: RankingsService) {}

  private readonly logger = new Logger(RankingsController.name);

  @EventPattern('processar-partida')
  async processMatch(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originMessage = context.getMessage();

    try {
      this.logger.log(`Data: ${JSON.stringify(data)}`);
      const idMatch: string = data.idMatch;
      const match: MatchInterface = data.match;
      await this.rankingsService.processMatch(idMatch, match);
      await channel.ack(originMessage);
    } catch (error) {
      this.logger.error(error.message);
      const ackErrosFIlter = ackErros.filter((ackErro) =>
        error.message.includes(ackErro),
      );

      if (ackErrosFIlter.length > 0) await channel.ack(originMessage);
    }
  }
}
