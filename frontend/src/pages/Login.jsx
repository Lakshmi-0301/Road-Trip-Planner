import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import { loginUser } from '../api/auth';
import styles from './AuthPage.module.css';

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Enter a valid email address';
    }
    if (!form.password) {
      errs.password = 'Password is required';
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
      const data = await loginUser(form.email, form.password);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        'Login failed. Please check your credentials.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className={styles.heading}>Welcome back</h1>
      <p className={styles.sub}>Sign in to continue planning your adventures.</p>

      {serverError && (
        <div className={styles.serverError} role="alert">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <FormInput
          id="login-email"
          label="Email address"
          type="email"
          value={form.email}
          onChange={update('email')}
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email}
          required
        />

        <FormInput
          id="login-password"
          label="Password"
          type="password"
          value={form.password}
          onChange={update('password')}
          placeholder="Your password"
          autoComplete="current-password"
          error={errors.password}
          required
        />

        <button
          id="login-submit-btn"
          type="submit"
          className={`${styles.btn} ${loading ? styles.btnLoading : ''}`}
          disabled={loading}
        >
          {loading ? (
            <span className={styles.spinner} aria-hidden="true" />
          ) : null}
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className={styles.switchText}>
        Don&apos;t have an account?{' '}
        <Link to="/register" id="goto-register-link">Create one</Link>
      </p>
    </AuthLayout>
  );
}
