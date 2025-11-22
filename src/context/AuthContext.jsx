import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
    console.log("Current profile →", profile);
}, [profile]);


  useEffect(() => {
    const initAuth = async () => {
      try {
        // ensure Firebase persists sessions
        await setPersistence(auth, browserLocalPersistence);
      } catch (err) {
        console.error("Failed to set Firebase persistence:", err);
      }

      const unsub = onAuthStateChanged(auth, async (currentUser) => {
        
        if (!currentUser) {
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

// fetch from Firestore...
setProfile(profileData); // set profile first
setUser(currentUser);    // then set user

        console.log("Auth state changed → currentUser:", currentUser);

        try {
          const ref = doc(db, "users", currentUser.uid);
          const snap = await getDoc(ref);

          let profileData;
          if (!snap.exists()) {
            profileData = {
              id: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || currentUser.email.split("@")[0],
              avatar: currentUser.photoURL || null,
              bio: "",
              streaks: 0,
              friends: [],
              createdAt: Date.now(),
            };
            await setDoc(ref, profileData);
          } else {
            const data = snap.data();
            profileData = {
              ...data,
              displayName: currentUser.displayName || data.displayName || currentUser.email.split("@")[0],
              avatar: currentUser.photoURL || data.avatar || null,
            };

            // update missing fields in Firestore
            const updates = {};
            if (!data.displayName && currentUser.displayName) updates.displayName = currentUser.displayName;
            if (!data.avatar && currentUser.photoURL) updates.avatar = currentUser.photoURL;
            if (Object.keys(updates).length > 0) await setDoc(ref, { ...data, ...updates });
          }

          setProfile(profileData);
          localStorage.setItem("cachedProfile", JSON.stringify(profileData));
          localStorage.setItem("notiq_user", JSON.stringify({ ...currentUser, profile: profileData }));
        } catch (err) {
          console.warn("Error fetching profile, using cache", err);
          const cachedProfile = localStorage.getItem("cachedProfile");
          if (cachedProfile) {
            const parsed = JSON.parse(cachedProfile);
            setProfile(parsed);
            setUser({ uid: parsed.id, email: parsed.email });
          } else {
            setProfile({
              id: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.email.split("@")[0],
              avatar: null,
            });
            setUser(currentUser);
          }
        } finally {
          setLoading(false);
        }
      });

      return unsub;
    };

    initAuth();
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
