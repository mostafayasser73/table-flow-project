import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

// The bottom of every page. It has no state of its own, so it is a plain
// component with a template and its own styles.
@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.css',
})
export class SiteFooter {
  protected readonly year = new Date().getFullYear();
}
