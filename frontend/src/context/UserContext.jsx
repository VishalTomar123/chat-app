import { createContext, useContext, useEffect, useState } from "react";
import API from "../services/api";

const UserContext = createContext();

export const UserProvider = ({ children }) => {

  // const userId = localStorage.getItem("userId");

  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    const userId = localStorage.getItem("userId");

    if (!userId) return;

    try {

      const res = await API.get(`/users/profile`);

      setUser(res.data);

    } catch (err) {
      console.log(err);
    }

  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        fetchUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);