export default function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-16 ${className}`}>
      <div className="spinner-dark" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  )
}
