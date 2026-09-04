import { Component } from '@angular/core';

// A container with more than one place to put content: the parent decides
// what goes in the title, what goes in the body, and anything that matches
// neither lands in the default slot.
@Component({
  selector: 'app-slots-card',
  templateUrl: './slots-card.html',
  styleUrl: './slots-card.css',
})
export class SlotsCard {}
