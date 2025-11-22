import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed → user is:", currentUser);

      if (!currentUser) {
        // Try restore cached profile for offline
        const cachedProfile = localStorage.getItem("cachedProfile");
        if (cachedProfile) {
          setProfile(JSON.parse(cachedProfile));
          setUser({ uid: JSON.parse(cachedProfile).id });
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
        return;
      }

      // User is authenticated
      setUser(currentUser);

      // Try fetching profile from Firestore
      try {
        const ref = doc(db, "users", currentUser.uid);
        const snap = await getDoc(ref);

        let profileData;
        if (!snap.exists()) {
          profileData = {
            id: currentUser.uid,
            email: currentUser.email,
            createdAt: Date.now(),
            avatar: null,
            bio: "",
            streaks: 0,
            friends: [],
          };
          await setDoc(ref, profileData);
        } else {
          profileData = snap.data();
        }

        setProfile(profileData);
        localStorage.setItem("cachedProfile", JSON.stringify(profileData));
      } catch (err) {
        console.warn("Firestore offline or error, using cached profile", err);

        // Fallback to cached profile
        const cachedProfile = localStorage.getItem("cachedProfile");
        if (cachedProfile) {
          setProfile(JSON.parse(cachedProfile));
        } else {
          // If no cached profile, create a minimal one
          setProfile({
            id: currentUser.uid,
            email: currentUser.email,
          });
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const logout = async () => {
    await auth.signOut();
    setUser(null);
    setProfile(null);
    localStorage.removeItem("cachedProfile");
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
