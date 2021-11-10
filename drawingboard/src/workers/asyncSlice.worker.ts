export const slice = async (
  arr: Uint8ClampedArray | null,
  start: number,
  end: number
) => {
  if (!arr) {
    return arr;
  }
  return arr.slice(start, end);
};

export const toArray = async (arr: Uint8ClampedArray | null) => {
  if (!arr) {
    return arr;
  }
  return Array.from(arr);
};
