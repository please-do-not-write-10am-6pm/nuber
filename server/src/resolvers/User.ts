import bcrypt from "bcrypt";
import { sendConfirmationEmail } from "../utils/sendEmail";
import { createJWT } from "../utils/createJWT";
import request from "request-promise";
import { authenticatedResolver } from "../utils/wrappedResolvers";

export default {
  Query: {
    users: authenticatedResolver.wrap((parent, args, { entities: { User } }) =>
      User.find()
    ),
    user: authenticatedResolver.wrap(
      async (parent, { id }, { entities: { User } }) => {
        const user = await User.findOne(id);
        if (user) {
          return {
            ok: true,
            user,
            error: null
          };
        } else {
          return {
            ok: false,
            error: { message: "User not found" }
          };
        }
      }
    )
  },
  Mutation: {
    registerUserWithEmail: async (
      parent,
      args,
      { entities: { User, EmailConfirmation } }
    ) => {
      const newUser = await User.create(args).save();
      const emailConfirmation = await EmailConfirmation.create({
        user: newUser
      }).save();
      const message = await sendConfirmationEmail(emailConfirmation.key);
      emailConfirmation.sent = true;
      emailConfirmation.save();
      return {
        ok: true,
        user: newUser
      };
    },
    updateUser: authenticatedResolver.wrap(
      async (
        parent,
        args,
        { entities: { User } },
        req: Express.Request
      ): Promise<boolean> => {
        const updateData = args;
        if (args.password) {
          const hashedPassword: string = await bcrypt.hash(args.password, 12);
          updateData.password = hashedPassword;
        }
        try {
          await User.update(args.id, args);
          return true;
        } catch (error) {
          return false;
        }
      }
    ),
    confirmUserEmail: authenticatedResolver.wrap(
      async (
        parent,
        { key }: { key: string },
        { entities: { User, EmailConfirmation } },
        req: Express.Request
      ): Promise<object> => {
        if (req.user) {
          const user = await User.findOne(req.user.id);
          const confirmation = await EmailConfirmation.findOne({ key, user });
          if (confirmation) {
            user.verifiedEmail = true;
            user.save();
            await confirmation.remove();
            return {
              ok: true
            };
          } else {
            return {
              ok: false
            };
          }
        } else {
          return {
            ok: false,
            error: {
              message: "Not authenticated"
            }
          };
        }
      }
    ),
    facebookConnect: async (
      parent,
      { token }: { token: string },
      { entities: { User } }
    ) => {
      // https://developers.facebook.com/tools/explorer/?method=GET
      const fbURL = `https://graph.facebook.com/me?access_token=${token}&fields=id,first_name,last_name,email`;
      const fbRequest = await request(fbURL);
      const { id, first_name, last_name, email } = JSON.parse(fbRequest);
      const existingUser = await User.findOne({ facebookId: id });
      if (existingUser) {
        const token = createJWT(existingUser.id);
        return {
          ok: true,
          token
        };
      } else {
        const user = await User.create({
          facebookId: id,
          firstName: first_name,
          lastName: last_name,
          email: `${id}@facebook.com`,
          verifiedEmail: true,
          loginType: "facebook"
        }).save();
        const token = createJWT(user.id);
        return {
          ok: true,
          token
        };
      }
    },
    loginWithEmail: async (
      paret,
      { email, password }: { email: string; password: string },
      { entities: { User } }
    ) => {
      const user = await User.findOne({ email, loginType: "email" });
      if (!user) {
        return {
          ok: false,
          error: {
            message: "No user with that email"
          }
        };
      }
      const validPassword = await user.comparePassword(password, user.password);
      if (!validPassword) {
        return {
          ok: false,
          error: {
            message: "Wrong password"
          }
        };
      }
      const token = createJWT(user.id);
      return {
        ok: true,
        token
      };
    }
  }
};
