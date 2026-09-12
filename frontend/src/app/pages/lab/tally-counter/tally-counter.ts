import { Component, inject, input } from '@angular/core';

import { TallyService } from '../tally.service';

// providers: [TallyService] makes Angular create a new TallyService for each
// <app-tally-counter> on the page, so two counters never share a count.
@Component({
  selector: 'app-tally-counter',
  providers: [TallyService],
  templateUrl: './tally-counter.html',
  styleUrl: './tally-counter.css',
})
export class TallyCounter {
  protected readonly tally = inject(TallyService);

  readonly label = input.required<string>();
}
