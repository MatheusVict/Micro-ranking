import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MatchInterface } from './interfaces/match.interface';

@Injectable()
export class RankingsService {
  private readonly logger = new Logger(RankingsService.name);

  async processMatch(idMatch: string, match: MatchInterface): Promise<void> {
    this.logger.log(`O ID: ${idMatch} da Partida: ${JSON.stringify(match)}`);
  }
}
