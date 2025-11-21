import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (currentUser) => {
    try {
      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Only allow verified emails
      if (!currentUser.emailVerified) {
        setUser(null);
        setLoading(false);
        return;
      }

      const ref = doc(db, "users", currentUser.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        await setDoc(ref, {
          id: currentUser.uid,
          email: currentUser.email,
          createdAt: Date.now(),
          avatar: null,
          bio: "",
          streaks: 0,
          friends: [],
        });
      }

      setUser(currentUser);
    } catch (err) {
      console.error("AuthProvider error:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  });

  return () => unsub();
}, []);


  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
