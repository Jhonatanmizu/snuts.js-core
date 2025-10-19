let traverse: typeof import("@babel/traverse").default;

try {
  const mod = await import("@babel/traverse");
  traverse = (mod.default || mod) as typeof import("@babel/traverse").default;
} catch (e) {
  throw new Error("Failed to import @babel/traverse: " + e);
}

export { traverse };
