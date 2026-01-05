export const VALID_EMAIL = {
  re: /^(?![.])[A-Za-z0-9._-]+(?<![.])@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,4}$/,
  text: 'masukkan email yang valid',
}
export const DOTALPHANUM = {
  re: /^[a-zA-Z0-9._-]+$/,
  text: " hanya boleh berisi huruf, angka, '.', '_' atau '-'",
}
export const REPEATED_DOT = {
  re: /(\.\.|__|--)/,
  text: ' tidak boleh berisi simbol berulang',
}
export const NUMBER_ONLY = {
  re: /[^\d]/,
  text: ' hanya boleh berisi angka',
}
export const ALPHASPACE = {
  re: /^[A-Za-z]+(?: [A-Za-z]+)*$/,
  text: ' hanya boleh berisi huruf dan spasi antar kata',
}
export const ANY_UPPERCASE = {
  re: /[A-Z]/,
  text: ' harus berisi minimal 1 huruf kapital',
}
export const ANY_LOWERCASE = {
  re: /[a-z]/,
  text: ' harus berisi minimal 1 huruf kecil',
}
export const ANY_NUMBER = {
  re: /\d/,
  text: ' harus berisi minimal 1 angka',
}
export const ANY_SYMBOL = {
  re: /[\W+_]/,
  text: ' harus berisi minimal 1 simbol',
}
export const NO_SPACE = {
  re: /^\S+$/,
  text: ' tidak boleh berisi spasi',
}
