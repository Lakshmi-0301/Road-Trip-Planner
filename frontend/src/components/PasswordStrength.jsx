import styles from './PasswordStrength.module.css';

const checks = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Uppercase letter (A–Z)', test: (p) => /[A-Z]/.test(p) },
  { label: 'Number (0–9)',           test: (p) => /\d/.test(p) },
  { label: 'Special character (!@#…)', test: (p) => /[!@#$%^&*()_+\-=[\]{}|;':",./<>?]/.test(p) },
];

function getStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  const passed = checks.filter((c) => c.test(password)).length;
  if (passed <= 1) return { score: 1, label: 'Weak',        color: 'var(--strength-weak)' };
  if (passed === 2) return { score: 2, label: 'Fair',        color: 'var(--strength-fair)' };
  if (passed === 3) return { score: 3, label: 'Good',        color: 'var(--strength-good)' };
  return                  { score: 4, label: 'Strong',       color: 'var(--strength-strong)' };
}

export default function PasswordStrength({ password }) {
  const { score, label, color } = getStrength(password);

  if (!password) return null;

  return (
    <div className={styles.wrapper} aria-live="polite">
      {/* Strength bar */}
      <div className={styles.barTrack}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={styles.bar}
            style={{
              backgroundColor: i <= score ? color : 'var(--color-border)',
              transition: `background-color var(--transition-normal)`,
            }}
          />
        ))}
      </div>

      <span className={styles.label} style={{ color }}>
        {label}
      </span>

      {/* Checklist */}
      <ul className={styles.checklist}>
        {checks.map((c) => {
          const ok = c.test(password);
          return (
            <li key={c.label} className={`${styles.checkItem} ${ok ? styles.checkOk : ''}`}>
              <span className={styles.checkIcon} aria-hidden="true">
                {ok ? '✓' : '○'}
              </span>
              {c.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
