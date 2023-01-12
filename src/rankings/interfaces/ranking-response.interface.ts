export interface RankingResponse {
  player?: string;
  position?: number;
  score?: number;
  historicMatch?: Historic;
}

export interface Historic {
  victories?: number;
  defeats?: number;
}
