import React, { useEffect, useState } from "react";
import { loginWithProvider, loginUser } from "../firebase/auth";
import { providers } from "../firebase/authProviders";
import { useAuth } from "../context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import IllustrationSlide from "../components/IllustrationSlide";
import OrDivider from "../components/OrDivider";
import { FcGoogle } from "react-icons/fc";
import { FaFacebookF, FaGithub, FaDiscord } from "react-icons/fa";
import { FaMicrosoft } from "react-icons/fa6";
import logo from "../assets/logo.png";

function Login() {
  const { user, setUser, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // restore cached email & session
  useEffect(() => {
    const cachedEmail = localStorage.getItem("cachedEmail");
    if (cachedEmail) setEmail(cachedEmail);

    const cachedUser = localStorage.getItem("notiq_user");
    if (cachedUser) {
      setUser(JSON.parse(cachedUser));
      navigate("/dashboard");
    }
  }, []);

  useEffect(() => {
    if (email) localStorage.setItem("cachedEmail", email);
  }, [email]);

  const handleEmailLogin = async () => {
    setError("");
    try {
      const userDoc = await loginUser(email);
      setUser(userDoc);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleProviderLogin = async (name) => {
    try {
      const userDoc = await loginWithProvider(providers[name]);
      setUser(userDoc);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  if (loading) return <div className="text-center">Welcoming our newest Notiqer</div>;
  if (user) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen flex bg-white">
      <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
        <IllustrationSlide />
      </div>

      <div className="sm:w-screen flex-1 flex flex-col items-center justify-center p-10 md:p-16 bg-white shadow-lg">
        <div className="mb-10 text-center">
          <img src={logo} alt="" className="w-28 flex mx-14" />
          <h3 className="text-gray-900 font-bold text-3xl mb-1">Welcome to Notiq</h3>
          <h4 className="text-gray-700 text-lg">Log in to your Notiq account</h4>
        </div>

        <div className="flex gap-4 w-full max-w-md ml-20">
          {["google", "facebook", "github"].map((p) => (
            <button
              key={p}
              onClick={() => handleProviderLogin(p)}
              className="cursor-pointer bg-[#f5f5f5] px-6 h-20 rounded-xl text-gray-700 font-semibold hover:bg-white hover:shadow-md hover:scale-105 transition"
            >
              {p === "google" && <FcGoogle size={30} className="mx-auto mb-1" />}
              {p === "facebook" && <FaFacebookF size={30} color="#1877F2" className="mx-auto mb-1" />}
              {p === "github" && <FaGithub size={30} className="mx-auto mb-1" />}
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        <div className="hidden md:flex px-16 gap-4 w-full max-w-md mt-4 ml-20">
          {["discord", "microsoft"].map((p) => (
            <button
              key={p}
              onClick={() => handleProviderLogin(p)}
              className="cursor-pointer bg-[#f5f5f5] px-6 h-20 rounded-xl text-gray-700 font-semibold hover:bg-white hover:shadow-md hover:scale-105 transition"
            >
              {p === "discord" && <FaDiscord size={30} className="mx-auto mb-1" />}
              {p === "microsoft" && <FaMicrosoft size={30} className="mx-auto mb-1" />}
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        <OrDivider />

        <div className="flex flex-col w-full max-w-md text-gray-500 font-semibold">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            placeholder="Enter your email address"
            className="bg-white border rounded-lg p-3 shadow-sm font-normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            onClick={handleEmailLogin} disabled={!email}
            className="btn bg-slate-600 p-3 text-center text-white shadow-md hover:bg-slate-800 mt-6 hover:scale-105 transform transition"
          >
            Continue
          </button>
          {error && <p className="text-red-500 mt-2">{error}</p>}
          <p className="text-center font-normal text-gray-400 text-sm mt-2">
            Use an organization email to easily collaborate with teammates
          </p>
        </div>

        <a href="/register" className="text-sm text-center mt-2 link text-gray-500">
          Don't have an account? Register
        </a>
        <p className="text-sm text-gray-500 mt-5 max-w-md text-center">
          By continuing, you agree to the <a className="underline">Terms & Conditions</a> and{" "}
          <a className="underline" href="https://www.privacypolicies.com/live/9174002e-9d54-41a9-94ee-dc75c93d497d">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}

export default Login;
