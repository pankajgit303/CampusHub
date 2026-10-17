import { FooterCredit } from '../components/FooterCredit';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { Logo } from '../components/Shared';
import './login-picker.css';

const portals = [
  {
    role: 'student',
    title: 'Student',
    icon: GraduationCap,
    subtitle: 'Learn. Explore. Make it yours.',
    description: 'Classes, assignments, results and everything campus.',
  },
  {
    role: 'faculty',
    title: 'Faculty',
    icon: BookOpen,
    subtitle: 'Inspire the next generation.',
    description: 'Your teaching, attendance and grading workspace.',
  },
  {
    role: 'admin',
    title: 'Admin',
    icon: ShieldCheck,
    subtitle: 'Bring your campus together.',
    description: 'People, academic records and campus operations.',
  },
];

export default function LoginPicker() {
  return (
    <div className="portal-entry">
      <aside className="portal-brand">
        <Logo />
        <div className="portal-brand-copy">
          <span className="portal-kicker">
            <span /> A WHOLE CAMPUS. ONE CONNECTION.
          </span>
          <h1>
            Great things
            <br />
            start with
            <br />
            <em>connection.</em>
          </h1>
          <p>
            Your people. Your possibilities.
            <br />
            Your campus, all in one place.
          </p>
          <div className="portal-illustration" aria-hidden="true">
            <div className="portal-orbit orbit-a" />
            <div className="portal-orbit orbit-b" />
            <span className="portal-center">
              <GraduationCap size={66} strokeWidth={1.25} />
            </span>
            <span className="portal-satellite satellite-book">
              <BookOpen size={24} />
            </span>
            <span className="portal-satellite satellite-people">
              <Users size={24} />
            </span>
            <span className="portal-spark">
              <Sparkles size={24} />
            </span>
            <span className="portal-caption">A little more connected.</span>
          </div>
        </div>
        <div className="portal-brand-footer">
          <span>Smart College. Connected Campus.</span>
          <span>✦</span>
        </div>
      </aside>
      <main className="portal-selection">
        <nav className="portal-top">
          <Link to="/">
            <ArrowLeft size={15} />
            Back to home
          </Link>
          <span>CAMPUS ACCESS</span>
        </nav>
        <section className="portal-options">
          <div className="portal-welcome">WELCOME TO CAMPUSHUB</div>
          <h2>Choose your workspace.</h2>
          <p className="portal-intro">
            Different roles. One connected community.
            <br />
            Select your portal to make yourself at campus.
          </p>
          <div className="portal-cards">
            {portals.map(({ role, title, icon: Icon, subtitle, description }) => (
              <Link
                key={role}
                to={`/auth/login/${role}`}
                className={`portal-choice portal-${role}`}
                aria-label={`${title} login`}
              >
                <span className="portal-choice-icon">
                  <Icon size={27} strokeWidth={1.6} />
                </span>
                <span className="portal-choice-copy">
                  <strong>
                    {title} <span>LOGIN</span>
                  </strong>
                  <span className="portal-subtitle">{subtitle}</span>
                  <span className="portal-description">{description}</span>
                </span>
                <span className="portal-choice-arrow">
                  <ArrowUpRight size={21} />
                </span>
              </Link>
            ))}
          </div>
          <div className="portal-signup">
            <span>New to campus?</span>
            <Link to="/auth/signup">
              Create a student account <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="portal-security">
            <ShieldCheck size={16} />
            <span>Secure sign-in. A workspace that’s yours.</span>
          </div>
        </section>
        <footer className="portal-footer">
          <FooterCredit />
        </footer>
      </main>
    </div>
  );
}
