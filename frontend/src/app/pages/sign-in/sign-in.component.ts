import { Component, OnInit, OnDestroy, ElementRef, ViewChild, inject } from '@angular/core';
import { ClerkService } from '../../services/clerk.service';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  template: `
    <div class="auth-page">
      <div class="auth-container" #signInEl></div>
    </div>
  `,
  styleUrl: './sign-in.component.scss',
})
export class SignInComponent implements OnInit, OnDestroy {
  @ViewChild('signInEl', { static: true }) signInEl!: ElementRef<HTMLDivElement>;

  private clerk = inject(ClerkService);

  ngOnInit(): void {
    this.clerk.mountSignIn(this.signInEl.nativeElement);
  }

  ngOnDestroy(): void {
    this.clerk.unmountSignIn(this.signInEl.nativeElement);
  }
}
