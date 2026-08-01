# iPaymu Bridge Controlled Sandbox Upgrade

## Purpose

Upgrade the isolated NusaGiliBoat iPaymu sandbox bridge from the current
health-validation deployment to the observability release.

## Locked release identities

- Active image revision: `c1ffc4d456125c10be018c6154b13ef8831bac88`
- Active service version: `0.17.0`
- Current release pointer: `cf404da90e007d3c5402c16d85073885628785f2`
- Target revision: `7885c76d0b9ca931fcd21b812a32e9c67f9a297e`
- Target service version: `0.18.0`
- Target image: `nusagiliboat/ipaymu-bridge:7885c76d0b9c-observability-r10`

The active image revision and the `current` release pointer are different.
The controlled upgrade must align the release directory, image revision,
Compose image reference, and running container.

## Safety boundaries

The upgrade candidate must remain sandbox-only.

- `IPAYMU_ENABLED=true`
- `IPAYMU_ENVIRONMENT=sandbox`
- no host port publication;
- no public Traefik router;
- `traefik.enable=false`;
- only the external Docker network `gateway`;
- internal health and readiness checks only;
- no production iPaymu credentials;
- no provider transaction test during the deployment step;
- no Appwrite mutation during the initial health-validation step.

## Required VPS paths

- Deployment root: `/opt/nusagiliboat-pay`
- Release directory:
  `/opt/nusagiliboat-pay/releases/7885c76d0b9ca931fcd21b812a32e9c67f9a297e`
- Secret environment:
  `/opt/nusagiliboat-pay/.env`
- Compose descriptor:
  `/opt/nusagiliboat-pay/compose.yaml`
- Current release symlink:
  `/opt/nusagiliboat-pay/current`

The real `.env` must remain root-owned with mode `600`.

## Controlled upgrade order

1. Record the current container ID, image ID, image reference, health state,
   release symlink target, Compose checksum, and `.env` checksum.
2. Create a new immutable release directory for `7885c76d0b9ca931fcd21b812a32e9c67f9a297e`.
3. Verify package, lock, and service metadata version are `0.18.0`.
4. Build the candidate image from the explicit new release directory, not from
   the old `current` symlink.
5. Tag the candidate image as `nusagiliboat/ipaymu-bridge:7885c76d0b9c-observability-r10`.
6. Verify the image labels and service version before changing the container.
7. Render Compose using the real root-owned environment file.
8. Confirm there are no `ports` and no public Traefik HTTP labels.
9. Point `current` atomically to the new release.
10. Recreate only the `ipaymu-bridge` service.
11. Require container health `healthy`.
12. Require internal `/health` and `/ready` responses to return HTTP 200.
13. Confirm the public bridge route remains absent.
14. Confirm logs contain only sanitized observability fields.
15. Keep the deployment in sandbox mode until a separately approved public
    callback-route stage.

## Rollback conditions

Rollback immediately if any of these occur:

- container does not become healthy;
- `/health` or `/ready` does not return 200;
- service version is not `0.18.0`;
- image revision is not `7885c76d0b9ca931fcd21b812a32e9c67f9a297e`;
- a public bridge route appears unexpectedly;
- environment is not sandbox;
- sensitive values appear in authentication rejection logs;
- Appwrite connectivity or configuration readiness fails.

## Rollback procedure

1. Restore the previous Compose file.
2. Restore the `current` symlink to `cf404da90e007d3c5402c16d85073885628785f2`.
3. Restore the previous image reference:
   `nusagiliboat/ipaymu-bridge:c1ffc4d45612-health-validated`.
4. Recreate only the bridge service.
5. Require the previous container to become healthy.
6. Verify internal health and readiness return 200.
7. Preserve failed candidate logs and metadata in the audit directory.

## Deployment approval

This document is a local design candidate only.

It does not approve:

- VPS file changes;
- image build on VPS;
- container recreation;
- public Traefik routing;
- provider transaction requests;
- Appwrite mutations;
- production activation.
