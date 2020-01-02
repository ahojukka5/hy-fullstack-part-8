import React, { useState } from 'react';
import { GET_AUTHORS, EDIT_AUTHOR } from './Queries';
import { useQuery, useMutation } from '@apollo/react-hooks';

const AuthorsLayout = ({ children }) => (
  <div>
    <h2>Authors</h2>
    {children}
  </div>
);

const Authors = (props) => {
  const { loading, error, data } = useQuery(GET_AUTHORS);
  const [state, setState] = useState({ name: '', born: '' });
  const [editAuthor] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [{ query: GET_AUTHORS }],
  });
  const [errorMessage, setErrorMessage] = useState('');
  if (!props.show) return null;
  if (loading) return <AuthorsLayout>Loading...</AuthorsLayout>;
  if (error) return `Error! ${error.message}`;

  const authors = data.allAuthors;

  const onSubmit = async (event) => {
    event.preventDefault();
    const variables = { ...state, born: Number(state.born) };
    try {
      await editAuthor({ variables });
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message);
    }
    setState({ name: '', born: '' });
  };

  return (
    <AuthorsLayout>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {authors.map((a) => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>set birthyear</h2>
      <form onSubmit={onSubmit}>
        <div>
          name
          <select
            value={state.name}
            onChange={(event) =>
              setState({ ...state, name: event.target.value })
            }
          >
            <option>Select author</option>
            {authors.map((a) => (
              <option key={a.name} value={a.name}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          born
          <input
            value={state.born}
            onChange={(event) =>
              setState({ ...state, born: event.target.value })
            }
          />
        </div>
        <button type="submit">update author</button>
      </form>
      <div>{errorMessage}</div>
    </AuthorsLayout>
  );
};

export default Authors;
