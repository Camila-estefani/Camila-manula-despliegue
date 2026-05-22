import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientRequestService } from '../../../core/services/client-request.service';
import { ClientRequest } from '../../../core/models/client-request.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {

  formData: ClientRequest = {
    username: '',
    firstName: '',
    lastName: '',
    companyName: '',
    taxId: '',
    email: '',
    phone: '',
    address: ''
  };

  submitSuccess = false;
  submitError = false;
  isSubmitting = false;
  errorMessage = '';

  menuOpen = false;

  constructor(
    private readonly clientRequestService: ClientRequestService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  scrollTo(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    this.menuOpen = false;
  }

  goToLogin(): void {
    this.authService.logout();
    this.menuOpen = false;
    this.router.navigateByUrl('/login');
  }

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.submitSuccess = false;
    this.submitError = false;
    this.errorMessage = '';

    this.clientRequestService.submitRequest(this.formData).subscribe({
      next: () => {
        this.submitSuccess = true;
        this.isSubmitting = false;
        form.resetForm();
        this.formData = {
          username: '',
          firstName: '',
          lastName: '',
          companyName: '',
          taxId: '',
          email: '',
          phone: '',
          address: ''
        };
      },
      error: (err) => {
        this.submitError = true;
        this.isSubmitting = false;
        this.errorMessage = err?.error?.error || 'Ocurrió un error al enviar la solicitud. Inténtalo de nuevo.';
      }
    });
  }
}
