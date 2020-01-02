import React, { useState, useEffect } from 'react';
import Authors from './components/Authors';
import Books from './components/Books';
import NewBook from './components/NewBook';
import Recommendations from './components/Recommendations';
import Login from './components/Login';
import { useApolloClient, useSubscription } from '@apollo/react-hooks';
import { BOOK_ADDED, GET_BOOKS } from './components/Queries';

const App = () => {
  const [page, setPage] = useState('authors');
  const [token, setToken] = useState(null);
  const [message, setMessage] = useState(null);
  const client = useApolloClient();

  useSubscription(BOOK_ADDED, {
    onSubscriptionData: ({ subscriptionData }) => {
      showMessage(`Book ${subscriptionData.data.bookAdded.title} added!`);
      const data = client.readQuery({ query: GET_BOOKS });
      data.allBooks.push(subscriptionData.data.bookAdded);
      subscriptionData.data.bookAdded.genres.forEach(
        (genre) => data.allGenres.includes(genre) || data.allGenres.push(genre)
      );
      client.writeQuery({ query: GET_BOOKS, data });
    },
  });

  useEffect(() => {
    const token = window.localStorage.getItem('library-user-token');
    if (token) setToken(token);
  }, []);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 5000);
  };

  const handleLogin = (token) => {
    showMessage('Succesfully logged in!');
    setToken(token);
    localStorage.setItem('library-user-token', token);
    setPage('authors');
  };

  const handleLogout = () => {
    showMessage('Succesfully logged out!');
    localStorage.clear();
    client.resetStore();
    setToken(null);
  };

  const LoginButton = () => (
    <button onClick={() => setPage('login')}>Login</button>
  );

  const LogoutButton = () => <button onClick={handleLogout}>Logout</button>;

  return (
    <div>
      {message && <div>{message}</div>}
      <div>
        <button onClick={() => setPage('authors')}>Authors</button>
        <button onClick={() => setPage('books')}>Books</button>
        <button onClick={() => setPage('recommendations')}>
          Recommendations
        </button>
        <button onClick={() => setPage('add')}>Add book</button>
        {token ? <LogoutButton /> : <LoginButton />}
      </div>

      <Authors show={page === 'authors'} />
      <Books show={page === 'books'} />
      <Recommendations show={page === 'recommendations'} />
      <NewBook show={page === 'add'} />
      <Login show={page === 'login'} onLogin={handleLogin} />
    </div>
  );
};

export default App;
