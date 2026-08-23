import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.scss'
})
export class Auth {

  isLogin = true;
  isLoading = false;

  name = '';
  email = '';
  password = '';

  errorMessage = '';
  successMessage = '';

  constructor(private router: Router) {}

  switchMode(): void {
    this.isLogin = !this.isLogin;

    this.name = '';
    this.email = '';
    this.password = '';

    this.errorMessage = '';
    this.successMessage = '';
  }

  async submit(): Promise<void> {

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter email and password.';
      return;
    }

    if (!this.isLogin && !this.name) {
      this.errorMessage = 'Please enter your name.';
      return;
    }

    this.isLoading = true;

    try {

      const endpoint = this.isLogin
        ? 'http://localhost:5000/api/auth/login'
        : 'http://localhost:5000/api/auth/register';

      const body = this.isLogin
        ? {
            email: this.email,
            password: this.password
          }
        : {
            name: this.name,
            email: this.email,
            password: this.password
          };

      const response = await fetch(endpoint, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify(body)
      });

      const data = await response.json();

      console.log('AUTH RESPONSE:', data);

      if (!response.ok) {
        throw new Error(
          data.message || 'Authentication failed.'
        );
      }

      // REGISTER
      if (!this.isLogin) {

        this.successMessage =
          'Account created successfully. Please login.';

        this.isLogin = true;

        this.password = '';

        this.isLoading = false;

        return;
      }

      // LOGIN
      if (!data.token) {
        throw new Error('Server did not return a login token.');
      }

      // Save JWT token
      localStorage.setItem(
        'smartwall_token',
        data.token
      );

      // Save user information
      if (data.user) {
        localStorage.setItem(
          'smartwall_user',
          JSON.stringify(data.user)
        );
      }

      console.log('LOGIN SUCCESS');
      console.log('TOKEN SAVED');

      this.successMessage =
        'Login successful! Opening SmartWall...';

      setTimeout(() => {
        this.router.navigate(['/']);
      }, 500);

    } catch (error) {

      console.error('AUTH ERROR:', error);

      if (error instanceof Error) {
        this.errorMessage = error.message;
      } else {
        this.errorMessage =
          'Something went wrong. Please try again.';
      }

    } finally {

      this.isLoading = false;

    }
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}