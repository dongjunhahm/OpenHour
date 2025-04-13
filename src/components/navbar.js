import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { clearToken } from "../store/tokenSlice";

const Navbar = ({ toggleSidebar }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.token.token);
  const isLoggedIn = !!token;
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const handleHome = () => {
    router.push("/");
  };

  const handleAbout = () => {
    // Implement about page navigation or scroll to about section
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav 
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-md py-2" : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <button 
              className="text-2xl font-bold flex items-center" 
              onClick={handleHome}
            >
              <span className={scrolled ? "text-blue-600" : "text-blue-600"}>Open</span>
              <span className={scrolled ? "text-gray-900" : "text-gray-900"}>Hour</span>
            </button>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink href="/" label="Home" scrolled={scrolled} />
            <NavLink href="/#features" label="Features" scrolled={scrolled} />
            <NavLink href="/#about" label="About" scrolled={scrolled} />
            
            {isLoggedIn ? (
              <div className="relative group">
                <button className={`font-medium ${
                  scrolled ? "text-gray-700 hover:text-blue-600" : "text-gray-800 hover:text-blue-600"
                }`}>
                  My Account
                </button>
                <div className="absolute right-0 w-48 mt-2 origin-top-right bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-200">
                  <div className="py-1">
                    <a 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer" 
                      onClick={handleDashboard}
                    >
                      Dashboard
                    </a>
                    <a 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer" 
                      onClick={handleSignOut}
                    >
                      Sign Out
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg transition duration-300"
              >
                Sign In
              </button>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
              aria-label="toggle menu"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                {mobileMenuOpen ? (
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.828 4.828z"
                  />
                ) : (
                  <path
                    fillRule="evenodd"
                    d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white shadow-xl mt-2 py-2">
          <div className="container mx-auto px-4">
            <a href="/" className="block py-2 text-gray-800">Home</a>
            <a href="/#features" className="block py-2 text-gray-800">Features</a>
            <a href="/#about" className="block py-2 text-gray-800">About</a>
            
            {isLoggedIn ? (
              <>
                <a 
                  onClick={handleDashboard} 
                  className="block py-2 text-gray-800 cursor-pointer"
                >
                  Dashboard
                </a>
                <a 
                  onClick={handleSignOut} 
                  className="block py-2 text-gray-800 cursor-pointer"
                >
                  Sign Out
                </a>
              </>
            ) : (
              <a 
                onClick={handleSignIn}
                className="block py-2 text-blue-600 font-medium cursor-pointer"
              >
                Sign In
              </a>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

const NavLink = ({ href, label, scrolled }) => {
  return (
    <a 
      href={href} 
      className={`font-medium transition-colors duration-300 ${
        scrolled ? "text-gray-700 hover:text-blue-600" : "text-gray-800 hover:text-blue-600"
      }`}
    >
      {label}
    </a>
  );
};

export default Navbar;