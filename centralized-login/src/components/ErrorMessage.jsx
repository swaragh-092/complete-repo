export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <p className="text-red-600 mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="px-4 py-2 bg-red-100 text-red-700 rounded">
          Try Again
        </button>
      )}
    </div>
  );
}
