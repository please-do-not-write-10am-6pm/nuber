import { GraphQLServer } from "graphql-yoga";
import { NextFunction, Request, Response } from "express";
import logger from "morgan";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import schema from "./schema";
import cors from "cors";
import entities from "./entities";
import { JWT_SECRET } from "./keys";

class App {
  public app: GraphQLServer;

  constructor() {
    this.app = new GraphQLServer({
      schema,
      context: req => {
        return {
          req: req.request
        };
      }
    });
    this.middlewares();
  }
  private middlewares = (): void => {
    this.app.express.use(cors());
    this.app.express.use(this.appendUserToReq);
    this.app.express.use(logger("dev"));
    this.app.express.use(helmet());
  };

  private appendUserToReq = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const token = req.get("X-JWT");
    if (token) {
      try {
        const decoded = await jwt.verify(token, JWT_SECRET);
        const reqUser = await entities.User.findOne(decoded["id"]);
        req["user"] = reqUser;
      } catch (err) {
        return err;
      }
    }
    next();
  };
}

export default new App().app;
