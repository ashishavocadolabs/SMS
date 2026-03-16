import { Link } from "react-router-dom";
import { LogoIcon } from "./Icons";

export default function Header() {
  return (
    <header className="header">
      <div className="header__container">
        <div className="header__brand">
          <LogoIcon size={28} />
          <span className="header__title">Digital Pdhai</span>
        </div>

        <nav className="header__nav">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#about">About</a>
        </nav>

        <div className="header__actions">
          <Link to="/student/login" className="header__link">
            Login
          </Link>
          <Link to="/student/login" className="button button--primary button--sm">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
