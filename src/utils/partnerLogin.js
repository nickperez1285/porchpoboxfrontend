import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getApiUrl } from "../config/api";

export const resolvePartnerLogin = async (user) => {
  const partnerDoc = await getDoc(doc(db, "partners", user.uid));
  if (partnerDoc.exists()) {
    return { action: "navigate", path: "/partner" };
  }

  try {
    const idToken = await user.getIdToken();
    const response = await fetch(
      getApiUrl("/api/notifications/partner-auth-status"),
      {
        headers: { Authorization: `Bearer ${idToken}` },
      },
    );

    if (response.ok) {
      const data = await response.json();
      if (data.registeredWithDifferentAuth) {
        return {
          action: "error",
          message:
            "This email is already registered as a partner with email and password. Please sign in with email and password instead of Google.",
        };
      }
    }
  } catch (error) {
    console.warn("Partner auth status check failed:", error);
  }

  return { action: "navigate", path: "/partner/register" };
};
