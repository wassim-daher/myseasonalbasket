// Small stroke icons, drawn inline so they follow the text colour.

type P = { size?: number };
const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true });

export const SearchIcon = ({ size = 24 }: P) => (<svg {...base(size)}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>);
export const CartIcon = ({ size = 24 }: P) => (<svg {...base(size)}><path d="M3 4h2l2.4 10.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2" /><circle cx="9.5" cy="19.5" r="1.3" /><circle cx="17" cy="19.5" r="1.3" /></svg>);
export const UserIcon = ({ size = 24 }: P) => (<svg {...base(size)}><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5" /></svg>);
export const MenuIcon = ({ size = 28 }: P) => (<svg {...base(size)} strokeWidth={2.2}><path d="M4 7h16M4 12h16M4 17h16" /></svg>);
export const CloseIcon = ({ size = 24 }: P) => (<svg {...base(size)} strokeWidth={2}><path d="M6 6l12 12M18 6L6 18" /></svg>);
export const CalendarIcon = ({ size = 18 }: P) => (<svg {...base(size)}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></svg>);
export const BasketIcon = ({ size = 18 }: P) => (<svg {...base(size)}><path d="M4 10h16l-1.6 8.4a2 2 0 0 1-2 1.6H7.6a2 2 0 0 1-2-1.6z" /><path d="M8 10l3-6M16 10l-3-6" /></svg>);
export const TruckIcon = ({ size = 18 }: P) => (<svg {...base(size)}><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" /><circle cx="7" cy="17.5" r="1.6" /><circle cx="17" cy="17.5" r="1.6" /></svg>);
export const WhatsAppIcon = ({ size = 30 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M12 2.2a9.7 9.7 0 0 0-8.3 14.7L2.3 21.8l5-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .2-1.2c-.1-.1-.2-.2-.4-.3z" />
  </svg>
);
