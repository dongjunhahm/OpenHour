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

  const handleHome = () => {
    router.push("/");
  };

  return (
    <nav className="fixed top-0 w-full bg-white shadow-sm py-4 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <button 
              className="text-2xl font-bold flex items-center" 
              onClick={handleHome}
            >
              <span className="text-black">Open</span>
              <span className="text-black">Hour</span>
            </button>
          </div>
          
          {/* Sign In Button */}
          <div>
            {isLoggedIn ? (
              <button
                onClick={handleSignOut}
                className="bg-black text-white font-medium px-5 py-2 rounded-lg transition duration-300"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={handleSignIn}
                className="bg-black text-white font-medium px-5 py-2 rounded-lg transition duration-300"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;