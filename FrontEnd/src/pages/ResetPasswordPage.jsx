import { Navigate } from 'react-router-dom';

/** Legacy route — password reset is handled in the forgot-password OTP flow. */
export default function ResetPasswordPage() {
  return <Navigate to="/forgot-password" replace />;
}
