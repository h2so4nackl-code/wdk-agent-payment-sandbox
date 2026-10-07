# v0.1.0 release provenance

Reconciled on 2026-10-07 using GitHub commit/tree/run/job APIs, decoded job logs and the release tag ref. Repository: [h2so4nackl-code/wdk-agent-payment-sandbox](https://github.com/h2so4nackl-code/wdk-agent-payment-sandbox).

## Finding

The release commit and the later conformance commit have different identities and parents, but **the exact same complete Git tree**, including README, source, tests, dependency locks, configuration, scripts, workflow and curated evidence. The release's "Validated snapshot" statement is supported by content equivalence. It must not be read as claiming that the cited workflow checked out the release commit SHA itself.

No missing functional conformance check was identified. No tag movement, history rewrite or new runtime test execution was needed for this reconciliation. This document adds an independently inspectable provenance bridge; it does not claim a new CI run or extend the sandbox's supported profile.

## Commit and tree identities

| Role | Commit | Complete tree | Parent |
|---|---|---|---|
| v0.1.0 tag target | `060e40506ace8fd990d0056934e828425f3d0114` | `2c8e960e56b89700c0da729384ed1b02b3c9a435` | `06158529807b285272c7f79a49d37d3fe3515ca5` |
| Run 37288753892 checkout | `2e04dba65132f5e0790fcc56c52f10712581bd5a` | `2c8e960e56b89700c0da729384ed1b02b3c9a435` | `636d6a94fc25dabe88a97c35a22df0c527c4d7c0` |
| Release parent | `06158529807b285272c7f79a49d37d3fe3515ca5` | `9de05011282add8beea8090a9976e6a3486365e8` | `3128e6f2353a815d10ea96f9580042435033416f` |
| Run 37224889693 checkout / later CI parent | `636d6a94fc25dabe88a97c35a22df0c527c4d7c0` | `9de05011282add8beea8090a9976e6a3486365e8` | `3128e6f2353a815d10ea96f9580042435033416f` |

Sources: [release tag ref](https://api.github.com/repos/h2so4nackl-code/wdk-agent-payment-sandbox/git/ref/tags/v0.1.0), [release commit](https://api.github.com/repos/h2so4nackl-code/wdk-agent-payment-sandbox/commits/060e40506ace8fd990d0056934e828425f3d0114), [later CI commit](https://api.github.com/repos/h2so4nackl-code/wdk-agent-payment-sandbox/commits/2e04dba65132f5e0790fcc56c52f10712581bd5a), [release parent](https://api.github.com/repos/h2so4nackl-code/wdk-agent-payment-sandbox/commits/06158529807b285272c7f79a49d37d3fe3515ca5), [earlier CI commit](https://api.github.com/repos/h2so4nackl-code/wdk-agent-payment-sandbox/commits/636d6a94fc25dabe88a97c35a22df0c527c4d7c0).

Both recursive tree API responses are untruncated and contain 104 file entries (115 entries including directories). Comparing each path, object type, mode and blob SHA yields:

- Release versus later CI: zero added, removed or changed files; complete tree identity.
- Release parent versus earlier CI: zero differences; complete tree identity.
- Earlier CI versus release/later CI: only `README.md` changes, in three documentation hunks covering public publication status, the earlier CI link and authorization wording. The remaining 103 files have identical blobs and modes. In particular, runtime code, test suites, package manifests/locks, workflow and scripts are unchanged.

Sources: [release/later CI tree](https://api.github.com/repos/h2so4nackl-code/wdk-agent-payment-sandbox/git/trees/2c8e960e56b89700c0da729384ed1b02b3c9a435?recursive=1), [parent/earlier CI tree](https://api.github.com/repos/h2so4nackl-code/wdk-agent-payment-sandbox/git/trees/9de05011282add8beea8090a9976e6a3486365e8?recursive=1). Matching README patches alone were not used as proof of snapshot equivalence.

## Hosted test evidence

Both runs were `workflow_dispatch`, attempt 1, with conclusion `success`. Each job's checkout log identifies the full commit SHA listed above; the workflow uses the triggering ref, with no separate checkout override. Both use Node 24.16.0 and locked `npm ci` installs with lifecycle scripts disabled; the official-profile install also omits optional dependencies.

| Run | Job | Platform | Core | Official profile | Fail / skipped / cancelled |
|---|---|---|---|---|---|
| [37288753892](https://github.com/h2so4nackl-code/wdk-agent-payment-sandbox/actions/runs/37288753892) | [111693912176](https://github.com/h2so4nackl-code/wdk-agent-payment-sandbox/actions/runs/37288753892/job/111693912176) | ubuntu-26.04 | 77/77 | 59/59 | 0 / 0 / 0 in each suite |
| [37288753892](https://github.com/h2so4nackl-code/wdk-agent-payment-sandbox/actions/runs/37288753892) | [111693911736](https://github.com/h2so4nackl-code/wdk-agent-payment-sandbox/actions/runs/37288753892/job/111693911736) | windows-latest | 77/77 | 59/59 | 0 / 0 / 0 in each suite |
| [37224889693](https://github.com/h2so4nackl-code/wdk-agent-payment-sandbox/actions/runs/37224889693) | [111502407958](https://github.com/h2so4nackl-code/wdk-agent-payment-sandbox/actions/runs/37224889693/job/111502407958) | ubuntu-26.04 | 77/77 | 59/59 | 0 / 0 / 0 in each suite |
| [37224889693](https://github.com/h2so4nackl-code/wdk-agent-payment-sandbox/actions/runs/37224889693) | [111502408078](https://github.com/h2so4nackl-code/wdk-agent-payment-sandbox/actions/runs/37224889693/job/111502408078) | windows-latest | 77/77 | 59/59 | 0 / 0 / 0 in each suite |

The total is **77 + 59 = 136 tests per platform**. The 34 signer-adapter tests are included in the 59 official-profile tests, not added again. The later run also passed both supported typechecks, lint, build, the two scans and the expected-diagnostic evidence gate. The gate reproduces the known upstream direct TypeScript TS2322 failure; it does not mean that direct upstream compatibility passes.

The later run completed before the public release was published (2026-10-05 09:18:12 UTC). This establishes conformance of the release content before publication, without asserting a run on its commit identity. [Release metadata](https://api.github.com/repos/h2so4nackl-code/wdk-agent-payment-sandbox/releases/tags/v0.1.0).

## Recheck

After fetching the four exact commit objects, these Git commands reproduce the content comparison. Use two-endpoint `git diff`, not a merge-base/three-dot comparison of the divergent histories.

```sh
git rev-parse 060e40506ace8fd990d0056934e828425f3d0114^{tree}
git rev-parse 2e04dba65132f5e0790fcc56c52f10712581bd5a^{tree}
git diff --exit-code 060e40506ace8fd990d0056934e828425f3d0114 2e04dba65132f5e0790fcc56c52f10712581bd5a
git diff --exit-code 06158529807b285272c7f79a49d37d3fe3515ca5 636d6a94fc25dabe88a97c35a22df0c527c4d7c0
git diff --name-status 636d6a94fc25dabe88a97c35a22df0c527c4d7c0 060e40506ace8fd990d0056934e828425f3d0114
git diff 636d6a94fc25dabe88a97c35a22df0c527c4d7c0 060e40506ace8fd990d0056934e828425f3d0114 -- README.md
```

Expected: both `rev-parse` commands print `2c8e960e56b89700c0da729384ed1b02b3c9a435`; both equality diffs are empty; the last pairwise comparison reports only `M README.md` and its three documentation hunks. The API tree and checkout-log checks described above were performed for this reconciliation; this command block is a reproduction recipe.

Scope: repository content and the cited historical CI checks only. This is not binary/SLSA provenance, a new dependency audit, real-settlement validation or a guarantee about future main revisions. The tag and historical commit objects remain unchanged; this evidence document lives in a later documentation commit and is not retroactively part of v0.1.0.
