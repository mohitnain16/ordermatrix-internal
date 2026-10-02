import { ORDERMATRIX_FACTS } from './facts';

export function getDailyFact(): string {
  const epochDay = Math.floor(Date.now() / 86400000);
  return ORDERMATRIX_FACTS[epochDay % ORDERMATRIX_FACTS.length];
}
