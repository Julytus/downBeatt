# Kho LUT seed builder

Python 3.12 tool to build the deterministic local LUT sample assets and SQL seed.
Install with `python -m pip install -r tools/seed/kho-lut/requirements.txt`, then run
`python tools/seed/kho-lut/build.py`. Set `MINIO_ENDPOINT`, `MINIO_ROOT_USER`,
`MINIO_ROOT_PASSWORD` (and optionally `MINIO_PUBLIC_BUCKET`, `MINIO_PRIVATE_BUCKET`)
or configure those values in `backend/.env`. `--self-test` validates cube output.

Backend profile `local` tự nạp file mẫu lên MinIO khi khởi động (`seed.minio.enabled`). Chỉ cần chạy script này khi đổi `luts.json` và cần sinh lại `V3_1__seed_kho_lut.sql`.

