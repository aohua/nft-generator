const debounce = (fn: Function, wait: number) => {
  let timer: NodeJS.Timeout | null = null;
  return (...params: any) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn.apply(this, params);
    }, wait);
  };
};

export default debounce;
