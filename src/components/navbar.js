import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { clearToken } from "../store/tokenSlice";

const Navbar = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.token.token);
  const isLoggedIn = !!token;

  const handleSignIn = () => {
    router.push("/loginPage");
  };

  const handleSignOut = () => {
    dispatch(clearToken());
    router.push("/");
  };

  const handleDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="flex-none">
      </div>
      <div className="flex-1">
        <a className="btn btn-ghost text-xl">OpenHour</a>
      </div>
      <div className="flex-none">
        {isLoggedIn ? (
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost">
              My Account
            </label>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
              <li><a onClick={handleDashboard}>Dashboard</a></li>
              <li><a onClick={handleSignOut}>Sign Out</a></li>
            </ul>
          </div>
        ) : (
          <button className="btn btn-ghost" onClick={handleSignIn}>
            Sign In
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
