import React, { useState } from 'react';
import { useMutation } from '@apollo/react-hooks';
import { LOGIN } from './Queries';

const initialState = { username: '', password: '', error: null };

const Login = ({ show, onLogin }) => {
  const [state, setState] = useState(initialState);

  const handleError = ({ message }) => {
    setState({ ...state, error: `Login failed: ${message}` });
  };

  const [login] = useMutation(LOGIN, {
    onError: handleError,
  });

  const handleLogin = async (event) => {
    event.preventDefault();
    setState(initialState);
    const result = await login({
      variables: { username: state.username, password: state.password },
    });

    if (result) {
      const token = result.data.login.value;
      onLogin && onLogin(token);
    }
  };

  const onChange = (event) => {
    setState({ ...state, [event.target.name]: event.target.value });
  };

  return show ? (
    <>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          username
          <input
            type="text"
            name="username"
            value={state.username}
            onChange={onChange}
          />
        </div>
        <div>
          password
          <input
            type="password"
            name="password"
            value={state.password}
            onChange={onChange}
          />
        </div>
        <div>
          <button disabled={!state.username || !state.password} type="submit">
            Login
          </button>
        </div>
      </form>
      <div color="red">{state.error}</div>
    </>
  ) : null;
};

export default Login;
