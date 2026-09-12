import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  FormField,
  applyEach,
  form,
  min,
  minLength,
  required,
  submit,
} from '@angular/forms/signals';
import { Observable, filter, map, retry } from 'rxjs';

import { API_BASE_URL } from '../../api-config';
import { ApiResponse } from '../../models/api-response.model';
import { CategoriesData, MenuItem } from '../../models/menu-item.model';
import { CartService } from '../../services/cart.service';
import { MenuService } from '../../services/menu.service';
import { LegacyChild } from './legacy-child/legacy-child';
import { LifecycleLogger } from './lifecycle-logger/lifecycle-logger';
import { SlotsCard } from './slots-card/slots-card';
import { TallyCounter } from './tally-counter/tally-counter';

// A page that shows the Angular building blocks the rest of the app uses, and
// also the older ways of writing them, side by side, on the real menu data.
@Component({
  selector: 'app-lab',
  // CommonModule brings *ngIf, *ngFor and *ngSwitch
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FormField,
    LegacyChild,
    LifecycleLogger,
    SlotsCard,
    TallyCounter,
  ],
  templateUrl: './lab.html',
  styleUrl: './lab.css',
  // <card-title> and <card-body> are only markers for the projection slots,
  // not components, so Angular is told not to look for them
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Lab implements OnInit {
  private readonly menuService = inject(MenuService);
  private readonly http = inject(HttpClient);

  // a root service: the same instance the header reads the cart count from
  protected readonly cartService = inject(CartService);

  protected readonly dishes = signal<MenuItem[]>([]);
  protected readonly errorMessage = signal('');

  // for *ngIf and *ngSwitch
  protected showLegacyList = true;
  protected role = 'chef';

  // the label handed to the lifecycle logger, so ngOnChanges can be seen
  protected loggerLabel = 'Lifecycle logger';
  protected isLoggerVisible = true;

  protected readonly picked = signal('');

  // --- signals: untracked and manual cleanup -------------------------------

  protected readonly clicks = signal(0);
  protected readonly watched = signal('start');

  private readonly manualEffectLog = signal<string[]>([]);
  protected readonly effectLog = this.manualEffectLog.asReadonly();

  private readonly effectRef = effect(
    () => {
      // watched() is tracked, clicks() is read without being tracked, so
      // pressing the counter alone never runs this again
      const line = `watched: ${this.watched()}, clicks: ${untracked(this.clicks)}`;

      queueMicrotask(() =>
        this.manualEffectLog.update((lines) => [...lines, line]),
      );
    },
    { manualCleanup: true },
  );

  protected readonly isEffectAlive = signal(true);

  // --- a signal form submitted by hand, without formRoot -------------------

  private readonly noteModel = signal({ note: '' });

  protected readonly noteForm = form(this.noteModel, (schema) => {
    required(schema.note, { message: 'Write something first' });
    minLength(schema.note, 5, { message: 'At least 5 characters' });
  });

  protected readonly noteLength = computed(
    () => this.noteForm.note().value().length,
  );

  protected readonly saved = signal('');

  // --- a reactive form with a FormArray -----------------------------------

  // a shopping list where the rows are added and removed while the form is
  // open, which is exactly what FormArray is for
  protected readonly listForm = new FormGroup({
    supplier: new FormControl('', [Validators.required]),
    items: new FormArray([this.newItemControl()]),
  });

  protected get items(): FormArray<FormControl<string | null>> {
    return this.listForm.controls.items;
  }

  protected addItem(): void {
    this.items.push(this.newItemControl());
  }

  protected removeItem(index: number): void {
    this.items.removeAt(index);
  }

  protected readonly listResult = signal('');

  protected saveList(): void {
    if (this.listForm.invalid) {
      this.listForm.markAllAsTouched();
      return;
    }

    const value = this.listForm.getRawValue();

    this.listResult.set(
      `${value.supplier}: ${value.items.filter(Boolean).join(', ')}`,
    );
  }

  // --- a signal form over a nested model with an array ---------------------

  protected readonly orderModel = signal({
    contact: { name: '', phone: '' },
    lines: [{ product: '', quantity: 1 }],
  });

  protected readonly orderForm = form(this.orderModel, (schema) => {
    required(schema.contact.name, { message: 'Name is required' });
    applyEach(schema.lines, (line) => {
      required(line.product, { message: 'Pick a dish' });
      min(line.quantity, 1, { message: 'At least one' });
    });
  });

  protected addLine(): void {
    this.orderModel.update((model) => ({
      ...model,
      lines: [...model.lines, { product: '', quantity: 1 }],
    }));
  }

  // --- an Observable made by hand, with filter() and map() ----------------

  protected readonly streamLog = signal<string[]>([]);
  protected readonly isStreaming = signal(false);

  // The producer: it decides when to call next(), error() and complete().
  // Nothing runs until somebody subscribes.
  private ticketNumbers(shouldFail: boolean): Observable<number> {
    return new Observable<number>((observer) => {
      let ticket = 0;

      const timerId = setInterval(() => {
        ticket++;
        observer.next(ticket);

        if (ticket === 3 && shouldFail) {
          // error() ends the stream: complete() will never be called after it
          observer.error(new Error('The ticket printer ran out of paper'));
        }

        if (ticket === 6) {
          observer.complete();
        }
      }, 400);

      // returned function = what to do when the stream ends or is unsubscribed
      return () => clearInterval(timerId);
    });
  }

  protected runStream(shouldFail: boolean): void {
    this.streamLog.set([]);
    this.isStreaming.set(true);

    const log = (line: string) =>
      this.streamLog.update((lines) => [...lines, line]);

    this.ticketNumbers(shouldFail)
      .pipe(
        // only the even tickets go on...
        filter((ticket) => ticket % 2 === 0),
        // ...and each one is turned into a label
        map((ticket) => `Ticket #${1000 + ticket}`),
      )
      .subscribe({
        next: (label) => log(`next: ${label}`),
        error: (error: Error) => {
          log(`error: ${error.message}`);
          this.isStreaming.set(false);
        },
        complete: () => {
          log('complete');
          this.isStreaming.set(false);
        },
      });
  }

  // --- a request with HttpHeaders and retry() -----------------------------

  protected readonly headerResult = signal('');

  protected loadWithHeaders(): void {
    this.headerResult.set('Loading...');

    // Most headers are added for the whole app by the interceptors. This is
    // how one request sets its own: Accept tells the server what to send back.
    const headers = new HttpHeaders({ Accept: 'application/json' });

    this.http
      .get<ApiResponse<CategoriesData>>(
        `${API_BASE_URL}/menu-items/categories`,
        {
          headers,
        },
      )
      .pipe(
        // on a failure the request is sent again, up to 2 more times
        retry(2),
        map((response) => response.data.categories),
      )
      .subscribe({
        next: (categories) =>
          this.headerResult.set(`Categories: ${categories.join(', ')}`),
        error: (error: Error) => this.headerResult.set(error.message),
      });
  }

  private newItemControl(): FormControl<string | null> {
    return new FormControl('', [Validators.required]);
  }

  ngOnInit(): void {
    this.menuService.getMenuItems({ limit: 5 }).subscribe({
      next: (response) => this.dishes.set(response.data.menuItems),
      error: (error: Error) => this.errorMessage.set(error.message),
    });
  }

  protected onPicked(dish: MenuItem): void {
    this.picked.set(dish.name);
  }

  protected stopEffect(): void {
    this.effectRef.destroy();
    this.isEffectAlive.set(false);
  }

  // submit() runs the same steps FormRoot does, but from a click handler
  protected async saveNote(): Promise<void> {
    const ok = await submit(this.noteForm, async (field) => {
      this.saved.set(`Saved: ${field().value().note}`);
      return undefined;
    });

    if (!ok) {
      this.saved.set('');
    }
  }
}
