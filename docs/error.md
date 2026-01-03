2026-Jan-03 14:12:58.956578 Starting deployment of carlosacostap-unca/epixodo:main to localhost.
2026-Jan-03 14:12:59.158125 Preparing container with helper image: ghcr.io/coollabsio/coolify-helper:1.0.12
2026-Jan-03 14:13:00.778868 Image not found (gowccgsco0c4k4cowgwk04s4:24844aad74b47faed5943838ef7a0160a47e12c7). Building new image.
2026-Jan-03 14:13:00.787399 ----------------------------------------
2026-Jan-03 14:13:00.795476 Importing carlosacostap-unca/epixodo:main (commit sha 24844aad74b47faed5943838ef7a0160a47e12c7) to /artifacts/ogskoc4w4o4ogkcko80okkwo.
2026-Jan-03 14:13:02.717646 Generating nixpacks configuration with: nixpacks plan -f json --env NIXPACKS_NODE_VERSION=22 --env COOLIFY_URL=https://epixodo.acostaparra.com --env COOLIFY_FQDN=epixodo.acostaparra.com --env COOLIFY_BRANCH=main --env COOLIFY_RESOURCE_UUID=gowccgsco0c4k4cowgwk04s4 /artifacts/ogskoc4w4o4ogkcko80okkwo
2026-Jan-03 14:13:03.194478 Found application type: node.
2026-Jan-03 14:13:03.205205 If you need further customization, please check the documentation of Nixpacks: https://nixpacks.com/docs/providers/node
2026-Jan-03 14:13:04.144749 ----------------------------------------
2026-Jan-03 14:13:04.153909 Building docker image started.
2026-Jan-03 14:13:04.160318 To check the current progress, click on Show Debug Logs.
2026-Jan-03 14:13:39.044758 ========================================
2026-Jan-03 14:13:39.053281 Deployment failed: Command execution failed (exit code 1): docker exec ogskoc4w4o4ogkcko80okkwo bash -c 'bash /artifacts/build.sh'
2026-Jan-03 14:13:39.053281 Error: #0 building with "default" instance using docker driver
2026-Jan-03 14:13:39.053281 
2026-Jan-03 14:13:39.053281 #1 [internal] load build definition from Dockerfile
2026-Jan-03 14:13:39.053281 #1 transferring dockerfile: 1.57kB done
2026-Jan-03 14:13:39.053281 #1 DONE 0.0s
2026-Jan-03 14:13:39.053281 
2026-Jan-03 14:13:39.053281 #2 [internal] load metadata for ghcr.io/railwayapp/nixpacks:ubuntu-1745885067
2026-Jan-03 14:13:39.053281 #2 DONE 0.3s
2026-Jan-03 14:13:39.053281 
2026-Jan-03 14:13:39.053281 #3 [internal] load .dockerignore
2026-Jan-03 14:13:39.053281 #3 transferring context: 2B done
2026-Jan-03 14:13:39.053281 #3 DONE 0.0s
2026-Jan-03 14:13:39.053281 
2026-Jan-03 14:13:39.053281 #4 [stage-0  1/11] FROM ghcr.io/railwayapp/nixpacks:ubuntu-1745885067@sha256:d45c89d80e13d7ad0fd555b5130f22a866d9dd10e861f589932303ef2314c7de
2026-Jan-03 14:13:39.053281 #4 DONE 0.0s
2026-Jan-03 14:13:39.053281 
2026-Jan-03 14:13:39.053281 #5 [internal] load build context
2026-Jan-03 14:13:39.053281 #5 transferring context: 985.44kB 0.0s done
2026-Jan-03 14:13:39.053281 #5 DONE 0.0s
2026-Jan-03 14:13:39.053281 
2026-Jan-03 14:13:39.053281 #6 [stage-0  2/11] WORKDIR /app/
2026-Jan-03 14:13:39.053281 #6 CACHED
2026-Jan-03 14:13:39.053281 
2026-Jan-03 14:13:39.053281 #7 [stage-0  3/11] COPY .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix
2026-Jan-03 14:13:39.053281 #7 CACHED
2026-Jan-03 14:13:39.053281 
2026-Jan-03 14:13:39.053281 #8 [stage-0  4/11] RUN nix-env -if .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix && nix-collect-garbage -d
2026-Jan-03 14:13:39.053281 #8 CACHED
2026-Jan-03 14:13:39.053281 
2026-Jan-03 14:13:39.053281 #9 [stage-0  5/11] RUN sudo apt-get update && sudo apt-get install -y --no-install-recommends curl wget
2026-Jan-03 14:13:39.053281 #9 CACHED
2026-Jan-03 14:13:39.053281 
2026-Jan-03 14:13:39.053281 #10 [stage-0  6/11] COPY . /app/.
2026-Jan-03 14:13:39.053281 #10 DONE 0.1s
2026-Jan-03 14:13:39.053281 
2026-Jan-03 14:13:39.053281 #11 [stage-0  7/11] RUN --mount=type=cache,id=gowccgsco0c4k4cowgwk04s4-/root/npm,target=/root/.npm npm ci
2026-Jan-03 14:13:39.053281 #11 0.238 npm warn config production Use `--omit=dev` instead.
2026-Jan-03 14:13:39.053281 #11 8.187 npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
2026-Jan-03 14:13:39.053281 #11 8.318 npm warn deprecated whatwg-encoding@3.1.1: Use @exodus/bytes instead for a more spec-conformant and faster implementation
2026-Jan-03 14:13:39.053281 #11 8.448 npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
2026-Jan-03 14:13:39.053281 #11 17.09
2026-Jan-03 14:13:39.053281 #11 17.09 > epixodo@0.1.0 prepare
2026-Jan-03 14:13:39.053281 #11 17.09 > husky
2026-Jan-03 14:13:39.053281 #11 17.09
2026-Jan-03 14:13:39.053281 #11 17.16 .git can't be found
2026-Jan-03 14:13:39.053281 #11 17.18 added 800 packages, and audited 801 packages in 17s
2026-Jan-03 14:13:39.053281 #11 17.18
2026-Jan-03 14:13:39.053281 #11 17.18 232 packages are looking for funding
2026-Jan-03 14:13:39.053281 #11 17.18   run `npm fund` for details
2026-Jan-03 14:13:39.053281 #11 17.18
2026-Jan-03 14:13:39.053281 #11 17.18 found 0 vulnerabilities
2026-Jan-03 14:13:39.053281 #11 DONE 17.7s
2026-Jan-03 14:13:39.053281 
2026-Jan-03 14:13:39.053281 #12 [stage-0  8/11] COPY . /app/.
2026-Jan-03 14:13:39.053281 #12 DONE 0.1s
2026-Jan-03 14:13:39.053281 
2026-Jan-03 14:13:39.053281 #13 [stage-0  9/11] RUN --mount=type=cache,id=gowccgsco0c4k4cowgwk04s4-next/cache,target=/app/.next/cache --mount=type=cache,id=gowccgsco0c4k4cowgwk04s4-node_modules/cache,target=/app/node_modules/.cache npm run build
2026-Jan-03 14:13:39.053281 #13 0.207 npm warn config production Use `--omit=dev` instead.
2026-Jan-03 14:13:39.053281 #13 0.229
2026-Jan-03 14:13:39.053281 #13 0.229 > epixodo@0.1.0 build
2026-Jan-03 14:13:39.053281 #13 0.229 > next build
2026-Jan-03 14:13:39.053281 #13 0.229
2026-Jan-03 14:13:39.053281 #13 1.271 ▲ Next.js 16.1.1 (Turbopack)
2026-Jan-03 14:13:39.053281 #13 1.273
2026-Jan-03 14:13:39.053281 #13 1.358   Creating an optimized production build ...
2026-Jan-03 14:13:39.053281 #13 8.205 ✓ Compiled successfully in 6.2s
2026-Jan-03 14:13:39.053281 #13 8.228   Running TypeScript ...
2026-Jan-03 14:13:39.053281 #13 14.82 Failed to compile.
2026-Jan-03 14:13:39.053281 #13 14.82
2026-Jan-03 14:13:39.053281 #13 14.82 ./app/finance/page.tsx:282:61
2026-Jan-03 14:13:39.053281 #13 14.82 Type error: Type '{ transactions: any[]; accounts: any[]; }' is not assignable to type 'IntrinsicAttributes & FinanceStatsProps'.
2026-Jan-03 14:13:39.053281 #13 14.82   Property 'accounts' does not exist on type 'IntrinsicAttributes & FinanceStatsProps'.
2026-Jan-03 14:13:39.053281 #13 14.82
2026-Jan-03 14:13:39.053281 #13 14.82   280 |               {activeTab === 'dashboard' && (
2026-Jan-03 14:13:39.053281 #13 14.82   281 |                 <div className="space-y-8">
2026-Jan-03 14:13:39.053281 #13 14.82 > 282 |                   <FinanceStats transactions={transactions} accounts={accounts} />
2026-Jan-03 14:13:39.053281 #13 14.82       |                                                             ^
2026-Jan-03 14:13:39.053281 #13 14.82   283 |                   <TransactionList
2026-Jan-03 14:13:39.053281 #13 14.82   284 |                     transactions={transactions}
2026-Jan-03 14:13:39.053281 #13 14.82   285 |                     onUpdate={fetchTransactions}
2026-Jan-03 14:13:39.053281 #13 14.90 Next.js build worker exited with code: 1 and signal: null
2026-Jan-03 14:13:39.053281 #13 ERROR: process "/bin/bash -ol pipefail -c npm run build" did not complete successfully: exit code: 1
2026-Jan-03 14:13:39.053281 ------
2026-Jan-03 14:13:39.053281 > [stage-0  9/11] RUN --mount=type=cache,id=gowccgsco0c4k4cowgwk04s4-next/cache,target=/app/.next/cache --mount=type=cache,id=gowccgsco0c4k4cowgwk04s4-node_modules/cache,target=/app/node_modules/.cache npm run build:
2026-Jan-03 14:13:39.053281 14.82   Property 'accounts' does not exist on type 'IntrinsicAttributes & FinanceStatsProps'.
2026-Jan-03 14:13:39.053281 14.82
2026-Jan-03 14:13:39.053281 14.82   280 |               {activeTab === 'dashboard' && (
2026-Jan-03 14:13:39.053281 14.82   281 |                 <div className="space-y-8">
2026-Jan-03 14:13:39.053281 14.82 > 282 |                   <FinanceStats transactions={transactions} accounts={accounts} />
2026-Jan-03 14:13:39.053281 14.82       |                                                             ^
2026-Jan-03 14:13:39.053281 14.82   283 |                   <TransactionList
2026-Jan-03 14:13:39.053281 14.82   284 |                     transactions={transactions}
2026-Jan-03 14:13:39.053281 14.82   285 |                     onUpdate={fetchTransactions}
2026-Jan-03 14:13:39.053281 14.90 Next.js build worker exited with code: 1 and signal: null
2026-Jan-03 14:13:39.053281 ------
2026-Jan-03 14:13:39.053281 
2026-Jan-03 14:13:39.053281 1 warning found (use docker --debug to expand):
2026-Jan-03 14:13:39.053281 - UndefinedVar: Usage of undefined variable '$NIXPACKS_PATH' (line 18)
2026-Jan-03 14:13:39.053281 Dockerfile:24
2026-Jan-03 14:13:39.053281 --------------------
2026-Jan-03 14:13:39.053281 22 |     # build phase
2026-Jan-03 14:13:39.053281 23 |     COPY . /app/.
2026-Jan-03 14:13:39.053281 24 | >>> RUN --mount=type=cache,id=gowccgsco0c4k4cowgwk04s4-next/cache,target=/app/.next/cache --mount=type=cache,id=gowccgsco0c4k4cowgwk04s4-node_modules/cache,target=/app/node_modules/.cache npm run build
2026-Jan-03 14:13:39.053281 25 |
2026-Jan-03 14:13:39.053281 26 |
2026-Jan-03 14:13:39.053281 --------------------
2026-Jan-03 14:13:39.053281 ERROR: failed to build: failed to solve: process "/bin/bash -ol pipefail -c npm run build" did not complete successfully: exit code: 1
2026-Jan-03 14:13:39.053281 exit status 1
2026-Jan-03 14:13:39.131339 ========================================
2026-Jan-03 14:13:39.141389 Deployment failed. Removing the new version of your application.
2026-Jan-03 14:13:39.600730 Gracefully shutting down build container: ogskoc4w4o4ogkcko80okkwo