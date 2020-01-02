import React, { useState } from 'react';
import { GET_BOOKS } from './Queries';
import { useQuery } from '@apollo/react-hooks';

const BooksLayout = ({ children }) => (
  <div>
    <h2>Books</h2>
    {children}
  </div>
);

const Books = (props) => {
  const [genre, setGenre] = useState(null);
  const variables = genre ? { genre } : {};
  const { loading, error, data } = useQuery(GET_BOOKS, { variables });

  if (!props.show) return null;
  if (loading) return <BooksLayout>Loading...</BooksLayout>;
  if (error) return `Error! ${error.message}`;
  const allGenres = data.allGenres || [];

  return (
    <BooksLayout>
      <div>in genre {genre}</div>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {data.allBooks.map((a) => (
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {allGenres.map((genre) => (
        <button key={genre} onClick={() => setGenre(genre)}>
          {genre}
        </button>
      ))}
      <button onClick={() => setGenre(null)}>all genres</button>
    </BooksLayout>
  );
};

export default Books;
