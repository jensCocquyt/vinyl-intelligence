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
  styles: [`
    .auth-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: var(--bg);
    }
  `],
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
