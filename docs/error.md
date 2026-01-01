2025-Dec-31 23:59:09.831480 Starting deployment of carlosacostap-unca/epixodo:main to localhost.
2025-Dec-31 23:59:10.511003 Preparing container with helper image: ghcr.io/coollabsio/coolify-helper:1.0.12
2025-Dec-31 23:59:14.229087 Image not found (gowccgsco0c4k4cowgwk04s4:5d600d7e573791e13606eb3d73de589ead9cca75). Building new image.
2025-Dec-31 23:59:14.236180 ----------------------------------------
2025-Dec-31 23:59:14.242486 Importing carlosacostap-unca/epixodo:main (commit sha 5d600d7e573791e13606eb3d73de589ead9cca75) to /artifacts/f0wkooo0c080k0s4gwgssg0o.
2025-Dec-31 23:59:17.087430 Generating nixpacks configuration with: nixpacks plan -f json --env NIXPACKS_NODE_VERSION=22 --env COOLIFY_URL=https://epixodo.acostaparra.com --env COOLIFY_FQDN=epixodo.acostaparra.com --env COOLIFY_BRANCH=main --env COOLIFY_RESOURCE_UUID=gowccgsco0c4k4cowgwk04s4 /artifacts/f0wkooo0c080k0s4gwgssg0o
2025-Dec-31 23:59:18.091686 Found application type: node.
2025-Dec-31 23:59:18.101921 If you need further customization, please check the documentation of Nixpacks: https://nixpacks.com/docs/providers/node
2025-Dec-31 23:59:20.142894 ----------------------------------------
2025-Dec-31 23:59:20.155004 Building docker image started.
2025-Dec-31 23:59:20.164998 To check the current progress, click on Show Debug Logs.
2026-Jan-01 00:01:59.093070 ========================================
2026-Jan-01 00:01:59.104709 Deployment failed: Command execution failed (exit code 1): docker exec f0wkooo0c080k0s4gwgssg0o bash -c 'bash /artifacts/build.sh'
2026-Jan-01 00:01:59.104709 Error: #0 building with "default" instance using docker driver
2026-Jan-01 00:01:59.104709 
2026-Jan-01 00:01:59.104709 #1 [internal] load build definition from Dockerfile
2026-Jan-01 00:01:59.104709 #1 transferring dockerfile: 1.43kB 0.0s done
2026-Jan-01 00:01:59.104709 #1 DONE 0.1s
2026-Jan-01 00:01:59.104709 
2026-Jan-01 00:01:59.104709 #2 [internal] load metadata for ghcr.io/railwayapp/nixpacks:ubuntu-1745885067
2026-Jan-01 00:01:59.104709 #2 DONE 1.3s
2026-Jan-01 00:01:59.104709 
2026-Jan-01 00:01:59.104709 #3 [internal] load .dockerignore
2026-Jan-01 00:01:59.104709 #3 transferring context: 2B done
2026-Jan-01 00:01:59.104709 #3 DONE 0.0s
2026-Jan-01 00:01:59.104709 
2026-Jan-01 00:01:59.104709 #4 [internal] load build context
2026-Jan-01 00:01:59.104709 #4 transferring context: 460.60kB 0.0s done
2026-Jan-01 00:01:59.104709 #4 DONE 0.1s
2026-Jan-01 00:01:59.104709 
2026-Jan-01 00:01:59.104709 #5 [stage-0  1/11] FROM ghcr.io/railwayapp/nixpacks:ubuntu-1745885067@sha256:d45c89d80e13d7ad0fd555b5130f22a866d9dd10e861f589932303ef2314c7de
2026-Jan-01 00:01:59.104709 #5 resolve ghcr.io/railwayapp/nixpacks:ubuntu-1745885067@sha256:d45c89d80e13d7ad0fd555b5130f22a866d9dd10e861f589932303ef2314c7de 0.0s done
2026-Jan-01 00:01:59.104709 #5 sha256:d45c89d80e13d7ad0fd555b5130f22a866d9dd10e861f589932303ef2314c7de 1.61kB / 1.61kB done
2026-Jan-01 00:01:59.104709 #5 sha256:98801a2e9c74b1236de01aa97bc99349f700f53f81d3bbab4411e2a8a9dd316d 1.06kB / 1.06kB done
2026-Jan-01 00:01:59.104709 #5 sha256:75908e6a244aa7c07bd16c59f1a88c832d0735edf545bd28f86d6bee4a5536a0 4.43kB / 4.43kB done
2026-Jan-01 00:01:59.104709 #5 DONE 0.1s
2026-Jan-01 00:01:59.104709 
2026-Jan-01 00:01:59.104709 #6 [stage-0  2/11] WORKDIR /app/
2026-Jan-01 00:01:59.104709 #6 DONE 0.1s
2026-Jan-01 00:01:59.104709 
2026-Jan-01 00:01:59.104709 #7 [stage-0  3/11] COPY .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix
2026-Jan-01 00:01:59.104709 #7 DONE 0.0s
2026-Jan-01 00:01:59.104709 
2026-Jan-01 00:01:59.104709 #8 [stage-0  4/11] RUN nix-env -if .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix && nix-collect-garbage -d
2026-Jan-01 00:01:59.104709 #8 0.947 unpacking 'https://github.com/NixOS/nixpkgs/archive/ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.tar.gz' into the Git cache...
2026-Jan-01 00:01:59.104709 #8 83.02 unpacking 'https://github.com/railwayapp/nix-npm-overlay/archive/main.tar.gz' into the Git cache...
2026-Jan-01 00:01:59.104709 #8 84.31 installing 'ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env'
2026-Jan-01 00:01:59.104709 #8 87.89 these 5 derivations will be built:
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/1f4a312hz9m6y1ssip52drgkim8az4d6-libraries.drv
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/6vy68gykpxfphbmmyd59ya88xvrwvvaa-npm-9.9.4.tgz.drv
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/79g4v87v1cgrx5vlwzcagcs6v8ps8fk2-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env.drv
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/w9h0z1lhfwxc0m38f3w5brfdqrzm4wyj-npm.drv
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/k57xf6608fm7jd3gxwb9h6nmgh82vlg2-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env.drv
2026-Jan-01 00:01:59.104709 #8 87.89 these 78 paths will be fetched (122.32 MiB download, 581.57 MiB unpacked):
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/cf7gkacyxmm66lwl5nj6j6yykbrg4q5c-acl-2.3.2
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/a9jgnlhkjkxav6qrc3rzg2q84pkl2wvr-attr-2.5.2
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/5mh7kaj2fyv8mk4sfq1brwxgc02884wi-bash-5.2p37
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/j7p46r8v9gcpbxx89pbqlh61zhd33gzv-binutils-2.43.1
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/df2a8k58k00f2dh2x930dg6xs6g6mliv-binutils-2.43.1-lib
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/srcmmqi8kxjfygd0hyy42c8hv6cws83b-binutils-wrapper-2.43.1
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/wf5zj2gbib3gjqllkabxaw4dh0gzcla3-builder.pl
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/ivl2v8rgg7qh1jkj5pwpqycax3rc2hnl-bzip2-1.0.8
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/mglixp03lsp0w986svwdvm7vcy17rdax-bzip2-1.0.8-bin
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/4s9rah4cwaxflicsk5cndnknqlk9n4p3-coreutils-9.5
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/pkc7mb4a4qvyz73srkqh4mwl70w98dsv-curl-8.11.0
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/p123cq20klajcl9hj8jnkjip5nw6awhz-curl-8.11.0-bin
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/5f5linrxzhhb3mrclkwdpm9bd8ygldna-curl-8.11.0-dev
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/agvks3qmzja0yj54szi3vja6vx3cwkkw-curl-8.11.0-man
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/00g69vw7c9lycy63h45ximy0wmzqx5y6-diffutils-3.10
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/74h4z8k82pmp24xryflv4lxkz8jlpqqd-ed-1.20.2
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/qbry6090vlr9ar33kdmmbq2p5apzbga8-expand-response-params
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/c4rj90r2m89rxs64hmm857mipwjhig5d-file-5.46
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/jqrz1vq5nz4lnv9pqzydj0ir58wbjfy1-findutils-4.10.0
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/a3c47r5z1q2c4rz0kvq8hlilkhx2s718-gawk-5.3.1
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/l89iqc7am6i60y8vk507zwrzxf0wcd3v-gcc-14-20241116
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/bpq1s72cw9qb2fs8mnmlw6hn2c7iy0ss-gcc-14-20241116-lib
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/17v0ywnr3akp85pvdi56gwl99ljv95kx-gcc-14-20241116-libgcc
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/xcn9p4xxfbvlkpah7pwchpav4ab9d135-gcc-wrapper-14-20241116
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/65h17wjrrlsj2rj540igylrx7fqcd6vq-glibc-2.40-36
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/1c6bmxrrhm8bd26ai2rjqld2yyjrxhds-glibc-2.40-36-bin
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/kj8hbqx4ds9qm9mq7hyikxyfwwg13kzj-glibc-2.40-36-dev
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/kryrg7ds05iwcmy81amavk8w13y4lxbs-gmp-6.3.0
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/a2byxfv4lc8f2g5xfzw8cz5q8k05wi29-gmp-with-cxx-6.3.0
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/1m67ipsk39xvhyqrxnzv2m2p48pil8kl-gnu-config-2024-01-01
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/aap6cq56amx4mzbyxp2wpgsf1kqjcr1f-gnugrep-3.11
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/fp6cjl1zcmm6mawsnrb5yak1wkz2ma8l-gnumake-4.4.1
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/abm77lnrkrkb58z6xp1qwjcr1xgkcfwm-gnused-4.9
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/9cwwj1c9csmc85l2cqzs3h9hbf1vwl6c-gnutar-1.35
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/nvvj6sk0k6px48436drlblf4gafgbvzr-gzip-1.13
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/wwipgdqb4p2fr46kmw9c5wlk799kbl68-icu4c-74.2
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/m8w3mf0i4862q22bxad0wspkgdy4jnkk-icu4c-74.2-dev
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/xmbv8s4p4i4dbxgkgdrdfb0ym25wh6gk-isl-0.20
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/2wh1gqyzf5xsvxpdz2k0bxiz583wwq29-keyutils-1.6.3-lib
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/milph81dilrh96isyivh5n50agpx39k2-krb5-1.21.3
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/b56mswksrql15knpb1bnhv3ysif340kd-krb5-1.21.3-dev
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/v9c1s50x7magpiqgycxxkn36avzbcg0g-krb5-1.21.3-lib
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/34z2792zyd4ayl5186vx0s98ckdaccz9-libidn2-2.3.7
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/2a3anh8vl3fcgk0fvaravlimrqawawza-libmpc-1.3.1
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/8675pnfr4fqnwv4pzjl67hdwls4q13aa-libssh2-1.11.1
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/d7zhcrcc7q3yfbm3qkqpgc3daq82spwi-libssh2-1.11.1-dev
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/xcqcgqazykf6s7fsn08k0blnh0wisdcl-libunistring-1.3
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/r9ac2hwnmb0nxwsrvr6gi9wsqf2whfqj-libuv-1.49.2
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/ll14czvpxglf6nnwmmrmygplm830fvlv-libuv-1.49.2-dev
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/6cr0spsvymmrp1hj5n0kbaxw55w1lqyp-libxcrypt-4.4.36
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/pc74azbkr19rkd5bjalq2xwx86cj3cga-linux-headers-6.12
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/fv7gpnvg922frkh81w5hkdhpz0nw3iiz-mirrors-list
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/qs22aazzrdd4dnjf9vffl0n31hvls43h-mpfr-4.2.1
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/grixvx878884hy8x3xs0c0s1i00j632k-nghttp2-1.64.0
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/dz97fw51rm5bl9kz1vg0haj1j1a7r1mr-nghttp2-1.64.0-dev
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/qcghigzrz56vczwlzg9c02vbs6zr9jkz-nghttp2-1.64.0-lib
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/fkyp1bm5gll9adnfcj92snyym524mdrj-nodejs-22.11.0
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/9l9n7a0v4aibcz0sgd0crs209an9p7dz-openssl-3.3.2
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/h1ydpxkw9qhjdxjpic1pdc2nirggyy6f-openssl-3.3.2
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/lygl27c44xv73kx1spskcgvzwq7z337c-openssl-3.3.2-bin
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/qq5q0alyzywdazhmybi7m69akz0ppk05-openssl-3.3.2-bin
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/kqm7wpqkzc4bwjlzqizcbz0mgkj06a9x-openssl-3.3.2-dev
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/pp2zf8bdgyz60ds8vcshk2603gcjgp72-openssl-3.3.2-dev
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/5yja5dpk2qw1v5mbfbl2d7klcdfrh90w-patch-2.7.6
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/srfxqk119fijwnprgsqvn68ys9kiw0bn-patchelf-0.15.0
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/3j1p598fivxs69wx3a657ysv3rw8k06l-pcre2-10.44
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/1i003ijlh9i0mzp6alqby5hg3090pjdx-perl-5.40.0
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/dj96qp9vps02l3n8xgc2vallqa9rhafb-sqlite-3.47.0
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/yc39wvfz87i0bl8r6vnhq48n6clbx2pb-sqlite-3.47.0-bin
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/i47d0rzbbnihcxkcaj48jgii5pj58djc-sqlite-3.47.0-dev
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/4ig84cyqi6qy4n0sanrbzsw1ixa497jx-stdenv-linux
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/d0gfdcag8bxzvg7ww4s7px4lf8sxisyx-stdenv-linux
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/d29r1bdmlvwmj52apgcdxfl1mm9c5782-update-autotools-gnu-config-scripts-hook
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/acfkqzj5qrqs88a4a6ixnybbjxja663d-xgcc-14-20241116-libgcc
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/c2njy6bv84kw1i4bjf5k5gn7gz8hn57n-xz-5.6.3
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/h18s640fnhhj2qdh5vivcfbxvz377srg-xz-5.6.3-bin
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/cqlaa2xf6lslnizyj9xqa8j0ii1yqw0x-zlib-1.3.1
2026-Jan-01 00:01:59.104709 #8 87.89   /nix/store/1lggwqzapn5mn49l9zy4h566ysv9kzdb-zlib-1.3.1-dev
2026-Jan-01 00:01:59.104709 #8 87.91 copying path '/nix/store/wf5zj2gbib3gjqllkabxaw4dh0gzcla3-builder.pl' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 87.91 copying path '/nix/store/1m67ipsk39xvhyqrxnzv2m2p48pil8kl-gnu-config-2024-01-01' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 87.91 copying path '/nix/store/17v0ywnr3akp85pvdi56gwl99ljv95kx-gcc-14-20241116-libgcc' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 87.91 copying path '/nix/store/xcqcgqazykf6s7fsn08k0blnh0wisdcl-libunistring-1.3' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 87.91 copying path '/nix/store/acfkqzj5qrqs88a4a6ixnybbjxja663d-xgcc-14-20241116-libgcc' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 87.92 copying path '/nix/store/pc74azbkr19rkd5bjalq2xwx86cj3cga-linux-headers-6.12' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 87.92 copying path '/nix/store/fv7gpnvg922frkh81w5hkdhpz0nw3iiz-mirrors-list' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 87.92 copying path '/nix/store/agvks3qmzja0yj54szi3vja6vx3cwkkw-curl-8.11.0-man' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 87.92 copying path '/nix/store/grixvx878884hy8x3xs0c0s1i00j632k-nghttp2-1.64.0' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 87.92 copying path '/nix/store/d29r1bdmlvwmj52apgcdxfl1mm9c5782-update-autotools-gnu-config-scripts-hook' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 87.96 copying path '/nix/store/34z2792zyd4ayl5186vx0s98ckdaccz9-libidn2-2.3.7' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.00 copying path '/nix/store/65h17wjrrlsj2rj540igylrx7fqcd6vq-glibc-2.40-36' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.84 copying path '/nix/store/a9jgnlhkjkxav6qrc3rzg2q84pkl2wvr-attr-2.5.2' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.84 copying path '/nix/store/5mh7kaj2fyv8mk4sfq1brwxgc02884wi-bash-5.2p37' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.85 copying path '/nix/store/ivl2v8rgg7qh1jkj5pwpqycax3rc2hnl-bzip2-1.0.8' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.85 copying path '/nix/store/1c6bmxrrhm8bd26ai2rjqld2yyjrxhds-glibc-2.40-36-bin' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.85 copying path '/nix/store/bpq1s72cw9qb2fs8mnmlw6hn2c7iy0ss-gcc-14-20241116-lib' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.85 copying path '/nix/store/abm77lnrkrkb58z6xp1qwjcr1xgkcfwm-gnused-4.9' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.85 copying path '/nix/store/kryrg7ds05iwcmy81amavk8w13y4lxbs-gmp-6.3.0' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.85 copying path '/nix/store/r9ac2hwnmb0nxwsrvr6gi9wsqf2whfqj-libuv-1.49.2' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.85 copying path '/nix/store/2wh1gqyzf5xsvxpdz2k0bxiz583wwq29-keyutils-1.6.3-lib' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.85 copying path '/nix/store/74h4z8k82pmp24xryflv4lxkz8jlpqqd-ed-1.20.2' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.85 copying path '/nix/store/6cr0spsvymmrp1hj5n0kbaxw55w1lqyp-libxcrypt-4.4.36' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.85 copying path '/nix/store/a3c47r5z1q2c4rz0kvq8hlilkhx2s718-gawk-5.3.1' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.85 copying path '/nix/store/qcghigzrz56vczwlzg9c02vbs6zr9jkz-nghttp2-1.64.0-lib' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.85 copying path '/nix/store/qbry6090vlr9ar33kdmmbq2p5apzbga8-expand-response-params' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.85 copying path '/nix/store/fp6cjl1zcmm6mawsnrb5yak1wkz2ma8l-gnumake-4.4.1' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.85 copying path '/nix/store/9l9n7a0v4aibcz0sgd0crs209an9p7dz-openssl-3.3.2' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.87 copying path '/nix/store/h1ydpxkw9qhjdxjpic1pdc2nirggyy6f-openssl-3.3.2' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.87 copying path '/nix/store/5yja5dpk2qw1v5mbfbl2d7klcdfrh90w-patch-2.7.6' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.88 copying path '/nix/store/mglixp03lsp0w986svwdvm7vcy17rdax-bzip2-1.0.8-bin' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.90 copying path '/nix/store/3j1p598fivxs69wx3a657ysv3rw8k06l-pcre2-10.44' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.92 copying path '/nix/store/c2njy6bv84kw1i4bjf5k5gn7gz8hn57n-xz-5.6.3' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.92 copying path '/nix/store/cf7gkacyxmm66lwl5nj6j6yykbrg4q5c-acl-2.3.2' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.92 copying path '/nix/store/nvvj6sk0k6px48436drlblf4gafgbvzr-gzip-1.13' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.93 copying path '/nix/store/ll14czvpxglf6nnwmmrmygplm830fvlv-libuv-1.49.2-dev' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.93 copying path '/nix/store/cqlaa2xf6lslnizyj9xqa8j0ii1yqw0x-zlib-1.3.1' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.93 copying path '/nix/store/dz97fw51rm5bl9kz1vg0haj1j1a7r1mr-nghttp2-1.64.0-dev' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.95 copying path '/nix/store/qs22aazzrdd4dnjf9vffl0n31hvls43h-mpfr-4.2.1' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 88.95 copying path '/nix/store/xmbv8s4p4i4dbxgkgdrdfb0ym25wh6gk-isl-0.20' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 89.09 copying path '/nix/store/df2a8k58k00f2dh2x930dg6xs6g6mliv-binutils-2.43.1-lib' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 89.10 copying path '/nix/store/c4rj90r2m89rxs64hmm857mipwjhig5d-file-5.46' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 89.11 copying path '/nix/store/dj96qp9vps02l3n8xgc2vallqa9rhafb-sqlite-3.47.0' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 89.12 copying path '/nix/store/yc39wvfz87i0bl8r6vnhq48n6clbx2pb-sqlite-3.47.0-bin' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 89.14 copying path '/nix/store/1lggwqzapn5mn49l9zy4h566ysv9kzdb-zlib-1.3.1-dev' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 89.14 copying path '/nix/store/9cwwj1c9csmc85l2cqzs3h9hbf1vwl6c-gnutar-1.35' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 89.20 copying path '/nix/store/h18s640fnhhj2qdh5vivcfbxvz377srg-xz-5.6.3-bin' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 89.22 copying path '/nix/store/kj8hbqx4ds9qm9mq7hyikxyfwwg13kzj-glibc-2.40-36-dev' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 89.25 copying path '/nix/store/2a3anh8vl3fcgk0fvaravlimrqawawza-libmpc-1.3.1' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 89.36 copying path '/nix/store/aap6cq56amx4mzbyxp2wpgsf1kqjcr1f-gnugrep-3.11' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 89.43 copying path '/nix/store/i47d0rzbbnihcxkcaj48jgii5pj58djc-sqlite-3.47.0-dev' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 89.53 copying path '/nix/store/lygl27c44xv73kx1spskcgvzwq7z337c-openssl-3.3.2-bin' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 89.57 copying path '/nix/store/pp2zf8bdgyz60ds8vcshk2603gcjgp72-openssl-3.3.2-dev' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 89.65 copying path '/nix/store/qq5q0alyzywdazhmybi7m69akz0ppk05-openssl-3.3.2-bin' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 89.65 copying path '/nix/store/v9c1s50x7magpiqgycxxkn36avzbcg0g-krb5-1.21.3-lib' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 89.65 copying path '/nix/store/8675pnfr4fqnwv4pzjl67hdwls4q13aa-libssh2-1.11.1' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 89.71 copying path '/nix/store/kqm7wpqkzc4bwjlzqizcbz0mgkj06a9x-openssl-3.3.2-dev' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 89.73 copying path '/nix/store/a2byxfv4lc8f2g5xfzw8cz5q8k05wi29-gmp-with-cxx-6.3.0' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 89.73 copying path '/nix/store/j7p46r8v9gcpbxx89pbqlh61zhd33gzv-binutils-2.43.1' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 89.73 copying path '/nix/store/wwipgdqb4p2fr46kmw9c5wlk799kbl68-icu4c-74.2' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 89.73 copying path '/nix/store/srfxqk119fijwnprgsqvn68ys9kiw0bn-patchelf-0.15.0' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 89.83 copying path '/nix/store/4s9rah4cwaxflicsk5cndnknqlk9n4p3-coreutils-9.5' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 89.97 copying path '/nix/store/pkc7mb4a4qvyz73srkqh4mwl70w98dsv-curl-8.11.0' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 89.98 copying path '/nix/store/milph81dilrh96isyivh5n50agpx39k2-krb5-1.21.3' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 90.01 copying path '/nix/store/l89iqc7am6i60y8vk507zwrzxf0wcd3v-gcc-14-20241116' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 90.09 copying path '/nix/store/d7zhcrcc7q3yfbm3qkqpgc3daq82spwi-libssh2-1.11.1-dev' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 90.32 copying path '/nix/store/jqrz1vq5nz4lnv9pqzydj0ir58wbjfy1-findutils-4.10.0' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 90.32 copying path '/nix/store/00g69vw7c9lycy63h45ximy0wmzqx5y6-diffutils-3.10' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 90.32 copying path '/nix/store/1i003ijlh9i0mzp6alqby5hg3090pjdx-perl-5.40.0' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 90.58 copying path '/nix/store/p123cq20klajcl9hj8jnkjip5nw6awhz-curl-8.11.0-bin' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 90.69 copying path '/nix/store/b56mswksrql15knpb1bnhv3ysif340kd-krb5-1.21.3-dev' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 90.81 copying path '/nix/store/4ig84cyqi6qy4n0sanrbzsw1ixa497jx-stdenv-linux' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 90.86 copying path '/nix/store/5f5linrxzhhb3mrclkwdpm9bd8ygldna-curl-8.11.0-dev' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 91.13 building '/nix/store/1f4a312hz9m6y1ssip52drgkim8az4d6-libraries.drv'...
2026-Jan-01 00:01:59.104709 #8 91.24 building '/nix/store/6vy68gykpxfphbmmyd59ya88xvrwvvaa-npm-9.9.4.tgz.drv'...
2026-Jan-01 00:01:59.104709 #8 91.86 building '/nix/store/79g4v87v1cgrx5vlwzcagcs6v8ps8fk2-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env.drv'...
2026-Jan-01 00:01:59.104709 #8 91.93 copying path '/nix/store/srcmmqi8kxjfygd0hyy42c8hv6cws83b-binutils-wrapper-2.43.1' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 92.23
2026-Jan-01 00:01:59.104709 #8 92.23 trying https://registry.npmjs.org/npm/-/npm-9.9.4.tgz
2026-Jan-01 00:01:59.104709 #8 92.25   % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
2026-Jan-01 00:01:59.104709 #8 92.25                                  Dload  Upload   Total   Spent    Left  Speed
2026-Jan-01 00:01:59.104709 #8 92.28 copying path '/nix/store/m8w3mf0i4862q22bxad0wspkgdy4jnkk-icu4c-74.2-dev' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 92.50 100 2648k  100 2648k    0     0   9.9M      0 --:--:-- --:--:-- --:--:--  9.9M
2026-Jan-01 00:01:59.104709 #8 92.60 copying path '/nix/store/fkyp1bm5gll9adnfcj92snyym524mdrj-nodejs-22.11.0' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 98.99 copying path '/nix/store/xcn9p4xxfbvlkpah7pwchpav4ab9d135-gcc-wrapper-14-20241116' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 99.01 copying path '/nix/store/d0gfdcag8bxzvg7ww4s7px4lf8sxisyx-stdenv-linux' from 'https://cache.nixos.org'...
2026-Jan-01 00:01:59.104709 #8 99.06 building '/nix/store/w9h0z1lhfwxc0m38f3w5brfdqrzm4wyj-npm.drv'...
2026-Jan-01 00:01:59.104709 #8 99.15 Running phase: unpackPhase
2026-Jan-01 00:01:59.104709 #8 99.16 unpacking source archive /nix/store/fkd1ma3nify8r9wp463yg5rqz9hdcyf1-npm-9.9.4.tgz
2026-Jan-01 00:01:59.104709 #8 99.82 source root is package
2026-Jan-01 00:01:59.104709 #8 99.90 setting SOURCE_DATE_EPOCH to timestamp 499162500 of file package/package.json
2026-Jan-01 00:01:59.104709 #8 99.91 Running phase: installPhase
2026-Jan-01 00:01:59.104709 #8 101.9 building '/nix/store/k57xf6608fm7jd3gxwb9h6nmgh82vlg2-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env.drv'...
2026-Jan-01 00:01:59.104709 #8 102.0 created 33 symlinks in user environment
2026-Jan-01 00:01:59.104709 #8 102.2 building '/nix/store/57xki8c7krhax7r4mdr0icil5dklppb2-user-environment.drv'...
2026-Jan-01 00:01:59.104709 #8 102.5 removing old generations of profile /nix/var/nix/profiles/per-user/root/profile
2026-Jan-01 00:01:59.104709 #8 102.5 removing profile version 1
2026-Jan-01 00:01:59.104709 #8 102.5 removing old generations of profile /nix/var/nix/profiles/per-user/root/channels
2026-Jan-01 00:01:59.104709 #8 102.5 removing old generations of profile /nix/var/nix/profiles/per-user/root/profile
2026-Jan-01 00:01:59.104709 #8 102.5 removing old generations of profile /nix/var/nix/profiles/per-user/root/channels
2026-Jan-01 00:01:59.104709 #8 102.5 finding garbage collector roots...
2026-Jan-01 00:01:59.104709 #8 102.5 removing stale link from '/nix/var/nix/gcroots/auto/lzjbmb2ry0z7lma2fvpqprb12921pnb5' to '/nix/var/nix/profiles/per-user/root/profile-1-link'
2026-Jan-01 00:01:59.104709 #8 102.5 deleting garbage...
2026-Jan-01 00:01:59.104709 #8 102.5 deleting '/nix/store/a9qf4wwhympzs35ncp80r185j6a21w07-user-environment'
2026-Jan-01 00:01:59.104709 #8 102.5 deleting '/nix/store/253kwn1730vnay87xkjgxa2v97w3y079-user-environment.drv'
2026-Jan-01 00:01:59.104709 #8 102.5 deleting '/nix/store/hn5mrh362n52x8wwab9s1v6bgn4n5c94-env-manifest.nix'
2026-Jan-01 00:01:59.104709 #8 102.5 deleting '/nix/store/wf5zj2gbib3gjqllkabxaw4dh0gzcla3-builder.pl'
2026-Jan-01 00:01:59.104709 #8 102.5 deleting '/nix/store/d0gfdcag8bxzvg7ww4s7px4lf8sxisyx-stdenv-linux'
2026-Jan-01 00:01:59.104709 #8 102.5 deleting '/nix/store/4ig84cyqi6qy4n0sanrbzsw1ixa497jx-stdenv-linux'
2026-Jan-01 00:01:59.104709 #8 102.5 deleting '/nix/store/mglixp03lsp0w986svwdvm7vcy17rdax-bzip2-1.0.8-bin'
2026-Jan-01 00:01:59.104709 #8 102.5 deleting '/nix/store/lwi59jcfwk2lnrakmm1y5vw85hj3n1bi-source'
2026-Jan-01 00:01:59.104709 #8 108.7 deleting '/nix/store/xcn9p4xxfbvlkpah7pwchpav4ab9d135-gcc-wrapper-14-20241116'
2026-Jan-01 00:01:59.104709 #8 108.7 deleting '/nix/store/srcmmqi8kxjfygd0hyy42c8hv6cws83b-binutils-wrapper-2.43.1'
2026-Jan-01 00:01:59.104709 #8 108.7 deleting '/nix/store/j7p46r8v9gcpbxx89pbqlh61zhd33gzv-binutils-2.43.1'
2026-Jan-01 00:01:59.104709 #8 108.7 deleting '/nix/store/h18s640fnhhj2qdh5vivcfbxvz377srg-xz-5.6.3-bin'
2026-Jan-01 00:01:59.104709 #8 108.7 deleting '/nix/store/c2njy6bv84kw1i4bjf5k5gn7gz8hn57n-xz-5.6.3'
2026-Jan-01 00:01:59.104709 #8 108.7 deleting '/nix/store/5yja5dpk2qw1v5mbfbl2d7klcdfrh90w-patch-2.7.6'
2026-Jan-01 00:01:59.104709 #8 108.7 deleting '/nix/store/9b6isf8q3962hxfjqw6bhclw290bs6kb-source'
2026-Jan-01 00:01:59.104709 #8 108.7 deleting '/nix/store/l89iqc7am6i60y8vk507zwrzxf0wcd3v-gcc-14-20241116'
2026-Jan-01 00:01:59.104709 #8 108.8 deleting '/nix/store/xmbv8s4p4i4dbxgkgdrdfb0ym25wh6gk-isl-0.20'
2026-Jan-01 00:01:59.104709 #8 108.8 deleting '/nix/store/2a3anh8vl3fcgk0fvaravlimrqawawza-libmpc-1.3.1'
2026-Jan-01 00:01:59.104709 #8 108.8 deleting '/nix/store/qs22aazzrdd4dnjf9vffl0n31hvls43h-mpfr-4.2.1'
2026-Jan-01 00:01:59.104709 #8 108.8 deleting '/nix/store/kryrg7ds05iwcmy81amavk8w13y4lxbs-gmp-6.3.0'
2026-Jan-01 00:01:59.104709 #8 108.8 deleting '/nix/store/srfxqk119fijwnprgsqvn68ys9kiw0bn-patchelf-0.15.0'
2026-Jan-01 00:01:59.104709 #8 108.8 deleting '/nix/store/5f5linrxzhhb3mrclkwdpm9bd8ygldna-curl-8.11.0-dev'
2026-Jan-01 00:01:59.104709 #8 108.8 deleting '/nix/store/d7zhcrcc7q3yfbm3qkqpgc3daq82spwi-libssh2-1.11.1-dev'
2026-Jan-01 00:01:59.104709 #8 108.8 deleting '/nix/store/ivl2v8rgg7qh1jkj5pwpqycax3rc2hnl-bzip2-1.0.8'
2026-Jan-01 00:01:59.104709 #8 108.8 deleting '/nix/store/p123cq20klajcl9hj8jnkjip5nw6awhz-curl-8.11.0-bin'
2026-Jan-01 00:01:59.104709 #8 108.8 deleting '/nix/store/pkc7mb4a4qvyz73srkqh4mwl70w98dsv-curl-8.11.0'
2026-Jan-01 00:01:59.104709 #8 108.8 deleting '/nix/store/kqm7wpqkzc4bwjlzqizcbz0mgkj06a9x-openssl-3.3.2-dev'
2026-Jan-01 00:01:59.104709 #8 108.8 deleting '/nix/store/qq5q0alyzywdazhmybi7m69akz0ppk05-openssl-3.3.2-bin'
2026-Jan-01 00:01:59.104709 #8 108.8 deleting '/nix/store/b56mswksrql15knpb1bnhv3ysif340kd-krb5-1.21.3-dev'
2026-Jan-01 00:01:59.104709 #8 108.8 deleting '/nix/store/milph81dilrh96isyivh5n50agpx39k2-krb5-1.21.3'
2026-Jan-01 00:01:59.104709 #8 108.8 deleting '/nix/store/v9c1s50x7magpiqgycxxkn36avzbcg0g-krb5-1.21.3-lib'
2026-Jan-01 00:01:59.104709 #8 108.8 deleting '/nix/store/8675pnfr4fqnwv4pzjl67hdwls4q13aa-libssh2-1.11.1'
2026-Jan-01 00:01:59.104709 #8 108.8 deleting '/nix/store/9l9n7a0v4aibcz0sgd0crs209an9p7dz-openssl-3.3.2'
2026-Jan-01 00:01:59.104709 #8 108.8 deleting '/nix/store/dz97fw51rm5bl9kz1vg0haj1j1a7r1mr-nghttp2-1.64.0-dev'
2026-Jan-01 00:01:59.104709 #8 108.8 deleting '/nix/store/qcghigzrz56vczwlzg9c02vbs6zr9jkz-nghttp2-1.64.0-lib'
2026-Jan-01 00:01:59.104709 #8 108.8 deleting '/nix/store/grixvx878884hy8x3xs0c0s1i00j632k-nghttp2-1.64.0'
2026-Jan-01 00:01:59.104709 #8 108.8 deleting '/nix/store/aap6cq56amx4mzbyxp2wpgsf1kqjcr1f-gnugrep-3.11'
2026-Jan-01 00:01:59.104709 #8 108.8 deleting '/nix/store/3j1p598fivxs69wx3a657ysv3rw8k06l-pcre2-10.44'
2026-Jan-01 00:01:59.104709 #8 108.8 deleting '/nix/store/d29r1bdmlvwmj52apgcdxfl1mm9c5782-update-autotools-gnu-config-scripts-hook'
2026-Jan-01 00:01:59.104709 #8 108.8 deleting '/nix/store/1m67ipsk39xvhyqrxnzv2m2p48pil8kl-gnu-config-2024-01-01'
2026-Jan-01 00:01:59.104709 #8 108.8 deleting '/nix/store/00g69vw7c9lycy63h45ximy0wmzqx5y6-diffutils-3.10'
2026-Jan-01 00:01:59.104709 #8 108.8 deleting '/nix/store/2wh1gqyzf5xsvxpdz2k0bxiz583wwq29-keyutils-1.6.3-lib'
2026-Jan-01 00:01:59.104709 #8 108.8 deleting '/nix/store/1i003ijlh9i0mzp6alqby5hg3090pjdx-perl-5.40.0'
2026-Jan-01 00:01:59.104709 #8 108.9 deleting '/nix/store/fkd1ma3nify8r9wp463yg5rqz9hdcyf1-npm-9.9.4.tgz'
2026-Jan-01 00:01:59.104709 #8 108.9 deleting '/nix/store/6cr0spsvymmrp1hj5n0kbaxw55w1lqyp-libxcrypt-4.4.36'
2026-Jan-01 00:01:59.104709 #8 108.9 deleting '/nix/store/9fxr7753z31rn59i64dqaajgsx0ap91p-libraries'
2026-Jan-01 00:01:59.104709 #8 108.9 deleting '/nix/store/nvvj6sk0k6px48436drlblf4gafgbvzr-gzip-1.13'
2026-Jan-01 00:01:59.104709 #8 108.9 deleting '/nix/store/jqrz1vq5nz4lnv9pqzydj0ir58wbjfy1-findutils-4.10.0'
2026-Jan-01 00:01:59.104709 #8 108.9 deleting '/nix/store/kj8hbqx4ds9qm9mq7hyikxyfwwg13kzj-glibc-2.40-36-dev'
2026-Jan-01 00:01:59.104709 #8 108.9 deleting '/nix/store/1c6bmxrrhm8bd26ai2rjqld2yyjrxhds-glibc-2.40-36-bin'
2026-Jan-01 00:01:59.104709 #8 108.9 deleting '/nix/store/fv7gpnvg922frkh81w5hkdhpz0nw3iiz-mirrors-list'
2026-Jan-01 00:01:59.104709 #8 108.9 deleting '/nix/store/df2a8k58k00f2dh2x930dg6xs6g6mliv-binutils-2.43.1-lib'
2026-Jan-01 00:01:59.104709 #8 108.9 deleting '/nix/store/c4rj90r2m89rxs64hmm857mipwjhig5d-file-5.46'
2026-Jan-01 00:01:59.104709 #8 108.9 deleting '/nix/store/agvks3qmzja0yj54szi3vja6vx3cwkkw-curl-8.11.0-man'
2026-Jan-01 00:01:59.104709 #8 108.9 deleting '/nix/store/9cwwj1c9csmc85l2cqzs3h9hbf1vwl6c-gnutar-1.35'
2026-Jan-01 00:01:59.104709 #8 108.9 deleting '/nix/store/a3c47r5z1q2c4rz0kvq8hlilkhx2s718-gawk-5.3.1'
2026-Jan-01 00:01:59.104709 #8 108.9 deleting '/nix/store/abm77lnrkrkb58z6xp1qwjcr1xgkcfwm-gnused-4.9'
2026-Jan-01 00:01:59.104709 #8 108.9 deleting '/nix/store/74h4z8k82pmp24xryflv4lxkz8jlpqqd-ed-1.20.2'
2026-Jan-01 00:01:59.104709 #8 108.9 deleting '/nix/store/qbry6090vlr9ar33kdmmbq2p5apzbga8-expand-response-params'
2026-Jan-01 00:01:59.104709 #8 108.9 deleting '/nix/store/pc74azbkr19rkd5bjalq2xwx86cj3cga-linux-headers-6.12'
2026-Jan-01 00:01:59.104709 #8 109.0 deleting '/nix/store/fp6cjl1zcmm6mawsnrb5yak1wkz2ma8l-gnumake-4.4.1'
2026-Jan-01 00:01:59.104709 #8 109.0 deleting unused links...
2026-Jan-01 00:01:59.104709 #8 113.3 note: currently hard linking saves 3.02 MiB
2026-Jan-01 00:01:59.104709 #8 113.4 61 store paths deleted, 559.41 MiB freed
2026-Jan-01 00:01:59.104709 #8 DONE 113.5s
2026-Jan-01 00:01:59.104709 
2026-Jan-01 00:01:59.104709 #9 [stage-0  5/11] RUN sudo apt-get update && sudo apt-get install -y --no-install-recommends curl wget
2026-Jan-01 00:01:59.104709 #9 0.921 Get:1 http://security.ubuntu.com/ubuntu noble-security InRelease [126 kB]
2026-Jan-01 00:01:59.104709 #9 0.934 Get:2 http://archive.ubuntu.com/ubuntu noble InRelease [256 kB]
2026-Jan-01 00:01:59.104709 #9 2.063 Get:3 http://security.ubuntu.com/ubuntu noble-security/main amd64 Packages [1752 kB]
2026-Jan-01 00:01:59.104709 #9 2.175 Get:4 http://archive.ubuntu.com/ubuntu noble-updates InRelease [126 kB]
2026-Jan-01 00:01:59.104709 #9 2.462 Get:5 http://archive.ubuntu.com/ubuntu noble-backports InRelease [126 kB]
2026-Jan-01 00:01:59.104709 #9 2.783 Get:6 http://archive.ubuntu.com/ubuntu noble/main amd64 Packages [1808 kB]
2026-Jan-01 00:01:59.104709 #9 3.237 Get:7 http://security.ubuntu.com/ubuntu noble-security/restricted amd64 Packages [2898 kB]
2026-Jan-01 00:01:59.104709 #9 3.480 Get:8 http://archive.ubuntu.com/ubuntu noble/restricted amd64 Packages [117 kB]
2026-Jan-01 00:01:59.104709 #9 3.495 Get:9 http://archive.ubuntu.com/ubuntu noble/universe amd64 Packages [19.3 MB]
2026-Jan-01 00:01:59.104709 #9 3.552 Get:10 http://security.ubuntu.com/ubuntu noble-security/multiverse amd64 Packages [33.1 kB]
2026-Jan-01 00:01:59.104709 #9 3.554 Get:11 http://security.ubuntu.com/ubuntu noble-security/universe amd64 Packages [1183 kB]
2026-Jan-01 00:01:59.104709 #9 5.648 Get:12 http://archive.ubuntu.com/ubuntu noble/multiverse amd64 Packages [331 kB]
2026-Jan-01 00:01:59.104709 #9 5.678 Get:13 http://archive.ubuntu.com/ubuntu noble-updates/restricted amd64 Packages [3059 kB]
2026-Jan-01 00:01:59.104709 #9 6.027 Get:14 http://archive.ubuntu.com/ubuntu noble-updates/main amd64 Packages [2130 kB]
2026-Jan-01 00:01:59.104709 #9 6.262 Get:15 http://archive.ubuntu.com/ubuntu noble-updates/multiverse amd64 Packages [35.9 kB]
2026-Jan-01 00:01:59.104709 #9 6.264 Get:16 http://archive.ubuntu.com/ubuntu noble-updates/universe amd64 Packages [1950 kB]
2026-Jan-01 00:01:59.104709 #9 6.486 Get:17 http://archive.ubuntu.com/ubuntu noble-backports/main amd64 Packages [49.5 kB]
2026-Jan-01 00:01:59.104709 #9 6.490 Get:18 http://archive.ubuntu.com/ubuntu noble-backports/universe amd64 Packages [34.6 kB]
2026-Jan-01 00:01:59.104709 #9 6.586 Fetched 35.3 MB in 6s (5606 kB/s)
2026-Jan-01 00:01:59.104709 #9 6.586 Reading package lists...
2026-Jan-01 00:01:59.104709 #9 7.720 Reading package lists...
2026-Jan-01 00:01:59.104709 #9 8.884 Building dependency tree...
2026-Jan-01 00:01:59.104709 #9 9.229 Reading state information...
2026-Jan-01 00:01:59.104709 #9 9.662 curl is already the newest version (8.5.0-2ubuntu10.6).
2026-Jan-01 00:01:59.104709 #9 9.662 The following NEW packages will be installed:
2026-Jan-01 00:01:59.104709 #9 9.662   wget
2026-Jan-01 00:01:59.104709 #9 10.16 0 upgraded, 1 newly installed, 0 to remove and 40 not upgraded.
2026-Jan-01 00:01:59.104709 #9 10.16 Need to get 334 kB of archives.
2026-Jan-01 00:01:59.104709 #9 10.16 After this operation, 938 kB of additional disk space will be used.
2026-Jan-01 00:01:59.104709 #9 10.16 Get:1 http://archive.ubuntu.com/ubuntu noble-updates/main amd64 wget amd64 1.21.4-1ubuntu4.1 [334 kB]
2026-Jan-01 00:01:59.104709 #9 11.54 debconf: delaying package configuration, since apt-utils is not installed
2026-Jan-01 00:01:59.104709 #9 11.60 Fetched 334 kB in 2s (221 kB/s)
2026-Jan-01 00:01:59.104709 #9 11.66 Selecting previously unselected package wget.
2026-Jan-01 00:01:59.104709 #9 11.66 (Reading database ... 
(Reading database ... 5%
(Reading database ... 10%
(Reading database ... 15%
(Reading database ... 20%
(Reading database ... 25%
(Reading database ... 30%
(Reading database ... 35%
(Reading database ... 40%
(Reading database ... 45%
(Reading database ... 50%
(Reading database ... 55%
(Reading database ... 60%
(Reading database ... 65%
(Reading database ... 70%
(Reading database ... 75%
(Reading database ... 80%
(Reading database ... 85%
(Reading database ... 90%
(Reading database ... 95%
(Reading database ... 100%
(Reading database ... 9511 files and directories currently installed.)
2026-Jan-01 00:01:59.104709 #9 11.74 Preparing to unpack .../wget_1.21.4-1ubuntu4.1_amd64.deb ...
2026-Jan-01 00:01:59.104709 #9 11.74 Unpacking wget (1.21.4-1ubuntu4.1) ...
2026-Jan-01 00:01:59.104709 #9 11.80 Setting up wget (1.21.4-1ubuntu4.1) ...
2026-Jan-01 00:01:59.104709 #9 DONE 11.9s
2026-Jan-01 00:01:59.104709 
2026-Jan-01 00:01:59.104709 #10 [stage-0  6/11] COPY . /app/.
2026-Jan-01 00:01:59.104709 #10 DONE 0.1s
2026-Jan-01 00:01:59.104709 
2026-Jan-01 00:01:59.104709 #11 [stage-0  7/11] RUN --mount=type=cache,id=gowccgsco0c4k4cowgwk04s4-/root/npm,target=/root/.npm npm ci
2026-Jan-01 00:01:59.104709 #11 0.254 npm warn config production Use `--omit=dev` instead.
2026-Jan-01 00:01:59.104709 #11 14.98
2026-Jan-01 00:01:59.104709 #11 14.98 added 438 packages, and audited 439 packages in 15s
2026-Jan-01 00:01:59.104709 #11 14.98
2026-Jan-01 00:01:59.104709 #11 14.98 176 packages are looking for funding
2026-Jan-01 00:01:59.104709 #11 14.98   run `npm fund` for details
2026-Jan-01 00:01:59.104709 #11 14.98
2026-Jan-01 00:01:59.104709 #11 14.98 found 0 vulnerabilities
2026-Jan-01 00:01:59.104709 #11 DONE 15.7s
2026-Jan-01 00:01:59.104709 
2026-Jan-01 00:01:59.104709 #12 [stage-0  8/11] COPY . /app/.
2026-Jan-01 00:01:59.104709 #12 DONE 0.1s
2026-Jan-01 00:01:59.104709 
2026-Jan-01 00:01:59.104709 #13 [stage-0  9/11] RUN --mount=type=cache,id=gowccgsco0c4k4cowgwk04s4-next/cache,target=/app/.next/cache --mount=type=cache,id=gowccgsco0c4k4cowgwk04s4-node_modules/cache,target=/app/node_modules/.cache npm run build
2026-Jan-01 00:01:59.104709 #13 0.238 npm warn config production Use `--omit=dev` instead.
2026-Jan-01 00:01:59.104709 #13 0.263
2026-Jan-01 00:01:59.104709 #13 0.263 > epixodo@0.1.0 build
2026-Jan-01 00:01:59.104709 #13 0.263 > next build
2026-Jan-01 00:01:59.104709 #13 0.263
2026-Jan-01 00:01:59.104709 #13 1.204 Attention: Next.js now collects completely anonymous telemetry regarding usage.
2026-Jan-01 00:01:59.104709 #13 1.204 This information is used to shape Next.js' roadmap and prioritize features.
2026-Jan-01 00:01:59.104709 #13 1.204 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
2026-Jan-01 00:01:59.104709 #13 1.204 https://nextjs.org/telemetry
2026-Jan-01 00:01:59.104709 #13 1.204
2026-Jan-01 00:01:59.104709 #13 1.218 ▲ Next.js 16.1.1 (Turbopack)
2026-Jan-01 00:01:59.104709 #13 1.219
2026-Jan-01 00:01:59.104709 #13 1.275   Creating an optimized production build ...
2026-Jan-01 00:01:59.104709 #13 7.619 ✓ Compiled successfully in 5.8s
2026-Jan-01 00:01:59.104709 #13 7.634   Running TypeScript ...
2026-Jan-01 00:01:59.104709 #13 11.88 Failed to compile.
2026-Jan-01 00:01:59.104709 #13 11.88
2026-Jan-01 00:01:59.104709 #13 11.89 ./components/activities/activity-selector-modal.tsx:42:46
2026-Jan-01 00:01:59.104709 #13 11.89 Type error: Type '{ children: Element; isOpen: boolean; onClose: () => void; title: string; }' is not assignable to type 'IntrinsicAttributes & ModalProps'.
2026-Jan-01 00:01:59.104709 #13 11.89   Property 'title' does not exist on type 'IntrinsicAttributes & ModalProps'.
2026-Jan-01 00:01:59.104709 #13 11.89
2026-Jan-01 00:01:59.104709 #13 11.89   40 |
2026-Jan-01 00:01:59.104709 #13 11.89   41 |   return (
2026-Jan-01 00:01:59.104709 #13 11.89 > 42 |     <Modal isOpen={isOpen} onClose={onClose} title="Seleccionar Actividad">
2026-Jan-01 00:01:59.104709 #13 11.89      |                                              ^
2026-Jan-01 00:01:59.104709 #13 11.89   43 |       <div className="p-4">
2026-Jan-01 00:01:59.104709 #13 11.89   44 |         <div className="relative mb-4">
2026-Jan-01 00:01:59.104709 #13 11.89   45 |           <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
2026-Jan-01 00:01:59.104709 #13 11.95 Next.js build worker exited with code: 1 and signal: null
2026-Jan-01 00:01:59.104709 #13 ERROR: process "/bin/bash -ol pipefail -c npm run build" did not complete successfully: exit code: 1
2026-Jan-01 00:01:59.104709 ------
2026-Jan-01 00:01:59.104709 > [stage-0  9/11] RUN --mount=type=cache,id=gowccgsco0c4k4cowgwk04s4-next/cache,target=/app/.next/cache --mount=type=cache,id=gowccgsco0c4k4cowgwk04s4-node_modules/cache,target=/app/node_modules/.cache npm run build:
2026-Jan-01 00:01:59.104709 11.89   Property 'title' does not exist on type 'IntrinsicAttributes & ModalProps'.
2026-Jan-01 00:01:59.104709 11.89
2026-Jan-01 00:01:59.104709 11.89   40 |
2026-Jan-01 00:01:59.104709 11.89   41 |   return (
2026-Jan-01 00:01:59.104709 11.89 > 42 |     <Modal isOpen={isOpen} onClose={onClose} title="Seleccionar Actividad">
2026-Jan-01 00:01:59.104709 11.89      |                                              ^
2026-Jan-01 00:01:59.104709 11.89   43 |       <div className="p-4">
2026-Jan-01 00:01:59.104709 11.89   44 |         <div className="relative mb-4">
2026-Jan-01 00:01:59.104709 11.89   45 |           <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
2026-Jan-01 00:01:59.104709 11.95 Next.js build worker exited with code: 1 and signal: null
2026-Jan-01 00:01:59.104709 ------
2026-Jan-01 00:01:59.104709 
2026-Jan-01 00:01:59.104709 1 warning found (use docker --debug to expand):
2026-Jan-01 00:01:59.104709 - UndefinedVar: Usage of undefined variable '$NIXPACKS_PATH' (line 18)
2026-Jan-01 00:01:59.104709 Dockerfile:24
2026-Jan-01 00:01:59.104709 --------------------
2026-Jan-01 00:01:59.104709 22 |     # build phase
2026-Jan-01 00:01:59.104709 23 |     COPY . /app/.
2026-Jan-01 00:01:59.104709 24 | >>> RUN --mount=type=cache,id=gowccgsco0c4k4cowgwk04s4-next/cache,target=/app/.next/cache --mount=type=cache,id=gowccgsco0c4k4cowgwk04s4-node_modules/cache,target=/app/node_modules/.cache npm run build
2026-Jan-01 00:01:59.104709 25 |
2026-Jan-01 00:01:59.104709 26 |
2026-Jan-01 00:01:59.104709 --------------------
2026-Jan-01 00:01:59.104709 ERROR: failed to build: failed to solve: process "/bin/bash -ol pipefail -c npm run build" did not complete successfully: exit code: 1
2026-Jan-01 00:01:59.104709 exit status 1
2026-Jan-01 00:01:59.213532 ========================================
2026-Jan-01 00:01:59.223193 Deployment failed. Removing the new version of your application.
2026-Jan-01 00:02:00.723138 Gracefully shutting down build container: f0wkooo0c080k0s4gwgssg0o