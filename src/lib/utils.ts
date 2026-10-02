import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * The class-name joiner the shadcn/Magic UI registry expects at
 * `@/lib/utils`. It exists so registry components install and update cleanly;
 * the site's own components use template literals, which is the convention
 * everywhere outside `components/ui/`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
