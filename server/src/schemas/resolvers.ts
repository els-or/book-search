import { User, Book } from '../models/index.js';
import { signToken, AuthenticationError } from '../services/auth.js'; 

interface AddUserArgs {
    input: {
        username: string;
    email: string;
    password: string;
}
}

interface LoginUserArgs {
    email: string;
    password: string;
}

interface UserArgs {
    username: string;
}

interface BookArgs {
  input: {
    bookId: string;
    bookTitle: string;
    bookAuthor: string;
}
}

interface saveBookArgs {
    bookData: BookArgs;
}

const resolvers = {
  Query: {
    users: async () => {
      return User.find().populate('savedBooks');
    },
    user: async (_parent: any, { username }: UserArgs) => {
      return User.findOne({ username }).populate('savedBooks');
    },
    books: async () => {
      return await Book.find().sort({ createdAt: -1 });
    },
    book: async (_parent: any, { input }: BookArgs) => {
      return await Book.findOne({ _id: input.bookId });
    },
    // Query to get the authenticated user's information
    // The 'me' query relies on the context to check if the user is authenticated
    me: async (_parent: any, _args: any, context: any) => {
      // If the user is authenticated, find and return the user's information along with their thoughts
      if (context.user) {
        return User.findOne({ _id: context.user._id }).populate('books');
      }
      // If the user is not authenticated, throw an AuthenticationError
      throw new AuthenticationError('Could not authenticate user.');
    },
  },
  Mutation: {
    addUser: async (_parent: any, { input }: AddUserArgs) => {
      // Create a new user with the provided username, email, and password
      const user = await User.create({ ...input });
    
      // Sign a token with the user's information
      const token = signToken(user.username, user.email, user._id);
    
      // Return the token and the user
      return { token, user };
    },
    
    login: async (_parent: any, { email, password }: LoginUserArgs) => {
      // Find a user with the provided email
      const user = await User.findOne({ email });
    
      // If no user is found, throw an AuthenticationError
      if (!user) {
        throw new AuthenticationError('Could not authenticate user.');
      }
    
      // Check if the provided password is correct
      const correctPw = await user.isCorrectPassword(password);
    
      // If the password is incorrect, throw an AuthenticationError
      if (!correctPw) {
        throw new AuthenticationError('Could not authenticate user.');
      }
    
      // Sign a token with the user's information
      const token = signToken(user.username, user.email, user._id);
    
      // Return the token and the user
      return { token, user };
    },
    addBook: async (_parent: any, { bookData }: saveBookArgs, context: any) => {
      if (context.user) {
        const book= await Book.create({ ...bookData });

        await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { thoughts: book._id } }
        );

        return book;
      }
      throw AuthenticationError;
      ('You need to be logged in!');
    },
    addComment: async (_parent: any, { bookData }: saveBookArgs, context: any) => {
      if (context.user) {
        return Book.findOneAndUpdate(
          { _id: bookData.input.bookId },
          {
            $addToSet: {
              savedBook: { bookData, bookAuthor: context.user.username },
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );
      }
      throw AuthenticationError;
    },
    removeBook: async (_parent: any, { bookData }: saveBookArgs, context: any) => {
      if (context.user) {
        const book = await Book.findOneAndDelete({
          _id: bookData.input.bookId,
          bookAuthor: context.user.username,
        });

        if(!book){
          throw AuthenticationError;
        }

        await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { books: book._id } }
        );

        return book;
      }
      throw AuthenticationError;
    }
  }
};

export default resolvers;
