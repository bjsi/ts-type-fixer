export type Success<T> = {
  success: true;
  data: T;
};

export type Fail<E> = {
  success: false;
  error: E;
};
