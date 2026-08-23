import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isUploading: boolean = false; // Added back to fix template errors

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
        this.cdr.detectChanges(); // Ensures first-click registration
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  removeSelectedFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile = null;
    this.previewUrl = null;
    this.cdr.detectChanges();
  }

  uploadAndContinue(): void {
    if (this.selectedFile) {
      this.isUploading = true;
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.router.navigate(['/visualizer']); 
      }, 300);
    }
  }
}