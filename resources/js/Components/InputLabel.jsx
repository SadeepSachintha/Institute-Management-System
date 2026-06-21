export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}) {
    return (
        <label
            {...props}
            className={
                `block text-xs font-semibold text-slate-400 tracking-wider uppercase ` +
                className
            }
        >
            {value ? value : children}
        </label>
    );
}
