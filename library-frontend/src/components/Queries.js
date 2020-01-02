import { gql } from 'apollo-boost';

const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      value
    }
  }
`;

const BOOK_DETAILS = gql`
  fragment BookDetails on Book {
    id
    title
    published
    author {
      id
      name
      born
    }
    genres
  }
`;

const ADD_BOOK = gql`
  mutation AddBook(
    $title: String!
    $published: Int!
    $author: String!
    $genres: [String!]!
  ) {
    addBook(
      title: $title
      published: $published
      author: $author
      genres: $genres
    ) {
      ...BookDetails
    }
  }
  ${BOOK_DETAILS}
`;

const GET_BOOKS = gql`
  query getBooks($genre: String) {
    allBooks(genre: $genre) {
      ...BookDetails
    }
    allGenres
  }
  ${BOOK_DETAILS}
`;

const GET_RECOMMENDATIONS = gql`
  query getBooks($genre: String) {
    allBooks(genre: $genre) {
      ...BookDetails
    }
    me {
      username
      favoriteGenre
    }
  }
  ${BOOK_DETAILS}
`;

const BOOK_ADDED = gql`
  subscription {
    bookAdded {
      ...BookDetails
    }
  }
  ${BOOK_DETAILS}
`;

const GET_AUTHORS = gql`
  {
    allAuthors {
      name
      born
      bookCount
    }
  }
`;
const EDIT_AUTHOR = gql`
  mutation editAuthor($name: String!, $born: Int!) {
    editAuthor(name: $name, setBornTo: $born) {
      name
      born
    }
  }
`;

export {
  LOGIN,
  BOOK_DETAILS,
  ADD_BOOK,
  BOOK_ADDED,
  GET_BOOKS,
  GET_RECOMMENDATIONS,
  GET_AUTHORS,
  EDIT_AUTHOR,
};
