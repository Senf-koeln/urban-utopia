import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { listUtopiaRequestsByUser } from "@/lib/dataAccess";
import { ids } from "../helpers/ids";

interface UserContextType {
  userId: string | null;
  setUserId: (id: string | null) => void;
  userCredits: number;
  setUserCredits: React.Dispatch<React.SetStateAction<number>>;
  remainingCredits: number;
  fetchUserRemainingCredits: (userId: string | null) => Promise<void>;
  setRemainingCredits: React.Dispatch<React.SetStateAction<number>>;
}

const UserContext = createContext<UserContextType>({
  userId: null,
  setUserId: () => {},
  userCredits: 50,
  setUserCredits: () => {},
  remainingCredits: 0,
  fetchUserRemainingCredits: async () => {},
  setRemainingCredits: () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [userCredits, setUserCredits] = useState<number>(0);
  const [remainingCredits, setRemainingCredits] = useState<number>(0);
  const [userId, setUserIdState] = useState<string | null>(
    localStorage.getItem("id")
  );

  // Sync userId changes with localStorage
  useEffect(() => {

    console.log(userId, localStorage)
    if (userId !== null) {
      localStorage.setItem("id", userId);
    } else {
      localStorage.removeItem("id");
    }
  }, [userId]);

  const setUserId = (id: string | null) => {
    console.log("setUserId", id);
    setUserIdState(id);
  };

  const fetchUserRemainingCredits = useCallback(async () => {
    if (!userId) return;
    const requests = await listUtopiaRequestsByUser(userId);
    const attemptsWithoutRetries = requests.filter(
      (request) => Number(request.retryCount) < 1,
    ).length;
    const currentUser = ids.find(({ id }) => id === userId);
    const currentCredits = currentUser ? currentUser.credits : 50;
    setRemainingCredits(currentCredits - attemptsWithoutRetries);
  }, [userId]);

  useEffect(() => {
    const user = ids.find(({ id }) => id === userId);
    if (user) {
      setUserCredits(user.credits);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUserRemainingCredits();
    }
  }, [userId, userCredits, fetchUserRemainingCredits]);

  return (
    <UserContext.Provider
      value={{
        userId,
        setUserId,
        userCredits,
        setUserCredits,
        remainingCredits,
        setRemainingCredits,
        fetchUserRemainingCredits,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
