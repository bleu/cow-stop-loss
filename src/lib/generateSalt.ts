export function generateSalt(): `0x${string}` {
  const characters = "abcdef0123456789";
  const sault = [...Array(64).keys()]
    .map((i) =>
      characters.charAt(Math.floor(Math.random() * characters.length))
    )
    .join("");

  return `0x${sault}`;
}
