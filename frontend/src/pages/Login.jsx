import { useContext, useState } from "react";
import { login as apiLogin } from "../api/authApi";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({});

  const submit = async () => {
    const res = await apiLogin(form);
    login(res.data.token);
  };

  return (
    <>
      <input placeholder="Email" onChange={e => setForm({...form, email: e.target.value})} />
      <input placeholder="Password" type="password" onChange={e => setForm({...form, password: e.target.value})} />
      <button onClick={submit}>Login</button>
    </>
  );
}
