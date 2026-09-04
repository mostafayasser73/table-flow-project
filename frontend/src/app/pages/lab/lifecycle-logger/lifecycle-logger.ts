import {
  AfterContentChecked,
  AfterContentInit,
  AfterViewChecked,
  AfterViewInit,
  Component,
  ContentChild,
  DoCheck,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
  afterEveryRender,
  afterNextRender,
  signal,
} from '@angular/core';

// Every lifecycle hook Angular offers, in one component, each one writing a
// line so the order they run in can be seen on the screen and in the console.
//
// This is a demonstration. Real screens should only use the hooks they need,
// because ngDoCheck, ngAfterContentChecked and ngAfterViewChecked run on every
// change detection cycle.
@Component({
  selector: 'app-lifecycle-logger',
  templateUrl: './lifecycle-logger.html',
  styleUrl: './lifecycle-logger.css',
})
export class LifecycleLogger
  implements
    OnChanges,
    OnInit,
    DoCheck,
    AfterContentInit,
    AfterContentChecked,
    AfterViewInit,
    AfterViewChecked,
    OnDestroy
{
  // the decorator form of an input, the one ngOnChanges was made for
  @Input() label = '';

  // an element the parent projected into <ng-content>
  @ContentChild('projected') projected?: ElementRef<HTMLElement>;

  // an element from this component's own template
  @ViewChild('ownParagraph') ownParagraph?: ElementRef<HTMLElement>;

  readonly log = signal<string[]>([]);

  // The "checked" hooks run constantly, so they are only counted. These are
  // plain numbers on purpose: writing a signal from inside a hook that runs
  // during rendering would ask Angular to render again, and again, forever
  // (NG0103). A plain field is simply read the next time the view is drawn.
  protected doCheckCount = 0;
  protected contentCheckedCount = 0;
  protected viewCheckedCount = 0;

  constructor() {
    this.write('constructor');

    // once, after the first paint
    afterNextRender(() => this.write('afterNextRender'));

    // After every paint from now on. It only writes to the console: an
    // afterEveryRender callback that touches anything the template shows asks
    // Angular to render again, and that never stops (NG0103).
    afterEveryRender(() => console.log('afterEveryRender'));
  }

  ngOnChanges(changes: SimpleChanges): void {
    const label = changes['label'];

    this.write(
      `ngOnChanges: "${label?.previousValue ?? ''}" -> "${label?.currentValue ?? ''}"`,
    );
  }

  ngOnInit(): void {
    this.write('ngOnInit');
  }

  ngDoCheck(): void {
    this.doCheckCount++;
  }

  ngAfterContentInit(): void {
    this.write(
      `ngAfterContentInit: projected "${this.projected?.nativeElement.textContent?.trim() ?? ''}"`,
    );
  }

  ngAfterContentChecked(): void {
    this.contentCheckedCount++;
  }

  ngAfterViewInit(): void {
    this.write(
      `ngAfterViewInit: own element "${this.ownParagraph?.nativeElement.textContent?.trim() ?? ''}"`,
    );
  }

  ngAfterViewChecked(): void {
    this.viewCheckedCount++;
  }

  ngOnDestroy(): void {
    console.log('ngOnDestroy: the logger is leaving the page');
  }

  private write(line: string): void {
    console.log(line);

    // the hooks run while Angular is rendering, so the signal is written
    // after the current cycle to avoid changing what is being drawn
    queueMicrotask(() => this.log.update((lines) => [...lines, line]));
  }
}
