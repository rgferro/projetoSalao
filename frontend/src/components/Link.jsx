import React from 'react';

export function Link({ to, href, children, className, onClick, ...props }) {
  const target = to || href || '/';

  const handleClick = (e) => {
    if (onClick) onClick(e);

    // Se for link interno (# ou /)
    if (!target.startsWith('http') && !target.startsWith('mailto:') && !target.startsWith('tel:')) {
      e.preventDefault();
      window.history.pushState({}, '', target);
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo(0, 0);
    }
  };

  return (
    <a href={target} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  );
}

export default Link;
