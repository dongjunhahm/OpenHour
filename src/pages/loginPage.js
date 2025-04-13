import LoginForm from "../components/loginForm";
import { useRouter } from "next/router";

export default function Page() {
  const router = useRouter();
  const { redirect_to } = router.query;
  const isCalendarInvite = redirect_to && redirect_to.includes('/shared-calendar/');
  return (
    <div
      data-theme="light"
      className="flex min-h-svh w-full items-center justify-center p-6 md:p-10"
    >
      <div className="w-full max-w-sm">
        {isCalendarInvite && (
          <div className="alert alert-info mb-4">
            <span>Please log in to access the shared calendar you were invited to.</span>
          </div>
        )}
        <LoginForm />
      </div>
    </div>
  );
}
