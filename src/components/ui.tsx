import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const Button = ({
    children,
    variant = 'default',
    size = 'default',
    className,
    disabled,
    ...props
}: {
    children?: React.ReactNode;
    variant?: string;
    size?: string;
    className?: string;
    disabled?: boolean;
    [key: string]: unknown;
}) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/5 disabled:pointer-events-none disabled:opacity-50 active:scale-95'

    const variants: Record<string, string> = {
        default: 'bg-titanium text-ivory shadow-lg hover:shadow-xl hover:bg-black',
        outline: 'border border-black/10 bg-white/50 glass hover:bg-white text-titanium',
        secondary: 'bg-black/5 text-titanium hover:bg-black/10',
        ghost: 'hover:bg-black/5 text-titanium',
        link: 'text-black underline-offset-4 hover:underline',
        glass: 'glass premium-shadow text-titanium hover:bg-white/80',
    }

    const sizes: Record<string, string> = {
        default: 'h-11 px-6 py-2',
        sm: 'h-9 rounded-apple-sm px-4 text-xs',
        lg: 'h-14 rounded-apple-lg px-10 text-lg',
        icon: 'h-11 w-11 p-0',
    }

    return (
        <button
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    )
}

export const Card = ({ children, className, noPadding, ...props }: { children?: React.ReactNode; className?: string; noPadding?: boolean;[key: string]: unknown }) => (
    <div
        className={cn('rounded-apple-xl glass premium-shadow text-titanium overflow-hidden', className)}
        {...props}
    >
        <div className={cn(noPadding ? 'p-0' : 'p-6 sm:p-8')}>
            {children}
        </div>
    </div>
)

export const Badge = ({ children, className, variant = 'default', ...props }: { children?: React.ReactNode; className?: string; variant?: string;[key: string]: unknown }) => {
    const variants: Record<string, string> = {
        default: 'border-transparent bg-titanium/10 text-titanium font-bold',
        secondary: 'border-transparent bg-white/50 glass text-titanium',
        destructive: 'border-transparent bg-titanium/20 text-titanium',
        outline: 'border-black/10 text-titanium',
    }

    return (
        <div
            className={cn(
                'inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-widest transition-colors',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type, ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                'flex h-12 w-full rounded-full border border-black/5 bg-white/50 glass px-6 py-2 text-sm premium-shadow transition-all placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:bg-white',
                className
            )}
            ref={ref}
            {...props}
        />
    )
})
Input.displayName = 'Input'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => {
    return (
        <textarea
            className={cn(
                'flex min-h-[120px] w-full rounded-2xl border border-black/5 bg-white/50 glass px-6 py-4 text-sm premium-shadow transition-all placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:bg-white resize-none',
                className
            )}
            ref={ref}
            {...props}
        />
    )
})
Textarea.displayName = 'Textarea'

export const Modal = ({
    isOpen,
    onClose,
    children,
    title,
    className
}: {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    className?: string;
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
            <div
                className="absolute inset-0 bg-ivory/80 backdrop-blur-md"
                onClick={onClose}
            />
            <Card
                noPadding
                className={cn(
                    "relative z-10 w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-4 sm:zoom-in-95 duration-500 p-0 rounded-b-none sm:rounded-apple-xl max-h-[90vh] overflow-y-auto",
                    className
                )}
            >
                <div className="p-6 sm:p-10">
                    {title && (
                        <div className="mb-6 sm:mb-8 text-center px-2">
                            <h2 className="text-3xl font-black text-titanium tracking-tighter leading-tight">{title}</h2>
                        </div>
                    )}
                    {children}
                </div>
            </Card>
        </div>
    )
}
