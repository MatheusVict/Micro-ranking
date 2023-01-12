import { ChallengeStatus } from '../enum/challenge.enum';

export interface ChallengeInterface {
  _id: string;
  DateTimeChallenge: Date;
  status: ChallengeStatus;
  DateTimeRequest: Date;
  DateTimeResponse?: Date;
  requester: string;
  category: string;
  match?: string;
  players: string[];
}
