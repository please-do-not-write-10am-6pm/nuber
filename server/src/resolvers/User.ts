export default {
  Query: {
    users: async (parent, args, { entities: { User } }) => {
      const allUsers = await User.find();
      return allUsers;
    }
  },
  Mutation: {
    createUser: async (parent, args, { entities: { User } }) =>
      User.create(args).save()
  }
};
