export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__content">
        <div className="footer__brand">
          <strong>Digital Pdhai</strong>
          <span>School Management Platform</span>
        </div>

        <div className="footer__links">
          <div>
            <h4>Product</h4>
            <a href="#" rel="noopener noreferrer">
              Features
            </a>
            <a href="#" rel="noopener noreferrer">
              Pricing
            </a>
          </div>

          <div>
            <h4>Company</h4>
            <a href="#" rel="noopener noreferrer">
              About
            </a>
            <a href="#" rel="noopener noreferrer">
              Contact
            </a>
          </div>

          <div>
            <h4>Support</h4>
            <a href="#" rel="noopener noreferrer">
              Help Center
            </a>
            <a href="#" rel="noopener noreferrer">
              Privacy</a>
          </div>
        </div>

        <div className="footer__legal">
          <span>© {year} Digital Pdhai.</span>
          <span>Built with React &amp; Node.js.</span>
        </div>
      </div>
    </footer>
  );
}
