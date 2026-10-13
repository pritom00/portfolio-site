import { profile } from '@/data/content';

export default function Footer() {
  return (
    <footer className="footer">
      <span>© {new Date().getFullYear()} {profile.name}</span>
      <a href="#top">Back to top</a>
    </footer>
  );
}
