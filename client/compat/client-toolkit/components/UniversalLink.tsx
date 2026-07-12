import React from 'react';

export interface UniversalLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to?: string;
}

export const UniversalLink: React.FC<UniversalLinkProps> = ({ to, href, children, ...props }) => {
  const resolvedHref = to ?? href ?? '#';

  return (
    <a href={resolvedHref} {...props}>
      {children}
    </a>
  );
};

export const AppLink = UniversalLink;
