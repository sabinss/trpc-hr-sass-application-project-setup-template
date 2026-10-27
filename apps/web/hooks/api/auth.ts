import { trpc } from "~/trpc/client";

export const useSignup = () => {
  const {
    mutate: createUserWithEmailAndPassword,
    mutateAsync: createUserWithEmailAndPasswordAsync,
    error,
    isError,
    isSuccess,
    isPending,
    status,
    failureCount,
  } = trpc.authRouter.createUserWithEmailAndPassword.useMutation();
  return {
    createUserWithEmailAndPassword,
    createUserWithEmailAndPasswordAsync,
    error,
    isError,
    isSuccess,
    isPending,
    status,
    failureCount,
  };
};
