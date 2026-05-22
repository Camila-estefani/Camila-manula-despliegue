import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ClientProfileService, FileUploadResponse } from '../../core/services/client-profile.service';
import { AuthUser } from '../../core/models/auth.model';
import { ClientProfileUpdateRequest } from '../../core/models/client-profile.model';
import { environment } from '../../../environments/environment';

interface MenuItem {
  label: string;
  route: string;
  shortLabel: string;
}

function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const newPassword = control.get('newPassword')?.value?.trim() ?? '';
    const confirmPassword = control.get('confirmPassword')?.value?.trim() ?? '';
    const currentPassword = control.get('currentPassword')?.value?.trim() ?? '';

    if (!newPassword && !confirmPassword) {
      return null;
    }

    if (!currentPassword) {
      return { currentPasswordRequired: true };
    }

    if (newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }

    return null;
  };
}

@Component({
  selector: 'app-client-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './client-profile.html',
  styleUrl: './client-profile.css'
})
export class ClientProfileComponent implements OnInit {
  sidebarOpen = true;
  activeRoute = 'perfil';
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  profileImagePreview = '';
  private selectedProfileImageFile: File | null = null;
  private removePhotoRequested = false;
  profile: AuthUser | null = null;
  readonly profileForm: FormGroup;

  menuItems: MenuItem[] = [
    { label: 'Mis Pedidos', route: '/customer/pedidos', shortLabel: 'PE' },
    { label: 'Clientes', route: '/customer/clientes', shortLabel: 'CL' },
    { label: 'Mi Perfil', route: '/customer/perfil', shortLabel: 'PR' }
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly clientProfileService: ClientProfileService,
    private readonly router: Router
  ) {
    this.profileForm = this.fb.group({
      companyName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{9}$/), Validators.maxLength(9)]],
      address: ['', [Validators.required, Validators.maxLength(255)]],
      currentPassword: [''],
      newPassword: ['', [Validators.minLength(6), Validators.maxLength(100)]],
      confirmPassword: ['', [Validators.maxLength(100)]]
    }, { validators: passwordMatchValidator() });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  setActiveRoute(route: string): void {
    this.activeRoute = route;
  }

  loadProfile(): void {
    this.loading = true;
    this.errorMessage = '';

    this.clientProfileService.getProfile().pipe(finalize(() => {
      this.loading = false;
    })).subscribe({
      next: (user) => {
        this.profile = user;
        this.authService.updateCurrentUser(user);

        const client = user.client;
        this.profileImagePreview = this.resolveProfileImageUrl(client?.profileImageUrl || '');
        this.selectedProfileImageFile = null;
        this.profileForm.patchValue({
          companyName: client?.companyName || user.displayName || '',
          email: client?.email || user.username || '',
          phone: client?.phone || '',
          address: client?.address || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || 'No se pudo cargar el perfil.';
        if (error?.status === 401) {
          this.authService.clearSession();
          this.router.navigateByUrl('/login');
        }
      }
    });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.selectedProfileImageFile = file;
    this.removePhotoRequested = false;
    this.profileImagePreview = URL.createObjectURL(file);
  }

  clearPhoto(): void {
    this.profileImagePreview = '';
    this.selectedProfileImageFile = null;
    this.removePhotoRequested = true;
  }

  guardarCambios(): void {
    if (this.profileForm.invalid || this.saving) {
      this.profileForm.markAllAsTouched();
      this.errorMessage = 'Revisa los campos marcados antes de guardar.';
      this.successMessage = '';
      return;
    }

    const newPassword = this.profileForm.value.newPassword?.trim() ?? '';
    const confirmPassword = this.profileForm.value.confirmPassword?.trim() ?? '';
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        this.errorMessage = 'La confirmación de la contraseña no coincide.';
        return;
      }
    }

    if (this.selectedProfileImageFile && this.selectedProfileImageFile.size > 5 * 1024 * 1024) {
      this.errorMessage = 'La imagen es demasiado grande. Selecciona un archivo menor a 5 MB.';
      this.successMessage = '';
      return;
    }

    const request: ClientProfileUpdateRequest = {
      companyName: this.profileForm.value.companyName?.trim() || null,
      phone: this.profileForm.value.phone?.trim() || null,
      address: this.profileForm.value.address?.trim() || null,
      currentPassword: this.profileForm.value.currentPassword?.trim() || null,
      newPassword: newPassword || null,
      confirmPassword: confirmPassword || null
    };

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    // If a new file is selected, upload it first. If user requested removal, send empty string
    // for `profileImageUrl` so backend will clear the value. Otherwise, don't include the field.
    const saveProfile$ = this.selectedProfileImageFile
      ? this.clientProfileService.uploadProfileImage(this.selectedProfileImageFile).pipe(
          switchMap((upload: FileUploadResponse) => {
            request.profileImageUrl = upload.path;
            this.profileImagePreview = upload.url;
            return this.clientProfileService.updateProfile(request);
          })
        )
      : (this.removePhotoRequested ? (() => { request.profileImageUrl = ''; return this.clientProfileService.updateProfile(request); })() : this.clientProfileService.updateProfile(request));

    saveProfile$.pipe(finalize(() => {
      this.saving = false;
    })).subscribe({
      next: (user) => {
        this.profile = user;
        this.authService.updateCurrentUser(user);
        this.profileImagePreview = this.resolveProfileImageUrl(user.client?.profileImageUrl || '');
        this.selectedProfileImageFile = null;
        this.removePhotoRequested = false;
        this.profileForm.patchValue({
          companyName: user.client?.companyName || user.displayName || '',
          email: user.client?.email || user.username || '',
          phone: user.client?.phone || '',
          address: user.client?.address || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        this.successMessage = 'Perfil actualizado correctamente.';
        this.errorMessage = '';
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || 'Ocurrió un error al actualizar el perfil.';
        this.successMessage = '';
        if (error?.status === 401) {
          this.authService.clearSession();
          this.router.navigateByUrl('/login');
        }
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  get client() {
    return this.profile?.client;
  }

  get registrationDate(): string {
    return this.client?.createdAt || this.profile?.createdAt || '—';
  }

  get displayEmail(): string {
    return this.client?.email || this.profile?.username || '—';
  }

  get displayName(): string {
    return this.client?.companyName || this.profile?.displayName || this.profile?.username || '—';
  }

  get emailValue(): string {
    return (this.profileForm.get('email')?.value || this.displayEmail || '') as string;
  }

  get initials(): string {
    const source = this.displayName.trim();
    if (!source) {
      return 'PR';
    }

    const parts = source.split(/\s+/).slice(0, 2);
    return parts.map((part) => part.charAt(0).toUpperCase()).join('') || 'PR';
  }

  private resolveProfileImageUrl(imageUrl: string): string {
    if (!imageUrl) {
      return '';
    }

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    // handle older saved paths like /profile-images/... by normalizing to /uploads/profile-images/...
    if (imageUrl.startsWith('/profile-images/')) {
      return `${environment.apiUrl}/uploads${imageUrl}`;
    }

    return `${environment.apiUrl}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
  }
}