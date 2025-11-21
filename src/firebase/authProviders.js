import { auth } from "./firebaseConfig";
import { 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  FacebookAuthProvider,
  TwitterAuthProvider,
  OAuthProvider,
  signInWithPopup
} from "firebase/auth";

// Create providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const twitterProvider = new TwitterAuthProvider();
const microsoftProvider = new OAuthProvider('microsoft.com');

// Function to sign in
export const signInWithProvider = async (provider) => {
  try {
    const result = await signInWithPopup(auth, provider);
    // user info
    const user = result.user;
    return user;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const providers = {
  google: googleProvider,
  github: githubProvider,
  facebook: facebookProvider,
  twitter: twitterProvider,
  microsoft: microsoftProvider
};
