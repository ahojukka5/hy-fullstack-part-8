const {
  ApolloServer,
  UserInputError,
  AuthenticationError,
  gql,
  PubSub,
} = require('apollo-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;

const Authors = require('./models/author');
const Books = require('./models/book');
const Users = require('./models/user');

mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

console.log('connecting to', MONGODB_URI);

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('connected to MongoDB');
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message);
  });

const pubsub = new PubSub();

const typeDefs = gql`
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Book {
    id: ID!
    title: String!
    published: Int!
    author: Author!
    genres: [String!]!
  }

  type Author {
    id: ID!
    name: String!
    born: Int
    bookCount: Int!
  }

  type Subscription {
    bookAdded: Book!
  }

  type Query {
    hello: String!
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    allUsers: [User!]!
    allGenres: [String!]!
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      published: Int!
      author: String!
      genres: [String!]!
    ): Book

    editAuthor(name: String!, setBornTo: Int!): Author

    createUser(username: String!, favoriteGenre: String!): User

    login(username: String!, password: String!): Token
  }
`;

const resolvers = {
  Query: {
    hello: () => {
      return 'world';
    },

    bookCount: () => Books.collection.countDocuments(),

    authorCount: () => Authors.collection.countDocuments(),

    allBooks: async (root, args) => {
      let boks = await Books.find({}).populate('author');
      const byAuthor = (book) => book.author.name === args.author;
      const byGenre = (book) => book.genres.includes(args.genre);
      args.genre &&
        args.genre !== 'all genres' &&
        (boks = boks.filter(byGenre));
      args.author && (boks = boks.filter(byAuthor));
      return boks;
    },

    /*
     * Solving N+1 problem
     *
     * The trick here is that we fetch all books and given book.author._id we
     * can from there count the number of books per author to a temporary
     * object, which is then used to manually populate author.bookCount
     */
    allAuthors: async () => {
      // console.log('allAuthors(): Authors.find');
      const authors = await Authors.find({});
      // console.log('allAuthors(): Books.find');
      const books = await Books.find({});
      const bookCount = books.reduce((bookCount, book) => {
        const bid = book.author._id;
        bookCount[bid] = (bookCount[bid] || 0) + 1;
        return bookCount;
      }, {});
      // console.log(bookCount);
      return authors
        .map((author) => author.toObject())
        .map((author) => ({
          ...author,
          bookCount: bookCount[author._id] || 0,
        }));
    },

    allUsers: async () => {
      const users = await Users.find({});
      return users;
    },

    allGenres: async () => {
      const allGenres = new Set();
      const books = await Books.find({});
      books.forEach((book) =>
        book.genres.forEach((genre) => allGenres.add(genre))
      );
      return [...allGenres];
    },

    me: (root, args, context) => {
      return context.currentUser;
    },
  },

  Author: {
    /*
     * Here, if root.bookCount is defined (which is precalculated above), use
     * that to determine the number of books. Otherwise, as a fall back method,
     * count the number of books like before. So, if we enter to
     * Author.bookCount from allAuthors(), use precalculated numbers.
     */
    bookCount: async (root) => {
      // If we have bookCount defined in parent, then we have precalculated it.
      if (typeof root.bookCount !== 'undefined') return root.bookCount;
      // console.log('bookCount: Authors.findOne');
      const author = await Authors.findOne({ name: root.name });
      // console.log('bookCount: Books.collection.countDocuments');
      const bookCount = await Books.collection.countDocuments({
        author: author._id,
      });
      return bookCount;
    },
  },

  Mutation: {
    addBook: async (root, args, context) => {
      if (!context.currentUser) {
        throw new AuthenticationError('not authenticated');
      }

      let author = await Authors.findOne({ name: args.author });

      if (!author) {
        try {
          author = await new Authors({ name: args.author, born: null }).save();
        } catch (error) {
          throw new UserInputError(error.message, { invalidArgs: args });
        }
      }
      try {
        const book = new Books({ ...args, author }).save();
        pubsub.publish('BOOK_ADDED', { bookAdded: book });
        return book;
      } catch (error) {
        throw new UserInputError(error.message, { invalidArgs: args });
      }
    },

    editAuthor: async (root, args, context) => {
      if (!context.currentUser) {
        throw new AuthenticationError('not authenticated');
      }
      const author = await Authors.findOne({ name: args.name });
      if (author) {
        const newAuthor = { name: author.name, born: args.setBornTo };
        await Authors.findByIdAndUpdate(author._id, newAuthor, { new: true });
        return newAuthor;
      } else {
        return null;
      }
    },

    createUser: (root, args) => {
      const user = new Users({
        username: args.username,
        favoriteGenre: args.favoriteGenre,
      });
      return user.save().catch((error) => {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      });
    },

    login: async (root, args) => {
      const user = await Users.findOne({ username: args.username });
      if (!user || args.password !== 'secret') {
        throw new UserInputError('wrong credentials');
      }
      const userForToken = { username: user.username, id: user._id };
      return { value: jwt.sign(userForToken, JWT_SECRET) };
    },
  },

  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOK_ADDED']),
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null;
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET);
      const currentUser = await Users.findById(decodedToken.id);
      return { currentUser };
    }
  },
});

server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`Server ready at ${url}`);
  console.log(`Subscriptions ready at ${subscriptionsUrl}`);
});
