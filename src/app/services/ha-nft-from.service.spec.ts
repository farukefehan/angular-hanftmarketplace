import { TestBed } from '@angular/core/testing';

import { HaNftFromService } from './ha-nft-from.service';

describe('HaNftFromService', () => {
  let service: HaNftFromService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HaNftFromService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
