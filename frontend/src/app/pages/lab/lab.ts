import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
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

import { MenuItem } from '../../models/menu-item.model';
import { MenuService } from '../../services/menu.service';
import { LegacyChild } from './legacy-child/legacy-child';
import { LifecycleLogger } from './lifecycle-logger/lifecycle-logger';
import { SlotsCard } from './slots-card/slots-card';

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
  ],
  templateUrl: './lab.html',
  styleUrl: './lab.css',
  // <card-title> and <card-body> are only markers for the projection slots,
  // not components, so Angular is told not to look for them
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Lab implements OnInit {
  private readonly menuService = inject(MenuService);

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

  private newItemControl(): FormControl<string | null> {
    return new FormControl('', [Validators.required]);
  }

  ngOnInit(): void {
    this.menuService.getMenuItems({ limit: 5 }).subscribe({
      next: (response) => this.dishes.set(response.data.menuItems),
      error: (error: HttpErrorResponse) =>
        this.errorMessage.set(error.error?.message ?? 'Could not load dishes'),
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
