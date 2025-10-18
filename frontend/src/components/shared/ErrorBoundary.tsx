import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import './ErrorBoundary.scss';

const ErrorBoundary = () => {
  const error = useRouteError();

  let errorMessage: string;
  let errorStatus: number | undefined;

  if (isRouteErrorResponse(error)) {
    errorMessage = error.statusText || error.data?.message || 'Wystąpił błąd';
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else {
    errorMessage = 'Nieznany błąd';
  }

  return (
    <div className="error-boundary">
      <div className="error-content">
        {errorStatus && <h1 className="error-status">{errorStatus}</h1>}
        <h2 className="error-title">Ups! Coś poszło nie tak</h2>
        <p className="error-message">{errorMessage}</p>
        <Link to="/" className="error-link">
          Wróć do strony głównej
        </Link>
      </div>
    </div>
  );
};

export default ErrorBoundary;
