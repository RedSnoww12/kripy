import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  title: string;
  updatedAt: string;
  children: ReactNode;
  alternateLink?: { to: string; label: string };
}

export default function LegalLayout({
  title,
  updatedAt,
  children,
  alternateLink,
}: Props) {
  useEffect(() => {
    document.body.classList.add('legal');
    return () => {
      document.body.classList.remove('legal');
    };
  }, []);

  return (
    <div className="legal-wrap">
      <Link className="legal-back" to="/">
        ← Retour
      </Link>
      <h1 className="brand brand-g">Kripy</h1>
      <div className="legal-sub">{title}</div>
      <div className="legal-date">Dernière mise à jour : {updatedAt}</div>

      {children}

      <div className="legal-footer">
        {alternateLink && (
          <>
            <Link to={alternateLink.to}>{alternateLink.label}</Link>
            <span className="sep">·</span>
          </>
        )}
        <Link to="/">Retour à l'application</Link>
      </div>
    </div>
  );
}
