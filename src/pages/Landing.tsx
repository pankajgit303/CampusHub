import { FooterCredit } from '../components/FooterCredit';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  GraduationCap,
  ShieldCheck,
  Users,
  Bell,
  ClipboardCheck,
  FileText,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import './landing-home.css';
const portals = [
  {
    role: 'student',
    title: 'Student portal',
    text: 'Your classes, assignments, attendance and results.',
    icon: GraduationCap,
  },
  {
    role: 'faculty',
    title: 'Faculty portal',
    text: 'Manage teaching, review work and support your students.',
    icon: Users,
  },
  {
    role: 'admin',
    title: 'Administration',
    text: 'Manage academic records and campus operations.',
    icon: ShieldCheck,
  },
];
export default function Landing() {
  return (
    <div className="campus-home">
      <div className="ch-utility">
        <div>
          <span>SMART CAMPUS MANAGEMENT SYSTEM</span>
          <Link to="/auth/signup">
            New here? Create an account <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
      <header className="ch-header">
        <Link to="/" className="ch-brand">
          <span>
            <GraduationCap size={32} />
          </span>
          <div>
            <strong>CampusHub</strong>
            <small>LEARN. CONNECT. ACHIEVE.</small>
          </div>
        </Link>
        <nav aria-label="Main navigation">
          <a href="#services">Campus services</a>
          <a href="#portals">Login portals</a>
          <a href="#help">Help & guidance</a>
        </nav>
        <Link to="/auth/login" className="ch-button ch-button-dark">
          Sign in <ArrowUpRight size={16} />
        </Link>
      </header>
      <main>
        <section className="ch-hero">
          <div className="ch-hero-inner">
            <div className="ch-hero-copy">
              <span className="ch-eyebrow">YOUR CAMPUS. ONE CONNECTION.</span>
              <h1>
                A smarter way
                <br />
                to stay <em>connected.</em>
              </h1>
              <p>
                From your first class to your next opportunity. Bring academics, campus life and
                everyday essentials together in one place.
              </p>
              <div className="ch-hero-actions">
                <Link to="/auth/login/student" className="ch-button ch-button-dark">
                  Student login <ArrowRight size={17} />
                </Link>
                <a href="#portals" className="ch-text-link">
                  Find your workspace <ArrowUpRight size={16} />
                </a>
              </div>
              <div className="ch-hero-note">
                <ShieldCheck size={17} />
                <span>Dedicated access for students, faculty and administrators.</span>
              </div>
            </div>
            <div className="ch-visual">
              <div className="ch-visual-caption">
                <span className="ch-dot" /> A CONNECTED CAMPUS
              </div>
              <div className="ch-campus-icon">
                <GraduationCap size={85} strokeWidth={1.25} />
              </div>
              <h2>Everything starts here.</h2>
              <p>A clear view of your campus day.</p>
              <div className="ch-preview-grid">
                {[
                  [BookOpen, 'Learning'],
                  [CalendarDays, 'Schedule'],
                  [ClipboardCheck, 'Attendance'],
                  [Bell, 'Updates'],
                ].map(([Icon, label]) => {
                  const Glyph = Icon as typeof BookOpen;
                  return (
                    <div key={String(label)}>
                      <Glyph size={22} />
                      <span>{String(label)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="ch-visual-bottom">
                <span>CampusHub student workspace</span>
                <ArrowUpRight size={18} />
              </div>
            </div>
          </div>
        </section>
        <section className="ch-portals ch-section" id="portals">
          <div className="ch-section-heading">
            <div>
              <span className="ch-eyebrow">GET STARTED</span>
              <h2>Your role. Your workspace.</h2>
            </div>
            <p>Choose your portal to securely access your account.</p>
          </div>
          <div className="ch-portal-grid">
            {portals.map(({ role, title, text, icon: Icon }, i) => (
              <Link to={`/auth/login/${role}`} className="ch-portal" key={role}>
                <div className="ch-portal-top">
                  <span className="ch-service-icon">
                    <Icon size={27} />
                  </span>
                  <span className="ch-number">0{i + 1}</span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                <span className="ch-portal-bottom">
                  Go to login <ArrowRight size={18} />
                </span>
              </Link>
            ))}
          </div>
        </section>
        <section className="ch-services" id="services">
          <div className="ch-section">
            <div className="ch-section-heading">
              <div>
                <span className="ch-eyebrow">CAMPUS SERVICES</span>
                <h2>
                  Less searching.
                  <br />
                  More moving forward.
                </h2>
              </div>
              <p>The tools you need for a well-organised academic day.</p>
            </div>
            <div className="ch-service-grid">
              {[
                {
                  icon: BookOpen,
                  title: 'Learning & resources',
                  text: 'Find assignments and study materials in your academic workspace.',
                },
                {
                  icon: ClipboardCheck,
                  title: 'Attendance & results',
                  text: 'Keep track of recorded attendance and published academic results.',
                },
                {
                  icon: CalendarDays,
                  title: 'Schedules & examinations',
                  text: 'Plan ahead with class timetables and examination schedules.',
                },
                {
                  icon: Bell,
                  title: 'Campus announcements',
                  text: 'Stay informed with notices, events and placement opportunities.',
                },
                {
                  icon: FileText,
                  title: 'Student services',
                  text: 'Maintain your profile and submit concerns to your college team.',
                },
                {
                  icon: Sparkles,
                  title: 'Campus AI',
                  text: 'Look up your accessible classes, assignments and campus updates.',
                },
              ].map(({ icon: Icon, title, text }) => (
                <article key={title}>
                  <span className="ch-service-icon">
                    <Icon size={23} />
                  </span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="ch-help ch-section" id="help">
          <div>
            <span className="ch-eyebrow">A LITTLE GUIDANCE</span>
            <h2>New to CampusHub?</h2>
            <p>
              Start with your account. Your college team will connect you to the right academic
              workspace.
            </p>
            <Link to="/auth/signup" className="ch-button ch-button-dark">
              Create an account <ArrowRight size={16} />
            </Link>
          </div>
          <div className="ch-faq">
            {[
              [
                'How do I get started?',
                'Create an account and verify your email. Your administrator assigns your department, semester and student details.',
              ],
              [
                'How do faculty members join?',
                'Register and verify your email, then ask your college administrator to grant faculty access and assign your teaching subjects.',
              ],
              [
                'Which login should I use?',
                'Choose Student, Faculty or Administration according to the role assigned to your account.',
              ],
              [
                'Where can I get help?',
                'For academic or account questions, contact your college administration. Signed-in users can submit concerns through Grievances.',
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <ChevronRight size={17} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="ch-bottom">
          <div>
            <GraduationCap size={34} />
            <div>
              <h2>Your next step starts here.</h2>
              <p>Sign in and get back to what matters.</p>
            </div>
          </div>
          <Link to="/auth/login" className="ch-button ch-button-white">
            Open your portal <ArrowUpRight size={18} />
          </Link>
        </section>
      </main>
      <footer className="ch-footer">
        <FooterCredit />
      </footer>
    </div>
  );
}
