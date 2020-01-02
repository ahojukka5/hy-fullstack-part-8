import React, { useState } from 'react';

import { useQuery } from '@apollo/react-hooks';
import { GET_RECOMMENDATIONS } from './Queries';

const RecommendationsLayout = ({ children }) => (
  <div>
    <h2>Recommended books</h2>
    {children}
  </div>
);

const Recommendations = (props) => {
  const [genre, setGenre] = useState(null);
  const variables = genre ? { genre } : {};
  const { loading, error, data } = useQuery(GET_RECOMMENDATIONS, {
    variables,
    pollInterval: 500,
  });
  if (!props.show) return null;
  if (loading) return <RecommendationsLayout>Loading...</RecommendationsLayout>;
  if (error) return `Error! ${error.message}`;

  if (!data.me) {
    return (
      <RecommendationsLayout>
        Please login to get your favourite books!
      </RecommendationsLayout>
    );
  }

  // Set genre only first time.
  if (!genre) setGenre(data.me.favoriteGenre);

  return (
    <RecommendationsLayout>
      <div>books in your favorite genre {genre}</div>
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
    </RecommendationsLayout>
  );
};

export default Recommendations;
