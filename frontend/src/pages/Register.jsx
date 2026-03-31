import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import PasswordStrength from '../components/PasswordStrength';
import { registerUser } from '../api/auth';
import styles from './AuthPage.module.css';

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const errs = {};

    if (!form.username.trim()) {
      errs.username = 'Username is required';
    } else if (form.username.trim().length < 3) {
      errs.username = 'Username must be at least 3 characters';
    }

    if (!form.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Enter a valid email address';
    }

    if (!form.password) {
      errs.password = 'Password is required';
    } else {
      if (form.password.length < 8)               errs.password = 'Password must be at least 8 characters';
      else if (!/[A-Z]/.test(form.password))      errs.password = 'Add at least one uppercase letter';
      else if (!/\d/.test(form.password))          errs.password = 'Add at least one number';
      else if (!/[!@#$%^&*()_+\-=[\]{}|;':",./<>?]/.test(form.password))
                                                    errs.password = 'Add at least one special character';
    }

    if (!form.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const data = await registerUser(form.username, form.email, form.password);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        'Registration failed. Please try again.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className={styles.heading}>Create your account</h1>
      <p className={styles.sub}>Join and start planning epic road trips.</p>

      {serverError && (
        <div className={styles.serverError} role="alert">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <FormInput
          id="reg-username"
          label="Username"
          type="text"
          value={form.username}
          onChange={update('username')}
          placeholder="e.g. roadrunner42"
          autoComplete="username"
          error={errors.username}
          required
        />

        <FormInput
          id="reg-email"
          label="Email address"
          type="email"
          value={form.email}
          onChange={update('email')}
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email}
          required
        />

        <div>
          <FormInput
            id="reg-password"
            label="Password"
            type="password"
            value={form.password}
            onChange={update('password')}
            placeholder="Create a strong password"
            autoComplete="new-password"
            error={errors.password}
            required
          />
          <PasswordStrength password={form.password} />
        </div>

        <FormInput
          id="reg-confirm-password"
          label="Confirm password"
          type="password"
          value={form.confirmPassword}
          onChange={update('confirmPassword')}
          placeholder="Repeat your password"
          autoComplete="new-password"
          error={errors.confirmPassword}
          required
        />

        <button
          id="register-submit-btn"
          type="submit"
          className={`${styles.btn} ${loading ? styles.btnLoading : ''}`}
          disabled={loading}
        >
          {loading ? (
            <span className={styles.spinner} aria-hidden="true" />
          ) : null}
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className={styles.switchText}>
        Already have an account?{' '}
        <Link to="/login" id="goto-login-link">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
