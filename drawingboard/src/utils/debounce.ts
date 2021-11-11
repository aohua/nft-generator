function debounce<T extends Function>(fn: T, wait: number) {
  let timer: NodeJS.Timeout | null = null;
  return (...params: any) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      // @ts-ignore: this error
      fn.apply(this, params);
    }, wait);
  };
}

export default debounce;
