import { useState } from 'react';
import { IoEyeOffOutline, IoEyeOutline, IoFingerPrint } from 'react-icons/io5';
import { showAlert, simplePrompt } from '../components/dialogs';
import type { Navigation } from '../navigation';
import * as store from '../services/store';

export default function LoginScreen({ navigation }: { navigation: Navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [busy, setBusy] = useState(false);

  // Sign in an existing user
  const handleLogin = async () => {
    setBusy(true);
    try {
      await store.signIn(email, password);
      navigation.replace('Main');
    } catch (error) {
      showAlert('Login Error', (error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Create a brand new user from the typed credentials
  const handleSignUp = async () => {
    setBusy(true);
    try {
      await store.signUp(email, password);
      navigation.replace('Main');
    } catch (error) {
      showAlert('Sign up Error', (error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Face / Touch ID
  const handleBiometricLogin = async () => {
    setIsAuthenticating(true);
    try {
      if (store.getState().biometricsAvailable) {
        const success = await simplePrompt('Confirm identity to access DanaFlow', 'Cancel');
        if (success) {
          store.biometricSignIn();
          navigation.replace('Main');
        } else {
          showAlert('Authentication failed', 'Please try again');
        }
      } else {
        showAlert('Not Supported', 'Biometrics are not set up on this device');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="screen login">
      <div className="login-header">
        <div className="logo-mark">DF</div>
        <h1 className="login-title">DanaFlow</h1>
        <div className="login-sub">Agentic Insurance</div>
      </div>

      <form
        className="login-card"
        onSubmit={(event) => {
          event.preventDefault();
          void handleLogin();
        }}
      >
        <h2 className="card-title">Welcome back</h2>
        <p className="card-subtitle">Sign in to your account</p>

        <div className="input-group">
          <label className="input-label" htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="password">Password</label>
          <div className="password-wrapper">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              className="eye-toggle"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <IoEyeOffOutline size={20} color="#B0B0B0" /> : <IoEyeOutline size={20} color="#B0B0B0" />}
            </button>
          </div>
        </div>

        <button type="submit" className="primary-button" disabled={busy}>
          {busy ? 'Please wait…' : 'Sign In'}
        </button>

        <div className="divider"><span>or</span></div>

        <button
          type="button"
          className="biometric-button"
          onClick={handleBiometricLogin}
          disabled={isAuthenticating}
        >
          {isAuthenticating ? <span className="typing"><i /><i /><i /></span> : <IoFingerPrint size={22} />}
          <span>{isAuthenticating ? 'Verifying…' : 'Quick Login (Face / Touch ID)'}</span>
        </button>
      </form>

      <div className="login-footer">
        <span>Don't have an account?</span>
        <button type="button" className="link-button" onClick={handleSignUp} disabled={busy}>
          Create Account
        </button>
      </div>

      <div className="demo-hint">
        Demo account: <b>{store.DEMO_ACCOUNT.email}</b> / <b>{store.DEMO_ACCOUNT.password}</b>
        <br />
        <button
          type="button"
          onClick={() => {
            setEmail(store.DEMO_ACCOUNT.email);
            setPassword(store.DEMO_ACCOUNT.password);
          }}
        >
          Fill in the demo account
        </button>
      </div>
    </div>
  );
}
