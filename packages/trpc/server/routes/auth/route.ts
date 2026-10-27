import { publicProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { userService } from "../../services";
import {
  createUserWithEmailAndPasswordInputModel,
  createUserWithEmailAndPasswordOutputModel,
} from "./model";
import { setAuthenticationCookie } from "../../utils/cookie";
const TAGS = ["Authentication"];
const getPath = generatePath("/authentication");

export const authRouter = router({
  createUserWithEmailAndPassword: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/create-user-with-email-and-password"),
        tags: TAGS,
        summary: "Create a user with email and password",
        description: "Create a user with email and password",
      },
    })
    .input(createUserWithEmailAndPasswordInputModel)
    .output(createUserWithEmailAndPasswordOutputModel)
    .mutation(async ({ input, ctx }) => {
      const { fullName, email, password } = input;
      const { id, token } = await userService.createUserWithEmailAndPassword({
        fullName,
        email,
        password,
      });
      setAuthenticationCookie(ctx, token);
      return {
        id,
      };
    }),
});
