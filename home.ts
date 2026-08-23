import { Component, inject } from '@angular/core';
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
  
  selectedFile: File | null = null;
  isUploading: boolean = false;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  uploadAndContinue(): void {
    if (this.selectedFile) {
      const objectUrl = URL.createObjectURL(this.selectedFile);
      sessionStorage.setItem('room_image_url', objectUrl);
      this.router.navigate(['/visualizer']); 
    }
  }
}