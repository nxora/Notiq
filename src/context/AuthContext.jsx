import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed → user:", currentUser);

      if (!currentUser) {
        // restore from localStorage
        const cachedProfile = localStorage.getItem("cachedProfile");
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);
          setProfile(parsed);
          setUser({ uid: parsed.id, email: parsed.email });
        } else {
          setProfile(null);
          setUser(null);
        }
        setLoading(false);
        return;
      }

      setUser(currentUser);

      try {
        const ref = doc(db, "users", currentUser.uid);
        const snap = await getDoc(ref);

        let profileData;
        if (!snap.exists()) {
          profileData = {
            id: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || "",
            avatar: currentUser.photoURL || null,
            bio: "",
            streaks: 0,
            friends: [],
            createdAt: Date.now(),
          };
          await setDoc(ref, profileData);
        } else {
          profileData = snap.data();
        }

        setProfile(profileData);

        // persist profile in localStorage
        localStorage.setItem("cachedProfile", JSON.stringify(profileData));
        localStorage.setItem("notiq_user", JSON.stringify({ ...currentUser, profile: profileData }));
      } catch (err) {
        console.warn("Firestore offline or error, using cached profile", err);

        const cachedProfile = localStorage.getItem("cachedProfile");
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);
          setProfile(parsed);
          setUser({ uid: parsed.id, email: parsed.email });
        } else {
          setProfile({ id: currentUser.uid, email: currentUser.email });
          setUser(currentUser);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
    localStorage.removeItem("cachedProfile");
    localStorage.removeItem("notiq_user");
  };

  return (
    <AuthContext.Provider value={{ user, profile, setUser, setProfile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
