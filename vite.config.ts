import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  class Solution:
    def uniquePaths(self, grid: List[List[int]]) -> int:
        MOD = 10**9 + 7
        m, n = len(grid), len(grid[0])

        # f[i][j][0]: enter (i, j) by moving down
        # f[i][j][1]: enter (i, j) by moving right
        f = [[[0, 0] for _ in range(n)] for _ in range(m)]
        f[0][0][0] = 1

        for i in range(m):
            for j in range(n):
                if i > 0:
                    if grid[i - 1][j] == 0:
                        f[i][j][0] = f[i - 1][j][0] + f[i - 1][j][1]
                    else:
                        f[i][j][0] = f[i - 1][j][1]
                    f[i][j][0] %= MOD

                if j > 0:
                    if grid[i][j - 1] == 0:
                        f[i][j][1] = f[i][j - 1][0] + f[i][j - 1][1]
                    else:
                        f[i][j][1] = f[i][j - 1][0]
                    f[i][j][1] %= MOD

        return (f[m - 1][n - 1][0] + f[m - 1][n - 1][1]) % MOD
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
