export const peso = (n: number) => "₱" + Number(n).toLocaleString("en-PH");
export const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
/** PH mobile / landline: 10–13 digits */
export const validPhone = (v: string) => {
  const d = v.replace(/\D/g, "");
  return d.length >= 10 && d.length <= 13;
};
export const plural = (n: number, word: string, many = word + "s") => `${n} ${n === 1 ? word : many}`;
