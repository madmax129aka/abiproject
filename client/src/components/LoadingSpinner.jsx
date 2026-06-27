const LoadingSpinner = ({ size = 'lg', text = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      <div className={`${sizeClasses[size]} border-4 border-primary/30 border-t-primary rounded-full animate-spin`} />
      {text && <p className="text-slate-400 text-sm animate-pulse">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
