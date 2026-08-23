import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  email = '';
  password = '';

  loading = false;
  errorMessage = '';

  constructor(private router: Router) {}

  async login(): Promise<void> {

    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage =
        'Please enter your email and password.';
      return;
    }

    this.loading = true;

    try {

      const response = await fetch(
        'http://localhost:5000/api/auth/login',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            email: this.email,
            password: this.password
          })
        }
      );

      const data = await response.json();

      console.log('LOGIN STATUS:', response.status);
      console.log('LOGIN RESPONSE:', data);

      if (!response.ok) {
        throw new Error(
          data.message || 'Login failed.'
        );
      }

      if (!data.token) {
        throw new Error(
          'Server did not return a login token.'
        );
      }

      /*
       * SAVE JWT
       */
      localStorage.setItem(
        'token',
        data.token
      );

      /*
       * Save user information too
       */
      if (data.user) {
        localStorage.setItem(
          'user',
          JSON.stringify(data.user)
        );
      }

      console.log('JWT SAVED SUCCESSFULLY');

      /*
       * Go to upload page
       */
      await this.router.navigate(['/']);

    } catch (error) {

      console.error(
        'LOGIN ERROR:',
        error
      );

      if (error instanceof Error) {
        this.errorMessage = error.message;
      } else {
        this.errorMessage =
          'Unable to login.';
      }

    } finally {

      this.loading = false;

    }
  }
}