const typeDefs = `
  type User {
    _id: ID
    username: String
    email: String
    password: String
    thoughts: [Thought]!
  }

  type Book {
    _id: ID
    author: String
    description: String
    bookId: String
    image: String
    link: String
    title: String
  }
    input BookInput {
    author: String
    description: String!
    bookId: String!
    image: String
    link: String
    title: String!
    }

  input UserInput {
    username: String!
    email: String!
    password: String!
  }
  
  type Auth {
    token: ID!
    user: User
  }

  type Query {
    users: [User]
    user(username: String!): User
    books: [Book]!
    book(bookId: ID!): Book
    me: User
  }

  type Mutation {
    addUser(input: UserInput!): Auth
    login(email: String!, password: String!): Auth
    addBook(input: bookInput!): Book
    removeBook(bookId: ID!): Book
  }
`;

export default typeDefs;
