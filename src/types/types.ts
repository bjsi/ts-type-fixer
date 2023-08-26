export type Success<T> = {
  success: true;
  data: T;
};

export type Fail<E> = {
  success: false;
  error: E;
};

export const success = <T>(data: T): Success<T> => ({
  success: true,
  data,
});

export const fail = <E>(error: E): Fail<E> => ({
  success: false,
  error,
});
