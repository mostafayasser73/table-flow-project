import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

// A custom attribute directive: it does not add or remove anything from the
// page, it only changes how the element it sits on behaves. Put appAutofocus
// on an input and the cursor lands in it as soon as the browser has painted.
//
//   <input type="search" appAutofocus />
@Directive({
  selector: '[appAutofocus]',
})
export class Autofocus {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    // afterNextRender runs once, after the DOM exists — focusing earlier
    // would do nothing because the element is not on the page yet.
    afterNextRender(() => this.host.nativeElement.focus());
  }
}
