export interface MatchInterface {
  category: string;
  challenge: string;
  players: string[];
  def: string;
  result: Array<Result>;
}

export interface Result {
  set: string;
}
