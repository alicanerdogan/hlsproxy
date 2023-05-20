export function btoa(str: string) {
  return Buffer.from(str, "binary").toString("base64");
}

export function atob(str: string) {
  return Buffer.from(str, "base64").toString("binary");
}
