import { FooterCredit } from '../components/FooterCredit';
import LoginPicker from './LoginPicker';
import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, ShieldCheck, BookOpen, Users, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { configured, supabase } from '../lib/supabase';
import { Logo } from '../components/Shared';
import { Button } from '../components/ui/button';
export default function Auth() {
  const { mode: routeMode = 'login', loginRole } = useParams();
  const mode = loginRole ? 'login' : routeMode;
  const [searchParams] = useSearchParams();
  const roles = ['student', 'faculty', 'admin'] as const;
  const role = roles.find((r) => r === (loginRole || searchParams.get('role')));
  const roleLabel = role ? role[0].toUpperCase() + role.slice(1) : '';
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const schema = z.object({
    email: mode === 'reset' ? z.string() : z.email('Enter a valid email address'),
    password: ['login', 'signup', 'reset'].includes(mode)
      ? z.string().min(mode === 'login' ? 1 : 12, 'Use at least 12 characters')
      : z.string(),
    full_name: mode === 'signup' ? z.string().trim().min(2, 'Enter your full name') : z.string(),
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', full_name: '' },
  });
  async function submit(values: z.infer<typeof schema>) {
    setMessage('');
    if (!configured) {
      toast.error('Add Supabase environment variables to connect the application.');
      return;
    }
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword(values);
        if (error) throw error;
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, account_status')
          .eq('id', data.user.id)
          .maybeSingle();
        if (
          profileError ||
          !profile ||
          profile.account_status !== 'active' ||
          profile.role !== role
        ) {
          await supabase.auth.signOut();
          if (profileError) throw profileError;
          if (!profile || profile.account_status !== 'active') {
            throw new Error('Your account is unavailable. Contact your college administrator.');
          }
          throw new Error(
            `This account has the ${profile.role} role. Please use ${profile.role} login.`,
          );
        }
        navigate('/app');
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: { full_name: values.full_name },
            emailRedirectTo: `${location.origin}/app`,
          },
        });
        if (error) throw error;
        setMessage(
          'Check your email to verify your account. Your administrator will assign your department and semester.',
        );
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
          redirectTo: `${location.origin}/auth/reset`,
        });
        if (error) throw error;
        setMessage('If that email is registered, you will receive a password reset link.');
      } else {
        const { error } = await supabase.auth.updateUser({ password: values.password });
        if (error) throw error;
        toast.success('Password updated');
        navigate('/app');
      }
    } catch (error) {
      toast.error((error as Error).message);
    }
  }
  const title =
    mode === 'signup'
      ? 'Your campus starts here.'
      : mode === 'forgot'
        ? 'Forgot your password?'
        : mode === 'reset'
          ? 'A fresh start.'
          : `${roleLabel} login`;
  if (loginRole && !role) return <Navigate to="/auth/login" replace />;
  if (mode === 'login' && !role) return <LoginPicker />;

  return (
    <div className="auth-page">
      <aside className="auth-story">
        <Logo />
        <div>
          <span className="pill">ONE CAMPUS. ENDLESS POSSIBILITIES.</span>
          <h1>
            A little less admin.
            <br />A lot more <em>campus.</em>
          </h1>
          <p>Your classes, your community, your next big opportunity. All in one place.</p>
          <div className="auth-icons">
            <BookOpen />
            <Users />
            <Sparkles />
          </div>
        </div>
        <small>CampusHub · Smart College. Connected Campus.</small>
      </aside>
      <main className="auth-form">
        <Link to="/" className="muted">
          ← Back to CampusHub
        </Link>
        <h1>{title}</h1>
        {mode === 'login' && (
          <nav className="login-role-tabs" aria-label="Login portal">
            {roles.map((portal) => (
              <Link
                key={portal}
                aria-current={role === portal ? 'page' : undefined}
                to={`/auth/login/${portal}`}
              >
                {portal[0].toUpperCase() + portal.slice(1)}
              </Link>
            ))}
          </nav>
        )}
        <p className="muted">
          {mode === 'signup'
            ? 'Create your student account to get connected.'
            : mode === 'login'
              ? `Sign in with your ${role} account to open your workspace.`
              : 'Everything you need for a better college day.'}
        </p>
        <form onSubmit={handleSubmit(submit)}>
          {mode === 'signup' && (
            <label>
              Full name
              <input autoComplete="name" {...register('full_name')} />
              <small className="field-error">{errors.full_name?.message}</small>
            </label>
          )}
          {mode !== 'reset' && (
            <label>
              College email
              <input
                type="email"
                autoComplete="email"
                placeholder="you@college.edu"
                {...register('email')}
              />
              <small className="field-error">{errors.email?.message}</small>
            </label>
          )}
          {mode !== 'forgot' && (
            <label>
              Password
              <input
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                {...register('password')}
              />
              <small className="field-error">{errors.password?.message}</small>
            </label>
          )}
          {mode === 'login' && (
            <Link to={`/auth/forgot?role=${role}`} className="text-link">
              Forgot password?
            </Link>
          )}
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting
              ? 'Please wait…'
              : mode === 'signup'
                ? 'Create account'
                : mode === 'forgot'
                  ? 'Send reset link'
                  : mode === 'reset'
                    ? 'Save password'
                    : `Sign in as ${roleLabel}`}
            <ArrowRight size={17} />
          </Button>
          {message && (
            <p className="success-box" role="status">
              {message}
            </p>
          )}
        </form>
        <p className="auth-switch">
          {mode === 'login' && role === 'student' ? (
            <>
              New to CampusHub? <Link to="/auth/signup">Create an account</Link>
            </>
          ) : mode === 'login' ? (
            <>
              Staff access is assigned by your college.{' '}
              <Link to="/auth/login">Choose another portal</Link>
            </>
          ) : (
            <Link to={role ? `/auth/login/${role}` : '/auth/login'}>Back to sign in</Link>
          )}
        </p>
        <div className="secure-note">
          <ShieldCheck size={16} />
          Secure access for your college community
        </div>
        <footer className="auth-footer">
          <FooterCredit />
        </footer>
      </main>
    </div>
  );
}
