import { Module } from '@nestjs/common';
import { ClientProxySmartRanking } from './client-proxy.proxymq';

@Module({
  providers: [ClientProxySmartRanking],
  exports: [ClientProxySmartRanking],
})
export class ProxymqModule {}
