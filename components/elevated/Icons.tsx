import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function ArrowUpRightIcon(props: IconProps) {
  return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3.5 12.5 12 4M5 4h7v7" /></svg>;
}

export function ArrowRightIcon(props: IconProps) {
  return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" /></svg>;
}

export function ArrowLeftIcon(props: IconProps) {
  return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M13.5 8h-11M7 3.5 2.5 8 7 12.5" /></svg>;
}

export function ArrowDownIcon(props: IconProps) {
  return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M8 2.5v11M3.5 9 8 13.5 12.5 9" /></svg>;
}

export function SearchIcon(props: IconProps) {
  return <svg aria-hidden="true" width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" {...props}><circle cx="7.5" cy="7.5" r="5" /><path d="m11.3 11.3 3.4 3.4" /></svg>;
}

export function CalendarIcon(props: IconProps) {
  return <svg aria-hidden="true" width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="2" y="3.5" width="13" height="11.5" rx="1" /><path d="M5.5 2v3M11.5 2v3M2 7h13" /></svg>;
}

export function MenuIcon(props: IconProps) {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...props}><path d="M3 6h14M3 10h14M3 14h14" /></svg>;
}
