export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <p className="ml-4 text-blue-700">{message}</p>
    </div>
  );
}
