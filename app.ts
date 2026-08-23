import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  uploadedImageUrl = '';
  isUploading = false;
  uploadError = '';

  private readonly apiBaseUrl = 'http://localhost:5000';

  constructor(private readonly router: Router) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      this.uploadError = 'Please select a JPG, PNG or WEBP image.';
      this.clearPreview();
      return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      this.uploadError = 'Image must be smaller than 10 MB.';
      this.clearPreview();
      return;
    }

    this.selectedFile = file;
    this.uploadError = '';
    this.uploadedImageUrl = '';

    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }

    this.previewUrl = URL.createObjectURL(file);

    console.log('FILE SELECTED:', file.name);
    console.log('FILE TYPE:', file.type);
    console.log('FILE SIZE:', file.size);
  }

  removeImage(): void {
    this.clearPreview();

    console.log('IMAGE REMOVED');
  }

  private clearPreview(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }

    this.selectedFile = null;
    this.previewUrl = null;
    this.uploadedImageUrl = '';
    this.uploadError = '';
    this.isUploading = false;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const token = window.localStorage.getItem('smartwall_token');

    if (!token || token.trim().length === 0) {
      return null;
    }

    return token.trim();
  }

  async continueToVisualizer(): Promise<void> {
    if (!this.selectedFile) {
      this.uploadError = 'Please upload a room image first.';
      return;
    }

    if (this.isUploading) {
      return;
    }

    const token = this.getToken();

    if (!token) {
      this.uploadError =
        'Please login first. Your login session is missing.';

      console.error(
        'UPLOAD BLOCKED: smartwall_token was not found in localStorage.'
      );

      return;
    }

    this.isUploading = true;
    this.uploadError = '';
    this.uploadedImageUrl = '';

    console.log('--------------------------------');
    console.log('UPLOAD START');
    console.log('File:', this.selectedFile.name);
    console.log('Token exists:', true);
    console.log('--------------------------------');

    try {
      const formData = new FormData();

      formData.append(
        'roomImage',
        this.selectedFile,
        this.selectedFile.name
      );

      const response = await fetch(
        `${this.apiBaseUrl}/api/upload/room`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      );

      console.log('HTTP STATUS:', response.status);

      const rawResponse = await response.text();

      let data: any = {};

      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        data = {
          message: rawResponse || 'Invalid server response.'
        };
      }

      console.log('UPLOAD RESPONSE:', data);

      if (response.status === 401) {
        window.localStorage.removeItem('smartwall_token');

        throw new Error(
          'Your login session has expired. Please login again.'
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
          `Image upload failed with HTTP ${response.status}.`
        );
      }

      const serverImageUrl =
        data?.image?.url ??
        data?.url ??
        data?.imageUrl;

      if (
        typeof serverImageUrl !== 'string' ||
        serverImageUrl.trim().length === 0
      ) {
        console.error(
          'Server response did not contain an image URL:',
          data
        );

        throw new Error(
          'Upload succeeded, but the server did not return an image URL.'
        );
      }

      const normalizedImageUrl =
        serverImageUrl.startsWith('http://') ||
        serverImageUrl.startsWith('https://')
          ? serverImageUrl
          : `${this.apiBaseUrl}${serverImageUrl.startsWith('/') ? '' : '/'}${serverImageUrl}`;

      this.uploadedImageUrl = normalizedImageUrl;

      console.log(
        'UPLOADED IMAGE URL:',
        this.uploadedImageUrl
      );

      this.isUploading = false;

      /*
       * IMPORTANT:
       * Navigate immediately after successful upload.
       *
       * The image URL is passed to the Visualizer through
       * the route query parameter.
       */
      await this.router.navigate(
        ['/visualizer'],
        {
          queryParams: {
            image: this.uploadedImageUrl
          }
        }
      );

    } catch (error: unknown) {
      console.error('UPLOAD ERROR:', error);

      this.isUploading = false;

      if (error instanceof Error) {
        this.uploadError = error.message;
      } else {
        this.uploadError =
          'Something went wrong while uploading the room image.';
      }

      console.log(
        'UPLOAD FAILED - isUploading:',
        this.isUploading
      );
    }
  }

  openVisualizer(): void {
    if (!this.uploadedImageUrl) {
      this.uploadError =
        'Please upload the room image first.';
      return;
    }

    this.router.navigate(
      ['/visualizer'],
      {
        queryParams: {
          image: this.uploadedImageUrl
        }
      }
    );
  }
}